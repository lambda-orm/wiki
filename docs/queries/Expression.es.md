# Expresiones lambda {#lambda-expressions}

Esta página resume las piezas de una consulta de λORM: los métodos que se encadenan sobre una entidad y los operadores y funciones que se pueden usar dentro de las lambdas. Sirve como referencia rápida; cada método enlaza con la página de sus ejemplos.

Las consultas son [expresiones lambda](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) escritas en el propio lenguaje de programación. Hacen referencia a las entidades y propiedades del dominio, por lo que son independientes del lenguaje de la base de datos y de cómo se almacenan los datos.

## Ejemplo {#example}

La siguiente consulta lee los productos cuyo nombre empieza por "A", con el nombre de su categoría, ordenados por categoría (ascendente) y producto (descendente), y devuelve la primera página de 10 registros:

```typescript
Products
	.filter(p => upper(substr(p.name, 1, 1)) == "A")
	.map(p => ({ category: p.category.name, product: p.name }))
	.sort(p => [p.category, desc(p.product)])
	.page(1, 10)
```

En Oracle, λORM la traduce a:

```sql
SELECT c.CategoryName AS "category", p.ProductName AS "product"
FROM Products p
INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE UPPER(SUBSTR(p.ProductName,1,1)) = 'A'
ORDER BY "category" asc, "product" desc
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

La misma consulta se ejecuta en cualquier otro motor de base de datos: en MySQL, por ejemplo, la paginación se convierte en `LIMIT 0,10`.

## Ventajas {#advantages}

- Las consultas se escriben en el mismo lenguaje de programación que la aplicación.
- No hay que aprender un lenguaje nuevo.
- Las expresiones son fáciles de escribir y de leer.
- El IntelliSense del IDE ayuda a escribir las expresiones.
- Los errores de sintaxis se detectan mientras se escribe.

## Métodos de consulta {#query-methods}

| Método | Descripción | Equivalente SQL | Ejemplos |
|:--|:--|:--|:--|
| filter | Filtra los registros. | WHERE | [Select](Select.md) |
| having | Filtra los grupos. | HAVING | [Agrupación](Grouping.md) |
| map | Indica las propiedades a devolver. | SELECT | [Select](Select.md) |
| distinct | Indica las propiedades a devolver, eliminando los registros duplicados. | SELECT DISTINCT | [Select](Select.md) |
| first | Devuelve el primer registro. | SELECT + ORDER BY + LIMIT | [Select](Select.md) |
| last | Devuelve el último registro. | SELECT + ORDER BY DESC + LIMIT | [Select](Select.md) |
| sort | Indica el orden de los registros. | ORDER BY | [Select](Select.md) |
| page | Pagina los registros. | LIMIT / OFFSET (depende del dialecto) | [Select](Select.md) |
| include | Carga los registros de entidades relacionadas. | | [Include](Include.md) |
| insert | Inserta un registro. | INSERT | [Insert](Insert.md) |
| upsert | Inserta un registro, o lo actualiza si ya existe uno con la misma clave primaria. | INSERT … ON CONFLICT / MERGE | [Insert](Insert.md#upsert) |
| bulkInsert | Inserta muchos registros a la vez. | INSERT | [Inserción masiva](BulkInsert.md) |
| update | Actualiza registros; siempre tiene un filtro. | UPDATE con WHERE | [Update](Update.md) |
| updateAll | Actualiza todos los registros de una entidad. | UPDATE sin WHERE | [Update](Update.md) |
| delete | Elimina registros; siempre tiene un filtro. | DELETE con WHERE | [Delete](Delete.md) |
| deleteAll | Elimina todos los registros de una entidad. | DELETE sin WHERE | [Delete](Delete.md) |

- No hay un método para los joins: se deduce un INNER JOIN cuando la consulta navega por una relación, como en `p.category.name` (ver [Join](Join.md)); cuando la entidad relacionada está en otra fuente, la consulta se resuelve entre fuentes (ver [Consultas entre fuentes](CrossSource.md)).
- No hay un método para GROUP BY: se deduce cuando se usa una función de agregación (ver [Agrupación](Grouping.md)).

## Operadores {#operators}

Los operadores son los mismos que en JavaScript.

| Categoría | Operadores | Más información |
|:--|:--|:--|
| Aritméticos | `-`, `+`, `*`, `/`, `**`, `//`, `%` | [Numéricos](operatorsAndFunctions/Numeric.md) |
| A nivel de bits | `~`, `&`, `\|`, `^`, `<<`, `>>` | [A nivel de bits](operatorsAndFunctions/Bitwise.md) |
| Comparación | `==`, `===`, `!=`, `!==`, `>`, `<`, `>=`, `<=` | [Comparación](operatorsAndFunctions/Comparison.md) |
| Lógicos | `!`, `&&`, `\|\|` | [Lógicos](operatorsAndFunctions/Logical.md) |
| Array | `[]` | |

## Funciones {#functions}

| Categoría | Funciones | Más información |
|:--|:--|:--|
| Numéricas | abs, ceil, cos, exp, ln, log, remainder, round, sign, sin, tan, trunc… | [Numéricos](operatorsAndFunctions/Numeric.md) |
| Cadenas | chr, lower, lpad, ltrim, replace, rpad, rtrim, substr, trim, upper, concat… | [Cadenas](operatorsAndFunctions/String.md) |
| Fecha y hora | curTime, today, now, time, date, dateTime, year, month, day, weekday, hour… | [Fecha y hora](operatorsAndFunctions/Datetime.md) |
| Conversión | toString, toNumber | [Cadenas](operatorsAndFunctions/String.md) |
| Nulos | nvl, nvl2, isNull, isNotNull | [Nulos](operatorsAndFunctions/Nullable.md) |
| Generales | as, distinct | |
| Ordenación | asc, desc | [Ordenación](operatorsAndFunctions/Sort.md) |
| Condición | between, in, includes | [Comparación](operatorsAndFunctions/Comparison.md) |
| Agrupación | avg, count, first, last, max, min, sum | [Agrupación](operatorsAndFunctions/Group.md) |
| Metadatos | user, source | |
| JSON | jsonHas, jsonSet, jsonIncludes (rutas como `p.meta.address.zip`) | [JSON, vectores y puntos](JsonVectorsPoints.md) |
| Vectores | cosineDistance, l2Distance, innerProduct | [JSON, vectores y puntos](JsonVectorsPoints.md#vectors) |
| Geo | point, distance, within, inside | [JSON, vectores y puntos](JsonVectorsPoints.md#points) |

Consultar [Operadores y funciones](operatorsAndFunctions/OperatorsAndFunctions.md) para la referencia completa.
