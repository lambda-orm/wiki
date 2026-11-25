# Query Language

This page introduces the λORM query language: what a query looks like, the kinds of queries there are and where each one is documented.

λORM queries are written as [JavaScript lambda expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) over the entities of the domain. You can write them as TypeScript/JavaScript code, navigating the entities of the model, or send them as a string (for example from the [CLI](../cli/index.md) or to the [Data Gateway](../data-gateway/index.md)).

λORM translates each query into the language of the database engine of each source (SQL for MySQL, MariaDB, PostgreSQL, SQL Server, Oracle and SQLite, MongoDB aggregation pipelines, or HTTP requests to a REST API for an [Http source](../schema/HttpSource.md)). A query can also combine entities of different sources: see [Queries across sources](CrossSource.md).

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

## Advantages

- Queries are written in the same programming language as the application.
- There is no new language to learn.
- Queries are easy to write and to read.
- The IDE's IntelliSense helps you write the expressions.
- Syntax errors are caught while you write.
