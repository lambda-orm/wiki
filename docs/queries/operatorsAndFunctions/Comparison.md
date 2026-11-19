# Comparison Operators and Functions

Comparison operators and functions compare two or more values and return a boolean. They are mostly used in the predicate of `filter` (the `WHERE` clause of the generated SQL), but they can be used in any expression of a query.

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

## Summary

| Operator / function | Description |
|---|---|
| `==`, `===` | Equal to |
| `!=`, `!==`, `<>` | Not equal to |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal to |
| `<=` | Less than or equal to |
| `between` | Checks whether a value is within a range |
| `in` | Checks whether a value is in a list of values |
| `includes` | Checks whether a list contains a value |

## Equal (`==`, `===`)

Returns `true` when both operands are equal. `==` and `===` are equivalent: both are translated to `=` in SQL.

**Syntax:**

- `a == b`
- `a === b`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> p.name)
```

**Result:** `[{"name":"Brazil"}]`

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 === "BRA").map(p=> p.name)
```

**Result:** `[{"name":"Brazil"}]`

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Not equal (`!=`, `!==`, `<>`)

Returns `true` when the operands are different. The three forms are equivalent and are translated to `<>` in SQL.

**Syntax:**

- `a != b`
- `a !== b`
- `a <> b`

See the [Logical](Logical.md) page for an example that uses `!=`.

## Greater than, less than (`>`, `<`, `>=`, `<=`)

Compare two values of the same type (numbers, strings or dates).

- `a > b`: `a` is greater than `b`.
- `a < b`: `a` is less than `b`.
- `a >= b`: `a` is greater than or equal to `b`.
- `a <= b`: `a` is less than or equal to `b`.

Name of the first country (ordered by name) whose latitude is between -11 and -9 (exclusive) and whose longitude is -55:

```typescript
Countries.filter(p=> p.latitude < -9 && p.latitude > -11 && p.longitude == -55 ).first(p=> p.name)
```

**Result:** `[{"name":"Brazil"}]`

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude < -9 AND (c.latitude > -11 AND c.longitude = -55))
ORDER BY c.name asc
LIMIT 0,1
```

## between

Returns `true` when `value` is within the range `from` to `to`. In SQL it is translated to `value BETWEEN from AND to`, which includes both limits.

**Signature:** `between(value: T, from: T, to: T): boolean`

```typescript
Countries.filter(p=> between(p.latitude,-11,-9) && p.longitude == -55 ).first(p=> p.name)
```

**Result:** `[{"name":"Brazil"}]`

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude BETWEEN -11 AND -9 AND c.longitude = -55)
ORDER BY c.name asc
LIMIT 0,1
```

## in

Returns `true` when `value` is equal to one of the values of `list`. It replaces several conditions joined with `||`, and is translated to `value IN (...)` in SQL.

**Signature:** `in(value: T, list: T[]): boolean`

```typescript
Countries.filter(p=> in(p.iso3,["BRA","ARG"])).map(p=> p.name)
```

**Result:** `[{"name":"Argentina"},{"name":"Brazil"}]`

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 IN ('BRA', 'ARG')
```

## includes

Returns `true` when `list` contains `value`. It is the same check as `in`, with the arguments in the opposite order: the list comes first. `contains` is an alias of `includes`.

**Signature:** `includes(list: T[], value: T): boolean`

For example, `includes(["BRA","ARG"], p.iso3)` generates the same `WHERE c.iso3 IN ('BRA', 'ARG')` condition as the `in` example above on every SQL engine; on MongoDB it is `{"iso3": {"$in": ["BRA", "ARG"]}}`. The method form `["BRA","ARG"].includes(p.iso3)` is the same.

As in JavaScript, `includes` of a **text** is a different check: `p.name.includes("ar")` returns `true` when the text contains `"ar"` (`LIKE '%ar%'` on SQL, a literal search on MongoDB). The type of the first argument decides: a list (or a variable) is the list check, a text is the text check.

## Database support

!!! warning "Engine differences"
    - **MongoDB**: `between` is translated to `{"$gte": from, "$lt": to}`, so the upper limit is **excluded**, unlike SQL `BETWEEN`.
