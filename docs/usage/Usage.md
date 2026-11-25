# Usage

This page shows different ways of using λORM with the same example domain (Northwind) on different infrastructures:
a single source, several sources, CQRS with several stages, and a Node.js client connected to a
[Data Gateway](../data-gateway/index.md).

To keep the schemas short, the properties, keys, indexes and relations of the entities, as well as the mappings, are
omitted. The complete schemas are in the [labs](../labs/index.md).

## Single source

### Schema

The domain has five entities: `Categories`, `Customers`, `Products`, `Orders` and `Orders.details`, where `Orders` is a composite
entity made of the orders and their details.
The infrastructure has a single stage with a single source, `Ordering`, a MySQL database that uses the default
mapping.

```yaml
domain:  
  entities:
  - name: Categories
  - name: Customers
  - name: Products
  - name: Orders
  - name: Orders.details
infrastructure:
  mappings:
  - name: default
  sources:
    - name: Ordering
      mapping: default
      dialect: MySQL
      connection: ${CNN_MYSQL}
  stages:
  - name: default
    sources:
      - name: Ordering
```

### Query

The query gets an order of a customer, with its details. It is written as a lambda expression and run with the
`@lambdaorm/lib` library.

```typescript
import { orm } from '@lambdaorm/lib'
import { Orders } from './northwind/domain/model'

(async () => {
  try {
    // initialize the ORM with the schema file
    await orm.init('./lambdaORM.yaml')
    // query
    const query = (customerId: string) => Orders
      .filter(p => p.customerId == customerId)
      .include(p => [
        p.customer.map(p => p.name),
        p.details
          .include(p => p.product
            .include(p => p.category.map(p => p.name))
            .map(p => p.name))
          .map(p => [p.quantity, p.unitPrice])
      ])
      .page(1, 1)
    // execute the query
    const result = await orm.execute(query, { customerId: 'CENTC' })
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error(error)
  } finally {
    await orm.end()
  }
})()
```

### Result

```json
[
  {
    "id": 12,
    "customerId": "CENTC",
    "orderDate": "1996-07-18T00:00:00.000Z",
    "customer": {
      "name": "Centro comercial Moctezuma"
    },
    "details": [
      {
        "quantity": 10,
        "unitPrice": 8,
        "product": {
          "name": "Sir Rodney's Scones",
          "category": {
            "name": "Confections"
          }
        }
      },
      {
        "quantity": 1,
        "unitPrice": 20.8,
        "product": {
          "name": "Gravad lax",
          "category": {
            "name": "Seafood"
          }
        }
      }
    ]
  }
]
```

## Multiple sources

### Schema

In this case the entities of the domain are stored in different sources:

- `Categories` and `Products` are stored in the `Catalog` source, a MySQL database that uses the default mapping.
- `Customers` is stored in the `Crm` source, a PostgreSQL database that uses the default mapping.
- `Orders` is stored in the `Ordering` source, a MongoDB database that uses the `mongoDb` mapping.

The `condition` of each source in the stage decides which entities it stores.

```yaml
domain:  
  entities:
  - name: Categories
  - name: Customers
  - name: Products
  - name: Orders
  - name: Orders.details
infrastructure:
  mappings:
  - name: default
  - name: mongoDb
    extends: default
  sources:
  - name: Catalog      
    dialect: MySQL
    mapping: default
    connection: ${CNN_MYSQL}      
  - name: Crm    
    dialect: PostgreSQL
    mapping: default
    connection: ${CNN_POSTGRES}
  - name: Ordering
    dialect: MongoDB
    mapping: mongoDb      
    connection: ${CNN_MONGODB}    
  stages:
  - name: default
    sources:
    - name: Catalog
      condition: entity.in(["Categories","Products"])
    - name: Crm
      condition: entity.in(["Address","Customers"])
    - name: Ordering
      condition: entity.in(["Orders","Orders.details"])
```

### Query

This time the query is run from the [CLI](../cli/Commands/Execute.md). The code does not change with the
infrastructure, and the result is the same as in the previous case, although the data now comes from three databases.

```sh
lambdaorm execute -e ".env" -q "Orders.filter(p => p.customerId == customerId).include(p => [p.customer.map(p => p.name), p.details.include(p => p.product.include(p => p.category.map(p => p.name)).map(p => p.name)).map(p => [p.quantity, p.unitPrice])]).page(1,1)" -d "{\"customerId\": \"CENTC\"}"
```

### Result

```json
[
  {
    "id": 12,
    "customerId": "CENTC",
    "orderDate": "1996-07-18T00:00:00.000Z",
    "customer": {
      "name": "Centro comercial Moctezuma"
    },
    "details": [
      {
        "quantity": 10,
        "unitPrice": 8,
        "product": {
          "name": "Sir Rodney's Scones",
          "category": {
            "name": "Confections"
          }
        }
      },
      {
        "quantity": 1,
        "unitPrice": 20.8,
        "product": {
          "name": "Gravad lax",
          "category": {
            "name": "Seafood"
          }
        }
      }
    ]
  }
]
```

[View the complete lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)

## CQRS

[CQRS (Command Query Responsibility Segregation)](https://microservices.io/patterns/data/cqrs.html) separates the
model used to write data from the model used to read it. With λORM it is a matter of configuration.

### Schema

This schema defines three stages for the same domain:

- `default`: data is read from and written to the `Catalog`, `Crm` and `Ordering` sources.
- `insights`: data is read from and written to the `Insights` source.
- `cqrs`: data is read from the `Insights` source but written to the `Catalog`, `Crm` and `Ordering` sources.

To keep `Insights` in step with `Catalog`, `Crm` and `Ordering`, a [listener](../schema/SchemaExample-Listener.md) runs
after each insert, bulk insert, update or delete on the `default` and `cqrs` stages, and applies the same operation on
the `insights` stage.

```yaml
domain:  
  entities:
  - name: Categories
  - name: Customers
  - name: Products
  - name: Orders
  - name: Orders.details
infrastructure:
  mappings:
  - name: default
  - name: mongoDb
    extends: default
  sources:
  - name: Catalog      
    dialect: MySQL
    mapping: default
    connection: ${CNN_MYSQL}      
  - name: Crm    
    dialect: PostgreSQL
    mapping: default
    connection: ${CNN_POSTGRES}
  - name: Ordering
    dialect: MongoDB
    mapping: mongoDb      
    connection: ${CNN_MONGODB}
  - name: Insights    
    dialect: PostgreSQL
    mapping: default
    connection: ${CNN_INSIGHTS}         
  stages:
  - name: default
    sources:
    - name: Catalog
      condition: entity.in(["Categories","Products"])
    - name: Crm
      condition: entity.in(["Address","Customers"])
    - name: Ordering
      condition: entity.in(["Orders","Orders.details"])
  - name: insights
    sources:
    - name: Insights
  - name: cqrs
    sources:
    - name: Insights
      condition: action == "select"
    - name: Catalog
      condition: entity.in(["Categories","Products"])
    - name: Crm
      condition: entity.in(["Address","Customers"])
    - name: Ordering
      condition: entity.in(["Orders","Orders.details"])
application:
  listeners:
    - name: syncInsights
      on: [insert, bulkInsert, update, delete ]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"})        
```

### Query

This time the query is run on a [Data Gateway](../data-gateway/index.md) that serves this schema, through its
[REST API](../data-gateway/Rest.md#execute):

```sh
curl -X POST "http://localhost:8080/execute?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "data": {"customerId": "CENTC"}, "options": {"stage": "default"}}'
```

### Result

```json
[
  {
    "id": 12,
    "customerId": "CENTC",
    "orderDate": "1996-07-18T00:00:00.000+02:00",
    "details": [
      {
        "subTotal": 80,
        "product": {
          "name": "Sir Rodney's Scones"
        }
      },
      {
        "subTotal": 20.8,
        "product": {
          "name": "Gravad lax"
        }
      }
    ],
    "customer": {
      "name": "Centro comercial Moctezuma"
    }
  }
]
```

### Query plan on the default stage

On the `default` stage, the data comes from different sources, according to the configuration of the stage:

```sh
curl -X POST "http://localhost:8080/plan?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "options": {"stage": "default"}}'
```

Result:

```json
{
  "entity": "Orders",
  "dialect": "MongoDB",
  "source": "Ordering",
  "sentence": "[{ \"$match\" : { \"CustomerID\":{{customerId}} } }, { \"$project\" :{ \"_id\": 0 , \"id\":\"$_id\", \"customerId\":\"$CustomerID\", \"orderDate\":\"$OrderDate\", \"__id\":\"$_id\", \"__customerId\":\"$CustomerID\" ,\"details\": { \"$map\":{ \"input\": \"$\\\"Order Details\\\"\", \"in\": { \"subTotal\":{ \"$multiply\" :[\"$$this.Quantity\",\"$$this.UnitPrice\"] }, \"__productId\":\"$$this.ProductID\", \"LambdaOrmParentId\":\"$$this.OrderID\" } }} }} , { \"$sort\" :{ \"OrderDate\":1 } } , { \"$skip\" : 0 }, { \"$limit\" : 1 } , { \"$project\": { \"_id\": 0 } }]",
  "children": [
    {
      "entity": "Orders.details",
      "dialect": "MongoDB",
      "source": "Ordering",
      "children": [
        {
          "entity": "Products",
          "dialect": "MySQL",
          "source": "Catalog",
          "sentence": "SELECT p.ProductName AS name, p.ProductID AS LambdaOrmParentId FROM Products p  WHERE  p.ProductID IN (?) "
        }
      ]
    },
    {
      "entity": "Customers",
      "dialect": "PostgreSQL",
      "source": "Crm",
      "sentence": "SELECT c.CompanyName AS \"name\", c.CustomerID AS \"LambdaOrmParentId\" FROM Customers c  WHERE  c.CustomerID IN ($1) "
    }
  ]
}
```

### Query plan on the cqrs stage

On the `cqrs` stage, a select reads all the data from a single source, `Insights`, according to the configuration of
the stage. An insert, update or delete is executed on the corresponding source (`Catalog`, `Crm` or `Ordering`).

```sh
curl -X POST "http://localhost:8080/plan?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "options": {"stage": "cqrs"}}'
```

Result:

```json
{
  "entity": "Orders",
  "dialect": "PostgreSQL",
  "source": "Insights",
  "sentence": "SELECT o.OrderID AS \"id\", o.CustomerID AS \"customerId\", o.OrderDate AS \"orderDate\", o.OrderID AS \"__id\", o.CustomerID AS \"__customerId\" FROM Orders o  WHERE o.CustomerID = $1 ORDER BY o.OrderDate asc  OFFSET 0 LIMIT 1 ",
  "children": [
    {
      "entity": "Orders.details",
      "dialect": "PostgreSQL",
      "source": "Insights",
      "sentence": "SELECT (o1.Quantity * o1.UnitPrice) AS \"subTotal\", o1.ProductID AS \"__productId\", o1.OrderID AS \"LambdaOrmParentId\" FROM \"Order Details\" o1  WHERE  o1.OrderID IN ($1) ",
      "children": [
        {
          "entity": "Products",
          "dialect": "PostgreSQL",
          "source": "Insights",
          "sentence": "SELECT p.ProductName AS \"name\", p.ProductID AS \"LambdaOrmParentId\" FROM Products p  WHERE  p.ProductID IN ($1) "
        }
      ]
    },
    {
      "entity": "Customers",
      "dialect": "PostgreSQL",
      "source": "Insights",
      "sentence": "SELECT c.CompanyName AS \"name\", c.CustomerID AS \"LambdaOrmParentId\" FROM Customers c  WHERE  c.CustomerID IN ($1) "
    }
  ]
}
```


## CQRS with Kafka

When the schema is served by a [Data Gateway](../data-gateway/index.md), the synchronization can go through Kafka
instead: the listener publishes the inserts, updates and deletes of the `default` and `cqrs` stages to a topic with
`queue.send`, and a consumer applies them on the `insights` stage. The queue is configured in
`infrastructure.queue` (`config` is the [kafkajs](https://kafka.js.org/docs/configuration) configuration); see
[execute-queued](../data-gateway/Rest.md#execute-queued).

### Schema

```yaml
...
infrastructure:
  ...
  queue: 
    config: $QUEUE_CONFIG
    consumers:
      - name: syncInsights
        config:
          groupId: group1
        subscribe:
          topic: insights-sync
          fromBeginning: true
        execute: orm.execute(message.query,message.data, {stage:"insights"})    
application:
  listeners:
    - name: syncInsights
      on: [insert, bulkInsert, update, delete ]
      condition: options.stage.in("default","cqrs")
      after: queue.send("insights-sync",[{query,data}]) 
```


## Node.js client

### Schema

With a client, the local schema only defines the domain, the URL of the Data Gateway and the paths where
`lambdaorm build -l client-node` generates the model; the sources and their connections belong to the schema served
by the [Data Gateway](../data-gateway/index.md). [`lambdaorm init -u <url>`](../cli/Commands/Init.md) creates this
schema with the domain read from the gateway.

```yaml
domain:  
  entities:
  - name: Categories
  - name: Customers
  - name: Products
  - name: Orders
  - name: Orders.details
infrastructure:
  service:
    url: http://localhost:8080
  paths:
    src: src
    domain: northwind/domain
```

### Query

This time the query runs through the [Node.js client](../data-gateway/Clients.md) (`@lambdaorm/client`), which
connects to a Data Gateway, and it is written as a string. Here the gateway serves a single schema at the root, so the
URL is the gateway's; otherwise it includes the route of the schema (for example `http://localhost:8080/northwind`).

```typescript
import { orm } from '@lambdaorm/client'
import fs from 'fs'
import path from 'path'

(async () => {
  try {
    await orm.init('http://localhost:8080', { headers: { 'X-Api-Key': process.env.BACKEND_KEY } })
    // test the connection
    console.log(await orm.general.ping())
    // import the data of the data.json file
    const content = fs.readFileSync(path.join(__dirname, '../data.json'), 'utf-8')
    await orm.stage.import('default', JSON.parse(content))
    // query as a string
    const query = `Orders
      .filter(p => p.customerId == customerId)
      .include(p => [
        p.customer.map(p => p.name),
        p.details
          .include(p => p.product
            .include(p => p.category.map(p => p.name))
            .map(p => p.name))
          .map(p => [p.quantity, p.unitPrice])
      ])`
    // get the execution plan
    const plan = await orm.plan(query, { stage: 'default' })
    console.log(JSON.stringify(plan, null, 2))
    // execute the query
    const result = await orm.execute(query, { customerId: 'CENTC' }, { stage: 'default' })
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error(error)
  } finally {
    await orm.end()
  }
})()
```

## Considerations

- With both `@lambdaorm/lib` and `@lambdaorm/client`, queries can be written as lambda expressions or as strings.
- Queries are written against the domain model and do not depend on the infrastructure. A project can start with a
  simple infrastructure and change it later without touching the code.
- Development, test and production environments can have different infrastructures (stages) with the same code.

Many other use cases can be solved by configuring the schema and writing queries. Explore the
[labs](../labs/index.md) and the rest of this documentation.
