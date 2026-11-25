# Verwendung {#usage}

Diese Seite zeigt verschiedene Möglichkeiten, λORM mit derselben Beispieldomäne (Northwind) auf unterschiedlichen Infrastrukturen zu verwenden:
eine einzelne Quelle, mehrere Quellen, CQRS mit mehreren Stages und ein Node.js-Client, der mit einem
[Data Gateway](../data-gateway/index.md) verbunden ist.

Um die Schemas kurz zu halten, werden die Eigenschaften, Schlüssel, Indizes und Beziehungen der Entitäten sowie die Mappings
weggelassen. Die vollständigen Schemas finden Sie in den [Labs](../labs/index.md).

## Einzelne Quelle {#single-source}

### Schema {#schema}

Die Domäne hat fünf Entitäten: `Categories`, `Customers`, `Products`, `Orders` und `Orders.details`, wobei `Orders` eine zusammengesetzte
Entität aus den Bestellungen und ihren Positionen ist.
Die Infrastruktur hat einen einzigen Stage mit einer einzigen Quelle, `Ordering`, einer MySQL-Datenbank, die das Standard-Mapping
verwendet.

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

### Abfrage {#query}

Die Abfrage liefert eine Bestellung eines Kunden mit ihren Positionen. Sie ist als Lambda-Ausdruck geschrieben und wird mit der
Bibliothek `@lambdaorm/lib` ausgeführt.

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

### Ergebnis {#result}

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

## Mehrere Quellen {#multiple-sources}

### Schema {#schema_1}

In diesem Fall werden die Entitäten der Domäne in verschiedenen Quellen gespeichert:

- `Categories` und `Products` werden in der Quelle `Catalog` gespeichert, einer MySQL-Datenbank, die das Standard-Mapping verwendet.
- `Customers` wird in der Quelle `Crm` gespeichert, einer PostgreSQL-Datenbank, die das Standard-Mapping verwendet.
- `Orders` wird in der Quelle `Ordering` gespeichert, einer MongoDB-Datenbank, die das Mapping `mongoDb` verwendet.

Die `condition` jeder Quelle im Stage legt fest, welche Entitäten sie speichert.

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

### Abfrage {#query_1}

Diesmal wird die Abfrage über die [CLI](../cli/Commands/Execute.md) ausgeführt. Der Code ändert sich mit der
Infrastruktur nicht, und das Ergebnis ist dasselbe wie im vorherigen Fall, obwohl die Daten nun aus drei Datenbanken stammen.

```sh
lambdaorm execute -e ".env" -q "Orders.filter(p => p.customerId == customerId).include(p => [p.customer.map(p => p.name), p.details.include(p => p.product.include(p => p.category.map(p => p.name)).map(p => p.name)).map(p => [p.quantity, p.unitPrice])]).page(1,1)" -d "{\"customerId\": \"CENTC\"}"
```

### Ergebnis {#result_1}

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

[Das vollständige Lab ansehen](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)

## CQRS {#cqrs}

[CQRS (Command Query Responsibility Segregation)](https://microservices.io/patterns/data/cqrs.html) trennt das
Modell zum Schreiben von Daten von dem Modell zum Lesen. Mit λORM ist das eine Frage der Konfiguration.

### Schema {#schema_2}

Dieses Schema definiert drei Stages für dieselbe Domäne:

- `default`: Daten werden aus den Quellen `Catalog`, `Crm` und `Ordering` gelesen und in sie geschrieben.
- `insights`: Daten werden aus der Quelle `Insights` gelesen und in sie geschrieben.
- `cqrs`: Daten werden aus der Quelle `Insights` gelesen, aber in die Quellen `Catalog`, `Crm` und `Ordering` geschrieben.

Um `Insights` mit `Catalog`, `Crm` und `Ordering` synchron zu halten, läuft ein [Listener](../schema/SchemaExample-Listener.md)
nach jedem Insert, Bulk-Insert, Update oder Delete auf den Stages `default` und `cqrs` und wendet dieselbe Operation auf
den Stage `insights` an.

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

### Abfrage {#query_2}

Diesmal wird die Abfrage auf einem [Data Gateway](../data-gateway/index.md), das dieses Schema bereitstellt, über seine
[REST-API](../data-gateway/Rest.md#execute) ausgeführt:

```sh
curl -X POST "http://localhost:8080/execute?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "data": {"customerId": "CENTC"}, "options": {"stage": "default"}}'
```

### Ergebnis {#result_2}

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

### Abfrageplan auf dem Stage default {#query-plan-on-the-default-stage}

Auf dem Stage `default` stammen die Daten gemäß der Konfiguration des Stages aus verschiedenen Quellen:

```sh
curl -X POST "http://localhost:8080/plan?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "options": {"stage": "default"}}'
```

Ergebnis:

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

### Abfrageplan auf dem Stage cqrs {#query-plan-on-the-cqrs-stage}

Auf dem Stage `cqrs` liest ein Select gemäß der Konfiguration des Stages alle Daten aus einer einzigen Quelle, `Insights`.
Ein Insert, Update oder Delete wird auf der entsprechenden Quelle (`Catalog`, `Crm` oder `Ordering`) ausgeführt.

```sh
curl -X POST "http://localhost:8080/plan?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "options": {"stage": "cqrs"}}'
```

Ergebnis:

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


## CQRS mit Kafka {#cqrs-with-kafka}

Wenn das Schema von einem [Data Gateway](../data-gateway/index.md) bereitgestellt wird, kann die Synchronisierung stattdessen über Kafka
laufen: Der Listener veröffentlicht die Inserts, Updates und Deletes der Stages `default` und `cqrs` mit
`queue.send` in einem Topic, und ein Consumer wendet sie auf den Stage `insights` an. Die Queue wird in
`infrastructure.queue` konfiguriert (`config` ist die [kafkajs](https://kafka.js.org/docs/configuration)-Konfiguration); siehe
[execute-queued](../data-gateway/Rest.md#execute-queued).

### Schema {#schema_3}

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


## Node.js-Client {#nodejs-client}

### Schema {#schema_4}

Mit einem Client definiert das lokale Schema nur die Domäne, die URL des Data Gateway und die Pfade, in denen
`lambdaorm build -l client-node` das Modell erzeugt; die Quellen und ihre Verbindungen gehören zu dem Schema, das
vom [Data Gateway](../data-gateway/index.md) bereitgestellt wird. [`lambdaorm init -u <url>`](../cli/Commands/Init.md) erstellt dieses
Schema mit der vom Gateway gelesenen Domäne.

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

### Abfrage {#query_3}

Diesmal läuft die Abfrage über den [Node.js-Client](../data-gateway/Clients.md) (`@lambdaorm/client`), der sich
mit einem Data Gateway verbindet, und sie ist als Zeichenfolge geschrieben. Hier stellt das Gateway ein einziges Schema im Stammpfad bereit, daher ist die
URL die des Gateways; andernfalls enthält sie die Route des Schemas (zum Beispiel `http://localhost:8080/northwind`).

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

## Überlegungen {#considerations}

- Sowohl mit `@lambdaorm/lib` als auch mit `@lambdaorm/client` können Abfragen als Lambda-Ausdrücke oder als Zeichenfolgen geschrieben werden.
- Abfragen werden gegen das Domänenmodell geschrieben und hängen nicht von der Infrastruktur ab. Ein Projekt kann mit einer
  einfachen Infrastruktur beginnen und sie später ändern, ohne den Code anzufassen.
- Entwicklungs-, Test- und Produktionsumgebungen können mit demselben Code unterschiedliche Infrastrukturen (Stages) haben.

Viele weitere Anwendungsfälle lassen sich durch Konfiguration des Schemas und das Schreiben von Abfragen lösen. Erkunden Sie die
[Labs](../labs/index.md) und den Rest dieser Dokumentation.
