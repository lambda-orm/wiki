# Uso {#usage}

Esta página mostra diferentes formas de usar o λORM com o mesmo domínio de exemplo (Northwind) em diferentes
infraestruturas: uma única fonte, várias fontes, CQRS com vários stages e um cliente Node.js conectado a um
[Data Gateway](../data-gateway/index.md).

Para manter os esquemas curtos, as propriedades, chaves, índices e relações das entidades, assim como os mapeamentos,
foram omitidos. Os esquemas completos estão nos [labs](../labs/index.md).

## Fonte única {#single-source}

### Esquema {#schema}

O domínio tem cinco entidades: `Categories`, `Customers`, `Products`, `Orders` e `Orders.details`, onde `Orders` é uma entidade
composta formada pelos pedidos e seus detalhes.
A infraestrutura tem um único stage com uma única fonte, `Ordering`, um banco de dados MySQL que usa o mapeamento
padrão.

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

A consulta obtém um pedido de um cliente, com seus detalhes. Ela é escrita como uma expressão lambda e executada com a
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

## Várias fontes {#multiple-sources}

### Esquema {#schema_1}

Neste caso, as entidades do domínio são armazenadas em fontes diferentes:

- `Categories` e `Products` são armazenadas na fonte `Catalog`, um banco de dados MySQL que usa o mapeamento padrão.
- `Customers` é armazenada na fonte `Crm`, um banco de dados PostgreSQL que usa o mapeamento padrão.
- `Orders` é armazenada na fonte `Ordering`, um banco de dados MongoDB que usa o mapeamento `mongoDb`.

A `condition` de cada fonte no stage decide quais entidades ela armazena.

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

Desta vez, a consulta é executada a partir da [CLI](../cli/Commands/Execute.md). O código não muda com a
infraestrutura, e o resultado é o mesmo do caso anterior, embora os dados agora venham de três bancos de dados.

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

[Ver o lab completo](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)

## CQRS {#cqrs}

O [CQRS (Command Query Responsibility Segregation)](https://microservices.io/patterns/data/cqrs.html) separa o
modelo usado para escrever os dados do modelo usado para lê-los. Com o λORM, é uma questão de configuração.

### Esquema {#schema_2}

Este esquema define três stages para o mesmo domínio:

- `default`: os dados são lidos das fontes `Catalog`, `Crm` e `Ordering` e escritos nelas.
- `insights`: os dados são lidos da fonte `Insights` e escritos nela.
- `cqrs`: os dados são lidos da fonte `Insights`, mas escritos nas fontes `Catalog`, `Crm` e `Ordering`.

Para manter `Insights` em sincronia com `Catalog`, `Crm` e `Ordering`, um [listener](../schema/SchemaExample-Listener.md)
é executado após cada insert, bulk insert, update ou delete nos stages `default` e `cqrs`, e aplica a mesma operação no
stage `insights`.

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

Desta vez, a consulta é executada em um [Data Gateway](../data-gateway/index.md) que serve este esquema, por meio da
sua [API REST](../data-gateway/Rest.md#execute):

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

### Plano da consulta no stage default {#query-plan-on-the-default-stage}

No stage `default`, os dados vêm de fontes diferentes, de acordo com a configuração do stage:

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

### Plano da consulta no stage cqrs {#query-plan-on-the-cqrs-stage}

No stage `cqrs`, um select lê todos os dados de uma única fonte, `Insights`, de acordo com a configuração do stage.
Um insert, update ou delete é executado na fonte correspondente (`Catalog`, `Crm` ou `Ordering`).

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


## CQRS com Kafka {#cqrs-with-kafka}

Quando o esquema é servido por um [Data Gateway](../data-gateway/index.md), a sincronização pode passar pelo Kafka:
o listener publica os inserts, updates e deletes dos stages `default` e `cqrs` em um tópico com `queue.send`, e um
consumidor os aplica no stage `insights`. A fila é configurada em `infrastructure.queue` (`config` é a configuração do
[kafkajs](https://kafka.js.org/docs/configuration)); veja [execute-queued](../data-gateway/Rest.md#execute-queued).

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


## Cliente Node.js {#nodejs-client}

### Esquema {#schema_4}

Com um cliente, o esquema local define apenas o domínio, a URL do Data Gateway e os caminhos onde
`lambdaorm build -l client-node` gera o modelo; as fontes e suas conexões pertencem ao esquema servido pelo
[Data Gateway](../data-gateway/index.md). [`lambdaorm init -u <url>`](../cli/Commands/Init.md) cria este esquema com o
domínio lido do gateway.

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

Desta vez, a consulta é executada por meio do [cliente Node.js](../data-gateway/Clients.md) (`@lambdaorm/client`), que
se conecta a um Data Gateway, e é escrita como uma string. Aqui o gateway serve um único esquema na raiz, então a URL
é a do gateway; caso contrário, ela inclui a rota do esquema (por exemplo `http://localhost:8080/northwind`).

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

## Considerações {#considerations}

- Tanto com `@lambdaorm/lib` quanto com `@lambdaorm/client`, as consultas podem ser escritas como expressões lambda ou
  como strings.
- As consultas são escritas sobre o modelo do domínio e não dependem da infraestrutura. Um projeto pode começar com uma
  infraestrutura simples e alterá-la depois sem mexer no código.
- Os ambientes de desenvolvimento, teste e produção podem ter infraestruturas diferentes (stages) com o mesmo código.

Muitos outros casos de uso podem ser resolvidos configurando o esquema e escrevendo consultas. Explore os
[labs](../labs/index.md) e o restante desta documentação.
