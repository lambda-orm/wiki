# λORM

[![npm version](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Write a query once. Run it on any database, from your code, a terminal, an API or an AI agent.**

λORM is a query language and a runtime for your data. You describe your **domain** once (entities, relations, rules)
in a schema and write queries as **lambda expressions** over it:

```typescript
Orders
  .filter(p => p.customer.country == country && p.orderDate >= since)
  .include(p => [p.customer.map(c => c.name), p.details.include(d => d.product.map(p => p.name))])
```

λORM turns that query into SQL for **MySQL, MariaDB, PostgreSQL, SQL Server, Oracle and SQLite** (sql.js), into an
aggregation pipeline for **MongoDB** or into calls to a **REST API**, even when the entities of one query live in
**different sources**. And the same query runs from a Node.js library, the command line, a REST or WebSocket API, or
an AI agent through MCP.

## Why λORM

- **Plain JavaScript over your domain.** A query is the code you would write over an array of objects:
  `filter`, `map`, `sort`, `p.customer.name`. No SQL in strings, no query builder, no new language; in TypeScript the
  editor completes it, and the Data Gateway IDE does the same ([why it matters](queries/Query-Language.md#javascript-over-your-domain)).
- **One domain, any database.** Queries talk about `Orders` and `Customers`, not about tables, dialects or where each
  entity is stored.
- **One query across several databases.** Orders in MongoDB, customers in PostgreSQL, products in MySQL: one query,
  one result. λORM splits it per source and joins the results.
- **Stages.** The same domain on one SQLite in development and distributed over three engines in production, or a
  write side and a read side ([CQRS](https://microservices.io/patterns/data/cqrs.html)), by configuration, not code.
- **Every channel.** TypeScript (typed), a string, the CLI, REST, WebSocket, MCP: the same language everywhere.
- **Governed access.** The [Data Gateway](data-gateway/index.md) publishes your schemas with credentials,
  permissions (`read`, `write`, …) and an audit of every change, for applications, people and AI agents alike.
- **Schema-first, both ways.** From a YAML to the tables (`push`), from the databases to the YAML (`pull`), or from a
  JSON file of data to a schema, tables and rows (`incorporate`).

See the [features](Features.md) for a complete list.

## The same query, from everywhere

The expression `Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])` is the same in every channel.

### Node.js / TypeScript

The library, [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib). See [Usage](usage/Usage.md).

```typescript
import { orm } from '@lambdaorm/lib'

await orm.init('./lambdaORM.yaml')
const products = await orm.execute(
  (minPrice: number) => Products.filter(p => p.price > minPrice).map(p => [p.name, p.price]),
  { minPrice: 50 })
```

### Command line

The `lambdaorm` command, [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli). See [CLI](cli/index.md).

```sh
lambdaorm execute -q "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])" -d '{"minPrice": 50}'
```

### REST API, from any language

The [Data Gateway](data-gateway/index.md) publishes the schema over HTTP. See [REST API](data-gateway/Rest.md).

```sh
curl -X POST http://gateway:8080/northwind/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])", "data": {"minPrice": 50}}'
```

```python
import requests

products = requests.post("http://gateway:8080/northwind/execute", headers={"X-Api-Key": key}, json={
    "query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])",
    "data": {"minPrice": 50},
}).json()
```

### Node.js client

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client): the interface of the library, run on a Data
Gateway over REST or WebSocket. See [Clients](data-gateway/Clients.md) and [WebSocket API](data-gateway/WebSocket.md).

```typescript
import { orm } from '@lambdaorm/client'

await orm.init('ws://gateway:8083/northwind', { headers: { 'X-Api-Key': key } })
const products = await orm.execute('Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])', { minPrice: 50 })
orm.on('schema.statusChanged', ({ status }) => console.log(status))
```

### AI agents

The Data Gateway speaks [MCP](data-gateway/Mcp.md): an agent explores the domain and queries it with the permissions
of its credential, never more.

```sh
claude mcp add --transport http northwind http://gateway:8081/northwind/mcp --header "X-Api-Key: $KEY"
```

> *"Which products cost more than 50?"*: the agent reads the domain of the schema from the tools and calls
> `orm_execute` with `Products.filter(p => p.price > 50).map(p => [p.name, p.price])`. With a `read` credential, it
> can't change anything.

### The browser

The [IDE](ide/index.md) of the Data Gateway, built with
[`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui): connect to gateways, browse the schemas, read each entity as a form, write
queries with autocompletion and draw diagrams.

![The UI of the Data Gateway](ide/images/ide-query.png)

## One query, three databases

A stage of the [northwind lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
keeps the catalog in MySQL, the customers in PostgreSQL and the orders in MongoDB:

```yaml
stages:
  - name: default
    sources:
      - name: Catalog                                   # MySQL
        condition: entity.in(["Categories","Products"])
      - name: Crm                                       # PostgreSQL
        condition: entity.in(["Address","Customers"])
      - name: Ordering                                  # MongoDB
        condition: entity.in(["Orders","Orders.details"])
```

The application doesn't know it. It asks for the orders of a customer with the name of the customer and, for each
line, the product and its category:

```typescript
Orders
  .filter(p => p.customerId == customerId)
  .include(p => [
    p.customer.map(c => c.name),
    p.details
      .include(d => d.product.include(pr => pr.category.map(c => c.name)).map(pr => pr.name))
      .map(d => [d.quantity, d.unitPrice])
  ])
```

and `orm.plan` shows what λORM will run (abridged):

```text
Orders            MongoDB     Ordering   aggregate [{ $match: { CustomerID: … } }, { $project: … }]
├─ Customers      PostgreSQL  Crm        SELECT c.CompanyName AS "name", … FROM Customers c WHERE c.CustomerID IN ($1)
└─ Orders.details MongoDB     Ordering   aggregate [{ $unwind: … }, { $match: { OrderID: { $in: … } } }, …]
   └─ Products    MySQL       Catalog    SELECT p.ProductName AS name, … FROM Products p WHERE p.ProductID IN (?)
      └─ Categories MySQL     Catalog    SELECT c1.CategoryName AS name, … FROM Categories c1 WHERE c1.CategoryID IN (?)
```

**One query per relation, never one per row:** each level reads the keys of the level above with an `IN`. When there
are many, the keys are split into chunks (at most 999 on Oracle, 7000 on the others) that run in parallel. The
result is one JSON tree, as if everything were in one database. See [include](queries/Include.md).

## One query, each engine's dialect

```typescript
Products
  .filter(p => p.price > minPrice && p.category.name == category)
  .map(p => ({ name: p.name, price: p.price }))
  .sort(p => desc(p.price))
  .page(1, 10)
```

```sql
-- MySQL
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > ? AND c.CategoryName = ?) ORDER BY p.UnitPrice desc LIMIT 0,10

-- PostgreSQL
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > $1 AND c.CategoryName = $2) ORDER BY p.UnitPrice desc OFFSET 0 LIMIT 10

-- SQL Server
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > @minPrice AND c.CategoryName = @category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY

-- Oracle
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > :minPrice AND c.CategoryName = :category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

The join is implicit (`p.category.name`), the parameters are always bound, and the property names are the domain's
(`price`), not the columns' (`UnitPrice`): the [mapping](schema/SchemaDefinition.md) lives in the schema. See the
[engines](schema/Engines.md) and the [query language](queries/Query-Language.md).

## Stages: the same code, another infrastructure

```yaml
infrastructure:
  stages:
    - name: dev                  # everything in one database
      sources: [ { name: Local } ]
    - name: prod                 # the same domain, spread over three engines
      sources:
        - { name: Catalog,  condition: 'entity.in(["Categories","Products"])' }
        - { name: Crm,      condition: 'entity.in(["Address","Customers"])' }
        - { name: Ordering, condition: 'entity.in(["Orders","Orders.details"])' }
```

```typescript
await orm.execute(query, data, { stage: 'prod' })
```

A write stage and a read stage over different databases is [CQRS by configuration](schema/SchemaExample-MultiplesStages.md).

## Governed access: the Data Gateway

The [Data Gateway](data-gateway/index.md) (Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway))
publishes one or several schemas over REST, WebSocket and MCP, with a web UI, with no backend to write:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: agent,   value: $AGENT_KEY,   permissions: [ read ] }
    - { name: backend, value: $BACKEND_KEY, permissions: [ read, write, script ] }
transports:
  http:       { port: 8080 }    # REST, OpenAPI
  mcpHttp:    { port: 8081 }    # AI agents
  management: { port: 9090 }    # the IDE (internal network only; left out in production)
```

- The same permissions on every transport: an agent with `read` can query, never write.
- Every write leaves an audit line: who, what, which entities, how many rows.
- Each schema in its own worker; Prometheus metrics, health probes for Kubernetes, rate and size limits.

**Try it in ten minutes:** [Getting started](data-gateway/GettingStarted.md), from an empty folder to the REST API,
the IDE, MCP and WebSocket.

## And more

- **Writes with their children:** `Orders.insert().include(p => p.details)`, `bulkInsert`, `upsert` and updates of
  composite relations; `update` and `delete` answer the affected rows, for optimistic locking. See
  [insert](queries/Insert.md) and [update](queries/Update.md).
- **[Transactions](usage/Transaction.md)** across sources and stages, and **[scripts](usage/Script.md)**: a whole use
  case (variables, conditions, loops and several queries) in one transaction and one call, from Node.js, the CLI or
  the gateway.
- **[Queries across sources](queries/CrossSource.md):** filter, map, group and sort by fields of relations stored in
  other databases.
- **[JSON, vectors and points](queries/JsonVectorsPoints.md):** paths inside JSON properties (`p.meta.address.zip`,
  `jsonSet`), similarity search with `cosineDistance` (RAG), and `distance` and `inside` for geography.
- **[Views](schema/Views.md) and [context](schema/Context.md):** each caller sees only its entities, properties and
  rows, with masks for personal data.
- **[Changes of the data](usage/DataEvents.md):** `orm.onDataChange` after each commit, and an outbox written in the
  same transaction.
- **[Typed queries](usage/TypedQueries.md):** named queries in the schema, and the types of their results generated by
  `lambdaorm build`.
- **[Synchronization](schema/SchemaSynchronization.md):** `push`, `pull`, `fetch` (the drift, for CI), `introspect`
  and `incorporate`, with [migrations](schema/SchemaSynchronization-Migrations.md) that can be undone and
  [seed data](schema/SchemaSynchronization-Seed.md).
- **[Repositories](usage/Repository.md)** and a typed model generated from the schema
  ([`lambdaorm build`](cli/Commands/Build.md)).
- **[Listeners](schema/SchemaExample-Listener.md), constraints, default values and computed properties**, written in
  the same expression language.
- **[Observability](schema/Observability.md):** logs, metrics and traces with OpenTelemetry.

See all the [features](Features.md).

## The ecosystem

| Project | Published as | What it is |
| --- | --- | --- |
| [Library](usage/Usage.md) | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | the ORM: runs the queries against the databases |
| [CLI](cli/index.md) | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) | the `lambdaorm` command: projects, synchronization, import / export, queries, scripts |
| [Data Gateway](data-gateway/index.md) | Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | the schemas over REST, MCP and WebSocket |
| [Data Gateway IDE](ide/index.md) | Docker [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide) · [desktop: Linux, Windows, macOS](ide/Download.md) | the IDE of the gateways: connections, explorer, queries, diagrams, administration |
| [Node.js client](data-gateway/Clients.md) | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | the interface of the library, run on a Data Gateway |
| [UI components](ide/Embedding.md) | [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui) | React components: the query editor, results, explorer and diagrams |
| [Base](https://www.npmjs.com/package/@lambdaorm/base) | [`@lambdaorm/base`](https://www.npmjs.com/package/@lambdaorm/base) | the contracts shared by the library, the CLI and the client |
| [3xpr](https://www.npmjs.com/package/3xpr) | [`3xpr`](https://www.npmjs.com/package/3xpr) | the expression engine the queries, scripts and schema rules are built on |

The source of the library, the CLI and the client is in [github.com/lambda-orm/core](https://github.com/lambda-orm/core);
the Data Gateway, its IDE and `@lambdaorm/ui` are in
[github.com/lambda-orm/data-gateway](https://github.com/lambda-orm/data-gateway).

!!! note
    The unscoped packages `lambdaorm`, `lambdaorm-cli` and `lambdaorm-client-node` are no longer maintained: use the
    `@lambdaorm/*` packages.

## Get started

| I want to… | Start here |
| --- | --- |
| query my databases from Node.js / TypeScript | [Usage](usage/Usage.md) |
| create a project, sync the databases, import data | [CLI](cli/index.md) |
| give applications in any language, or AI agents, access to my data | [Data Gateway: getting started](data-gateway/GettingStarted.md) |
| learn the query language | [Query language](queries/Query-Language.md) |
| define the domain, the sources and the stages | [Schema](schema/Schema.md) |
| see complete examples | [Labs](labs/index.md) |

## Learn more

- **Queries:** [query language](queries/Query-Language.md) | [select](queries/Select.md) | [join](queries/Join.md) |
  [grouping](queries/Grouping.md) | [include](queries/Include.md) | [insert](queries/Insert.md) |
  [bulk insert](queries/BulkInsert.md) | [update](queries/Update.md) | [delete](queries/Delete.md) |
  [metadata](queries/Metadata.md) | [across sources](queries/CrossSource.md) |
  [JSON, vectors and points](queries/JsonVectorsPoints.md) |
  [operators and functions](queries/operatorsAndFunctions/OperatorsAndFunctions.md)
- **Schema:** [schema](schema/Schema.md) | [definition](schema/SchemaDefinition.md) |
  [expressions](schema/SchemaDefinition-Expressions.md) |
  [environment variables](schema/SchemaDefinition-EnvironmentVariables.md) |
  [composite](schema/SchemaDefinition-Composite.md) | [listeners](schema/SchemaExample-Listener.md) |
  [multiple stages](schema/SchemaExample-MultiplesStages.md) |
  [multiple sources](schema/SchemaExample-StageMultiplesSources.md) | [engines](schema/Engines.md) |
  [views](schema/Views.md) | [context](schema/Context.md) | [REST API as a source](schema/HttpSource.md) |
  [observability](schema/Observability.md)
- **Synchronization:** [overview](schema/SchemaSynchronization.md) | [push](schema/SchemaSynchronization-Push.md) |
  [pull](schema/SchemaSynchronization-Pull.md) | [fetch](schema/SchemaSynchronization-Fetch.md) |
  [introspect](schema/SchemaSynchronization-Introspect.md) | [incorporate](schema/SchemaSynchronization-Incorporate.md) |
  [migrations](schema/SchemaSynchronization-Migrations.md) | [seed](schema/SchemaSynchronization-Seed.md)
- **Usage:** [usage](usage/Usage.md) | [repository](usage/Repository.md) | [transactions](usage/Transaction.md) |
  [scripts](usage/Script.md) | [changes of the data](usage/DataEvents.md) | [typed queries](usage/TypedQueries.md)
- **CLI:** [commands](cli/index.md) | [init](cli/Commands/Init.md) | [build](cli/Commands/Build.md) |
  [push](cli/Commands/Push.md) | [execute](cli/Commands/Execute.md) | [script](cli/Commands/Script.md)
- **Data Gateway:** [overview](data-gateway/index.md) | [getting started](data-gateway/GettingStarted.md) |
  [REST](data-gateway/Rest.md) | [WebSocket](data-gateway/WebSocket.md) | [MCP](data-gateway/Mcp.md) |
  [security](data-gateway/Security.md) | [clients](data-gateway/Clients.md) | [IDE](ide/index.md)

## Community

Questions, ideas and feedback are welcome in [GitHub Discussions](https://github.com/lambda-orm/wiki/discussions) and
on [Discord](https://discord.com/invite/yXT6XBX2); issues and pull requests in
[github.com/lambda-orm/core](https://github.com/lambda-orm/core).
