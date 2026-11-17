# Engines

λORM runs the same queries and stage commands on PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB and SQLite (SQLjs).
The same model gives the same results on every engine, except for the differences below.
They are checked by the [engines lab](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), which runs the same tests on PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free and MongoDB 7.

## Summary

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | MongoDB |
| --- | --- | --- | --- | --- | --- |
| string without `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | native |
| `''` (empty string) | `''` | `''` | `''` | **NULL** | `''` |
| `upsert()` | yes | yes | yes (`MERGE`) | yes (`MERGE`) | not yet (clear error) |
| `update().include()` of a composite relation | yes | yes | yes | yes | yes (children are embedded) |
| composite children | own table | own table | own table | own table | embedded in the parent's document |
| push / fetch of columns | yes | yes | yes | yes | schemaless: only whether the collection exists |
| column rename (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | — |

## Types

- **String without length**: unbounded (`TEXT`) only on PostgreSQL; on the other engines it is `VARCHAR(80)`. Set `length` for longer values, or `dbType` in the property mapping.
- **json**: objects and lists are written and read as such on every engine; the column type changes (see the table).
- **dateTime**: PostgreSQL writes it with milliseconds and offset, so a `timestamptz(3)` column (`dbType`) keeps the exact instant. On the other engines the precision depends on the column type (`DATETIME` keeps at least the seconds).
- **Empty string**: `''`, `0` and `false` are values, never NULL. Oracle is the exception: it has no empty string and stores `''` as NULL, so a value written as `''` comes back as `null` and a filter `p.email == ""` finds nothing.

See [Property types](SchemaDefinition.md#property-types).

## Writes

- `update` and `delete` return the number of affected rows on every engine.
- [`upsert()`](../queries/Insert.md#upsert) uses `ON CONFLICT … DO UPDATE` on PostgreSQL, `ON DUPLICATE KEY UPDATE` on MySQL and MariaDB, and `MERGE` on SQL Server and Oracle (from @lambdaorm/lib 3.5.0). On MongoDB it fails with a "not supported yet" error.
- [`update().include()` of a composite relation](../queries/Update.md#update-an-aggregate-composite-relation) inserts, updates and deletes the children with upsert, so it has the same support. On MongoDB the composite children are embedded in the parent's document, so the update replaces them there.

## Stage commands

- `push` and `fetch` compare tables and columns on every SQL engine.
- MongoDB is schemaless: `fetch` only says whether each collection exists, and its fields are whatever its documents have.

See [Push](SchemaSynchronization-Push.md) and [Fetch](SchemaSynchronization-Fetch.md).

## Transactions

- On every SQL engine a transaction uses one connection per source and commits or rolls back source by source (there is no two-phase commit).
- MongoDB transactions need a replica set.
