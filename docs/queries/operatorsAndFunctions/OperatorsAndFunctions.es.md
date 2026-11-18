# Operadores y funciones {#operators-and-functions}

Las consultas de λORM son expresiones lambda, y dentro de ellas se pueden usar los operadores y funciones que se enumeran en esta referencia. λORM traduce cada uno al lenguaje del motor de base de datos de la fuente de datos: SQL para MySQL, MariaDB, PostgreSQL, SQL Server, Oracle y SQLite, y pipelines de agregación para MongoDB. Ver [Lenguaje de consultas](../Query-Language.md) para una introducción a las consultas.

Cada página describe los operadores y funciones de una categoría, con su firma, una consulta de ejemplo, su resultado y el SQL generado para ella. No todas las funciones se pueden traducir a todos los motores de base de datos; cada página termina con una sección *Soporte por base de datos* que enumera las diferencias.

## Operadores y funciones escalares {#scalar-operators-and-functions}

| Página | Contenido |
|---|---|
| [Comparación](Comparison.md) | `==`, `!=`, `>`, `<`, `>=`, `<=`, `between`, `in`, `includes` |
| [Lógicos](Logical.md) | `!`, `&&`, `||` |
| [Numéricos](Numeric.md) | Operadores aritméticos y funciones matemáticas (`abs`, `round`, `log`, `sin`, ...) |
| [Cadenas](String.md) | Funciones de texto (`concat`, `lower`, `upper`, `replace`, `substring`, ...) |
| [Fecha y hora](Datetime.md) | Fecha actual, conversiones, partes de una fecha, intervalos y diferencias entre fechas |
| [Nulos](Nullable.md) | `nvl`, `nvl2`, `isNull`, `isNotNull` |
| [A nivel de bits](Bitwise.md) | `~`, `&`, `|`, `^`, `<<`, `>>` |

## Agregación y ordenación {#aggregation-and-sorting}

| Página | Contenido |
|---|---|
| [Agrupación](Group.md) | Funciones de agregación: `count`, `sum`, `avg`, `min`, `max`, `first`, `last` |
| [Ordenación](Sort.md) | `asc` y `desc`, usadas en `sort` |

!!! tip "Consejo"
    Para comprobar cómo se traduce una consulta para una fuente de datos determinada sin ejecutarla, se usa [`orm.plan`](../Metadata.md).
