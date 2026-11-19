# λORM

[![CLI](https://img.shields.io/badge/Api-CLI-blue.svg)](https://lambda-orm.github.io/wiki/cli/)
[![Data Gateway](https://img.shields.io/badge/Api-REST%20%7C%20MCP%20%7C%20WebSocket-blue.svg)](https://lambda-orm.github.io/wiki/data-gateway/)
[![Join the community on GitHub Discussions](https://img.shields.io/badge/Join%20the%20community-on%20GitHub%20Discussions-blue.svg)](https://github.com/lambda-orm/wiki/discussions)
[![Slack](https://img.shields.io/badge/chat-on%20slack-orange)](https://join.slack.com/t/nuevoespaciod-xo58767/shared_invite/zt-29ix7pc2r-Wd_ZBWnWRDv_5DM4NPtVhQ)
[![Gitter](https://badges.gitter.im/lambdaorm/community.svg)](https://app.gitter.im/#/room/#lambdaorm-how-to-contribute:gitter.im)
[![Discord](https://img.shields.io/badge/chat-on%20discord-orange)](https://discord.com/invite/yXT6XBX2)
[![language typescript](https://img.shields.io/badge/language-typescript-blue)](https://www.npmjs.com/package/@lambdaorm/lib)
[![npm version](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


λORM is an ORM that allows us to perform distributed queries on different database engines.

In λORM, queries are defined using lambda expressions based on a domain model which abstracts us from the infrastructure. For example, in a query you can obtain or modify records from different entities, where some persist in MySQL, others in Postgres, and others in Mongo.

λORM allows you to define different scenarios for the same domain. For example, in one scenario, the infrastructure may consist of distributed instances across SQL Server, MongoDB, and Oracle, while in another scenario it may be a single Postgres instance. This allows the [CQRS](https://microservices.io/patterns/data/cqrs.html) pattern to be implemented through configuration, without needing to write a single line of code. [view example](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/svc/04-northwind-cqrs-with-kafka)

In addition to being used as a Node.js library, it can be consumed from a command line interface (CLI) and, through the [Data Gateway](https://lambda-orm.github.io/wiki/data-gateway/), over REST, WebSocket or MCP (for AI agents) from any language.

## Query Language

Example of a query where orders and their details associated with a customer are obtained:

```Typescript
const query = (country: string) => Products
    .map(p => ({ category: p.category.name, largestPrice: max(p.price) }))    
    .filter(p => (p.price > 5 && p.supplier.country == country) || (p.inStock < 3))    
    .having(p => max(p.price) > 50)
    .sort(p => desc(p.largestPrice));
// Run the query passing the value of the country parameter
const result = await orm.execute(query, { country: 'ARG' });
```

In this example:

- Define a query that returns a list of product categories along with the maximum price of each category.
- Filter products based on price and supplier's country or stock availability
- Group products by category and calculate the maximum price
- Map each product to an object with category name and maximum price
- Sort the products by largest price in descending order

**view:** [queries](https://lambda-orm.github.io/wiki/queries/Query-Language/) |
[select](https://lambda-orm.github.io/wiki/queries/Select/) |
[join](https://lambda-orm.github.io/wiki/queries/Join/) |
[grouping](https://lambda-orm.github.io/wiki/queries/Grouping/) |
[include](https://lambda-orm.github.io/wiki/queries/Include/) |
[insert](https://lambda-orm.github.io/wiki/queries/Insert/) |
[bulkInsert](https://lambda-orm.github.io/wiki/queries/BulkInsert/) |
[update](https://lambda-orm.github.io/wiki/queries/Update/) |
[delete](https://lambda-orm.github.io/wiki/queries/Delete/) |
[repository](https://lambda-orm.github.io/wiki/usage/Repository/) |
[usage](https://lambda-orm.github.io/wiki/usage/Usage/) |
[metadata](https://lambda-orm.github.io/wiki/queries/Metadata/)

### Include

The include allows us to obtain the entity data and its relationships in the same query. These data may be in different databases. \
In this example the query is expressed as a text string. (Which is another alternative to the lambda expression)

```Typescript
import { orm } from '../../lib'
(async () => {
  try {
    await orm.init('./config/northwind.yaml')
    const query = `Orders
	.filter(p => p.id === id)
	.include(p => 
	  [ p.customer.map(p => p.name), 
	    p.details
             .include(p => 
                 p.product
  	          .include(p => p.category.map(p => p.name))
		  .map(p => p.name))
	     .map(p => [p.quantity, p.unitPrice])
	   ]
         )`
	const params = { id: 102 }
	const result = await orm.execute(query, params, { stage: 'PostgreSQL' })
	console.log(JSON.stringify(result, null, 2))
   } catch (error:any) {
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

**more info:** [include](https://lambda-orm.github.io/wiki/queries/Include/)

## Schema Configuration

Through the schema, you can define entities, enumerations, indexes, unique keys, default values, constraints, mapping, sources, stages, listeners, etc. The schema can be defined in a JSON or YAML format. Conditions or actions are performed using the same [expression language](https://www.npmjs.com/package/3xpr) that is used to define queries.

**view:**  [schema](https://lambda-orm.github.io/wiki/schema/Schema/) |
[definition](https://lambda-orm.github.io/wiki/schema/SchemaDefinition/) |
[use](https://lambda-orm.github.io/wiki/schema/Schema-Use/) |
[expressions](https://lambda-orm.github.io/wiki/schema/SchemaDefinition-Expressions/) |
[environment Variables](https://lambda-orm.github.io/wiki/schema/SchemaDefinition-EnvironmentVariables/) |
[composite](https://lambda-orm.github.io/wiki/schema/SchemaDefinition-Composite/) |
[listener](https://lambda-orm.github.io/wiki/schema/SchemaExample-Listener/) |
[multiple stages](https://lambda-orm.github.io/wiki/schema/SchemaExample-MultiplesStages/) |
[multiple sources](https://lambda-orm.github.io/wiki/schema/SchemaExample-StageMultiplesSources/) |
[push](https://lambda-orm.github.io/wiki/schema/SchemaSynchronization-Push/) |
[pull](https://lambda-orm.github.io/wiki/schema/SchemaSynchronization-Pull/) |
[fetch](https://lambda-orm.github.io/wiki/schema/SchemaSynchronization-Fetch/) |
[introspect](https://lambda-orm.github.io/wiki/schema/SchemaSynchronization-Introspect/) |
[incorporate](https://lambda-orm.github.io/wiki/schema/SchemaSynchronization-Incorporate/)

## All Labs

You can access various labs at [lambdaorm labs](https://github.com/lambda-orm/lambdaorm-labs)

## Related projects

- [@lambdaorm/lib](https://www.npmjs.com/package/@lambdaorm/lib): the library
- [@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli): command line interface for λORM
- [Data Gateway](https://lambda-orm.github.io/wiki/data-gateway/): your databases as a governed data API (REST, WebSocket, MCP for AI agents and a web UI), as the Docker image `flaviorita/data-gateway`
- [@lambdaorm/client](https://www.npmjs.com/package/@lambdaorm/client): Node.js client of the Data Gateway
- [3xpr](https://www.npmjs.com/package/3xpr): Extensible expression engine, which allows evaluating mathematical and logical expressions.
