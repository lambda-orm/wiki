# String Functions

String functions transform text values: change the case, pad, trim, replace or extract part of a string, and convert values to strings.

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

## Summary

| Function | Description |
|---|---|
| `chr` | Character for an ASCII code |
| `concat` | Concatenates strings |
| `lower` | Converts to lowercase |
| `upper` | Converts to uppercase |
| `lpad` | Pads the left side of a string |
| `rpad` | Pads the right side of a string |
| `ltrim` | Removes leading spaces |
| `rtrim` | Removes trailing spaces |
| `trim` | Removes leading and trailing spaces |
| `replace` | Replaces every occurrence of a value |
| `mask` | Hides the middle of a string |
| `maskLeft` | Hides all but the last characters |
| `maskRight` | Hides all but the first characters |
| `maskEmail` | Hides the user of an email |
| `hash` | SHA-256 or HMAC-SHA256 token of a value |
| `substr`, `substring` | Extracts part of a string |
| `strCount` | Counts the occurrences of a value |
| `length` | Number of characters |
| `left` | First characters of a string |
| `right` | Last characters of a string |
| `like` | Matches a SQL pattern |
| `startsWith` | Starts with a text |
| `includes` | Contains a text |
| `toString` | Converts a value to a string |

## chr

Returns the character whose ASCII code is `ascii`.

**Signature:** `chr(ascii: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: chr(68)})
```

**Result:** `[{"result":"D"}]`

**Generated SQL (MySQL):**

```sql
SELECT CHAR(68 USING ASCII) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## concat

Concatenates all its arguments into one string.

**Signature:** `concat(...values: any): string`

Region and subregion of Brazil, separated by a space:

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: concat(p.region," ",p.subregion) })
```

**Result:** `[{"result":"Americas South America"}]`

**Generated SQL (MySQL):**

```sql
SELECT CONCAT(CONCAT(c.region,' '),c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lower

Converts `value` to lowercase.

**Signature:** `lower(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lower(p.subregion) })
```

**Result:** `[{"result":"south america"}]`

**Generated SQL (MySQL):**

```sql
SELECT LOWER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## upper

Converts `value` to uppercase.

**Signature:** `upper(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: upper(p.subregion) })
```

**Result:** `[{"result":"SOUTH AMERICA"}]`

**Generated SQL (MySQL):**

```sql
SELECT UPPER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lpad

Pads the left side of `value` with `pad` until it is `len` characters long.

**Signature:** `lpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lpad(p.region,12,"_") })
```

**Result:** `[{"result":"____Americas"}]`

**Generated SQL (MySQL):**

```sql
SELECT LPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rpad

Pads the right side of `value` with `pad` until it is `len` characters long.

**Signature:** `rpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rpad(p.region,12,"_") })
```

**Result:** `[{"result":"Americas____"}]`

**Generated SQL (MySQL):**

```sql
SELECT RPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ltrim

Removes the leading spaces of `value`.

**Signature:** `ltrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ltrim("  a  ")})
```

**Result:** `[{"result":"a  "}]`

**Generated SQL (MySQL):**

```sql
SELECT LTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rtrim

Removes the trailing spaces of `value`.

**Signature:** `rtrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rtrim("  a  ")})
```

**Result:** `[{"result":"  a"}]`

**Generated SQL (MySQL):**

```sql
SELECT RTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trim

Removes the leading and trailing spaces of `value`. It is translated to `TRIM(value)` in SQL.

**Signature:** `trim(value: string): string`

## replace

Returns `value` with every occurrence of `source` replaced by `target`.

**Signature:** `replace(value: string, source: string, target: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: replace(p.region,"a","*")})
```

**Result:** `[{"result":"Americ*s"}]`

**Generated SQL (MySQL):**

```sql
SELECT REPLACE(c.region,'a','*') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## mask

The mask functions hide part of a personal value. λORM translates them to every engine with the same result as in memory, so a value masked by the database and one masked by the application look the same. A [view](../../schema/Views.md#personal-data-pii) can apply them to every property marked as personal data (`pii`) without naming it.

Masks a value: a quarter of the characters on each side stays visible (3 at most) and the rest is replaced with `*`, one per character. A value of less than 4 characters is all `*`. A null value stays null.

**Signature:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Result:** `[{"result":"Sou*******ica"}]`

**Generated SQL (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.subregion) < 4 THEN REPEAT('*', CHAR_LENGTH(c.subregion))
  ELSE CONCAT(LEFT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), REPEAT('*', CHAR_LENGTH(c.subregion) - 2 * LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), RIGHT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskLeft

Masks all the characters but the last `n` (a card or a phone number). A value of `n` characters or less is all `*`.

**Signature:** `maskLeft(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskLeft(p.name, 2)})
```

**Result:** `[{"result":"****il"}]`

**Generated SQL (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(REPEAT('*', CHAR_LENGTH(c.name) - 2), RIGHT(c.name, 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskRight

Masks all the characters but the first `n` (a surname). A value of `n` characters or less is all `*`.

**Signature:** `maskRight(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskRight(p.name, 2)})
```

**Result:** `[{"result":"Br****"}]`

**Generated SQL (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(LEFT(c.name, 2), REPEAT('*', CHAR_LENGTH(c.name) - 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskEmail

Masks an email: keeps the first character of the user and the domain. A value without a user before `@` is all `*`.

**Signature:** `maskEmail(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskEmail("ana.lopez@example.com")})
```

**Result:** `[{"result":"a********@example.com"}]`

**Generated SQL (MySQL):**

```sql
SELECT CASE WHEN LOCATE('@', 'ana.lopez@example.com') < 2 THEN REPEAT('*', CHAR_LENGTH('ana.lopez@example.com'))
  ELSE CONCAT(LEFT('ana.lopez@example.com', 1), REPEAT('*', LOCATE('@', 'ana.lopez@example.com') - 2),
    SUBSTRING('ana.lopez@example.com', LOCATE('@', 'ana.lopez@example.com'))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## hash

Returns a token of the value: its SHA-256 in hexadecimal or, with a `key`, its HMAC-SHA256. The same value always gives the same token, so the result can still be grouped or joined. Without a key it is translated on PostgreSQL, MySQL, MariaDB, SQL Server and Oracle; with a key only on PostgreSQL (which needs the `pgcrypto` extension). On MongoDB and SQLite it fails with `Function hash is not supported by <dialect>`.

**Signature:** `hash(value: string, key?: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: hash(p.iso3)})
```

**Result:** `[{"result":"b437fc1d678d9524fcaf93312f07f0fc9338283110a81edc0233bd0fb7932f69"}]`

**Generated SQL (MySQL):**

```sql
SELECT SHA2(c.iso3, 256) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## substr, substring

Returns the part of `value` that starts at position `from` (the first character is position 1 in SQL) and is `count` characters long. `substr` and `substring` are equivalent.

**Signature:**

- `substr(value: string, from: number, count: number): string`
- `substring(value: string, from: number, count: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substr(p.subregion,1,3)})
```

**Result:** `[{"result":"Sou"}]`

**Generated SQL (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substring(p.subregion,1,3)})
```

**Result:** `[{"result":"Sou"}]`

**Generated SQL (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## strCount

Returns the number of times `value` appears in `source`. The search is case-sensitive.

**Signature:** `strCount(source: string, value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: strCount(p.subregion,"a")})
```

**Result:** `[{"result":1}]`

**Generated SQL (MySQL):**

```sql
SELECT (LENGTH(c.subregion)-LENGTH(REPLACE(c.subregion,'a',''))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## length

Returns the number of characters of `value`.

**Signature:** `length(value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: length(p.subregion)})
```

**Result:** `[{"result":13}]`

**Generated SQL (MySQL):**

```sql
SELECT CHAR_LENGTH(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## left

Returns the first `n` characters of `value`.

**Signature:** `left(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: left(p.subregion, 5)})
```

**Result:** `[{"result":"South"}]`

**Generated SQL (MySQL):**

```sql
SELECT LEFT(c.subregion, 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## right

Returns the last `n` characters of `value`.

**Signature:** `right(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: right(p.subregion, 7)})
```

**Result:** `[{"result":"America"}]`

**Generated SQL (MySQL):**

```sql
SELECT RIGHT(c.subregion, 7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## like

Returns `true` when `value` matches the SQL pattern: `%` is any sequence of characters and `_` is one character. On MongoDB the pattern becomes a regular expression.

**Signature:** `like(value: string, pattern: string): boolean`

```typescript
Countries.filter(p=> like(p.name, "B%l")).map(p=> p.name)
```

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'B%l'
```

## startsWith

Returns `true` when `value` starts with `prefix`. It can be written as a function or as a method: `startsWith(p.name, "Bra")` or `p.name.startsWith("Bra")`.

**Signature:** `startsWith(value: string, prefix: string): boolean`

```typescript
Countries.filter(p=> p.name.startsWith("Bra")).map(p=> p.name)
```

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'Bra%'
```

## includes

Returns `true` when the text `value` contains `text`; written as a method, `p.subregion.includes("America")`. With a list instead of a text, `includes` checks whether the list contains a value (see [Comparison](Comparison.md#includes)).

**Signature:** `includes(value: string, text: string): boolean`

```typescript
Countries.filter(p=> p.subregion.includes("America")).map(p=> p.name)
```

**Generated SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.subregion LIKE '%America%'
```

## toString

Converts `value` to a string.

**Signature:** `toString(value: any): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toString(p.latitude)})
```

**Result:** `[{"result":"-10.0000"}]`

**Generated SQL (MySQL):**

```sql
SELECT CONVERT(c.latitude, CHAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Text constants

A text constant written in the query (`"O'Brien"`) goes into the statement escaped as each dialect requires (from `@lambdaorm/lib` 3.15.0): standard SQL doubles the quote, MySQL and MariaDB escape it with a backslash. The same applies to the lists of an `in`. Values passed as parameters are not affected: they travel as parameters of the statement.

```typescript
Customers.filter(p => p.name == "O'Brien")
```

```sql
-- PostgreSQL, SQL Server, Oracle, SQLite
WHERE c.CompanyName = 'O''Brien'
-- MySQL, MariaDB
WHERE c.CompanyName = 'O\'Brien'
```

## Database support

!!! warning "MongoDB"
    `chr`, `lpad`, `rpad` and `hash` have no MongoDB equivalent and cannot be translated. The other functions on this page are
    available. `like`, `startsWith` and `includes` of a text compare the text literally (`includes` and `startsWith`
    with `$indexOfCP`, `like` with a regular expression built from the pattern); in a filter they go in a `$expr`.

!!! note "Mask functions and hash"
    `mask`, `maskLeft`, `maskRight` and `maskEmail` are available on every engine, MongoDB included. `hash` is not available on MongoDB or SQLite, and `hash` with a key only on PostgreSQL.
