# λORM

[![CLI](https://img.shields.io/badge/Api-CLI-blue.svg)](https://lambda-orm.github.io/wiki/cli)
[![Api REST](https://img.shields.io/badge/Api-REST-blue.svg)](https://lambda-orm.github.io/wiki/api)
[![Join the community on GitHub Discussions](https://img.shields.io/badge/Join%20the%20community-on%20GitHub%20Discussions-blue.svg)](https://github.com/lambda-orm/wiki/discussions)
[![Slack](https://img.shields.io/badge/chat-on%20slack-orange)](https://join.slack.com/t/nuevoespaciod-xo58767/shared_invite/zt-29ix7pc2r-Wd_ZBWnWRDv_5DM4NPtVhQ)
[![Gitter](https://badges.gitter.im/lambdaorm/community.svg)](https://app.gitter.im/#/room/#lambdaorm-how-to-contribute:gitter.im)
[![Discord](https://img.shields.io/badge/chat-on%20discord-orange)](https://discord.com/invite/yXT6XBX2)
[![language typescript](https://img.shields.io/badge/language-typescript-blue)](https://www.npmjs.com/package/lambdaorm)
[![npm version](https://img.shields.io/badge/npm-10.2.5-green)](https://www.npmjs.com/package/lambdaorm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


λORM is an ORM that allows us to perform distributed queries on different database engines.

In λORM, queries are defined using lambda expressions based on a domain model which abstracts us from the infrastructure. For example, in a query you can obtain or modify records from different entities, where some persist in MySQL, others in Postgres, and others in Mongo.

λORM allows you to define different scenarios for the same domain. For example, in one scenario, the infrastructure may consist of distributed instances across SQL Server, MongoDB, and Oracle, while in another scenario it may be a single Postgres instance. This allows the [CQRS](https://microservices.io/patterns/data/cqrs.html) pattern to be implemented through configuration, without needing to write a single line of code. [view example](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/svc/04-northwind-cqrs-with-kafka)

In addition to being used as a Node.js library, it can be consumed from a command line interface (CLI), a REST service, or a REST service client in other programming languages.

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

**view:** [queries](https://lambda-orm.github.io/wiki/queries/Query-Language/index.html) |
[select](https://lambda-orm.github.io/wiki/queries/dql/Select/index.html) |
[join](https://lambda-orm.github.io/wiki/queries/dql/Join/index.html) |
[grouping](https://lambda-orm.github.io/wiki/queries/dql/Grouping/index.html) |
[include](https://lambda-orm.github.io/wiki/queries/dql/Include/index.html) |
[insert](https://lambda-orm.github.io/wiki/queries/dml/Insert/index.html) |
[bulkInsert](https://lambda-orm.github.io/wiki/queries/dmlBulkInsert/index.html) |
[update](https://lambda-orm.github.io/wiki/queries/dml/Update/index.html) |
[delete](https://lambda-orm.github.io/wiki/queries/dml/Delete/index.html) |
[repository](https://lambda-orm.github.io/wiki/Repository/index.html) |
[usage](https://lambda-orm.github.io/wiki/Usage/index.html) |
[metadata](https://lambda-orm.github.io/wiki/queries/Metadata/index.html)

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

**more info:** [include](https://lambda-orm.github.io/wiki/Include)

## Schema Configuration

Through the schema, you can define entities, enumerations, indexes, unique keys, default values, constraints, mapping, sources, stages, listeners, etc. The schema can be defined in a JSON or YAML format. Conditions or actions are performed using the same [expression language](https://www.npmjs.com/package/3xpr) that is used to define queries.

**view:**  [schema](https://lambda-orm.github.io/wiki/schema/Schema/index.html) |
[definition](https://lambda-orm.github.io/wiki/schema/Definition/SchemaDefinition/index.html) |
[use](https://lambda-orm.github.io/wiki/schema/Schema-Us/index.html) |
[expressions](https://lambda-orm.github.io/wiki/schema/Definition/SchemaDefinition-Expressions/index.html) |
[environment Variables](https://lambda-orm.github.io/wiki/schema/Definition/SchemaDefinition-EnvironmentVariables/index.html) |
[composite](https://lambda-orm.github.io/wiki/schema/Definition/SchemaDefinition-Composite/index.html) |
[listener](https://lambda-orm.github.io/wiki/schema/Examples/SchemaExample-Listener/index.html) |
[multiple stages](https://lambda-orm.github.io/wiki/schema/Examples/SchemaExample-MultiplesStages/index.html) |
[multiple sources](https://lambda-orm.github.io/wiki/schema/Examples/SchemaExample-StageMultiplesSources/index.html) |
[push](https://lambda-orm.github.io/wiki/schema/Examples/SchemaSynchronization-Push/index.html) |
[pull](https://lambda-orm.github.io/wiki/schema/Examples/SchemaSynchronization-Pull/index.html) |
[fetch](https://lambda-orm.github.io/wiki/schema/Examples/SchemaSynchronization-Fetch/index.html) |
[introspect](https://lambda-orm.github.io/wiki/schema/Examples/SchemaSynchronization-Introspect/index.html) |
[incorporate](https://lambda-orm.github.io/wiki/schema/Examples/SchemaSynchronization-Incorporate/index.html)

## All Labs

You can access various labs at [lambdaorm labs](https://github.com/lambda-orm/lambdaorm-labs)

## Related projects

- [Lambda ORM CLI](https://www.npmjs.com/package/lambdaorm-cli): Command line interface for λORM
- [Lambda ORM Service](https://lambda-orm.github.io/wiki/api/index.html): REST service for λORM
- [Client Node](https://www.npmjs.com/package/lambdaorm-client-node): HTTP client for λORM
- [3xpr](https://www.npmjs.com/package/3xpr): Extensible expression engine, which allows evaluating mathematical and logical expressions.
