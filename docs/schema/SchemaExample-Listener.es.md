# Listener en el esquema {#listener-on-schema}

Esta página explica los listeners: expresiones que λORM ejecuta antes o después de una consulta, o cuando esta falla. Se definen en `application.listeners` (ver [Listener](SchemaDefinition.md#listener)).

- **on**: las categorías de consulta que disparan el listener: `select`, `insert`, `upsert`, `update` y `delete`. Una inserción masiva pertenece a la categoría `insert`, y un merge a la categoría `upsert`.
- **condition**: una expresión que decide si el listener se ejecuta.
- **before**, **after** y **error**: las expresiones que se ejecutan antes de la consulta, después de ella o cuando falla.
- **transactional**: si el listener se ejecuta dentro de la transacción de la consulta (por defecto `true`).

## Cómo se ejecutan los listeners {#how-listeners-run}

- `before`, `after` y `error` se ejecutan uno tras otro y **se esperan**: `orm.execute` retorna cuando han
  terminado. Un error en `before` impide la sentencia; un error en `after` la hace fallar (primero se ejecutan los listeners de `error`).
- Se ejecutan **en la transacción de la sentencia**: las llamadas a `orm.execute` de un listener usan las mismas conexiones, y un
  rollback deshace lo que escribieron. Una sentencia con listeners que se ejecuta por sí sola abre una transacción para la sentencia
  y sus listeners, de modo que ambos se aplican por completo o no se aplican.
- El `orm.execute` de un listener puede indicar **otro stage** (`{ stage: "insights" }`): se une a la misma transacción
  (desde @lambdaorm/lib 3.3.0).
- `transactional: false` ejecuta un listener fuera de la transacción: lo que escribe se conserva aunque la transacción
  se revierta (por ejemplo, un registro de auditoría).

En este ejemplo, `touchInstallation` actualiza la instalación de cada archivo insertado en la misma transacción, y `audit` escribe un registro de auditoría que se conserva aunque la transacción se revierta:

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

Los argumentos disponibles en `condition`, `before`, `after` y `error`:

| Parámetro   | Descripción                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| query       | La expresión de consulta que se ejecutó                                                                         |
| data        | Los datos que se enviaron al ejecutar la expresión                                                              |
| options     | Las opciones que se enviaron al ejecutar la expresión                                                           |
| result      | Solo está disponible en el evento after y contiene el resultado de la ejecución de la expresión                 |
| action      | La acción que se ejecutó (select, insert, bulkInsert, update, upsert, merge, bulkMerge, delete, bulkDelete)     |
| type        | El tipo de sentencia que se ejecutó (dql, dml)                                                                  |
| category    | La categoría de la sentencia que se ejecutó (select, insert, update, delete, upsert)                            |
| sentence    | La sentencia que se ejecutó                                                                                     |
| dialect     | El dialecto de la fuente donde se ejecutó la sentencia                                                          |
| source      | La fuente donde se ejecutó la sentencia                                                                         |
| entity      | La entidad afectada por la sentencia                                                                            |
| error       | Solo está disponible en el evento error y contiene el error que se produjo                                      |

## Ejemplo de Listener {#listener-example}

Este ejemplo declara un listener que copia los datos al stage `insights` (patrón CQRS).
Cuando se insertan, actualizan o eliminan registros en el stage `default` o `cqrs`, el listener se ejecuta.
Su expresión `after` ejecuta la misma consulta, con los mismos datos, en el stage `insights`, en la misma transacción que la consulta original: si la escritura en `insights` falla, la original también se revierte.

**Parte del esquema donde se define el listener:**

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

El stage `default` reparte las entidades entre MySQL, PostgreSQL y MongoDB, el stage `insights` guarda todo en otra base de datos PostgreSQL, y el stage `cqrs` lee de `insights` y escribe en las fuentes de `default`.

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

## Laboratorios {#labs}

- [CLI - northwind cqrs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs)
