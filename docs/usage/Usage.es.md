# Uso {#usage}

Esta página muestra distintas formas de usar λORM con el mismo dominio de ejemplo (Northwind) sobre distintas
infraestructuras: una sola fuente, varias fuentes, CQRS con varios stages y un cliente de Node.js conectado a un
[Data Gateway](../data-gateway/index.md).

Para que los esquemas sean breves, se omiten las propiedades, claves, índices y relaciones de las entidades, así como
los mappings. Los esquemas completos están en los [labs](../labs/index.md).

## Una sola fuente {#single-source}

### Esquema {#schema}

El dominio tiene cinco entidades: `Categories`, `Customers`, `Products`, `Orders` y `Orders.details`, donde `Orders` es una entidad
compuesta formada por los pedidos y sus detalles.
La infraestructura tiene un único stage con una única fuente, `Ordering`, una base de datos MySQL que usa el mapping
por defecto.

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

### Consulta {#query}

La consulta obtiene un pedido de un cliente, con sus detalles. Se escribe como una expresión lambda y se ejecuta con la
biblioteca `@lambdaorm/lib`.

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

### Resultado {#result}

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

## Varias fuentes {#multiple-sources}

### Esquema {#schema_1}

En este caso las entidades del dominio se almacenan en fuentes distintas:

- `Categories` y `Products` se almacenan en la fuente `Catalog`, una base de datos MySQL que usa el mapping por defecto.
- `Customers` se almacena en la fuente `Crm`, una base de datos PostgreSQL que usa el mapping por defecto.
- `Orders` se almacena en la fuente `Ordering`, una base de datos MongoDB que usa el mapping `mongoDb`.

La `condition` de cada fuente en el stage decide qué entidades almacena.

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

### Consulta {#query_1}

Esta vez la consulta se ejecuta desde la [CLI](../cli/Commands/Execute.md). El código no cambia con la
infraestructura, y el resultado es el mismo que en el caso anterior, aunque ahora los datos vienen de tres bases de datos.

```sh
lambdaorm execute -e ".env" -q "Orders.filter(p => p.customerId == customerId).include(p => [p.customer.map(p => p.name), p.details.include(p => p.product.include(p => p.category.map(p => p.name)).map(p => p.name)).map(p => [p.quantity, p.unitPrice])]).page(1,1)" -d "{\"customerId\": \"CENTC\"}"
```

### Resultado {#result_1}

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

[Ver el lab completo](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)

## CQRS {#cqrs}

[CQRS (Command Query Responsibility Segregation)](https://microservices.io/patterns/data/cqrs.html) separa el modelo
que se usa para escribir los datos del modelo que se usa para leerlos. Con λORM es una cuestión de configuración.

### Esquema {#schema_2}

Este esquema define tres stages para el mismo dominio:

- `default`: los datos se leen de las fuentes `Catalog`, `Crm` y `Ordering`, y se escriben en ellas.
- `insights`: los datos se leen de la fuente `Insights` y se escriben en ella.
- `cqrs`: los datos se leen de la fuente `Insights`, pero se escriben en las fuentes `Catalog`, `Crm` y `Ordering`.

Para mantener `Insights` al día con `Catalog`, `Crm` y `Ordering`, un [listener](../schema/SchemaExample-Listener.md) se
ejecuta después de cada insert, bulk insert, update o delete en los stages `default` y `cqrs`, y aplica la misma
operación en el stage `insights`.

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

### Consulta {#query_2}

Esta vez la consulta se ejecuta en un [Data Gateway](../data-gateway/index.md) que sirve este esquema, a través de su
[API REST](../data-gateway/Rest.md#execute):

```sh
curl -X POST "http://localhost:8080/execute?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "data": {"customerId": "CENTC"}, "options": {"stage": "default"}}'
```

### Resultado {#result_2}

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

### Plan de la consulta en el stage default {#query-plan-on-the-default-stage}

En el stage `default`, los datos vienen de fuentes distintas, según la configuración del stage:

```sh
curl -X POST "http://localhost:8080/plan?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "options": {"stage": "default"}}'
```

Resultado:

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

### Plan de la consulta en el stage cqrs {#query-plan-on-the-cqrs-stage}

En el stage `cqrs`, un select lee todos los datos de una única fuente, `Insights`, según la configuración del stage.
Un insert, update o delete se ejecuta en la fuente correspondiente (`Catalog`, `Crm` u `Ordering`).

```sh
curl -X POST "http://localhost:8080/plan?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"query": "Orders.filter(p=>p.customerId==customerId).include(p=>[p.details.include(p=>p.product.map(p=>p.name)).map(p=>{subTotal:p.quantity*p.unitPrice}),p.customer.map(p=>p.name)]).sort(p=>p.orderDate).page(1,1)", "options": {"stage": "cqrs"}}'
```

Resultado:

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


## CQRS con Kafka {#cqrs-with-kafka}

Cuando el esquema lo sirve un [Data Gateway](../data-gateway/index.md), la sincronización puede pasar por Kafka: el
listener publica los inserts, updates y deletes de los stages `default` y `cqrs` en un topic con `queue.send`, y un
consumidor los aplica en el stage `insights`. La cola se configura en `infrastructure.queue` (`config` es la
configuración de [kafkajs](https://kafka.js.org/docs/configuration)); ver
[execute-queued](../data-gateway/Rest.md#execute-queued).

### Esquema {#schema_3}

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


## Cliente de Node.js {#nodejs-client}

### Esquema {#schema_4}

Con un cliente, el esquema local solo define el dominio, la URL del Data Gateway y las rutas donde
`lambdaorm build -l client-node` genera el modelo; las fuentes y sus conexiones pertenecen al esquema que sirve el
[Data Gateway](../data-gateway/index.md). [`lambdaorm init -u <url>`](../cli/Commands/Init.md) crea este esquema con el
dominio leído del gateway.

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

### Consulta {#query_3}

Esta vez la consulta se ejecuta a través del [cliente de Node.js](../data-gateway/Clients.md) (`@lambdaorm/client`), que
se conecta a un Data Gateway, y se escribe como una cadena. Aquí el gateway sirve un único esquema en la raíz, así que
la URL es la del gateway; si no, incluye la ruta del esquema (por ejemplo `http://localhost:8080/northwind`).

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

## Consideraciones {#considerations}

- Tanto con `@lambdaorm/lib` como con `@lambdaorm/client`, las consultas se pueden escribir como expresiones lambda o
  como cadenas.
- Las consultas se escriben contra el modelo del dominio y no dependen de la infraestructura. Un proyecto puede empezar
  con una infraestructura sencilla y cambiarla más adelante sin tocar el código.
- Los entornos de desarrollo, pruebas y producción pueden tener infraestructuras (stages) distintas con el mismo código.

Muchos otros casos de uso se pueden resolver configurando el esquema y escribiendo consultas. Se pueden explorar los
[labs](../labs/index.md) y el resto de esta documentación.
