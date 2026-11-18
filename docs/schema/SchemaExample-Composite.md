# Composite Example

This page shows a composite entity, `Orders.details`, stored in MongoDB on one stage and in PostgreSQL on another, and how the same query returns the same result on both.

A period in the name of an entity defines a [composite entity](SchemaDefinition-Composite.md): `Orders.details` is a composite entity of `Orders`.

If the source is NoSQL, the details are stored inside the order, in a single collection; if the source is relational, they are stored in separate tables.
In the domain they are treated the same way whatever the type of source, so the model does not depend on the persistence technology.

## Composite entity

In this example `Orders.details` is a composite entity of `Orders`. Its relation `order`, with `target: details`, creates the composite relation `details` in `Orders`.

**Part of the schema where the composite entity is defined:**

```yaml
domain:  
  entities:
...  
  - name: Orders
    primaryKey: [id]
    indexes:
    - name: orderDate
      fields: [orderDate]
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
  - name: Orders.details
    primaryKey: [orderId, productId]
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
...
```

**Complete schema:**

```yaml
domain:  
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

**Environment variables:**

```sh
CNN_MYSQL={"host":"localhost","port":3306,"user":"test","password":"test","database":"test"}
CNN_POSTGRES={"host":"localhost","port":5433,"user":"test","password":"test","database":"test"}
CNN_MONGODB={"url":"mongodb://test:test@localhost:27017","database":"test"}
```

**Lab:**

- [CLI - northwind multiples datasources](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)

## Composite entity in different sources

This example shows how a composite entity is stored in different sources.
On the `default` stage, `Orders` and `Orders.details` are stored in MongoDB; on the `insights` stage, they are stored in PostgreSQL.

**Part of the schema where the stages are configured:**

```yaml
...
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
...
```

**Complete schema:**

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
```

### Orders in MongoDB

In MongoDB the details are stored inside each document of the `Orders` collection:

![OrderCompositeInMongo](images/OrderCompositeInMongo.png)

### Orders in PostgreSQL

In PostgreSQL the orders are stored in the `Orders` table:

![OrderCompositeInPostgres](images/OrderCompositeInPostgres.png)

and the details in the `Order Details` table:

![OrderDetailsCompositeInPostgres](images/OrderDetailCompositeInPostgres.png)

## Queries

The same query, executed on each stage, returns the same orders with their details (only the format of the dates depends on the engine).

### Query on default stage

```sh
lambdaorm execute -e ".env" -s default -q "Orders.filter(p => p.customerId == customerId).include(p => [p.customer.map(p => p.name), p.details.include(p => p.product.include(p => p.category.map(p => p.name)).map(p => p.name)).map(p => [p.quantity, p.unitPrice])]).sort(p=> p.id).page(1,1)" -d "{\"customerId\": \"HANAR\"}"
```

Result:

```json
[
  {
    "id": 3,
    "customerId": "HANAR",
    "employeeId": 4,
    "orderDate": "1996-07-08T00:00:00.000+02:00",
    "requiredDate": "1996-08-05",
    "shippedDate": "1996-07-12",
    "shipViaId": 2,
    "freight": 65.83,
    "name": "Hanari Carnes",
    "address": "Rua do Pao, 67",
    "city": "Rio de Janeiro",
    "region": "RJ",
    "postalCode": "05454-876",
    "country": "Brazil",
    "details": [
      {
        "quantity": 10,
        "unitPrice": 7.7,
        "product": {
          "name": "Jack's New England Clam Chowder",
          "category": {
            "name": "Seafood"
          }
        }
      },
      {
        "quantity": 35,
        "unitPrice": 42.4,
        "product": {
          "name": "Manjimup Dried Apples",
          "category": {
            "name": "Produce"
          }
        }
      },
      {
        "quantity": 15,
        "unitPrice": 16.8,
        "product": {
          "name": "Louisiana Fiery Hot Pepper Sauce",
          "category": {
            "name": "Condiments"
          }
        }
      }
    ],
    "customer": {
      "name": "Hanari Carnes"
    }
  }
]
```

### Same query on insights stage

```sh
lambdaorm execute -e ".env" -s insights -q "Orders.filter(p => p.customerId == customerId).include(p => [p.customer.map(p => p.name), p.details.include(p => p.product.include(p => p.category.map(p => p.name)).map(p => p.name)).map(p => [p.quantity, p.unitPrice])]).sort(p=> p.id).page(1,1)" -d "{\"customerId\": \"HANAR\"}"
```

Result:

```json
[
  {
    "id": 3,
    "customerId": "HANAR",
    "employeeId": 4,
    "orderDate": "1996-07-07T22:00:00.000Z",
    "requiredDate": "1996-08-04T22:00:00.000Z",
    "shippedDate": "1996-07-11T22:00:00.000Z",
    "shipViaId": 2,
    "freight": 65.83,
    "name": "Hanari Carnes",
    "address": "Rua do Pao, 67",
    "city": "Rio de Janeiro",
    "region": "RJ",
    "postalCode": "05454-876",
    "country": "Brazil",
    "customer": {
      "name": "Hanari Carnes"
    },
    "details": [
      {
        "quantity": 10,
        "unitPrice": 7.7,
        "product": {
          "name": "Jack's New England Clam Chowder",
          "category": {
            "name": "Seafood"
          }
        }
      },
      {
        "quantity": 35,
        "unitPrice": 42.4,
        "product": {
          "name": "Manjimup Dried Apples",
          "category": {
            "name": "Produce"
          }
        }
      },
      {
        "quantity": 15,
        "unitPrice": 16.8,
        "product": {
          "name": "Louisiana Fiery Hot Pepper Sauce",
          "category": {
            "name": "Condiments"
          }
        }
      }
    ]
  }
]
```

## Labs

- [CLI - northwind](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/05-northwind)
- [CLI - northwind multiples datasources](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
- [CLI - northwind multiples stages](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/07-northwind-multiples-stages)
