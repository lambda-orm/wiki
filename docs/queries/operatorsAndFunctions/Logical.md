# Logical Operators

Logical operators combine or negate boolean expressions, for example to join several conditions in the predicate of `filter`.

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

## Summary

| Operator | Description | SQL |
|---|---|---|
| `!` | Logical NOT | `NOT` |
| `&&` | Logical AND | `AND` |
| `||` | Logical OR | `OR` |

## NOT (`!`)

Negates a boolean expression: returns `true` when `value` is `false`, and `false` when it is `true`.

**Syntax:** `!value`

For example, `Countries.filter(p=> !(p.iso3 == "BRA"))` generates the condition `WHERE NOT c.iso3 = 'BRA'`.

## AND (`&&`)

Returns `true` when both operands are `true`.

**Syntax:** `a && b`

Number of countries in South America whose longitude is less than -30:

```typescript
Countries.filter(p=> p.subregion == "South America" &&  p.longitude < -30 ).map(p=> {result:count(1)})
```

**Result:** `[{"result":15}]`

**Generated SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' AND c.longitude < -30)
```

## OR (`||`)

Returns `true` when at least one of the operands is `true`.

**Syntax:** `a || b`

Number of countries in South America or Central America:

```typescript
Countries.filter(p=> p.subregion == "South America" || p.subregion == "Central America" ).map(p=> {result:count(1)})
```

**Result:** `[{"result":23}]`

**Generated SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' OR c.subregion = 'Central America')
```

## Combining conditions

Operators can be combined with the comparison operators described in [Comparison](Comparison.md). Number of countries in the Americas region that are not in Northern America:

```typescript
Countries.filter(p=> p.region == "Americas" &&  p.subregion != "Northern America" ).map(p=> {result:count(1)})
```

**Result:** `[{"result":51}]`

**Generated SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.region = 'Americas' AND c.subregion <> 'Northern America')
```
