# Motores de base de datos {#engines}

Esta página enumera las diferencias entre los motores de base de datos que soporta λORM.

λORM ejecuta las mismas consultas y los mismos comandos de stage en PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB y SQLite (dialecto `SQLjs`).
El mismo modelo da los mismos resultados en todos los motores, salvo por las diferencias que se indican a continuación.
Estas diferencias las comprueba el [laboratorio de motores](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), que ejecuta las mismas pruebas en PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free y MongoDB 7.

## Resumen {#summary}

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | MongoDB |
| --- | --- | --- | --- | --- | --- |
| string sin `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | nativo |
| `''` (cadena vacía) | `''` | `''` | `''` | **NULL** | `''` |
| `upsert()` | sí | sí | sí (`MERGE`) | sí (`MERGE`) | todavía no (error claro) |
| `update().include()` de una relación compuesta | sí | sí | sí | sí | sí (los hijos están embebidos) |
| hijos compuestos | tabla propia | tabla propia | tabla propia | tabla propia | embebidos en el documento del padre |
| push / fetch de columnas | sí | sí | sí | sí | sin esquema: solo si la colección existe |
| renombrar columna (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | — |

## Tipos {#types}

- **String sin longitud**: es ilimitado (`TEXT`) solo en PostgreSQL; en los demás motores es `VARCHAR(80)`. Hay que definir `length` para valores más largos, o `dbType` en el mapping de la propiedad.
- **json**: los objetos y las listas se escriben y se leen como tales en todos los motores; lo que cambia es el tipo de columna (ver la tabla).
- **dateTime**: PostgreSQL lo escribe con milisegundos y desplazamiento horario, por lo que una columna `timestamptz(3)` (`dbType`) conserva el instante exacto. En los demás motores la precisión depende del tipo de columna (`DATETIME` conserva al menos los segundos).
- **Cadena vacía**: `''`, `0` y `false` son valores, nunca NULL. Oracle es la excepción: no tiene cadena vacía y guarda `''` como NULL, por lo que un valor escrito como `''` se lee como `null` y un filtro `p.email == ""` no encuentra nada.

Ver [Tipos de propiedad](SchemaDefinition.md#property-types).

## Escrituras {#writes}

- `update` y `delete` devuelven el número de filas afectadas en todos los motores.
- [`upsert()`](../queries/Insert.md#upsert) usa `ON CONFLICT … DO UPDATE` en PostgreSQL, `ON DUPLICATE KEY UPDATE` en MySQL y MariaDB, y `MERGE` en SQL Server y Oracle (desde @lambdaorm/lib 3.5.0). En MongoDB falla con un error "not supported yet".
- [`update().include()` de una relación compuesta](../queries/Update.md#update-an-aggregate-composite-relation) inserta, actualiza y elimina los hijos con upsert, así que tiene el mismo soporte. En MongoDB los hijos compuestos están embebidos en el documento del padre, por lo que la actualización los reemplaza allí.

## Comandos de stage {#stage-commands}

- `push` y `fetch` comparan tablas y columnas en todos los motores SQL.
- MongoDB no tiene esquema: `fetch` solo indica si cada colección existe, y sus campos son los que tengan sus documentos.

Ver [Push](SchemaSynchronization-Push.md) y [Fetch](SchemaSynchronization-Fetch.md).

## Transacciones {#transactions}

- En todos los motores SQL una transacción usa una conexión por fuente y confirma o revierte fuente por fuente (no hay commit en dos fases).
- Las transacciones de MongoDB necesitan un replica set.
