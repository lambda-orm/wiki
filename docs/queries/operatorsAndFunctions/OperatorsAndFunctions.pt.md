# Operadores e funções {#operators-and-functions}

As consultas λORM são expressões lambda, e dentro delas é possível usar os operadores e funções listados nesta referência. O λORM traduz cada um para a linguagem do mecanismo de banco de dados da fonte de dados: SQL para MySQL, MariaDB, PostgreSQL, SQL Server, Oracle e SQLite, e pipelines de agregação para MongoDB. Veja [Linguagem de consulta](../Query-Language.md) para uma introdução às consultas.

Cada página descreve os operadores e funções de uma categoria, com sua assinatura, uma consulta de exemplo, seu resultado e o SQL gerado para ela. Nem toda função pode ser traduzida para todos os mecanismos de banco de dados; cada página termina com uma seção *Suporte nos bancos de dados* que lista as diferenças.

## Operadores e funções escalares {#scalar-operators-and-functions}

| Página | Conteúdo |
|---|---|
| [Comparação](Comparison.md) | `==`, `!=`, `>`, `<`, `>=`, `<=`, `between`, `in`, `includes` |
| [Lógicos](Logical.md) | `!`, `&&`, `||` |
| [Numéricos](Numeric.md) | Operadores aritméticos e funções matemáticas (`abs`, `round`, `log`, `sin`, ...) |
| [String](String.md) | Funções de texto (`concat`, `lower`, `upper`, `replace`, `substring`, ...) |
| [Data e hora](Datetime.md) | Data atual, conversões, partes de datas, intervalos e diferenças entre datas |
| [Nulos](Nullable.md) | `nvl`, `nvl2`, `isNull`, `isNotNull` |
| [Bit a bit](Bitwise.md) | `~`, `&`, `|`, `^`, `<<`, `>>` |

## Agregação e ordenação {#aggregation-and-sorting}

| Página | Conteúdo |
|---|---|
| [Agrupamento](Group.md) | Funções de agregação: `count`, `sum`, `avg`, `min`, `max`, `first`, `last` |
| [Ordenação](Sort.md) | `asc` e `desc`, usadas em `sort` |

!!! tip "Dica"
    Para verificar como uma consulta é traduzida para uma determinada fonte de dados sem executá-la, use [`orm.plan`](../Metadata.md).
