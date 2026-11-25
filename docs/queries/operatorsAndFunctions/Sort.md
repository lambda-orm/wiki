# Sort Functions

The `sort` method orders the rows of a query (`ORDER BY` in SQL). Its predicate returns the field to sort by, optionally wrapped in `asc` or `desc` to set the direction. Without `asc` or `desc`, rows are sorted in ascending order. To sort by several fields or by an expression, see [Several fields and expressions](#several-fields-and-expressions).

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

## Summary

| Function | Description |
|---|---|
| `asc` | Sorts in ascending order (the default) |
| `desc` | Sorts in descending order |

## Default order

When the predicate returns a field without `asc` or `desc`, rows are sorted in ascending order.

Number of countries in each region, from the smallest to the largest:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)}).sort(p=> p.countries)
```

**Result:**

```json
[{"region":"Polar","countries":1}
,{"region":"","countries":2}
,{"region":"Oceania","countries":27}
,{"region":"Asia","countries":50}
,{"region":"Europe","countries":53}
,{"region":"Americas","countries":57}
,{"region":"Africa","countries":60}
]
```

**Generated SQL (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
ORDER BY countries asc
```

## asc

Sorts the rows by `value` in ascending order.

**Signature:** `asc(value: any): void`

Maximum latitude of each region, sorted by that maximum:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)}).sort(p=> asc(p.max))
```

**Result:**

```json
[{"region":"Polar","max":-74.65}
,{"region":"","max":-53.1}
,{"region":"Oceania","max":15.2}
,{"region":"Africa","max":34}
,{"region":"Asia","max":48}
,{"region":"Americas","max":72}
,{"region":"Europe","max":78}
]
```

**Generated SQL (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
ORDER BY max asc
```

## desc

Sorts the rows by `value` in descending order.

**Signature:** `desc(value: any): void`

ISO 3 codes of the countries of South America in descending order:

```typescript
Countries.filter(p=> p.subregion == "South America").map(p=> p.iso3).sort(p=> desc(p.iso3))
```

**Result:**

```json
[{"iso3":"VEN"}
,{"iso3":"URY"}
,{"iso3":"SUR"}
,{"iso3":"SGS"}
,{"iso3":"PRY"}
,{"iso3":"PER"}
,{"iso3":"GUY"}
,{"iso3":"GUF"}
,{"iso3":"FLK"}
,{"iso3":"ECU"}
,{"iso3":"COL"}
,{"iso3":"CHL"}
,{"iso3":"BRA"}
,{"iso3":"BOL"}
,{"iso3":"ARG"}
]
```

**Generated SQL (MySQL):**

```sql
SELECT c.iso3 AS iso3
FROM Countries c
WHERE c.subregion = 'South America'
ORDER BY c.iso3 desc
```

!!! warning "Reference fields through the lambda parameter"
    Write `desc(p.iso3)`, not `desc(iso3)`. A name that is not reached through the lambda parameter (`p`) is read as a query parameter: `sort(p=> desc(iso3))` generates `ORDER BY ? desc`, and the rows are not sorted by the field.

## Several fields and expressions

To sort by several fields, return them in an array, in order of priority; each one can have its own direction. You can also sort by an expression (a function or an operation), not only by a field. Customers of the Northwind sample sorted by country and, within each country, by the length of the name, longest first:

```typescript
Customers.map(p => [p.country, p.name]).sort(p => [p.country, desc(length(p.name))])
```

**Generated SQL (MySQL):**

```sql
SELECT c.Country AS country, c.CompanyName AS name
FROM Customers c
ORDER BY c.Country asc, CHAR_LENGTH(c.CompanyName) desc
```

## Database support

!!! note "MongoDB"
    MongoDB sorts only by fields, so λORM writes each expression of the sort as a field of an `$addFields` stage before the `$sort` (from `@lambdaorm/lib` 3.15.0). The query above becomes:

    ```json
    [
      { "$addFields": { "__lambdaOrmSort1": { "$strLenCP": "$CompanyName" } } },
      { "$sort": { "Country": 1, "__lambdaOrmSort1": -1 } },
      { "$project": { "_id": 0, "country": "$Country", "name": "$CompanyName" } }
    ]
    ```

    A grouped query sorted by an expression fails with `MongoDB doesn't sort a grouped query by an expression`: sort it by a field of its `map` instead.
