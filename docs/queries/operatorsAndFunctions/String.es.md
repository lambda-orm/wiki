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
| `substr`, `substring` | Extrae parte de un string |
| `strCount` | Cuenta las apariciones de un valor |
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

Enmascara un valor sensible: conserva sus tres primeros y sus tres últimos caracteres y reemplaza el resto por `***`.

**Firma:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Resultado:** `[{"result":"Sou***ica"}]`

**SQL generado (MySQL):**

```sql
SELECT Concat(LEFT(c.subregion,3),'***',RIGHT(c.subregion,3)) AS result
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

## Soporte por base de datos {#database-support}

!!! warning "MongoDB"
    En la versión actual, `chr`, `lpad`, `rpad`, `ltrim`, `rtrim`, `trim`, `replace`, `mask`, `substr`, `substring` y `strCount` no se pueden traducir a consultas de MongoDB. `concat`, `lower`, `upper` y `toString` sí están soportadas.
