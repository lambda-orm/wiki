# Funciones de cadenas {#string-functions}

Las funciones de cadenas transforman valores de texto: cambian entre mayúsculas y minúsculas, rellenan, recortan, reemplazan o extraen parte de un string, y convierten valores a string.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

## Resumen {#summary}

| Función | Descripción |
|---|---|
| `chr` | Carácter correspondiente a un código ASCII |
| `concat` | Concatena strings |
| `lower` | Convierte a minúsculas |
| `upper` | Convierte a mayúsculas |
| `lpad` | Rellena un string por la izquierda |
| `rpad` | Rellena un string por la derecha |
| `ltrim` | Elimina los espacios iniciales |
| `rtrim` | Elimina los espacios finales |
| `trim` | Elimina los espacios iniciales y finales |
| `replace` | Reemplaza todas las apariciones de un valor |
| `mask` | Oculta la parte central de un string |
| `maskLeft` | Oculta todo menos los últimos caracteres |
| `maskRight` | Oculta todo menos los primeros caracteres |
| `maskEmail` | Oculta el usuario de un email |
| `hash` | Token SHA-256 o HMAC-SHA256 de un valor |
| `substr`, `substring` | Extrae parte de un string |
| `strCount` | Cuenta las apariciones de un valor |
| `length` | Número de caracteres |
| `left` | Primeros caracteres de una cadena |
| `right` | Últimos caracteres de una cadena |
| `like` | Cumple un patrón SQL |
| `startsWith` | Empieza por un texto |
| `includes` | Contiene un texto |
| `toString` | Convierte un valor a string |

## chr {#chr}

Devuelve el carácter cuyo código ASCII es `ascii`.

**Firma:** `chr(ascii: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: chr(68)})
```

**Resultado:** `[{"result":"D"}]`

**SQL generado (MySQL):**

```sql
SELECT CHAR(68 USING ASCII) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## concat {#concat}

Concatena todos sus argumentos en un único string.

**Firma:** `concat(...values: any): string`

Región y subregión de Brasil, separadas por un espacio:

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: concat(p.region," ",p.subregion) })
```

**Resultado:** `[{"result":"Americas South America"}]`

**SQL generado (MySQL):**

```sql
SELECT CONCAT(CONCAT(c.region,' '),c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lower {#lower}

Convierte `value` a minúsculas.

**Firma:** `lower(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lower(p.subregion) })
```

**Resultado:** `[{"result":"south america"}]`

**SQL generado (MySQL):**

```sql
SELECT LOWER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## upper {#upper}

Convierte `value` a mayúsculas.

**Firma:** `upper(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: upper(p.subregion) })
```

**Resultado:** `[{"result":"SOUTH AMERICA"}]`

**SQL generado (MySQL):**

```sql
SELECT UPPER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lpad {#lpad}

Rellena `value` por la izquierda con `pad` hasta que tenga `len` caracteres.

**Firma:** `lpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lpad(p.region,12,"_") })
```

**Resultado:** `[{"result":"____Americas"}]`

**SQL generado (MySQL):**

```sql
SELECT LPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rpad {#rpad}

Rellena `value` por la derecha con `pad` hasta que tenga `len` caracteres.

**Firma:** `rpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rpad(p.region,12,"_") })
```

**Resultado:** `[{"result":"Americas____"}]`

**SQL generado (MySQL):**

```sql
SELECT RPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ltrim {#ltrim}

Elimina los espacios iniciales de `value`.

**Firma:** `ltrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ltrim("  a  ")})
```

**Resultado:** `[{"result":"a  "}]`

**SQL generado (MySQL):**

```sql
SELECT LTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rtrim {#rtrim}

Elimina los espacios finales de `value`.

**Firma:** `rtrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rtrim("  a  ")})
```

**Resultado:** `[{"result":"  a"}]`

**SQL generado (MySQL):**

```sql
SELECT RTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trim {#trim}

Elimina los espacios iniciales y finales de `value`. Se traduce a `TRIM(value)` en SQL.

**Firma:** `trim(value: string): string`

## replace {#replace}

Devuelve `value` con todas las apariciones de `source` reemplazadas por `target`.

**Firma:** `replace(value: string, source: string, target: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: replace(p.region,"a","*")})
```

**Resultado:** `[{"result":"Americ*s"}]`

**SQL generado (MySQL):**

```sql
SELECT REPLACE(c.region,'a','*') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## mask {#mask}

Las funciones de máscara ocultan parte de un dato personal. λORM las traduce a cada motor con el mismo resultado que en memoria, así que un valor enmascarado por la base de datos y uno enmascarado por la aplicación se ven igual. Una [vista](../../schema/Views.md#personal-data-pii) puede aplicarlas a cada propiedad marcada como dato personal (`pii`) sin nombrarla.

Enmascara un valor: queda visible una cuarta parte de los caracteres de cada lado (3 como máximo) y el resto se reemplaza por `*`, uno por carácter. Un valor de menos de 4 caracteres queda todo en `*`. Un valor nulo sigue siendo nulo.

**Firma:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Resultado:** `[{"result":"Sou*******ica"}]`

**SQL generado (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.subregion) < 4 THEN REPEAT('*', CHAR_LENGTH(c.subregion))
  ELSE CONCAT(LEFT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), REPEAT('*', CHAR_LENGTH(c.subregion) - 2 * LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), RIGHT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskLeft {#maskleft}

Enmascara todos los caracteres menos los últimos `n` (una tarjeta o un teléfono). Un valor de `n` caracteres o menos queda todo en `*`.

**Firma:** `maskLeft(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskLeft(p.name, 2)})
```

**Resultado:** `[{"result":"****il"}]`

**SQL generado (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(REPEAT('*', CHAR_LENGTH(c.name) - 2), RIGHT(c.name, 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskRight {#maskright}

Enmascara todos los caracteres menos los primeros `n` (un apellido). Un valor de `n` caracteres o menos queda todo en `*`.

**Firma:** `maskRight(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskRight(p.name, 2)})
```

**Resultado:** `[{"result":"Br****"}]`

**SQL generado (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(LEFT(c.name, 2), REPEAT('*', CHAR_LENGTH(c.name) - 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskEmail {#maskemail}

Enmascara un email: conserva el primer carácter del usuario y el dominio. Un valor sin usuario antes de `@` queda todo en `*`.

**Firma:** `maskEmail(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskEmail("ana.lopez@example.com")})
```

**Resultado:** `[{"result":"a********@example.com"}]`

**SQL generado (MySQL):**

```sql
SELECT CASE WHEN LOCATE('@', 'ana.lopez@example.com') < 2 THEN REPEAT('*', CHAR_LENGTH('ana.lopez@example.com'))
  ELSE CONCAT(LEFT('ana.lopez@example.com', 1), REPEAT('*', LOCATE('@', 'ana.lopez@example.com') - 2),
    SUBSTRING('ana.lopez@example.com', LOCATE('@', 'ana.lopez@example.com'))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## hash {#hash}

Devuelve un token del valor: su SHA-256 en hexadecimal o, con una `key`, su HMAC-SHA256. El mismo valor da siempre el mismo token, así que el resultado todavía se puede agrupar o unir. Sin clave se traduce en PostgreSQL, MySQL, MariaDB, SQL Server y Oracle; con clave solo en PostgreSQL (que necesita la extensión `pgcrypto`). En MongoDB y SQLite falla con `Function hash is not supported by <dialect>`.

**Firma:** `hash(value: string, key?: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: hash(p.iso3)})
```

**Resultado:** `[{"result":"b437fc1d678d9524fcaf93312f07f0fc9338283110a81edc0233bd0fb7932f69"}]`

**SQL generado (MySQL):**

```sql
SELECT SHA2(c.iso3, 256) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## substr, substring {#substr-substring}

Devuelve la parte de `value` que empieza en la posición `from` (en SQL el primer carácter es la posición 1) y tiene `count` caracteres. `substr` y `substring` son equivalentes.

**Firma:**

- `substr(value: string, from: number, count: number): string`
- `substring(value: string, from: number, count: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substr(p.subregion,1,3)})
```

**Resultado:** `[{"result":"Sou"}]`

**SQL generado (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substring(p.subregion,1,3)})
```

**Resultado:** `[{"result":"Sou"}]`

**SQL generado (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## strCount {#strcount}

Devuelve el número de veces que `value` aparece en `source`. La búsqueda distingue entre mayúsculas y minúsculas.

**Firma:** `strCount(source: string, value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: strCount(p.subregion,"a")})
```

**Resultado:** `[{"result":1}]`

**SQL generado (MySQL):**

```sql
SELECT (LENGTH(c.subregion)-LENGTH(REPLACE(c.subregion,'a',''))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## length {#length}

Devuelve el número de caracteres de `value`.

**Firma:** `length(value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: length(p.subregion)})
```

**Resultado:** `[{"result":13}]`

**SQL generado (MySQL):**

```sql
SELECT CHAR_LENGTH(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## left {#left}

Devuelve los primeros `n` caracteres de `value`.

**Firma:** `left(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: left(p.subregion, 5)})
```

**Resultado:** `[{"result":"South"}]`

**SQL generado (MySQL):**

```sql
SELECT LEFT(c.subregion, 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## right {#right}

Devuelve los últimos `n` caracteres de `value`.

**Firma:** `right(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: right(p.subregion, 7)})
```

**Resultado:** `[{"result":"America"}]`

**SQL generado (MySQL):**

```sql
SELECT RIGHT(c.subregion, 7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## like {#like}

Devuelve `true` cuando `value` cumple el patrón SQL: `%` es cualquier secuencia de caracteres y `_` es un carácter. En MongoDB el patrón se convierte en una expresión regular.

**Firma:** `like(value: string, pattern: string): boolean`

```typescript
Countries.filter(p=> like(p.name, "B%l")).map(p=> p.name)
```

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'B%l'
```

## startsWith {#startswith}

Devuelve `true` cuando `value` empieza por `prefix`. Se puede escribir como función o como método: `startsWith(p.name, "Bra")` o `p.name.startsWith("Bra")`.

**Firma:** `startsWith(value: string, prefix: string): boolean`

```typescript
Countries.filter(p=> p.name.startsWith("Bra")).map(p=> p.name)
```

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'Bra%'
```

## includes {#includes}

Devuelve `true` cuando el texto `value` contiene `text`; escrito como método, `p.subregion.includes("America")`. Con una lista en lugar de un texto, `includes` comprueba si la lista contiene un valor (ver [Comparación](Comparison.md#includes)).

**Firma:** `includes(value: string, text: string): boolean`

```typescript
Countries.filter(p=> p.subregion.includes("America")).map(p=> p.name)
```

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.subregion LIKE '%America%'
```

## toString {#tostring}

Convierte `value` a string.

**Firma:** `toString(value: any): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toString(p.latitude)})
```

**Resultado:** `[{"result":"-10.0000"}]`

**SQL generado (MySQL):**

```sql
SELECT CONVERT(c.latitude, CHAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Constantes de texto {#text-constants}

Una constante de texto escrita en la consulta (`"O'Brien"`) entra en la sentencia escapada como lo exige cada dialecto (a partir de `@lambdaorm/lib` 3.15.0): el SQL estándar duplica la comilla, MySQL y MariaDB la escapan con una barra invertida. Lo mismo vale para las listas de un `in`. Los valores pasados como parámetros no se ven afectados: viajan como parámetros de la sentencia.

```typescript
Customers.filter(p => p.name == "O'Brien")
```

```sql
-- PostgreSQL, SQL Server, Oracle, SQLite
WHERE c.CompanyName = 'O''Brien'
-- MySQL, MariaDB
WHERE c.CompanyName = 'O\'Brien'
```

## Soporte por base de datos {#database-support}

!!! warning "MongoDB"
    `chr`, `lpad`, `rpad` y `hash` no tienen equivalente en MongoDB y no se pueden traducir. El resto de las funciones de esta
    página están disponibles. `like`, `startsWith` e `includes` de un texto comparan el texto de forma literal
    (`includes` y `startsWith` con `$indexOfCP`, `like` con una expresión regular construida a partir del patrón); en
    un filtro van en un `$expr`.

!!! note "Funciones de máscara y hash"
    `mask`, `maskLeft`, `maskRight` y `maskEmail` están disponibles en todos los motores, MongoDB incluido. `hash` no está disponible en MongoDB ni en SQLite, y `hash` con clave solo en PostgreSQL.
