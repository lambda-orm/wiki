# Mecanismos de banco de dados {#engines}

Esta página lista as diferenças entre os mecanismos de banco de dados suportados pelo λORM. Leia-a quando escolher um mecanismo, mover um modelo de um mecanismo para outro ou executar o mesmo modelo em vários mecanismos.

O λORM executa as mesmas consultas e os mesmos comandos de stage no PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB e SQLite (dialeto `SQLjs`, com [sql.js](https://www.npmjs.com/package/sql.js)).
O mesmo modelo produz os mesmos resultados em todos os mecanismos, exceto pelas diferenças abaixo.
Essas diferenças são verificadas pelo [laboratório de mecanismos](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), que executa os mesmos testes no PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free e MongoDB 7; o SQLite é verificado pelos testes unitários do `@lambdaorm/lib` sobre um sql.js real.

Uma API REST também pode ser uma fonte, com o dialeto `Http`: veja [Uma API REST como fonte](HttpSource.md).

## Resumo {#summary}

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | SQLite (SQLjs) | MongoDB |
| --- | --- | --- | --- | --- | --- | --- |
| string sem `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | `VARCHAR(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | `JSON` (texto) | nativo |
| `point` | `geography` (PostGIS) | `POINT` | `geography` | `SDO_GEOMETRY` (Spatial) | `TEXT`, sem funções geo | GeoJSON |
| `vector` | `vector` (pgvector) | apenas MariaDB 11.7 | SQL Server 2025 | Oracle 23ai | não | não |
| `''` (string vazia) | `''` | `''` | `''` | **NULL** | `''` | `''` |
| `upsert()` | sim | sim | sim (`MERGE`) | sim (`MERGE`) | sim | ainda não (erro claro) |
| `update().include()` de uma relação composta | sim | sim | sim | sim | sim | sim (os filhos são incorporados) |
| filhos compostos | tabela própria | tabela própria | tabela própria | tabela própria | tabela própria | incorporados no documento do pai |
| push / fetch de colunas | sim | sim | sim | sim | sim; o tipo ou a nulabilidade de uma coluna não podem ser alterados | sem esquema: apenas se a coleção existe |
| chave única | constraint | constraint | constraint | constraint | índice único | — |
| chaves estrangeiras | sim | sim | sim | sim | não são criadas | — |
| renomear coluna (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | `RENAME COLUMN` | — |
| `hash(x)` / `hash(x, key)` | sim / sim (`pgcrypto`) | sim / não | sim / não | sim / não | não / não | não / não |
| transações | sim | sim | sim | sim | sim | exigem um replica set |

## Tipos {#types}

- **String sem comprimento**: ilimitada (`TEXT`) apenas no PostgreSQL; nos demais mecanismos é `VARCHAR(80)`. Defina `length` para valores mais longos, ou `dbType` no mapeamento da propriedade.
- **json**: objetos e listas são gravados e lidos como tais em todos os mecanismos; o que muda é o tipo da coluna (veja a tabela). Um caminho dentro dele (`p.meta.address.city`) pode ser lido, filtrado e gravado em todos os mecanismos.
- **point**: um ponto GeoJSON em todos os mecanismos que o têm. O PostgreSQL exige o PostGIS (`CREATE EXTENSION postgis`); o Oracle exige o Spatial (as imagens `slim` do Oracle Free não o têm), e o push não cria seu índice espacial. O SQL Server e o Oracle medem a `distance` sobre o elipsoide, então seus metros diferem um pouco dos demais mecanismos. O SQLite armazena o ponto como texto, mas não tem nenhuma das funções (`distance`, `within`, `inside`).
- **vector**: PostgreSQL com pgvector, MariaDB 11.7, SQL Server 2025 e Oracle 23ai. MySQL, SQLite e MongoDB não o têm (o `$vectorSearch` do MongoDB Atlas ainda não é suportado). `innerProduct` não está disponível no MariaDB.
- **dateTime**: o PostgreSQL o grava com milissegundos e deslocamento, de modo que uma coluna `timestamptz(3)` (`dbType`) preserva o instante exato. Nos demais mecanismos, a precisão depende do tipo da coluna (`DATETIME` preserva pelo menos os segundos).
- **boolean** e **json** no SQLite são armazenados como `0`/`1` e texto, e voltam como o modelo os tem.
- **String vazia**: `''`, `0` e `false` são valores, nunca NULL. O Oracle é a exceção: ele não tem string vazia e armazena `''` como NULL, então um valor gravado como `''` volta como `null` e um filtro `p.email == ""` não encontra nada.

Veja [Tipos de propriedade](SchemaDefinition.md#property-types) e [JSON, vetores e pontos](../queries/JsonVectorsPoints.md).

## Gravações {#writes}

- `update` e `delete` retornam o número de linhas afetadas em todos os mecanismos.
- [`upsert()`](../queries/Insert.md#upsert) usa `ON CONFLICT … DO UPDATE` no PostgreSQL e no SQLite, `ON DUPLICATE KEY UPDATE` no MySQL e no MariaDB, e `MERGE` no SQL Server e no Oracle (a partir do @lambdaorm/lib 3.5.0). No MongoDB, falha com um erro "not supported yet".
- [`update().include()` de uma relação composta](../queries/Update.md#update-an-aggregate-composite-relation) insere, atualiza e exclui os filhos com upsert, portanto tem o mesmo suporte. No MongoDB, os filhos compostos são incorporados no documento do pai, então a atualização os substitui ali.
- Uma chave `autoIncrement` é `AUTO_INCREMENT` no MySQL e no MariaDB, `IDENTITY` no SQL Server e o rowid no SQLite (uma chave primária `INTEGER`).

## Mascaramento {#masking}

As funções de máscara das [visões](Views.md#mask-functions) (`mask`, `maskLeft`, `maskRight`, `maskEmail`) são traduzidas para todos os mecanismos. `hash(x)` (SHA-256) existe no PostgreSQL, MySQL, MariaDB, SQL Server e Oracle; `hash(x, key)` (HMAC) apenas no PostgreSQL, com `pgcrypto`. Onde uma função não existe, a consulta falha quando é compilada, em vez de ser calculada em memória.

## Comandos de stage {#stage-commands}

- `push` e `fetch` comparam tabelas e colunas em todos os mecanismos SQL.
- O `push` altera o tipo, o comprimento ou a nulabilidade de uma coluna com a sintaxe de cada mecanismo: `MODIFY` com a definição completa no MySQL e no MariaDB (preserva o `AUTO_INCREMENT`), `ALTER COLUMN` com o tipo e a nulabilidade no SQL Server, `ALTER COLUMN … SET DATA TYPE` / `SET NOT NULL` no PostgreSQL e `MODIFY` no Oracle.
- O SQLite não adiciona constraints a uma tabela existente nem altera uma coluna: a chave única é um índice único, as chaves estrangeiras não são criadas (o SQLite não as verifica por padrão) e alterar o tipo ou a nulabilidade de uma coluna é um erro claro. O push lê sua estrutura de `sqlite_master`.
- O PostgreSQL lê o tipo das colunas `geography` e `vector`, de modo que um segundo push ou um fetch não encontra nenhuma diferença nelas.
- O MongoDB não tem esquema: `fetch` apenas informa se cada coleção existe, e seus campos são os que seus documentos tiverem.

Veja [Push](SchemaSynchronization-Push.md) e [Fetch](SchemaSynchronization-Fetch.md).

## Transações {#transactions}

- Em todos os mecanismos SQL, uma transação usa uma conexão por fonte e faz commit ou rollback fonte por fonte (não há commit em duas fases).
- O SQLite tem transações reais (`BEGIN`, `COMMIT`, `ROLLBACK`). Todas as suas conexões compartilham o mesmo banco de dados em memória, que é lido do arquivo quando a primeira conexão é aberta e gravado nele quando o ORM termina (`orm.end()`).
- As transações do MongoDB exigem um replica set.
- Uma fonte Http não tem rollback: dentro de uma transação, suas gravações esperam o commit, que ela faz antes dos bancos de dados (veja [Uma API REST como fonte](HttpSource.md)).
