# Query Language

This page introduces the λORM query language: what a query looks like, the kinds of queries there are and where each one is documented.

λORM queries are written as [JavaScript lambda expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) over the entities of the domain. You can write them as TypeScript/JavaScript code, navigating the entities of the model, or send them as a string (for example from the [CLI](../cli/index.md) or to the [Data Gateway](../data-gateway/index.md)).

λORM translates each query into the language of the database engine of each source (SQL for MySQL, MariaDB, PostgreSQL, SQL Server, Oracle and SQLite, MongoDB aggregation pipelines, or HTTP requests to a REST API for an [Http source](../schema/HttpSource.md)). A query can also combine entities of different sources: see [Queries across sources](CrossSource.md).

## JavaScript over your domain

A λORM query is **the code you would write over an array of objects**. Take a list of products in memory:

```typescript
// an array in memory: plain JavaScript
products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort((a, b) => b.price - a.price)
```

The same intent, as a λORM query over the `Products` of the domain:

```typescript
// a λORM query: the same lambdas, over the domain
Products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort(p => desc(p.price))
```

which λORM runs on PostgreSQL as:

```sql
SELECT p.ProductName AS "name", c.CategoryName AS "category", p.UnitPrice AS "price"
FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (c.CategoryName = 'Beverages' AND p.UnitPrice > 20)
ORDER BY p.UnitPrice desc
```

The query never named a table, a column or a join: `p.category.name` is enough, and the mapping of the schema says
that `Products` is the table `Products`, `name` the column `ProductName` and the relation `category` a join on
`CategoryID`.

`filter`, `map`, `sort`, `includes`, `p.category.name`: arrow functions, property paths and operators of JavaScript.
λORM reads that expression and turns it into SQL, a MongoDB pipeline or calls to a REST API. That is what sets it
apart from other ORMs and query languages:

| | λORM | Other approaches |
| --- | --- | --- |
| **The language** | JavaScript lambdas, as with an array | SQL in strings, a query builder of its own (`.where('price', '>', 20)`), or a DSL (GraphQL, JPQL, HQL) |
| **What a query names** | the domain: `p.category.name`, `p.details` | tables, columns and joins, or the names of one database |
| **Relations** | followed with a dot (`p.category.name`): λORM writes the joins, or the queries per source | joins written by hand, or an API to load them |
| **Where it runs** | MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, SQLite, MongoDB, REST APIs, several at once | usually one family of engines |
| **Where you write it** | TypeScript code, a string, the CLI, REST, WebSocket, MCP, the IDE: the same text | a different form for each |

### Transparent in TypeScript and JavaScript

In an application, a query is code. `lambdaorm build` generates the model of the domain (`Orders`, `Customers`…, see
[Schema Use](../schema/Schema-Use.md)) and a query is a function over it: its parameters are the parameters of the
query.

```typescript
import { orm } from '@lambdaorm/lib'
import { Orders } from './domain/model'

const ordersOf = (country: string) => Orders
  .filter(p => p.customer.country == country)
  .map(p => ({ id: p.id, customer: p.customer.name, date: p.orderDate }))

const result = await orm.execute(ordersOf, { country: 'Germany' })
```

- **IntelliSense:** the editor completes the entities, their properties and their relations, as it does with any
  typed object; a wrong name is a compile error, not a runtime surprise.
- **Refactoring and review:** a query is read like the rest of the code, by anyone who knows JavaScript.
- **Typed results:** the [named queries](../usage/TypedQueries.md) of the schema get the type of their result.

### The same text everywhere

The same expression travels as a string where there is no TypeScript: the [CLI](../cli/index.md), the REST, WebSocket
and MCP APIs of the [Data Gateway](../data-gateway/index.md), or an AI agent. In the
[Data Gateway IDE](../ide/Queries.md) the query editor completes it as you type, from the schema: entities,
properties and relations (`p.customer.` lists the properties of `Customers`), and the
[query wizard](../ide/QueryWizard.md) builds it for you.

The same language is used in the schema itself: the filters of the [views](../schema/Views.md), the conditions of the
stages, constraints and default values are lambda expressions too.

## Query types

### DQL

DQL (Data Query Language) queries retrieve data. They can be as simple as reading all the records of an entity, or they can filter, sort, group and paginate the records, compute values from them and load related entities.

**See:** [Select](Select.md), [Join](Join.md), [Grouping](Grouping.md), [Include](Include.md), [JSON, vectors and points](JsonVectorsPoints.md), [Queries across sources](CrossSource.md)

### DML

DML (Data Manipulation Language) queries change data. They include the following operations:

- **insert**: adds new records to an entity (also `bulkInsert` and `upsert`).
- **update**: modifies existing records.
- **delete**: removes records.

**See:** [Insert](Insert.md), [Bulk Insert](BulkInsert.md), [Update](Update.md), [Delete](Delete.md)

### DDL

DDL (Data Definition Language) statements create, modify and drop database structures and related objects:

- **CREATE**: creates new objects in the database, such as tables and indexes.
- **ALTER**: modifies the structure of existing objects, for example adding, changing or removing the columns of a table.
- **DROP**: deletes objects from the database.

You do not write DDL queries: λORM generates and runs them when you use the schema synchronization commands.

**See:** [Push](../schema/SchemaSynchronization-Push.md), [Pull](../schema/SchemaSynchronization-Pull.md), [Fetch](../schema/SchemaSynchronization-Fetch.md), [Introspect](../schema/SchemaSynchronization-Introspect.md), [Incorporate](../schema/SchemaSynchronization-Incorporate.md)

## Example

The following query reads the countries of a region, with their states whose name starts with "F". It returns the name, subregion and position of each country, 3 countries per page:

```typescript
Countries
	.filter(p => p.region == region)
	.map(p => [p.name, p.subregion, p.latitude, p.longitude]) // properties of the country
	.include(p => p.states.filter(p => substr(p.name, 1, 1) == "F") // states starting with 'F'
		.map(p => [p.name, p.latitude, p.longitude])
	)
	.page(1, 3) // first page, 3 countries per page
```

In this schema, `Countries` is in a MySQL source and `States` in a PostgreSQL source (see [Stage with multiple sources](../schema/SchemaExample-StageMultiplesSources.md)). λORM runs one statement per source:

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

The states are then attached to their country in memory, so each country of the result has a `states` array.
