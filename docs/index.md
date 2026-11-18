# λORM

[![npm version](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![language typescript](https://img.shields.io/badge/language-typescript-blue)](https://www.npmjs.com/package/@lambdaorm/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Join the community on GitHub Discussions](https://img.shields.io/badge/Join%20the%20community-on%20GitHub%20Discussions-blue.svg)](https://github.com/lambda-orm/wiki/discussions)
[![Slack](https://img.shields.io/badge/chat-on%20slack-orange)](https://join.slack.com/t/nuevoespaciod-xo58767/shared_invite/zt-29ix7pc2r-Wd_ZBWnWRDv_5DM4NPtVhQ)
[![Gitter](https://badges.gitter.im/lambdaorm/community.svg)](https://app.gitter.im/#/room/#lambdaorm-how-to-contribute:gitter.im)
[![Discord](https://img.shields.io/badge/chat-on%20discord-orange)](https://discord.com/invite/yXT6XBX2)

λORM (LambdaORM) is a TypeScript ORM that runs **distributed queries** across different database engines: MySQL,
MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB and SQLite.

Queries are written as **lambda expressions** over a **domain model** that is independent of the infrastructure. A
single query can read or write entities stored in different databases — for example, some in MySQL, others in
PostgreSQL and others in MongoDB — and λORM splits it into one sentence per source and joins the results.

The same domain can have several **stages** (infrastructure scenarios). In one stage the data may be spread across SQL
Server, MongoDB and Oracle; in another, everything may live in a single PostgreSQL database. This makes it possible to
implement patterns such as [CQRS](https://microservices.io/patterns/data/cqrs.html) through configuration, without
changing the code.

See the [features](Features.md) for a complete list.

## How to use it

| Way | Package | When to use it |
| --- | --- | --- |
| Node.js library | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | Run queries from a Node.js / TypeScript application. See [Usage](usage/Usage.md). |
| Command line | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) (command `lambdaorm`) | Create a project, synchronize the databases, import and export data, and run queries from a terminal or CI. See [CLI](cli/index.md). |
| Data Gateway | Docker image [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | Expose λORM schemas over the network: a REST API, MCP for AI agents, a WebSocket API and a web UI. See [Data Gateway](data-gateway/index.md). |
| Node.js client | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | Run the same queries from Node.js against a Data Gateway. See [Clients](data-gateway/Clients.md). |

```sh
npm install @lambdaorm/lib      # the library
npm install -g @lambdaorm/cli   # the lambdaorm command
```

!!! note
    The unscoped packages `lambdaorm`, `lambdaorm-cli` and `lambdaorm-client-node` are no longer maintained: use the
    `@lambdaorm/*` packages.

## Query language

The following query returns the highest price of each product category, considering only the products that match the
filter and the categories whose highest price is above 50:

```typescript
import { orm } from '@lambdaorm/lib'
import { Products } from './northwind/domain/model'

const query = (country: string) => Products
  .filter(p => (p.price > 5 && p.supplier.country == country) || (p.inStock < 3))
  .having(p => max(p.price) > 50)
  .map(p => ({ category: p.category.name, largestPrice: max(p.price) }))
  .sort(p => desc(p.largestPrice))

await orm.init('./lambdaORM.yaml')
// run the query, passing the value of the country parameter
const result = await orm.execute(query, { country: 'ARG' })
await orm.end()
```

In this query:

- `filter` keeps the products whose price is greater than 5 and whose supplier is in the given country, as well as
  those with fewer than 3 units in stock.
- `map` returns the category name and the highest price. Grouping is implicit: the products are grouped by category
  because `max` is an aggregate function.
- `having` keeps only the categories whose highest price is greater than 50.
- `sort` orders the result by the highest price, in descending order.
- `supplier` and `category` are relations: the joins are implicit.

**See also:** [query language](queries/Query-Language.md) |
[select](queries/Select.md) |
[join](queries/Join.md) |
[grouping](queries/Grouping.md) |
[include](queries/Include.md) |
[insert](queries/Insert.md) |
[bulk insert](queries/BulkInsert.md) |
[update](queries/Update.md) |
[delete](queries/Delete.md) |
[metadata](queries/Metadata.md) |
[repository](usage/Repository.md) |
[usage](usage/Usage.md)

### Include

`include` returns an entity together with its relations in the same query, even when they are stored in different
databases. In this example the query is written as a string, an alternative to the lambda expression:

```typescript
import { orm } from '@lambdaorm/lib'

(async () => {
  try {
    await orm.init('./config/northwind.yaml')
    const query = `Orders
      .filter(p => p.id === id)
      .include(p => [
        p.customer.map(p => p.name),
        p.details
          .include(p => p.product
            .include(p => p.category.map(p => p.name))
            .map(p => p.name))
          .map(p => [p.quantity, p.unitPrice])
      ])`
    const result = await orm.execute(query, { id: 102 }, { stage: 'PostgreSQL' })
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error(error.message)
  } finally {
    await orm.end()
  }
})()
```

**Result:**

```json
[
  {
    "id": 102,
    "customerId": "SPLIR",
    "employeeId": 7,
    "orderDate": "1996-11-07T23:00:00.000Z",
    "requiredDate": "1996-12-05T23:00:00.000Z",
    "shippedDate": "1996-11-14T23:00:00.000Z",
    "shipViaId": 1,
    "freight": 8.63,
    "name": "Split Rail Beer & Ale",
    "address": "P.O. Box 555",
    "city": "Lander",
    "region": "WY",
    "postalCode": "82520",
    "country": "USA",
    "customer": {
      "name": "Split Rail Beer & Ale"
    },
    "details": [
      {
        "quantity": 24,
        "unitPrice": 5.9,
        "product": {
          "name": "Tourtire",
          "category": {
            "name": "Meat/Poultry"
          }
        }
      }
    ]
  }
]
```

**More information:** [include](queries/Include.md)

## Schema

The schema defines entities, enumerations, indexes, unique keys, default values, constraints, mappings, sources,
stages, listeners and more. It is written in YAML or JSON. Conditions and actions use the same
[expression language](https://www.npmjs.com/package/3xpr) as queries.

**See also:** [schema](schema/Schema.md) |
[definition](schema/SchemaDefinition.md) |
[use](schema/Schema-Use.md) |
[expressions](schema/SchemaDefinition-Expressions.md) |
[environment variables](schema/SchemaDefinition-EnvironmentVariables.md) |
[composite](schema/SchemaDefinition-Composite.md) |
[listeners](schema/SchemaExample-Listener.md) |
[multiple stages](schema/SchemaExample-MultiplesStages.md) |
[multiple sources](schema/SchemaExample-StageMultiplesSources.md) |
[engines](schema/Engines.md)

### Synchronization

λORM keeps the databases and the schema in step, in both directions:
[synchronization](schema/SchemaSynchronization.md) |
[push](schema/SchemaSynchronization-Push.md) |
[pull](schema/SchemaSynchronization-Pull.md) |
[fetch](schema/SchemaSynchronization-Fetch.md) |
[introspect](schema/SchemaSynchronization-Introspect.md) |
[incorporate](schema/SchemaSynchronization-Incorporate.md)

## Transactions and scripts

- [Transactions](usage/Transaction.md): `orm.transaction` runs several queries in one transaction, also across sources
  and stages.
- [Scripts](usage/Script.md): a whole use case (variables, conditions, loops and several queries) in one transaction
  and in a single call — from Node.js, the CLI or the Data Gateway.

## Labs

Complete examples are available in the [λORM labs](labs/index.md).

## Related projects

- [λORM CLI](https://www.npmjs.com/package/@lambdaorm/cli): command line interface for λORM.
- [Data Gateway](data-gateway/index.md): λORM schemas over REST, MCP and WebSocket, with a web UI.
- [λORM client](https://www.npmjs.com/package/@lambdaorm/client): Node.js client for the Data Gateway.
- [3xpr](https://www.npmjs.com/package/3xpr): extensible expression engine that evaluates mathematical and logical
  expressions; λORM queries and scripts are built on it.
