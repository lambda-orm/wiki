# Mecanismos de banco de dados {#engines}

Esta página lista as diferenças entre os mecanismos de banco de dados suportados pelo λORM.

O λORM executa as mesmas consultas e os mesmos comandos de stage no PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB e SQLite (dialeto `SQLjs`).
O mesmo modelo produz os mesmos resultados em todos os mecanismos, exceto pelas diferenças abaixo.
Essas diferenças são verificadas pelo [laboratório de mecanismos](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), que executa os mesmos testes no PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free e MongoDB 7.

## Resumo {#summary}

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | MongoDB |
| --- | --- | --- | --- | --- | --- |
| string sem `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | nativo |
| `''` (string vazia) | `''` | `''` | `''` | **NULL** | `''` |
| `upsert()` | sim | sim | sim (`MERGE`) | sim (`MERGE`) | ainda não (erro claro) |
| `update().include()` de uma relação composta | sim | sim | sim | sim | sim (os filhos são incorporados) |
| filhos compostos | tabela própria | tabela própria | tabela própria | tabela própria | incorporados no documento do pai |
| push / fetch de colunas | sim | sim | sim | sim | sem esquema: apenas se a coleção existe |
| renomear coluna (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | — |

## Tipos {#types}

- **String sem comprimento**: ilimitada (`TEXT`) apenas no PostgreSQL; nos demais mecanismos é `VARCHAR(80)`. Defina `length` para valores mais longos, ou `dbType` no mapeamento da propriedade.
- **json**: objetos e listas são gravados e lidos como tais em todos os mecanismos; o que muda é o tipo da coluna (veja a tabela).
- **dateTime**: o PostgreSQL o grava com milissegundos e deslocamento, de modo que uma coluna `timestamptz(3)` (`dbType`) preserva o instante exato. Nos demais mecanismos, a precisão depende do tipo da coluna (`DATETIME` preserva pelo menos os segundos).
- **String vazia**: `''`, `0` e `false` são valores, nunca NULL. O Oracle é a exceção: ele não tem string vazia e armazena `''` como NULL, então um valor gravado como `''` volta como `null` e um filtro `p.email == ""` não encontra nada.

Veja [Tipos de propriedade](SchemaDefinition.md#property-types).

## Gravações {#writes}

- `update` e `delete` retornam o número de linhas afetadas em todos os mecanismos.
- [`upsert()`](../queries/Insert.md#upsert) usa `ON CONFLICT … DO UPDATE` no PostgreSQL, `ON DUPLICATE KEY UPDATE` no MySQL e no MariaDB, e `MERGE` no SQL Server e no Oracle (a partir do @lambdaorm/lib 3.5.0). No MongoDB, falha com um erro "not supported yet".
- [`update().include()` de uma relação composta](../queries/Update.md#update-an-aggregate-composite-relation) insere, atualiza e exclui os filhos com upsert, portanto tem o mesmo suporte. No MongoDB, os filhos compostos são incorporados no documento do pai, então a atualização os substitui ali.

## Comandos de stage {#stage-commands}

- `push` e `fetch` comparam tabelas e colunas em todos os mecanismos SQL.
- O MongoDB não tem esquema: `fetch` apenas informa se cada coleção existe, e seus campos são os que seus documentos tiverem.

Veja [Push](SchemaSynchronization-Push.md) e [Fetch](SchemaSynchronization-Fetch.md).

## Transações {#transactions}

- Em todos os mecanismos SQL, uma transação usa uma conexão por fonte e faz commit ou rollback fonte por fonte (não há commit em duas fases).
- As transações do MongoDB exigem um replica set.
