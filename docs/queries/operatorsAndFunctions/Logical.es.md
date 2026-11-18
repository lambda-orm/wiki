# Operadores lógicos {#logical-operators}

Los operadores lógicos combinan o niegan expresiones booleanas, por ejemplo para unir varias condiciones en el predicado de `filter`.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

## Resumen {#summary}

| Operador | Descripción | SQL |
|---|---|---|
| `!` | NOT lógico | `NOT` |
| `&&` | AND lógico | `AND` |
| `||` | OR lógico | `OR` |

## NOT (`!`) {#not}

Niega una expresión booleana: devuelve `true` cuando `value` es `false`, y `false` cuando es `true`.

**Sintaxis:** `!value`

Por ejemplo, `Countries.filter(p=> !(p.iso3 == "BRA"))` genera la condición `WHERE NOT c.iso3 = 'BRA'`.

## AND (`&&`) {#and}

Devuelve `true` cuando ambos operandos son `true`.

**Sintaxis:** `a && b`

Número de países de América del Sur cuya longitud es menor que -30:

```typescript
Countries.filter(p=> p.subregion == "South America" &&  p.longitude < -30 ).map(p=> {result:count(1)})
```

**Resultado:** `[{"result":15}]`

**SQL generado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' AND c.longitude < -30)
```

## OR (`||`) {#or}

Devuelve `true` cuando al menos uno de los operandos es `true`.

**Sintaxis:** `a || b`

Número de países de América del Sur o de América Central:

```typescript
Countries.filter(p=> p.subregion == "South America" || p.subregion == "Central America" ).map(p=> {result:count(1)})
```

**Resultado:** `[{"result":23}]`

**SQL generado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' OR c.subregion = 'Central America')
```

## Combinar condiciones {#combining-conditions}

Los operadores se pueden combinar con los operadores de comparación descritos en [Comparación](Comparison.md). Número de países de la región de las Américas que no están en América del Norte:

```typescript
Countries.filter(p=> p.region == "Americas" &&  p.subregion != "Northern America" ).map(p=> {result:count(1)})
```

**Resultado:** `[{"result":51}]`

**SQL generado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.region = 'Americas' AND c.subregion <> 'Northern America')
```
