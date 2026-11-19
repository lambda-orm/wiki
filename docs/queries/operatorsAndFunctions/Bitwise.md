# Bitwise Operators

Bitwise operators work on the binary representation of integer values.

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

!!! note "Results on MySQL"
    MySQL evaluates bitwise operations as unsigned 64-bit integers. The longitude of Brazil is -55, so several of the results below are very large numbers.

## Summary

| Operator | Description |
|---|---|
| `~` | Bitwise NOT |
| `&` | Bitwise AND |
| `|` | Bitwise OR |
| `^` | Bitwise XOR (exclusive OR); it is not exponentiation, use `**` for that |
| `<<` | Left shift |
| `>>` | Right shift |

## Bitwise NOT (`~`)

Inverts all the bits of `a`. Operands and result are numbers.

**Syntax:** `~a`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: ~ p.longitude })
```

**Result:** `[{"result":54}]`

**Generated SQL (MySQL):**

```sql
SELECT ~ c.longitude AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Bitwise AND (`&`)

Each bit of the result is 1 when the corresponding bits of `a` and `b` are both 1. Operands and result are numbers.

**Syntax:** `a & b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude & 1 })
```

**Result:** `[{"result":1}]`

**Generated SQL (MySQL):**

```sql
SELECT c.longitude & 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Bitwise OR (`|`)

Each bit of the result is 1 when the corresponding bit of `a` or of `b` is 1. Operands and result are numbers.

**Syntax:** `a | b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude | 1 })
```

**Result:** `[{"result":18446744073709552000}]`

**Generated SQL (MySQL):**

```sql
SELECT c.longitude | 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Bitwise XOR (`^`)

Each bit of the result is 1 when the corresponding bits of `a` and `b` are different. Operands and result are numbers.

**Syntax:** `a ^ b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude ^ 1 })
```

**Result:** `[{"result":18446744073709552000}]`

**Generated SQL (MySQL):**

```sql
SELECT c.longitude ^ 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Left shift (`<<`)

Shifts the bits of `a` to the left by `b` positions. Operands and result are numbers.

**Syntax:** `a << b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude << 1 })
```

**Result:** `[{"result":18446744073709552000}]`

**Generated SQL (MySQL):**

```sql
SELECT c.longitude << 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Right shift (`>>`)

Shifts the bits of `a` to the right by `b` positions. Operands and result are numbers.

**Syntax:** `a >> b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude >> 1 })
```

**Result:** `[{"result":9223372036854776000}]`

**Generated SQL (MySQL):**

```sql
SELECT c.longitude >> 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Database support

!!! warning "Engine differences"
    - **Oracle**: `&`, `|` and `^` are translated to `BITAND`, `BITOR` and `BITXOR`.
    - **PostgreSQL**: `^` is translated to the `#` operator (XOR).
    - **MongoDB**: `&`, `|`, `^` and `~` are translated to `$bitAnd`, `$bitOr`, `$bitXor` and `$bitNot` (MongoDB 6.3 or
      later); the shifts `<<` and `>>` cannot currently be translated.
