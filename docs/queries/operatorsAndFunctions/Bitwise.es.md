# Operadores a nivel de bits {#bitwise-operators}

Los operadores a nivel de bits trabajan sobre la representación binaria de valores enteros.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

!!! note "Resultados en MySQL"
    MySQL evalúa las operaciones a nivel de bits como enteros de 64 bits sin signo. La longitud de Brasil es -55, por lo que varios de los resultados siguientes son números muy grandes.

## Resumen {#summary}

| Operador | Descripción |
|---|---|
| `~` | NOT a nivel de bits |
| `&` | AND a nivel de bits |
| `|` | OR a nivel de bits |
| `^` | XOR a nivel de bits (OR exclusivo); no es la potenciación, para eso se usa `**` |
| `<<` | Desplazamiento a la izquierda |
| `>>` | Desplazamiento a la derecha |

## NOT a nivel de bits (`~`) {#bitwise-not}

Invierte todos los bits de `a`. Los operandos y el resultado son números.

**Sintaxis:** `~a`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: ~ p.longitude })
```

**Resultado:** `[{"result":54}]`

**SQL generado (MySQL):**

```sql
SELECT ~ c.longitude AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## AND a nivel de bits (`&`) {#bitwise-and}

Cada bit del resultado es 1 cuando los bits correspondientes de `a` y `b` son ambos 1. Los operandos y el resultado son números.

**Sintaxis:** `a & b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude & 1 })
```

**Resultado:** `[{"result":1}]`

**SQL generado (MySQL):**

```sql
SELECT c.longitude & 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## OR a nivel de bits (`|`) {#bitwise-or}

Cada bit del resultado es 1 cuando el bit correspondiente de `a` o de `b` es 1. Los operandos y el resultado son números.

**Sintaxis:** `a | b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude | 1 })
```

**Resultado:** `[{"result":18446744073709552000}]`

**SQL generado (MySQL):**

```sql
SELECT c.longitude | 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## XOR a nivel de bits (`^`) {#bitwise-xor}

Cada bit del resultado es 1 cuando los bits correspondientes de `a` y `b` son distintos. Los operandos y el resultado son números.

**Sintaxis:** `a ^ b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude ^ 1 })
```

**Resultado:** `[{"result":18446744073709552000}]`

**SQL generado (MySQL):**

```sql
SELECT c.longitude ^ 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Desplazamiento a la izquierda (`<<`) {#left-shift}

Desplaza los bits de `a` hacia la izquierda `b` posiciones. Los operandos y el resultado son números.

**Sintaxis:** `a << b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude << 1 })
```

**Resultado:** `[{"result":18446744073709552000}]`

**SQL generado (MySQL):**

```sql
SELECT c.longitude << 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Desplazamiento a la derecha (`>>`) {#right-shift}

Desplaza los bits de `a` hacia la derecha `b` posiciones. Los operandos y el resultado son números.

**Sintaxis:** `a >> b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude >> 1 })
```

**Resultado:** `[{"result":9223372036854776000}]`

**SQL generado (MySQL):**

```sql
SELECT c.longitude >> 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Soporte por base de datos {#database-support}

!!! warning "Diferencias entre motores"
    - **Oracle**: `&`, `|` y `^` se traducen a `BITAND`, `BITOR` y `BITXOR`.
    - **PostgreSQL**: `^` se traduce al operador `#` (XOR).
    - **MongoDB**: `&`, `|`, `^` y `~` se traducen a `$bitAnd`, `$bitOr`, `$bitXor` y `$bitNot` (MongoDB 6.3 o
      posterior); los desplazamientos `<<` y `>>` todavía no se pueden traducir.
