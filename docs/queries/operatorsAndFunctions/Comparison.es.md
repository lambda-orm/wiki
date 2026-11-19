# Operadores y funciones de comparación {#comparison-operators-and-functions}

Los operadores y funciones de comparación comparan dos o más valores y devuelven un booleano. Se usan sobre todo en el predicado de `filter` (la cláusula `WHERE` del SQL generado), pero se pueden usar en cualquier expresión de una consulta.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

## Resumen {#summary}

| Operador / función | Descripción |
|---|---|
| `==`, `===` | Igual a |
| `!=`, `!==`, `<>` | Distinto de |
| `>` | Mayor que |
| `<` | Menor que |
| `>=` | Mayor o igual que |
| `<=` | Menor o igual que |
| `between` | Comprueba si un valor está dentro de un rango |
| `in` | Comprueba si un valor está en una lista de valores |
| `includes` | Comprueba si una lista contiene un valor |

## Igual (`==`, `===`) {#equal}

Devuelve `true` cuando ambos operandos son iguales. `==` y `===` son equivalentes: ambos se traducen a `=` en SQL.

**Sintaxis:**

- `a == b`
- `a === b`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 === "BRA").map(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Distinto (`!=`, `!==`, `<>`) {#not-equal}

Devuelve `true` cuando los operandos son distintos. Las tres formas son equivalentes y se traducen a `<>` en SQL.

**Sintaxis:**

- `a != b`
- `a !== b`
- `a <> b`

Ver la página [Lógicos](Logical.md) para un ejemplo que usa `!=`.

## Mayor que, menor que (`>`, `<`, `>=`, `<=`) {#greater-than-less-than}

Comparan dos valores del mismo tipo (números, strings o fechas).

- `a > b`: `a` es mayor que `b`.
- `a < b`: `a` es menor que `b`.
- `a >= b`: `a` es mayor o igual que `b`.
- `a <= b`: `a` es menor o igual que `b`.

Nombre del primer país (ordenado por nombre) cuya latitud está entre -11 y -9 (sin incluirlos) y cuya longitud es -55:

```typescript
Countries.filter(p=> p.latitude < -9 && p.latitude > -11 && p.longitude == -55 ).first(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude < -9 AND (c.latitude > -11 AND c.longitude = -55))
ORDER BY c.name asc
LIMIT 0,1
```

## between {#between}

Devuelve `true` cuando `value` está dentro del rango de `from` a `to`. En SQL se traduce a `value BETWEEN from AND to`, que incluye ambos límites.

**Firma:** `between(value: T, from: T, to: T): boolean`

```typescript
Countries.filter(p=> between(p.latitude,-11,-9) && p.longitude == -55 ).first(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude BETWEEN -11 AND -9 AND c.longitude = -55)
ORDER BY c.name asc
LIMIT 0,1
```

## in {#in}

Devuelve `true` cuando `value` es igual a uno de los valores de `list`. Reemplaza varias condiciones unidas con `||` y se traduce a `value IN (...)` en SQL.

**Firma:** `in(value: T, list: T[]): boolean`

```typescript
Countries.filter(p=> in(p.iso3,["BRA","ARG"])).map(p=> p.name)
```

**Resultado:** `[{"name":"Argentina"},{"name":"Brazil"}]`

**SQL generado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 IN ('BRA', 'ARG')
```

## includes {#includes}

Devuelve `true` cuando `list` contiene `value`. Es la misma comprobación que `in`, con los argumentos en orden inverso: la lista va primero. `contains` es un alias de `includes`.

**Firma:** `includes(list: T[], value: T): boolean`

Por ejemplo, `includes(["BRA","ARG"], p.iso3)` genera la misma condición `WHERE c.iso3 IN ('BRA', 'ARG')` que el ejemplo de `in` anterior en todos los motores SQL; en MongoDB es `{"iso3": {"$in": ["BRA", "ARG"]}}`. La forma de método `["BRA","ARG"].includes(p.iso3)` es igual.

Como en JavaScript, `includes` de un **texto** es otra comprobación: `p.name.includes("ar")` devuelve `true` cuando el texto contiene `"ar"` (`LIKE '%ar%'` en SQL, una búsqueda literal en MongoDB). Decide el tipo del primer argumento: una lista (o una variable) es la comprobación de lista; un texto, la de texto.

## Soporte por base de datos {#database-support}

!!! warning "Diferencias entre motores"
    - **MongoDB**: `between` se traduce a `{"$gte": from, "$lt": to}`, por lo que el límite superior queda **excluido**, a diferencia de `BETWEEN` en SQL.
