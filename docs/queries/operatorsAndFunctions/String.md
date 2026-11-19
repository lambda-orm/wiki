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
| `substr`, `substring` | Extracts part of a string |
| `strCount` | Counts the occurrences of a value |
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

Masks a sensitive value: keeps its first three and last three characters and replaces the rest with `***`.

**Signature:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Result:** `[{"result":"Sou***ica"}]`

**Generated SQL (MySQL):**

```sql
SELECT Concat(LEFT(c.subregion,3),'***',RIGHT(c.subregion,3)) AS result
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

## Database support

!!! warning "MongoDB"
    `chr`, `lpad` and `rpad` have no MongoDB equivalent and cannot be translated. The other functions on this page are
    available. `like`, `startsWith` and `includes` of a text compare the text literally (`includes` and `startsWith`
    with `$indexOfCP`, `like` with a regular expression built from the pattern); in a filter they go in a `$expr`.
