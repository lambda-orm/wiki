# Listener im Schema {#listener-on-schema}

Diese Seite erklärt Listener: Ausdrücke, die λORM vor oder nach einer Abfrage oder bei deren Fehlschlag ausführt. Sie werden in `application.listeners` definiert (siehe [Listener](SchemaDefinition.md#listener)).

- **on**: die Abfragekategorien, die den Listener auslösen: `select`, `insert`, `upsert`, `update` und `delete`. Ein Bulk-Insert gehört zur Kategorie `insert`, ein Merge zur Kategorie `upsert`.
- **condition**: ein Ausdruck, der entscheidet, ob der Listener ausgeführt wird.
- **before**, **after** und **error**: die Ausdrücke, die vor der Abfrage, danach oder bei ihrem Fehlschlag ausgeführt werden.
- **transactional**: ob der Listener innerhalb der Transaktion der Abfrage ausgeführt wird (Standard `true`).

## Wie Listener ausgeführt werden {#how-listeners-run}

- `before`, `after` und `error` werden nacheinander ausgeführt und **es wird auf sie gewartet**: `orm.execute` kehrt zurück, wenn sie
  abgeschlossen sind. Ein Fehler in `before` verhindert die Anweisung; ein Fehler in `after` lässt sie fehlschlagen (zuvor werden die `error`-Listener ausgeführt).
- Sie laufen **in der Transaktion der Anweisung**: Die `orm.execute`-Aufrufe eines Listeners verwenden dieselben Verbindungen, und ein
  Rollback macht rückgängig, was sie geschrieben haben. Eine Anweisung mit Listenern, die für sich allein ausgeführt wird, öffnet eine Transaktion für die Anweisung
  und ihre Listener, sodass beide nach dem Alles-oder-nichts-Prinzip ausgeführt werden.
- Das `orm.execute` eines Listeners kann **einen anderen Stage** angeben (`{ stage: "insights" }`): Es tritt derselben Transaktion bei
  (ab @lambdaorm/lib 3.3.0).
- `transactional: false` führt einen Listener außerhalb der Transaktion aus: Was er schreibt, bleibt erhalten, auch wenn die Transaktion
  zurückgerollt wird (zum Beispiel ein Audit-Log).

In diesem Beispiel aktualisiert `touchInstallation` die Installation jeder eingefügten Datei in derselben Transaktion, und `audit` schreibt ein Audit-Log, das erhalten bleibt, auch wenn die Transaktion zurückgerollt wird:

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

## Argumente {#arguments}

Die in `condition`, `before`, `after` und `error` verfügbaren Argumente:

| Parameter   | Beschreibung                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| query       | Der ausgeführte Abfrageausdruck                                                                                 |
| data        | Die beim Ausführen des Ausdrucks übergebenen Daten                                                              |
| options     | Die beim Ausführen des Ausdrucks übergebenen Optionen                                                           |
| result      | Nur im after-Ereignis verfügbar; enthält das Ergebnis der Ausführung des Ausdrucks                              |
| action      | Die ausgeführte Aktion (select, insert, bulkInsert, update, upsert, merge, bulkMerge, delete, bulkDelete)        |
| type        | Der Typ der ausgeführten Anweisung (dql, dml)                                                                   |
| category    | Die Kategorie der ausgeführten Anweisung (select, insert, update, delete, upsert)                               |
| sentence    | Die ausgeführte Anweisung                                                                                       |
| dialect     | Der Dialekt der Quelle, auf der die Anweisung ausgeführt wurde                                                  |
| source      | Die Quelle, auf der die Anweisung ausgeführt wurde                                                              |
| entity      | Die von der Anweisung betroffene Entität                                                                        |
| error       | Nur im error-Ereignis verfügbar; enthält den aufgetretenen Fehler                                               |

## Listener-Beispiel {#listener-example}

Dieses Beispiel deklariert einen Listener, der die Daten auf den Stage `insights` kopiert (CQRS-Muster).
Wenn auf dem Stage `default` oder `cqrs` Datensätze eingefügt, aktualisiert oder gelöscht werden, wird der Listener ausgeführt.
Sein `after`-Ausdruck führt dieselbe Abfrage mit denselben Daten auf dem Stage `insights` aus, in derselben Transaktion wie die ursprüngliche Abfrage: Schlägt das Schreiben in `insights` fehl, wird auch das ursprüngliche zurückgerollt.

**Teil des Schemas, in dem der Listener definiert ist:**

```yaml
...
application:
  listeners:
    - name: syncInsights
      on: [insert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"}) 
```

**Vollständiges Schema:**

Der Stage `default` verteilt die Entitäten auf MySQL, PostgreSQL und MongoDB, der Stage `insights` speichert alles in einer anderen PostgreSQL-Datenbank, und der Stage `cqrs` liest aus `insights` und schreibt in die Quellen von `default`.

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

## Labs {#labs}

- [CLI – northwind cqrs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs)
