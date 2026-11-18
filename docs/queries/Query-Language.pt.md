# Linguagem de consulta {#query-language}

Esta página apresenta a linguagem de consulta do λORM: como é uma consulta, quais tipos de consulta existem e onde cada um está documentado.

As consultas λORM são escritas como [expressões lambda do JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) sobre as entidades do domínio. É possível escrevê-las como código TypeScript/JavaScript, navegando pelas entidades do modelo, ou enviá-las como string (por exemplo, a partir da [CLI](../cli/index.md) ou para o [Data Gateway](../data-gateway/index.md)).

O λORM traduz cada consulta para a linguagem do mecanismo de banco de dados de cada fonte (SQL para MySQL, MariaDB, PostgreSQL, SQL Server, Oracle e SQLite, ou consultas MongoDB).

## Tipos de consulta {#query-types}

### DQL {#dql}

As consultas DQL (Data Query Language) recuperam dados. Elas podem ser tão simples quanto ler todos os registros de uma entidade, ou podem filtrar, ordenar, agrupar e paginar os registros, calcular valores a partir deles e carregar entidades relacionadas.

**Veja:** [Select](Select.md), [Join](Join.md), [Agrupamento](Grouping.md), [Include](Include.md)

### DML {#dml}

As consultas DML (Data Manipulation Language) alteram dados. Elas incluem as seguintes operações:

- **insert**: adiciona novos registros a uma entidade (também `bulkInsert` e `upsert`).
- **update**: modifica registros existentes.
- **delete**: remove registros.

**Veja:** [Insert](Insert.md), [Inserção em massa](BulkInsert.md), [Update](Update.md), [Delete](Delete.md)

### DDL {#ddl}

As sentenças DDL (Data Definition Language) criam, modificam e eliminam estruturas do banco de dados e objetos relacionados:

- **CREATE**: cria novos objetos no banco de dados, como tabelas e índices.
- **ALTER**: modifica a estrutura de objetos existentes, por exemplo adicionando, alterando ou removendo as colunas de uma tabela.
- **DROP**: exclui objetos do banco de dados.

Você não escreve consultas DDL: o λORM as gera e executa quando você usa os comandos de sincronização do esquema.

**Veja:** [Push](../schema/SchemaSynchronization-Push.md), [Pull](../schema/SchemaSynchronization-Pull.md), [Fetch](../schema/SchemaSynchronization-Fetch.md), [Introspect](../schema/SchemaSynchronization-Introspect.md), [Incorporate](../schema/SchemaSynchronization-Incorporate.md)

## Exemplo {#example}

A consulta a seguir lê os países de uma região, com seus estados cujo nome começa com "F". Ela retorna o nome, a sub-região e a posição de cada país, 3 países por página:

```typescript
Countries
	.filter(p => p.region == region)
	.map(p => [p.name, p.subregion, p.latitude, p.longitude]) // properties of the country
	.include(p => p.states.filter(p => substr(p.name, 1, 1) == "F") // states starting with 'F'
		.map(p => [p.name, p.latitude, p.longitude])
	)
	.page(1, 3) // first page, 3 countries per page
```

Neste esquema, `Countries` está em uma fonte MySQL e `States` em uma fonte PostgreSQL (veja [Stage com múltiplas fontes](../schema/SchemaExample-StageMultiplesSources.md)). O λORM executa uma sentença por fonte:

```sql
-- MySQL: the countries of the region, first page of 3 records
SELECT c.name AS name, c.subregion AS subregion, c.latitude AS latitude, c.longitude AS longitude, c.iso3 AS `__iso3`
FROM Countries c
WHERE c.region = ?
ORDER BY c.name asc
LIMIT 0,3

-- PostgreSQL: the states starting with 'F' of the countries read above
SELECT s.NAME AS "name", s.LATITUDE AS "latitude", s.LONGITUDE AS "longitude", s.COUNTRY_CODE AS "LambdaOrmParentId"
FROM TBL_STATES s
WHERE SUBSTR(s.NAME,1,1) = 'F'
  AND s.COUNTRY_CODE IN (?)
```

Em seguida, os estados são associados ao seu país em memória, de modo que cada país do resultado tem um array `states`.

## Vantagens {#advantages}

- As consultas são escritas na mesma linguagem de programação da aplicação.
- Não há uma nova linguagem para aprender.
- As consultas são fáceis de escrever e de ler.
- O IntelliSense da IDE ajuda a escrever as expressões.
- Os erros de sintaxe são detectados enquanto você escreve.
