# Linguagem de consulta {#query-language}

Esta página apresenta a linguagem de consulta do λORM: como é uma consulta, quais tipos de consulta existem e onde cada um está documentado.

As consultas λORM são escritas como [expressões lambda do JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) sobre as entidades do domínio. É possível escrevê-las como código TypeScript/JavaScript, navegando pelas entidades do modelo, ou enviá-las como string (por exemplo, a partir da [CLI](../cli/index.md) ou para o [Data Gateway](../data-gateway/index.md)).

O λORM traduz cada consulta para a linguagem do mecanismo de banco de dados de cada fonte (SQL para MySQL, MariaDB, PostgreSQL, SQL Server, Oracle e SQLite, pipelines de agregação do MongoDB, ou requisições HTTP a uma API REST para uma [fonte Http](../schema/HttpSource.md)). Uma consulta também pode combinar entidades de fontes diferentes: veja [Consultas entre fontes](CrossSource.md).

## JavaScript sobre o seu domínio {#javascript-over-your-domain}

Uma consulta λORM é **o código que você escreveria sobre um array de objetos**. Pegue uma lista de produtos em memória:

```typescript
// an array in memory: plain JavaScript
products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort((a, b) => b.price - a.price)
```

A mesma intenção, como uma consulta λORM sobre os `Products` do domínio:

```typescript
// a λORM query: the same lambdas, over the domain
Products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort(p => desc(p.price))
```

que o λORM executa no PostgreSQL como:

```sql
SELECT p.ProductName AS "name", c.CategoryName AS "category", p.UnitPrice AS "price"
FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (c.CategoryName = 'Beverages' AND p.UnitPrice > 20)
ORDER BY p.UnitPrice desc
```

A consulta não citou nenhuma tabela, coluna ou join: basta `p.category.name`, e o mapping do esquema diz que
`Products` é a tabela `Products`, `name` a coluna `ProductName` e a relação `category` um join sobre `CategoryID`.

`filter`, `map`, `sort`, `includes`, `p.category.name`: arrow functions, caminhos de propriedades e operadores do
JavaScript. O λORM lê essa expressão e a transforma em SQL, em um pipeline do MongoDB ou em chamadas a uma API REST. É
isso que o diferencia de outros ORMs e linguagens de consulta:

| | λORM | Outras abordagens |
| --- | --- | --- |
| **A linguagem** | lambdas do JavaScript, como com um array | SQL em strings, um query builder próprio (`.where('price', '>', 20)`) ou uma DSL (GraphQL, JPQL, HQL) |
| **O que uma consulta cita** | o domínio: `p.category.name`, `p.details` | tabelas, colunas e joins, ou os nomes de um banco de dados específico |
| **Relações** | seguidas com um ponto (`p.category.name`): o λORM escreve os joins, ou as consultas por fonte | joins escritos à mão, ou uma API para carregá-las |
| **Onde é executada** | MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, SQLite, MongoDB, APIs REST, vários ao mesmo tempo | geralmente uma única família de mecanismos |
| **Onde você a escreve** | código TypeScript, uma string, a CLI, REST, WebSocket, MCP, a IDE: o mesmo texto | uma forma diferente para cada um |

### Transparente em TypeScript e JavaScript {#transparent-in-typescript-and-javascript}

Em uma aplicação, uma consulta é código. `lambdaorm build` gera o modelo do domínio (`Orders`, `Customers`…, veja
[Uso do esquema](../schema/Schema-Use.md)) e uma consulta é uma função sobre ele: seus parâmetros são os parâmetros da
consulta.

```typescript
import { orm } from '@lambdaorm/lib'
import { Orders } from './domain/model'

const ordersOf = (country: string) => Orders
  .filter(p => p.customer.country == country)
  .map(p => ({ id: p.id, customer: p.customer.name, date: p.orderDate }))

const result = await orm.execute(ordersOf, { country: 'Germany' })
```

- **IntelliSense:** o editor completa as entidades, suas propriedades e suas relações, como faz com qualquer objeto
  tipado; um nome errado é um erro de compilação, não uma surpresa em tempo de execução.
- **Refatoração e revisão:** uma consulta é lida como o resto do código, por qualquer pessoa que conheça JavaScript.
- **Resultados tipados:** as [consultas nomeadas](../usage/TypedQueries.md) do esquema recebem o tipo do seu
  resultado.

### O mesmo texto em todo lugar {#the-same-text-everywhere}

A mesma expressão trafega como string onde não há TypeScript: a [CLI](../cli/index.md), as APIs REST, WebSocket e MCP
do [Data Gateway](../data-gateway/index.md), ou um agente de IA. Na [IDE do Data Gateway](../ide/Queries.md), o editor
de consultas a completa enquanto você digita, a partir do esquema: entidades, propriedades e relações (`p.customer.`
lista as propriedades de `Customers`), e o [assistente de consultas](../ide/QueryWizard.md) a monta para você.

A mesma linguagem é usada no próprio esquema: os filtros das [visões](../schema/Views.md), as condições dos stages, as
restrições e os valores padrão também são expressões lambda.

## Tipos de consulta {#query-types}

### DQL {#dql}

As consultas DQL (Data Query Language) recuperam dados. Elas podem ser tão simples quanto ler todos os registros de uma entidade, ou podem filtrar, ordenar, agrupar e paginar os registros, calcular valores a partir deles e carregar entidades relacionadas.

**Veja:** [Select](Select.md), [Join](Join.md), [Agrupamento](Grouping.md), [Include](Include.md), [JSON, vetores e pontos](JsonVectorsPoints.md), [Consultas entre fontes](CrossSource.md)

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
