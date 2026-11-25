# Listener no esquema {#listener-on-schema}

Esta página explica os listeners: expressões que o λORM executa antes ou depois de uma consulta, ou quando ela falha. Eles são definidos em `application.listeners` (veja [Listener](SchemaDefinition.md#listener)).

- **on**: as categorias de consulta que disparam o listener: `select`, `insert`, `upsert`, `update` e `delete`. Um bulk insert pertence à categoria `insert`, e um merge à categoria `upsert`.
- **condition**: uma expressão que decide se o listener é executado.
- **before**, **after** e **error**: as expressões a executar antes da consulta, depois dela ou quando ela falha.
- **transactional**: se o listener é executado dentro da transação da consulta (padrão `true`).

## Como os listeners são executados {#how-listeners-run}

- `before`, `after` e `error` são executados um após o outro e **são aguardados**: `orm.execute` retorna quando eles
  terminam. Um erro em `before` impede a sentença; um erro em `after` a faz falhar (os listeners `error` são executados antes).
- Eles são executados **na transação da sentença**: as chamadas `orm.execute` de um listener usam as mesmas conexões, e um
  rollback desfaz o que eles gravaram. Uma sentença com listeners executada isoladamente abre uma transação para a sentença
  e seus listeners, de modo que ambos são tudo ou nada.
- O `orm.execute` de um listener pode indicar **outro stage** (`{ stage: "insights" }`): ele participa da mesma transação
  (desde o @lambdaorm/lib 3.3.0).
- `transactional: false` executa um listener fora da transação: o que ele grava é mantido mesmo que a transação
  sofra rollback (por exemplo, um log de auditoria).

Neste exemplo, `touchInstallation` atualiza a instalação de cada arquivo inserido na mesma transação, e `audit` grava um log de auditoria que é mantido mesmo que a transação sofra rollback:

```yaml
application:
  listeners:
    - name: touchInstallation
      on: [insert]
      condition: entity == "InstallationFiles"
      after: >-
        orm.execute("Installations.update(p => ({ lastEventAt: at })).filter(p => p.id == id)",
          { id: data.installationId, at: data.uploadedAt })
    - name: audit
      on: [insert, update, delete]
      transactional: false
      after: orm.execute("AuditLogs.insert()", { entity: entity, action: action })
```

## Argumentos {#arguments}

Os argumentos disponíveis em `condition`, `before`, `after` e `error`:

| Parâmetro   | Descrição                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| query       | A expressão da consulta que foi executada                                                                       |
| data        | Os dados enviados quando a expressão foi executada                                                              |
| options     | As opções enviadas quando a expressão foi executada                                                             |
| context     | O [contexto](Context.md) de quem a executa (`options.context`)                                                  |
| result      | Disponível apenas no evento after; contém o resultado da execução da expressão                                  |
| action      | A ação que foi executada (select, insert, bulkInsert, update, upsert, merge, bulkMerge, delete, bulkDelete)     |
| type        | O tipo de sentença que foi executada (dql, dml)                                                                 |
| category    | A categoria da sentença que foi executada (select, insert, update, delete, upsert)                              |
| sentence    | A sentença que foi executada                                                                                    |
| dialect     | O dialeto da fonte onde a sentença foi executada                                                                |
| source      | A fonte onde a sentença foi executada                                                                           |
| entity      | A entidade afetada pela sentença                                                                                |
| error       | Disponível apenas no evento error; contém o erro que ocorreu                                                    |

## Exemplo de listener {#listener-example}

Este exemplo declara um listener que copia os dados para o stage `insights` (padrão CQRS).
Quando registros são inseridos, atualizados ou excluídos no stage `default` ou `cqrs`, o listener é executado.
Sua expressão `after` executa a mesma consulta, com os mesmos dados, no stage `insights`, na mesma transação da consulta original: se a gravação em `insights` falhar, a original também sofre rollback.

**Parte do esquema onde o listener é definido:**

```yaml
...
application:
  listeners:
    - name: syncInsights
      on: [insert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"}) 
```

**Esquema completo:**

O stage `default` distribui as entidades entre MySQL, PostgreSQL e MongoDB, o stage `insights` armazena tudo em outro banco de dados PostgreSQL, e o stage `cqrs` lê de `insights` e grava nas fontes de `default`.

```yaml
domain:  
  enums:
  entities:
  - name: Address
    abstract: true
    indexes:
    - name: postalCode
      fields: ["postalCode"]
    - name: region
      fields: ["region", "country"]
    - name: city
      fields: ["city"]
    properties:
    - name: address
    - name: city
    - name: region
    - name: postalCode
      length: 20
    - name: country
  - name: Categories
    primaryKey: ["id"]
    uniqueKey: ["name"]
    properties:
    - name: id
      type: integer
      required: true
      autoIncrement: true
    - name: name
      required: true
  - name: Customers
    extends: Address
    primaryKey: ["id"]
    indexes:
    - name: name
      fields: ["name"]
    properties:
    - name: id
      length: 5
      required: true
    - name: name
      required: true
  - name: Products
    primaryKey: ["id"]
    uniqueKey: ["name", "supplierId"]
    properties:
    - name: id
      type: integer
      required: true
      autoIncrement: true
    - name: name
      required: true
    - name: categoryId
      type: integer
    - name: quantity
    - name: price
      type: decimal
      default: 0
    relations:
    - name: category
      from: categoryId
      entity: Categories
      to: id
      target: products
  - name: Orders
    primaryKey: ["id"]
    indexes:
    - name: orderDate
      fields: ["orderDate"]
    properties:
    - name: id
      type: integer
      required: true
      autoIncrement: true
    - name: customerId
      required: true
      length: 5
    - name: orderDate
      type: dateTime 
    relations:
    - name: customer
      from: customerId
      entity: Customers
      to: id
      target: orders
  - name: Orders.details
    primaryKey: ["orderId", "productId"]
    properties:
    - name: orderId
      required: true
      type: integer
    - name: productId
      required: true
      type: integer
    - name: unitPrice
      type: decimal
    - name: quantity
      type: decimal
    relations:
    - name: order
      from: orderId
      entity: Orders
      to: id
      target: details
    - name: product
      from: productId
      entity: Products
      to: id
      target: orderDetails
infrastructure:
  views:
  - name: default  
  mappings:
  - name: default
    entities:
    - name: Address
      abstract: true
      properties:
      - name: address
        mapping: Address
      - name: city
        mapping: City
      - name: region
        mapping: Region
      - name: postalCode
        mapping: PostalCode
      - name: country
        mapping: Country
    - name: Categories
      mapping: Categories
      properties:
      - name: id
        mapping: CategoryID
      - name: name
        mapping: CategoryName
    - name: Customers
      extends: Address
      mapping: Customers
      properties:
      - name: id
        mapping: CustomerID
      - name: name
        mapping: CompanyName
    - name: Products
      mapping: Products
      properties:
      - name: id
        mapping: ProductID
      - name: name
        mapping: ProductName
      - name: categoryId
        mapping: CategoryID
      - name: quantity
        mapping: QuantityPerUnit
      - name: price
        mapping: UnitPrice
    - name: Orders
      mapping: Orders
      properties:
      - name: id
        mapping: OrderID
      - name: customerId
        mapping: CustomerID
      - name: orderDate
        mapping: OrderDate
    - name: Orders.details
      mapping: Order Details
      properties:
      - name: orderId
        mapping: OrderID
      - name: productId
        mapping: ProductID
      - name: unitPrice
        mapping: UnitPrice
      - name: quantity
        mapping: Quantity
  - name: mongoDb
    extends: default
    entities:
      - name: Orders
        sequence: SQ_ORDERS
        properties:
          - name: id
            mapping: _id
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
      on: [insert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"}) 
```

## Laboratórios {#labs}

- [CLI - northwind cqrs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs)
