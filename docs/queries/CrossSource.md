# Queries across sources

A query can read fields of a relation whose entity lives in **another source**, even of another engine (orders in
PostgreSQL, customers in MongoDB):

```ts
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

λORM brings the root with its filters and an `include` of the other source (each source its own sentence), and then
maps, groups, sorts and pages **in memory**:

- a sort by fields of the root goes to its database with the page;
- to sort or group in memory it brings at most `maxRows` rows (10,000; `infrastructure.crossSource.maxRows` or
  `options.maxRows`): beyond, a `CrossSourceError`;
- `orm.plan` shows the sentence of each source and `inMemory: ['map', 'sort', …]`.

A filter by a field of the other source (`Orders.filter(p => p.customer.name == "Ann")`) first finds the keys in that
source.
