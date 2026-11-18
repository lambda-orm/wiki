# Aggregate Functions

Aggregate (group) functions calculate a single value from a set of rows. When a query's `map` mixes aggregate functions with other fields, λORM groups the rows by those other fields (`GROUP BY` in SQL). See [Grouping](../Grouping.md) for more examples, including `having`.

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

## Summary

| Function | Description |
|---|---|
| `avg` | Average of the values |
| `count` | Number of rows |
| `first` | First value of the set |
| `last` | Last value of the set |
| `max` | Maximum value |
| `min` | Minimum value |
| `sum` | Sum of the values |

## count

Returns the number of rows in the set. `count(1)` counts all the rows.

**Signature:** `count(value: any): integer`

Number of countries in the Americas region:

```typescript
Countries.filter(p=> p.region == "Americas").map(p=> {result:count(1)})
```

**Result:** `[{"result":57}]`

**Generated SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE c.region = 'Americas'
```

Number of countries in each region:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)})
```

**Result:**

```json
[{"region":"","countries":2}
,{"region":"Africa","countries":60}
,{"region":"Americas","countries":57}
,{"region":"Asia","countries":50}
,{"region":"Europe","countries":53}
,{"region":"Oceania","countries":27}
,{"region":"Polar","countries":1}
]
```

**Generated SQL (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
```

## max

Returns the maximum value of the set.

**Signature:** `max(value: T): T`

Maximum latitude of the countries of each region:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)})
```

**Result:**

```json
[{"region":"","max":-53.1}
,{"region":"Africa","max":34}
,{"region":"Americas","max":72}
,{"region":"Asia","max":48}
,{"region":"Europe","max":78}
,{"region":"Oceania","max":15.2}
,{"region":"Polar","max":-74.65}
]
```

**Generated SQL (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
```

## min

Returns the minimum value of the set.

**Signature:** `min(value: T): T`

Minimum latitude of the countries of each region:

```typescript
Countries.map(p=> {region:p.region,min:min(p.latitude)})
```

**Result:**

```json
[{"region":"","min":-54.4333}
,{"region":"Africa","min":-49.25}
,{"region":"Americas","min":-54.5}
,{"region":"Asia","min":-8.8333}
,{"region":"Europe","min":35}
,{"region":"Oceania","min":-41}
,{"region":"Polar","min":-74.65}
]
```

**Generated SQL (MySQL):**

```sql
SELECT c.region AS region, MIN(c.latitude) AS min
FROM Countries c
GROUP BY c.region
```

## avg

Returns the average of the values of the set.

**Signature:** `avg(value: number): number`

Average latitude of the countries of each region:

```typescript
Countries.map(p=> {region:p.region,avg:avg(p.latitude)})
```

**Result:**

```json
[{"region":"","avg":-53.76665}
,{"region":"Africa","avg":1.283335}
,{"region":"Americas","avg":10.42610526}
,{"region":"Asia","avg":25.822002}
,{"region":"Europe","avg":49.35021321}
,{"region":"Oceania","avg":-10.93023704}
,{"region":"Polar","avg":-74.65}
]
```

**Generated SQL (MySQL):**

```sql
SELECT c.region AS region, AVG(c.latitude) AS avg
FROM Countries c
GROUP BY c.region
```

## sum

Returns the sum of the values of the set. It is translated to `SUM(...)` in SQL.

**Signature:** `sum(value: number): number`

## first

Returns the first value of the set.

**Signature:** `first(value: T): T`

## last

Returns the last value of the set.

**Signature:** `last(value: T): T`

!!! warning "first and last on SQL databases"
    On SQL databases, `first` and `last` used as aggregates are translated to `FIRST(...)` and `LAST(...)`; check that your database engine supports these aggregate functions. On MongoDB they are translated to `$first` and `$last`.

    Do not confuse them with the `first` and `last` query methods (for example `Countries.first(p=> p.name)`), which return the first or last row of a query; see [Select](../Select.md).
