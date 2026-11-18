# Operadores y funciones numéricos {#numeric-operators-and-functions}

Los operadores y funciones numéricos realizan cálculos aritméticos, de redondeo, trigonométricos y logarítmicos.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

## Resumen {#summary}

### Operadores {#operators}

| Operador | Descripción |
|---|---|
| `-` | Negación (`-a`) o resta (`a - b`) |
| `+` | Suma |
| `*` | Multiplicación |
| `/` | División |
| `**` | Potenciación: `a` elevado a la potencia `b` |
| `//` | Raíz: la raíz `b`-ésima de `a` |
| `%` | Módulo: resto de `a / b` |

### Funciones {#functions}

| Función | Descripción |
|---|---|
| `abs` | Valor absoluto |
| `acos` | Arco coseno |
| `asin` | Arco seno |
| `atan` | Arco tangente |
| `atan2` | Arco tangente de `y / x` |
| `ceil` | Menor entero mayor o igual que un número |
| `cos` | Coseno |
| `cosh` | Coseno hiperbólico |
| `exp` | *e* elevado a una potencia |
| `floor` | Mayor entero menor o igual que un número |
| `ln` | Logaritmo natural |
| `log` | Logaritmo en una base dada |
| `log10` | Logaritmo en base 10 |
| `remainder` | Resto de una división |
| `round` | Redondea a un número de decimales |
| `sign` | Signo de un número |
| `sin` | Seno |
| `sinh` | Seno hiperbólico |
| `tan` | Tangente |
| `tanh` | Tangente hiperbólica |
| `trunc` | Trunca a un número de decimales |
| `toNumber` | Convierte un valor a número |

## Operadores aritméticos {#arithmetic-operators}

Los operadores aritméticos reciben números y devuelven un número. La precedencia sigue las reglas aritméticas habituales (`**` antes que `*` y `/`, que van antes que `+` y `-`); para cambiarla se usan paréntesis. En SQL, `**` se traduce a `POWER(a,b)`, `//` a `POWER(a,(1/b))` y `%` a `MOD(a,b)`.

**Sintaxis:**

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

**Resultado:** `[{"result":4}]`

**SQL generado (MySQL):**

```sql
SELECT ((3 + 2) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 3*4-1})
```

**Resultado:** `[{"result":11}]`

**SQL generado (MySQL):**

```sql
SELECT ((3 * 4) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1-2-5})
```

**Resultado:** `[{"result":-6}]`

**SQL generado (MySQL):**

```sql
SELECT ((1 - 2) - 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (2+3)*2})
```

**Resultado:** `[{"result":10}]`

**SQL generado (MySQL):**

```sql
SELECT ((2 + 3) * 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 2*(3+2)})
```

**Resultado:** `[{"result":10}]`

**SQL generado (MySQL):**

```sql
SELECT (2 * (3 + 2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2*3*4})
```

**Resultado:** `[{"result":25}]`

**SQL generado (MySQL):**

```sql
SELECT (1 + ((2 * 3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (1+(2**3)*4)})
```

**Resultado:** `[{"result":33}]`

**SQL generado (MySQL):**

```sql
SELECT (1 + (POWER(2,3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2**(3*4)})
```

**Resultado:** `[{"result":4097}]`

**SQL generado (MySQL):**

```sql
SELECT (1 + POWER(2,(3 * 4))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## abs {#abs}

Devuelve el valor absoluto de `value`.

**Firma:** `abs(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: abs(-9)})
```

**Resultado:** `[{"result":9}]`

**SQL generado (MySQL):**

```sql
SELECT ABS(-9) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## acos {#acos}

Devuelve el arco coseno de `value`, en radianes.

**Firma:** `acos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: acos(0.434)})
```

**Resultado:** `[{"result":1.121868332427735}]`

**SQL generado (MySQL):**

```sql
SELECT ACOS(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## asin {#asin}

Devuelve el arco seno de `value`, en radianes.

**Firma:** `asin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: asin(0.434)})
```

**Resultado:** `[{"result":0.44892799436716174}]`

**SQL generado (MySQL):**

```sql
SELECT ASIN(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan {#atan}

Devuelve el arco tangente de `value`, en radianes.

**Firma:** `atan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan(2)})
```

**Resultado:** `[{"result":1.1071487177940904}]`

**SQL generado (MySQL):**

```sql
SELECT ATAN(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan2 {#atan2}

Devuelve el arco tangente de `y / x`, en radianes, usando los signos de ambos argumentos para elegir el cuadrante.

**Firma:** `atan2(y: number, x: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan2(90, 15)})
```

**Resultado:** `[{"result":1.4056476493802699}]`

**SQL generado (MySQL):**

```sql
SELECT ATAN(90,15) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ceil {#ceil}

Devuelve el menor entero mayor o igual que `value`.

**Firma:** `ceil(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ceil(2)})
```

**Resultado:** `[{"result":2}]`

**SQL generado (MySQL):**

```sql
SELECT CEIL(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cos {#cos}

Devuelve el coseno de `value` (en radianes).

**Firma:** `cos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cos(2)})
```

**Resultado:** `[{"result":-0.4161468365471424}]`

**SQL generado (MySQL):**

```sql
SELECT COS(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cosh {#cosh}

Devuelve el coseno hiperbólico de `value`.

**Firma:** `cosh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cosh(2)})
```

**Resultado:** `[{"result":3.7621956910836314}]`

**SQL generado (MySQL):**

```sql
SELECT ((EXP(2) + EXP(-2)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## exp {#exp}

Devuelve *e* elevado a la potencia `value`.

**Firma:** `exp(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: exp(7)})
```

**Resultado:** `[{"result":1096.6331584284585}]`

**SQL generado (MySQL):**

```sql
SELECT EXP(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## floor {#floor}

Devuelve el mayor entero menor o igual que `value`.

**Firma:** `floor(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: floor(7)})
```

**Resultado:** `[{"result":7}]`

**SQL generado (MySQL):**

```sql
SELECT FLOOR(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ln {#ln}

Devuelve el logaritmo natural (en base *e*) de `value`.

**Firma:** `ln(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ln(7)})
```

**Resultado:** `[{"result":1.9459101490553132}]`

**SQL generado (MySQL):**

```sql
SELECT LN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log {#log}

Devuelve el logaritmo de `value` en base `base`. Por ejemplo, `log(7,10)` es el logaritmo en base 7 de 10.

**Firma:** `log(base: number, value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log(7,10)})
```

**Resultado:** `[{"result":1.1832946624549385}]`

**SQL generado (MySQL):**

```sql
SELECT LOG(7,10) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log10 {#log10}

Devuelve el logaritmo en base 10 de `value`.

**Firma:** `log10(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log10(7)})
```

**Resultado:** `[{"result":0.8450980400142568}]`

**SQL generado (MySQL):**

```sql
SELECT LOG10(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## remainder {#remainder}

Devuelve el resto de dividir `n1` entre `n2`. En MySQL, MariaDB y SQLite se calcula como `n1 - n2 * ROUND(n1 / n2)`, por lo que el resultado puede ser negativo (ver el ejemplo); en PostgreSQL se traduce a `MOD(n1,n2)`, que devuelve 1 para el mismo ejemplo.

**Firma:** `remainder(n1: number, n2: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: remainder(7,2)})
```

**Resultado:** `[{"result":-1}]`

**SQL generado (MySQL):**

```sql
SELECT (7 - 2*ROUND(7/2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## round {#round}

Redondea `value` a `decimals` decimales.

**Firma:** `round(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: round(7.984938,2)})
```

**Resultado:** `[{"result":7.98}]`

**SQL generado (MySQL):**

```sql
SELECT ROUND(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sign {#sign}

Devuelve el signo de `value`: -1 si es negativo, 0 si es cero y 1 si es positivo.

**Firma:** `sign(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sign(-7)})
```

**Resultado:** `[{"result":-1}]`

**SQL generado (MySQL):**

```sql
SELECT SIGN(-7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sin {#sin}

Devuelve el seno de `value` (en radianes).

**Firma:** `sin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sin(7)})
```

**Resultado:** `[{"result":0.6569865987187891}]`

**SQL generado (MySQL):**

```sql
SELECT SIN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sinh {#sinh}

Devuelve el seno hiperbólico de `value`.

**Firma:** `sinh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sinh(7)})
```

**Resultado:** `[{"result":548.3161232732465}]`

**SQL generado (MySQL):**

```sql
SELECT ((EXP(7) - EXP(-7)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tan {#tan}

Devuelve la tangente de `value` (en radianes).

**Firma:** `tan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tan(7)})
```

**Resultado:** `[{"result":0.8714479827243188}]`

**SQL generado (MySQL):**

```sql
SELECT TAN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tanh {#tanh}

Devuelve la tangente hiperbólica de `value`.

**Firma:** `tanh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tanh(7)})
```

**Resultado:** `[{"result":0.9999983369439447}]`

**SQL generado (MySQL):**

```sql
SELECT (EXP(2*7) - 1)/(EXP(2*7) + 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trunc {#trunc}

Trunca `value` a `decimals` decimales, sin redondear.

**Firma:** `trunc(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: trunc(7.984938,2)})
```

**Resultado:** `[{"result":7.98}]`

**SQL generado (MySQL):**

```sql
SELECT TRUNCATE(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## toNumber {#tonumber}

Convierte `value` a número. En MySQL se traduce a `CONVERT(value, DECIMAL)`, que no tiene decimales, por lo que el ejemplo devuelve 3; en PostgreSQL se traduce a `CAST(value AS INTEGER)`.

**Firma:** `toNumber(value: any): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toNumber("3.141516")})
```

**Resultado:** `[{"result":3}]`

**SQL generado (MySQL):**

```sql
SELECT CONVERT('3.141516', DECIMAL) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Soporte por base de datos {#database-support}

Algunas funciones no tienen un equivalente directo en todos los motores de base de datos, por lo que λORM las traduce a una expresión equivalente. Por ejemplo, en MySQL, MariaDB y SQLite `cosh`, `sinh` y `tanh` se calculan con `EXP`, y `trunc` se traduce a `TRUNCATE`; en SQL Server `trunc` se traduce a `ROUND(value,decimals,1)`, `ceil` a `CEILING` y `atan2` a `ATN2`.

!!! warning "MongoDB"
    - Actualmente `remainder` y `toNumber` no se pueden traducir a consultas de MongoDB.
    - `trunc` se traduce a `$trunc` sin el número de decimales, por lo que el valor se trunca a un entero.
