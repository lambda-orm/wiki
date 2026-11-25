# Operators and Functions

λORM queries are lambda expressions, and inside them you can use the operators and functions listed in this reference. λORM translates each one into the language of the database engine of the data source: SQL for MySQL, MariaDB, PostgreSQL, SQL Server, Oracle and SQLite, and aggregation pipelines for MongoDB. See [Query Language](../Query-Language.md) for an introduction to queries.

Each page describes the operators and functions of one category, with their signature, an example query, its result and the SQL generated for it. Not every function can be translated to every engine; each page ends with a *Database support* section that lists the differences.

## Scalar operators and functions

| Page | Contents |
|---|---|
| [Comparison](Comparison.md) | `==`, `!=`, `>`, `<`, `>=`, `<=`, `between`, `in`, `includes` |
| [Logical](Logical.md) | `!`, `&&`, `||` |
| [Numeric](Numeric.md) | Arithmetic operators and mathematical functions (`abs`, `round`, `log`, `sin`, ...) |
| [String](String.md) | Text functions (`concat`, `lower`, `upper`, `replace`, `substring`, `like`, `startsWith`, ...), masks (`mask`, `maskLeft`, `maskRight`, `maskEmail`) and `hash` |
| [Date and time](Datetime.md) | Current date, conversions, date parts, intervals and date differences |
| [Nullable](Nullable.md) | `nvl`, `nvl2`, `isNull`, `isNotNull` |
| [Bitwise](Bitwise.md) | `~`, `&`, `|`, `^`, `<<`, `>>` |
| [JSON, vectors and points](../JsonVectorsPoints.md) | Paths of a json, `jsonHas`, `jsonSet`; `cosineDistance`, `l2Distance`, `innerProduct`; `point`, `distance`, `within`, `inside` |

## Aggregation and sorting

| Page | Contents |
|---|---|
| [Group](Group.md) | Aggregate functions: `count`, `sum`, `avg`, `min`, `max`, `first`, `last` |
| [Sort](Sort.md) | `asc` and `desc`, used in `sort` |

!!! tip
    To check how a query is translated for a given data source without running it, use [`orm.plan`](../Metadata.md).
