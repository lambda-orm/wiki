# Numeric Operators and Functions

Numeric operators and functions perform arithmetic, rounding, trigonometric and logarithmic calculations.

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

## Summary

### Operators

| Operator | Description |
|---|---|
| `-` | Negation (`-a`) or subtraction (`a - b`) |
| `+` | Addition |
| `*` | Multiplication |
| `/` | Division |
| `**` | Exponentiation: `a` raised to the power of `b` |
| `//` | Root: the `b`-th root of `a` |
| `%` | Modulus: remainder of `a / b` |

### Functions

| Function | Description |
|---|---|
| `abs` | Absolute value |
| `acos` | Arc cosine |
| `asin` | Arc sine |
| `atan` | Arc tangent |
| `atan2` | Arc tangent of `y / x` |
| `ceil` | Smallest integer greater than or equal to a number |
| `cos` | Cosine |
| `cosh` | Hyperbolic cosine |
| `exp` | *e* raised to a power |
| `floor` | Largest integer less than or equal to a number |
| `ln` | Natural logarithm |
| `log` | Logarithm in a given base |
| `log10` | Base 10 logarithm |
| `remainder` | Remainder of a division |
| `round` | Rounds to a number of decimals |
| `sign` | Sign of a number |
| `sin` | Sine |
| `sinh` | Hyperbolic sine |
| `tan` | Tangent |
| `tanh` | Hyperbolic tangent |
| `trunc` | Truncates to a number of decimals |
| `toNumber` | Converts a value to a number |

## Arithmetic operators

The arithmetic operators take numbers and return a number. Precedence follows the usual arithmetic rules (`**` before `*` and `/`, which go before `+` and `-`); use parentheses to change it. In SQL, `**` is translated to `POWER(a,b)`, `//` to `POWER(a,(1/b))` and `%` to `MOD(a,b)`.

**Syntax:**

- `-a`, `a - b`
- `a + b`
- `a * b`
- `a / b`
- `a ** b`
- `a // b`
- `a % b`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 3+2-1 })
```

**Result:** `[{"result":4}]`

**Generated SQL (MySQL):**

```sql
SELECT ((3 + 2) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 3*4-1})
```

**Result:** `[{"result":11}]`

**Generated SQL (MySQL):**

```sql
SELECT ((3 * 4) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1-2-5})
```

**Result:** `[{"result":-6}]`

**Generated SQL (MySQL):**

```sql
SELECT ((1 - 2) - 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (2+3)*2})
```

**Result:** `[{"result":10}]`

**Generated SQL (MySQL):**

```sql
SELECT ((2 + 3) * 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 2*(3+2)})
```

**Result:** `[{"result":10}]`

**Generated SQL (MySQL):**

```sql
SELECT (2 * (3 + 2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2*3*4})
```

**Result:** `[{"result":25}]`

**Generated SQL (MySQL):**

```sql
SELECT (1 + ((2 * 3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (1+(2**3)*4)})
```

**Result:** `[{"result":33}]`

**Generated SQL (MySQL):**

```sql
SELECT (1 + (POWER(2,3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2**(3*4)})
```

**Result:** `[{"result":4097}]`

**Generated SQL (MySQL):**

```sql
SELECT (1 + POWER(2,(3 * 4))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## abs

Returns the absolute value of `value`.

**Signature:** `abs(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: abs(-9)})
```

**Result:** `[{"result":9}]`

**Generated SQL (MySQL):**

```sql
SELECT ABS(-9) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## acos

Returns the arc cosine of `value`, in radians.

**Signature:** `acos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: acos(0.434)})
```

**Result:** `[{"result":1.121868332427735}]`

**Generated SQL (MySQL):**

```sql
SELECT ACOS(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## asin

Returns the arc sine of `value`, in radians.

**Signature:** `asin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: asin(0.434)})
```

**Result:** `[{"result":0.44892799436716174}]`

**Generated SQL (MySQL):**

```sql
SELECT ASIN(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan

Returns the arc tangent of `value`, in radians.

**Signature:** `atan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan(2)})
```

**Result:** `[{"result":1.1071487177940904}]`

**Generated SQL (MySQL):**

```sql
SELECT ATAN(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan2

Returns the arc tangent of `y / x`, in radians, using the signs of both arguments to choose the quadrant.

**Signature:** `atan2(y: number, x: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan2(90, 15)})
```

**Result:** `[{"result":1.4056476493802699}]`

**Generated SQL (MySQL):**

```sql
SELECT ATAN(90,15) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ceil

Returns the smallest integer greater than or equal to `value`.

**Signature:** `ceil(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ceil(2)})
```

**Result:** `[{"result":2}]`

**Generated SQL (MySQL):**

```sql
SELECT CEIL(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cos

Returns the cosine of `value` (in radians).

**Signature:** `cos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cos(2)})
```

**Result:** `[{"result":-0.4161468365471424}]`

**Generated SQL (MySQL):**

```sql
SELECT COS(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cosh

Returns the hyperbolic cosine of `value`.

**Signature:** `cosh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cosh(2)})
```

**Result:** `[{"result":3.7621956910836314}]`

**Generated SQL (MySQL):**

```sql
SELECT ((EXP(2) + EXP(-2)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## exp

Returns *e* raised to the power of `value`.

**Signature:** `exp(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: exp(7)})
```

**Result:** `[{"result":1096.6331584284585}]`

**Generated SQL (MySQL):**

```sql
SELECT EXP(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## floor

Returns the largest integer less than or equal to `value`.

**Signature:** `floor(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: floor(7)})
```

**Result:** `[{"result":7}]`

**Generated SQL (MySQL):**

```sql
SELECT FLOOR(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ln

Returns the natural logarithm (base *e*) of `value`.

**Signature:** `ln(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ln(7)})
```

**Result:** `[{"result":1.9459101490553132}]`

**Generated SQL (MySQL):**

```sql
SELECT LN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log

Returns the logarithm of `value` in base `base`. For example, `log(7,10)` is the base 7 logarithm of 10.

**Signature:** `log(base: number, value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log(7,10)})
```

**Result:** `[{"result":1.1832946624549385}]`

**Generated SQL (MySQL):**

```sql
SELECT LOG(7,10) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log10

Returns the base 10 logarithm of `value`.

**Signature:** `log10(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log10(7)})
```

**Result:** `[{"result":0.8450980400142568}]`

**Generated SQL (MySQL):**

```sql
SELECT LOG10(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## remainder

Returns the remainder of dividing `n1` by `n2`. On MySQL, MariaDB and SQLite it is calculated as `n1 - n2 * ROUND(n1 / n2)`, so the result can be negative (see the example); on PostgreSQL it is translated to `MOD(n1,n2)`, which returns 1 for the same example.

**Signature:** `remainder(n1: number, n2: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: remainder(7,2)})
```

**Result:** `[{"result":-1}]`

**Generated SQL (MySQL):**

```sql
SELECT (7 - 2*ROUND(7/2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## round

Rounds `value` to `decimals` decimal places.

**Signature:** `round(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: round(7.984938,2)})
```

**Result:** `[{"result":7.98}]`

**Generated SQL (MySQL):**

```sql
SELECT ROUND(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sign

Returns the sign of `value`: -1 if it is negative, 0 if it is zero and 1 if it is positive.

**Signature:** `sign(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sign(-7)})
```

**Result:** `[{"result":-1}]`

**Generated SQL (MySQL):**

```sql
SELECT SIGN(-7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sin

Returns the sine of `value` (in radians).

**Signature:** `sin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sin(7)})
```

**Result:** `[{"result":0.6569865987187891}]`

**Generated SQL (MySQL):**

```sql
SELECT SIN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sinh

Returns the hyperbolic sine of `value`.

**Signature:** `sinh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sinh(7)})
```

**Result:** `[{"result":548.3161232732465}]`

**Generated SQL (MySQL):**

```sql
SELECT ((EXP(7) - EXP(-7)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tan

Returns the tangent of `value` (in radians).

**Signature:** `tan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tan(7)})
```

**Result:** `[{"result":0.8714479827243188}]`

**Generated SQL (MySQL):**

```sql
SELECT TAN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tanh

Returns the hyperbolic tangent of `value`.

**Signature:** `tanh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tanh(7)})
```

**Result:** `[{"result":0.9999983369439447}]`

**Generated SQL (MySQL):**

```sql
SELECT (EXP(2*7) - 1)/(EXP(2*7) + 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trunc

Truncates `value` to `decimals` decimal places, without rounding.

**Signature:** `trunc(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: trunc(7.984938,2)})
```

**Result:** `[{"result":7.98}]`

**Generated SQL (MySQL):**

```sql
SELECT TRUNCATE(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## toNumber

Converts `value` to a number. On MySQL it is translated to `CONVERT(value, DECIMAL)`, which has no decimal places, so the example returns 3; on PostgreSQL it is translated to `CAST(value AS INTEGER)`.

**Signature:** `toNumber(value: any): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toNumber("3.141516")})
```

**Result:** `[{"result":3}]`

**Generated SQL (MySQL):**

```sql
SELECT CONVERT('3.141516', DECIMAL) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Database support

Some functions have no direct equivalent in every engine, so λORM translates them to an equivalent expression. For example, on MySQL, MariaDB and SQLite `cosh`, `sinh` and `tanh` are calculated with `EXP`, and `trunc` is translated to `TRUNCATE`; on SQL Server `trunc` is translated to `ROUND(value,decimals,1)`, `ceil` to `CEILING` and `atan2` to `ATN2`.

!!! warning "MongoDB"
    - `remainder` and `toNumber` cannot currently be translated to MongoDB queries.
    - `trunc` is translated to `$trunc` without the number of decimals, so the value is truncated to an integer.
