# Motores de base de datos {#engines}

Esta página enumera las diferencias entre los motores de base de datos que soporta λORM. Léela cuando elijas un motor, cuando pases un modelo de un motor a otro o cuando ejecutes el mismo modelo en varios motores.

λORM ejecuta las mismas consultas y los mismos comandos de stage en PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB y SQLite (dialecto `SQLjs`, con [sql.js](https://www.npmjs.com/package/sql.js)).
El mismo modelo da los mismos resultados en todos los motores, salvo por las diferencias que se indican a continuación.
Estas diferencias las comprueba el [laboratorio de motores](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), que ejecuta las mismas pruebas en PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free y MongoDB 7; SQLite lo comprueban las pruebas unitarias de `@lambdaorm/lib` sobre un sql.js real.

Una API REST también puede ser una fuente, con el dialecto `Http`: ver [Una API REST como fuente](HttpSource.md).

## Resumen {#summary}

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | SQLite (SQLjs) | MongoDB |
| --- | --- | --- | --- | --- | --- | --- |
| string sin `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | `VARCHAR(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | `JSON` (texto) | nativo |
| `point` | `geography` (PostGIS) | `POINT` | `geography` | `SDO_GEOMETRY` (Spatial) | `TEXT`, sin funciones geográficas | GeoJSON |
| `vector` | `vector` (pgvector) | solo MariaDB 11.7 | SQL Server 2025 | Oracle 23ai | no | no |
| `''` (cadena vacía) | `''` | `''` | `''` | **NULL** | `''` | `''` |
| `upsert()` | sí | sí | sí (`MERGE`) | sí (`MERGE`) | sí | todavía no (error claro) |
| `update().include()` de una relación compuesta | sí | sí | sí | sí | sí | sí (los hijos están embebidos) |
| hijos compuestos | tabla propia | tabla propia | tabla propia | tabla propia | tabla propia | embebidos en el documento del padre |
| push / fetch de columnas | sí | sí | sí | sí | sí; no se puede cambiar el tipo ni la nulabilidad de una columna | sin esquema: solo si la colección existe |
| clave única | restricción | restricción | restricción | restricción | índice único | — |
| claves foráneas | sí | sí | sí | sí | no se crean | — |
| renombrar columna (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | `RENAME COLUMN` | — |
| `hash(x)` / `hash(x, key)` | sí / sí (`pgcrypto`) | sí / no | sí / no | sí / no | no / no | no / no |
| transacciones | sí | sí | sí | sí | sí | necesitan un replica set |

## Tipos {#types}

- **String sin longitud**: es ilimitado (`TEXT`) solo en PostgreSQL; en los demás motores es `VARCHAR(80)`. Hay que definir `length` para valores más largos, o `dbType` en el mapping de la propiedad.
- **json**: los objetos y las listas se escriben y se leen como tales en todos los motores; lo que cambia es el tipo de columna (ver la tabla). Una ruta dentro de él (`p.meta.address.city`) se puede leer, filtrar y escribir en todos los motores.
- **point**: un punto GeoJSON en todos los motores que lo tienen. PostgreSQL necesita PostGIS (`CREATE EXTENSION postgis`); Oracle necesita Spatial (las imágenes `slim` de Oracle Free no lo tienen), y push no crea su índice espacial. SQL Server y Oracle miden `distance` sobre el elipsoide, así que sus metros difieren un poco de los de los demás motores. SQLite guarda el punto como texto pero no tiene ninguna de las funciones (`distance`, `within`, `inside`).
- **vector**: PostgreSQL con pgvector, MariaDB 11.7, SQL Server 2025 y Oracle 23ai. MySQL, SQLite y MongoDB no lo tienen (`$vectorSearch` de MongoDB Atlas todavía no se soporta). `innerProduct` no está disponible en MariaDB.
- **dateTime**: PostgreSQL lo escribe con milisegundos y desplazamiento horario, por lo que una columna `timestamptz(3)` (`dbType`) conserva el instante exacto. En los demás motores la precisión depende del tipo de columna (`DATETIME` conserva al menos los segundos).
- **boolean** y **json** en SQLite se guardan como `0`/`1` y como texto, y se leen tal como los tiene el modelo.
- **Cadena vacía**: `''`, `0` y `false` son valores, nunca NULL. Oracle es la excepción: no tiene cadena vacía y guarda `''` como NULL, por lo que un valor escrito como `''` se lee como `null` y un filtro `p.email == ""` no encuentra nada.

Ver [Tipos de propiedad](SchemaDefinition.md#property-types) y [JSON, vectores y puntos](../queries/JsonVectorsPoints.md).

## Escrituras {#writes}

- `update` y `delete` devuelven el número de filas afectadas en todos los motores.
- [`upsert()`](../queries/Insert.md#upsert) usa `ON CONFLICT … DO UPDATE` en PostgreSQL y SQLite, `ON DUPLICATE KEY UPDATE` en MySQL y MariaDB, y `MERGE` en SQL Server y Oracle (desde @lambdaorm/lib 3.5.0). En MongoDB falla con un error "not supported yet".
- [`update().include()` de una relación compuesta](../queries/Update.md#update-an-aggregate-composite-relation) inserta, actualiza y elimina los hijos con upsert, así que tiene el mismo soporte. En MongoDB los hijos compuestos están embebidos en el documento del padre, por lo que la actualización los reemplaza allí.
- Una clave `autoIncrement` es `AUTO_INCREMENT` en MySQL y MariaDB, `IDENTITY` en SQL Server y el rowid en SQLite (una clave primaria `INTEGER`).

## Enmascaramiento {#masking}

Las funciones de máscara de las [vistas](Views.md#mask-functions) (`mask`, `maskLeft`, `maskRight`, `maskEmail`) se traducen a todos los motores. `hash(x)` (SHA-256) existe en PostgreSQL, MySQL, MariaDB, SQL Server y Oracle; `hash(x, key)` (HMAC) solo en PostgreSQL, con `pgcrypto`. Donde falta una función, la consulta falla al compilarse, en lugar de calcularse en memoria.

## Comandos de stage {#stage-commands}

- `push` y `fetch` comparan tablas y columnas en todos los motores SQL.
- `push` cambia el tipo, la longitud o la nulabilidad de una columna con la sintaxis de cada motor: `MODIFY` con la definición completa en MySQL y MariaDB (conserva `AUTO_INCREMENT`), `ALTER COLUMN` con el tipo y la nulabilidad en SQL Server, `ALTER COLUMN … SET DATA TYPE` / `SET NOT NULL` en PostgreSQL, y `MODIFY` en Oracle.
- SQLite no añade restricciones a una tabla existente ni modifica una columna: la clave única es un índice único, las claves foráneas no se crean (SQLite no las comprueba por defecto) y cambiar el tipo o la nulabilidad de una columna es un error claro. Push lee su estructura de `sqlite_master`.
- PostgreSQL lee el tipo de las columnas `geography` y `vector`, así que un segundo push o un fetch no encuentra diferencias en ellas.
- MongoDB no tiene esquema: `fetch` solo indica si cada colección existe, y sus campos son los que tengan sus documentos.

Ver [Push](SchemaSynchronization-Push.md) y [Fetch](SchemaSynchronization-Fetch.md).

## Transacciones {#transactions}

- En todos los motores SQL una transacción usa una conexión por fuente y confirma o revierte fuente por fuente (no hay commit en dos fases).
- SQLite tiene transacciones reales (`BEGIN`, `COMMIT`, `ROLLBACK`). Todas sus conexiones comparten la misma base de datos en memoria, que se lee del archivo cuando se abre la primera conexión y se escribe en él cuando termina el ORM (`orm.end()`).
- Las transacciones de MongoDB necesitan un replica set.
- Una fuente Http no tiene rollback: dentro de una transacción sus escrituras esperan al commit, que hace antes que las bases de datos (ver [Una API REST como fuente](HttpSource.md)).
