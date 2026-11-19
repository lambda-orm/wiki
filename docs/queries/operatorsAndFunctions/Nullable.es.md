# Funciones de nulos {#nullable-functions}

Las funciones de nulos comprueban si un valor es nulo o reemplazan los valores nulos por otro valor.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre las entidades `Countries` y `States` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó. En el esquema de pruebas, `Countries` se almacena en MySQL y `States` en PostgreSQL (mapeada a la tabla `TBL_STATES`), por lo que el SQL de cada ejemplo se muestra en el dialecto de su fuente de datos. Para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

## Resumen {#summary}

| Función | Descripción |
|---|---|
| `nvl` | Devuelve un valor por defecto cuando el valor es nulo |
| `nvl2` | Devuelve un valor cuando el valor no es nulo y otro cuando es nulo |
| `isNull` | Comprueba si un valor es nulo |
| `isNotNull` | Comprueba si un valor no es nulo |

## nvl {#nvl}

Devuelve `value` cuando no es nulo; en caso contrario devuelve `default`.

**Firma:** `nvl(value: T, default: T): T`

Número de estados cuya latitud es nula (el nulo se reemplaza por -100, de modo que la condición lo cumple):

```typescript
States.filter(p=> nvl(p.latitude,-100)== -100).map(p=> count(1))
```

**Resultado:** `[{"count":68}]`

**SQL generado (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (CASE WHEN s.LATITUDE IS NOT NULL THEN s.LATITUDE ELSE -100 END) = -100
```

Nombre nativo del país con código ISO 3 "CIV", o "???" cuando es nulo:

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl(p.native,"???")})
```

**Resultado:** `[{"native":"???"}]`

**SQL generado (MySQL):**

```sql
SELECT IFNULL(c.native,'???') AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## nvl2 {#nvl2}

Devuelve `a` cuando `value` no es nulo, y `b` cuando es nulo.

**Firma:** `nvl2(value: any, a: T, b: T): T`

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl2(p.native,"is not null","is null")})
```

**Resultado:** `[{"native":"is null"}]`

**SQL generado (MySQL):**

```sql
SELECT (CASE WHEN c.native IS NOT NULL THEN 'is not null' ELSE 'is null' END) AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## isNull {#isnull}

Devuelve `true` cuando `value` es nulo.

**Firma:** `isNull(value: any): boolean`

Número de estados cuya latitud es nula:

```typescript
States.filter(p=> isNull(p.latitude)).map(p=> count(1))
```

**Resultado:** `[{"count":68}]`

**SQL generado (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NULL)
```

## isNotNull {#isnotnull}

Devuelve `true` cuando `value` no es nulo.

**Firma:** `isNotNull(value: any): boolean`

Número de estados cuya latitud no es nula:

```typescript
States.filter(p=> isNotNull(p.latitude)).map(p=> count(1))
```

**Resultado:** `[{"count":4813}]`

**SQL generado (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NOT NULL)
```

## Soporte por base de datos {#database-support}

!!! note "MongoDB"
    `nvl`, `nvl2`, `isNull` e `isNotNull` se traducen a `$ifNull` y `$cond`; en un filtro, `isNull` e `isNotNull` van en
    un `$expr`. Un campo que no existe cuenta como nulo.
