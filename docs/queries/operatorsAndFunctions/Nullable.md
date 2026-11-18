# Nullable Functions

Nullable functions check whether a value is null, or replace null values with another value.

!!! note "About the examples"
    The examples run against the `Countries` and `States` entities of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated. In the test schema, `Countries` is stored in MySQL and `States` in PostgreSQL (mapped to the `TBL_STATES` table), so the SQL of each example is shown in the dialect of its data source. To see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

## Summary

| Function | Description |
|---|---|
| `nvl` | Returns a default value when the value is null |
| `nvl2` | Returns one value when the value is not null and another when it is null |
| `isNull` | Checks whether a value is null |
| `isNotNull` | Checks whether a value is not null |

## nvl

Returns `value` when it is not null; otherwise returns `default`.

**Signature:** `nvl(value: T, default: T): T`

Number of states whose latitude is null (null is replaced with -100, so the condition matches it):

```typescript
States.filter(p=> nvl(p.latitude,-100)== -100).map(p=> count(1))
```

**Result:** `[{"count":68}]`

**Generated SQL (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (CASE WHEN s.LATITUDE IS NOT NULL THEN s.LATITUDE ELSE -100 END) = -100
```

Native name of the country with ISO 3 code "CIV", or "???" when it is null:

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl(p.native,"???")})
```

**Result:** `[{"native":"???"}]`

**Generated SQL (MySQL):**

```sql
SELECT IFNULL(c.native,'???') AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## nvl2

Returns `a` when `value` is not null, and `b` when it is null.

**Signature:** `nvl2(value: any, a: T, b: T): T`

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl2(p.native,"is not null","is null")})
```

**Result:** `[{"native":"is null"}]`

**Generated SQL (MySQL):**

```sql
SELECT (CASE WHEN c.native IS NOT NULL THEN 'is not null' ELSE 'is null' END) AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## isNull

Returns `true` when `value` is null.

**Signature:** `isNull(value: any): boolean`

Number of states whose latitude is null:

```typescript
States.filter(p=> isNull(p.latitude)).map(p=> count(1))
```

**Result:** `[{"count":68}]`

**Generated SQL (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NULL)
```

## isNotNull

Returns `true` when `value` is not null.

**Signature:** `isNotNull(value: any): boolean`

Number of states whose latitude is not null:

```typescript
States.filter(p=> isNotNull(p.latitude)).map(p=> count(1))
```

**Result:** `[{"count":4813}]`

**Generated SQL (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NOT NULL)
```

## Database support

!!! warning "MongoDB"
    In the current version, `nvl`, `nvl2`, `isNull` and `isNotNull` cannot be translated to MongoDB queries.
