# Queries across sources

This page explains what happens when a query reads fields of a relation whose entity lives in **another source** of the stage, even one of another engine (orders in PostgreSQL, customers in MongoDB). You write the query as if everything were in one database; λORM splits it, runs a statement in each source and finishes the work in memory.

A relation between two entities of the same source is still a SQL join (see [Join](Join.md)). What this page describes applies only when the relation crosses sources.

## Read, sort and group by fields of another source

```ts
// Orders in PostgreSQL, Customers in MongoDB
Orders.map(p => [p.id, p.customer.name])
Orders.map(p => ({ id: p.id, who: p.customer.name })).sort(p => desc(p.who)).page(1, 20)
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

λORM runs these queries in two parts:

1. **In the databases:** the root entity with its filters and an [include](Include.md) of the relations read, each source with its own statement in its own dialect.
2. **In memory:** the `map` (grouping by the other fields when it has `count`, `sum`, `avg`, `min` or `max`), the `having`, the `sort` and the `page`.

The relations can be at any level: `p.customer.country.name` (`Customers` and `Countries` in another source) brings `include(p => [p.customer.include(p1 => [p1.country])])`, and each relation comes from its own source.

```ts
Orders.map(p => ({ country: p.customer.country.name, orders: count(p.id) })).sort(p => p.country)
```

## Limits

- **Sort and page in the database when possible.** If the `sort` reads only fields of the root and nothing is grouped, the `sort` and the `page` go to the database of the root (`ORDER BY … LIMIT`) and only the `map` runs in memory, so a paged query does not bring the whole table.
- **At most `maxRows` rows in memory.** To sort, group or page in memory, λORM brings at most `maxRows` rows (10,000 by default; set it in `infrastructure.crossSource.maxRows` of the schema or in `options.maxRows` of `orm.execute`). If there are more, the query fails with `CrossSourceError: Orders brings more than 10000 rows to sort in memory: filter it or raise maxRows`. It never cuts silently, because a result sorted over a part of the rows would be wrong.
- **Not supported:** `include`, `distinct` or `first` in the same query raise a `CrossSourceError`.

## See the plan

[`orm.plan`](Metadata.md) shows the statement of each source and, in `inMemory`, what runs in memory:

```ts
orm.plan('Orders.map(p => ({ who: p.customer.name, orders: count(p.id) })).sort(p => p.who)')
```

```json
{
  "entity": "Orders",
  "dialect": "PostgreSQL",
  "source": "sales",
  "sentence": "SELECT o.id AS \"id\", …, o.customerId AS \"__customerId\" FROM orders o ORDER BY o.id asc OFFSET 0 LIMIT 10001",
  "children": [
    {
      "entity": "Customers",
      "dialect": "MongoDB",
      "source": "crm",
      "sentence": "…"
    }
  ],
  "inMemory": ["map", "sort"]
}
```

## Filter by a field of another source

A filter by a field of a relation in another source (`Orders.filter(p => p.customer.name == "Ann")`) first looks up the keys in that source and then filters the root with `in`. It supports one level of relation and comparisons with values; see [Filter by a field of a relation in another source](Include.md#filter-by-a-field-of-a-relation-in-another-source).
