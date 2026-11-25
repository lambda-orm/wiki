# Engines

This page lists the differences between the database engines supported by λORM. Read it when you choose an engine, move a model from one engine to another, or run the same model on several engines.

λORM runs the same queries and stage commands on PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB and SQLite (dialect `SQLjs`, with [sql.js](https://www.npmjs.com/package/sql.js)).
The same model gives the same results on every engine, except for the differences below.
These differences are checked by the [engines lab](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), which runs the same tests on PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free and MongoDB 7; SQLite is checked by the unit tests of `@lambdaorm/lib` on a real sql.js.

A REST API can also be a source, with the dialect `Http`: see [A REST API as a source](HttpSource.md).

## Summary

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | SQLite (SQLjs) | MongoDB |
| --- | --- | --- | --- | --- | --- | --- |
| string without `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | `VARCHAR(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | `JSON` (text) | native |
| `point` | `geography` (PostGIS) | `POINT` | `geography` | `SDO_GEOMETRY` (Spatial) | `TEXT`, no geo functions | GeoJSON |
| `vector` | `vector` (pgvector) | MariaDB 11.7 only | SQL Server 2025 | Oracle 23ai | no | no |
| `''` (empty string) | `''` | `''` | `''` | **NULL** | `''` | `''` |
| `upsert()` | yes | yes | yes (`MERGE`) | yes (`MERGE`) | yes | not yet (clear error) |
| `update().include()` of a composite relation | yes | yes | yes | yes | yes | yes (children are embedded) |
| composite children | own table | own table | own table | own table | own table | embedded in the parent's document |
| push / fetch of columns | yes | yes | yes | yes | yes; a column's type or nullability can't be changed | schemaless: only whether the collection exists |
| unique key | constraint | constraint | constraint | constraint | unique index | — |
| foreign keys | yes | yes | yes | yes | not created | — |
| column rename (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | `RENAME COLUMN` | — |
| `hash(x)` / `hash(x, key)` | yes / yes (`pgcrypto`) | yes / no | yes / no | yes / no | no / no | no / no |
| transactions | yes | yes | yes | yes | yes | needs a replica set |

## Types

- **String without length**: unbounded (`TEXT`) only on PostgreSQL; on the other engines it is `VARCHAR(80)`. Set `length` for longer values, or `dbType` in the property mapping.
- **json**: objects and lists are written and read as such on every engine; the column type changes (see the table). A path inside it (`p.meta.address.city`) can be read, filtered and written on every engine.
- **point**: a GeoJSON point on every engine that has it. PostgreSQL needs PostGIS (`CREATE EXTENSION postgis`); Oracle needs Spatial (the `slim` images of Oracle Free do not have it), and push does not create its spatial index. SQL Server and Oracle measure `distance` on the ellipsoid, so their meters differ a little from the other engines. SQLite stores the point as text but has none of the functions (`distance`, `within`, `inside`).
- **vector**: PostgreSQL with pgvector, MariaDB 11.7, SQL Server 2025 and Oracle 23ai. MySQL, SQLite and MongoDB do not have it (MongoDB Atlas `$vectorSearch` is not supported yet). `innerProduct` is not available on MariaDB.
- **dateTime**: PostgreSQL writes it with milliseconds and offset, so a `timestamptz(3)` column (`dbType`) keeps the exact instant. On the other engines the precision depends on the column type (`DATETIME` keeps at least the seconds).
- **boolean** and **json** on SQLite are stored as `0`/`1` and text, and come back as the model has them.
- **Empty string**: `''`, `0` and `false` are values, never NULL. Oracle is the exception: it has no empty string and stores `''` as NULL, so a value written as `''` comes back as `null` and a filter `p.email == ""` finds nothing.

See [Property types](SchemaDefinition.md#property-types) and [JSON, vectors and points](../queries/JsonVectorsPoints.md).

## Writes

- `update` and `delete` return the number of affected rows on every engine.
- [`upsert()`](../queries/Insert.md#upsert) uses `ON CONFLICT … DO UPDATE` on PostgreSQL and SQLite, `ON DUPLICATE KEY UPDATE` on MySQL and MariaDB, and `MERGE` on SQL Server and Oracle (from @lambdaorm/lib 3.5.0). On MongoDB it fails with a "not supported yet" error.
- [`update().include()` of a composite relation](../queries/Update.md#update-an-aggregate-composite-relation) inserts, updates and deletes the children with upsert, so it has the same support. On MongoDB the composite children are embedded in the parent's document, so the update replaces them there.
- An `autoIncrement` key is `AUTO_INCREMENT` on MySQL and MariaDB, `IDENTITY` on SQL Server, and the rowid on SQLite (an `INTEGER` primary key).

## Masking

The mask functions of the [views](Views.md#mask-functions) (`mask`, `maskLeft`, `maskRight`, `maskEmail`) are translated to every engine. `hash(x)` (SHA-256) exists on PostgreSQL, MySQL, MariaDB, SQL Server and Oracle; `hash(x, key)` (HMAC) only on PostgreSQL, with `pgcrypto`. Where a function is missing, the query fails when it is compiled, instead of being computed in memory.

## Stage commands

- `push` and `fetch` compare tables and columns on every SQL engine.
- `push` changes the type, length or nullability of a column with the syntax of each engine: `MODIFY` with the whole definition on MySQL and MariaDB (it keeps `AUTO_INCREMENT`), `ALTER COLUMN` with the type and the nullability on SQL Server, `ALTER COLUMN … SET DATA TYPE` / `SET NOT NULL` on PostgreSQL, and `MODIFY` on Oracle.
- SQLite does not add constraints to an existing table nor change a column: the unique key is a unique index, foreign keys are not created (SQLite does not check them by default), and changing the type or the nullability of a column is a clear error. Push reads its structure from `sqlite_master`.
- PostgreSQL reads the type of `geography` and `vector` columns, so a second push or a fetch finds no difference in them.
- MongoDB is schemaless: `fetch` only says whether each collection exists, and its fields are whatever its documents have.

See [Push](SchemaSynchronization-Push.md) and [Fetch](SchemaSynchronization-Fetch.md).

## Transactions

- On every SQL engine a transaction uses one connection per source and commits or rolls back source by source (there is no two-phase commit).
- SQLite has real transactions (`BEGIN`, `COMMIT`, `ROLLBACK`). All its connections share the same database in memory, which is read from the file when the first connection opens and written to it when the ORM ends (`orm.end()`).
- MongoDB transactions need a replica set.
- An Http source has no rollback: inside a transaction its writes wait for the commit, which it does before the databases (see [A REST API as a source](HttpSource.md)).
