# Features

An overview of what λORM offers, with links to the pages that describe each feature.

## Database engines

- MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB and SQLite (SQLjs).
- A single query can involve several databases, even of different engines.
- [Engines](schema/Engines.md): the differences between engines (types, empty strings, `upsert`, …).

## Query language

- [Query language](queries/Query-Language.md) based on JavaScript lambda expressions.
- Queries can be written as JavaScript/TypeScript code or as a string.
- [Select](queries/Select.md), [insert](queries/Insert.md), [bulk insert](queries/BulkInsert.md),
  [update](queries/Update.md) and [delete](queries/Delete.md) clauses.
- Implicit [joins](queries/Join.md) and [grouping](queries/Grouping.md).
- Eager loading of relations with [include](queries/Include.md), also across databases.
- [Operators and functions](queries/operatorsAndFunctions/OperatorsAndFunctions.md).
- [Query metadata](queries/Metadata.md): the parameters, model, constraints and execution plan of a query.

## Usage

- [Repositories and custom repositories](usage/Repository.md).
- [Transactions and distributed transactions](usage/Transaction.md), across sources and stages.
- [Scripts](usage/Script.md): a whole use case (variables, conditions, loops and several queries) in one transaction,
  also over the Data Gateway.
- [Usage examples](usage/Usage.md): a single source, several sources, CQRS and the Node.js client.

## Schema

- [Schema](schema/Schema.md) configuration that decouples the domain model from the infrastructure.
- Configuration in JSON or YAML.
- [Mappings](schema/SchemaDefinition.md) between the domain and the infrastructure.
- [Entity inheritance](schema/SchemaExample-Extend.md) (`extends`).
- [Environment variables](schema/SchemaDefinition-EnvironmentVariables.md).
- Indexes, unique keys and constraints.
- Conditions and actions based on the [3xpr](https://www.npmjs.com/package/3xpr) expression engine
  ([expressions](schema/SchemaDefinition-Expressions.md)).
- [Stages](schema/SchemaExample-MultiplesStages.md): several infrastructure scenarios for the same domain.
- [Synchronization](schema/SchemaSynchronization.md) between the schema and the databases:
  [push](schema/SchemaSynchronization-Push.md), [pull](schema/SchemaSynchronization-Pull.md),
  [fetch](schema/SchemaSynchronization-Fetch.md), [introspect](schema/SchemaSynchronization-Introspect.md) and
  [incorporate](schema/SchemaSynchronization-Incorporate.md).
- [Listeners and subscribers](schema/SchemaExample-Listener.md): awaited, and run in the transaction of the sentence
  that triggers them.

## Performance

- [Bulk insert](queries/BulkInsert.md).
- High-performance queries.
- Connection pooling.

## Tools and clients

- TypeScript and JavaScript support.
- [CLI](cli/index.md) (`npm i -g @lambdaorm/cli`, command `lambdaorm`).
- [Data Gateway](data-gateway/index.md) (Docker image `flaviorita/data-gateway`):
    - a REST API, MCP for AI agents and a WebSocket API, with several schemas per instance;
    - credentials with permissions, audit of writes, metrics and health checks;
    - a web UI: explorer, entity forms, saved queries and diagrams of the domain.
- [Clients](data-gateway/Clients.md):
    - [Node.js client](https://www.npmjs.com/package/@lambdaorm/client) (`@lambdaorm/client`, REST or WebSocket);
    - other languages: generate a client from the Data Gateway's OpenAPI 3 document.
