# Include

This page shows how to load related entities together with the main entity, using the `include` method. Use it when the result must contain an object with its relations (an order with its customer and its details), or when the related entity is in another source.

`include` works with every type of relation (`oneToMany`, `manyToOne` and `oneToOne`, see [relations](../schema/SchemaDefinition.md)). In λORM terms, a `oneToMany` relation points to one record (each order has one `customer`) and a `manyToOne` relation is a collection (each order has many `details`). Inside an include you can also filter the related records and choose their properties.

For each include, λORM runs one statement that reads all the related records needed, and then assembles the objects in memory. This avoids running one statement per record, which considerably improves performance. To link the records, λORM adds the keys it needs to the statements (`__customerId`, `LambdaOrmParentId`…); they are removed from the result.

Includes can be used in selects, inserts, upserts, updates, deletes and bulk inserts. The SQL shown on this page is the one generated for MySQL.

## Include a `oneToMany` relation

Reads an order and its customer.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => p.customer)
```

**SQL Result:**

```sql
-- the order
SELECT o.OrderID AS id, o.CustomerID AS customerId, o.EmployeeID AS employeeId, o.OrderDate AS orderDate,
  o.RequiredDate AS requiredDate, o.ShippedDate AS shippedDate, o.ShipVia AS shipViaId, o.Freight AS freight,
  o.ShipName AS name, o.ShipAddress AS address, o.ShipCity AS city, o.ShipRegion AS region,
  o.ShipPostalCode AS postalCode, o.ShipCountry AS country, o.CustomerID AS `__customerId`
FROM Orders o
WHERE o.OrderID = ?

-- the customers of the orders read above
SELECT c.CustomerID AS id, c.CompanyName AS name, c.ContactName AS contact, c.ContactTitle AS phone,
  c.Address AS address, c.City AS city, c.Region AS region, c.PostalCode AS postalCode, c.Country AS country,
  c.CustomerID AS LambdaOrmParentId
FROM Customers c
WHERE c.CustomerID IN (?)
```

**Data Result:**

```json
[
  {
    "id": 10248,
    "customerId": "VINET",
    "employeeId": 5,
    "orderDate": "1996-07-03T22:00:00.000Z",
    "requiredDate": "1996-07-31T22:00:00.000Z",
    "shippedDate": "1996-07-15T22:00:00.000Z",
    "shipViaId": 3,
    "freight": 32.38,
    "name": "Vins et alcools Chevalier",
    "address": "59 rue de l-Abbaye",
    "city": "Reims",
    "region": null,
    "postalCode": "51100",
    "country": "France",
    "customer": {
      "id": "VINET",
      "name": "Vins et alcools Chevalier",
      "contact": "Paul Henriot",
      "phone": "Accounting Manager",
      "address": "59 rue de l'Abbaye",
      "city": "Reims",
      "region": null,
      "postalCode": "51100",
      "country": "France"
    }
  }
]
```

## Include `manyToOne` and `oneToMany` relations

Reads an order with its details and its customer. To include several relations, return them in an array.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => [p.details, p.customer])
```

**SQL Result:**

```sql
-- the order
SELECT o.OrderID AS id, o.CustomerID AS customerId, o.EmployeeID AS employeeId, o.OrderDate AS orderDate,
  o.RequiredDate AS requiredDate, o.ShippedDate AS shippedDate, o.ShipVia AS shipViaId, o.Freight AS freight,
  o.ShipName AS name, o.ShipAddress AS address, o.ShipCity AS city, o.ShipRegion AS region,
  o.ShipPostalCode AS postalCode, o.ShipCountry AS country, o.OrderID AS `__id`, o.CustomerID AS `__customerId`
FROM Orders o
WHERE o.OrderID = ?

-- the details of the orders read above
SELECT o1.OrderID AS orderId, o1.ProductID AS productId, o1.UnitPrice AS unitPrice, o1.Quantity AS quantity,
  o1.Discount AS discount, o1.OrderID AS LambdaOrmParentId
FROM `Order Details` o1
WHERE o1.OrderID IN (?)

-- the customers of the orders read above
SELECT c.CustomerID AS id, c.CompanyName AS name, c.ContactName AS contact, c.ContactTitle AS phone,
  c.Address AS address, c.City AS city, c.Region AS region, c.PostalCode AS postalCode, c.Country AS country,
  c.CustomerID AS LambdaOrmParentId
FROM Customers c
WHERE c.CustomerID IN (?)
```

**Data Result:**

```json
[
  {
    "id": 10248,
    "customerId": "VINET",
    "employeeId": 5,
    "orderDate": "1996-07-03T22:00:00.000Z",
    "requiredDate": "1996-07-31T22:00:00.000Z",
    "shippedDate": "1996-07-15T22:00:00.000Z",
    "shipViaId": 3,
    "freight": 32.38,
    "name": "Vins et alcools Chevalier",
    "address": "59 rue de l-Abbaye",
    "city": "Reims",
    "region": null,
    "postalCode": "51100",
    "country": "France",
    "details": [
      {
        "orderId": 10248,
        "productId": 11,
        "unitPrice": 14,
        "quantity": 12,
        "discount": 0
      },
      {
        "orderId": 10248,
        "productId": 42,
        "unitPrice": 9.8,
        "quantity": 10,
        "discount": 0
      },
      {
        "orderId": 10248,
        "productId": 72,
        "unitPrice": 34.8,
        "quantity": 5,
        "discount": 0
      }
    ],
    "customer": {
      "id": "VINET",
      "name": "Vins et alcools Chevalier",
      "contact": "Paul Henriot",
      "phone": "Accounting Manager",
      "address": "59 rue de l'Abbaye",
      "city": "Reims",
      "region": null,
      "postalCode": "51100",
      "country": "France"
    }
  }
]
```

## Nested includes

An included relation can include its own relations. This example reads an order with its customer and its details; for each detail it reads the product, and for each product its category.

**Lambda:**

```typescript
Orders
	.filter(p => p.id == id)
	.include(p => [p.details.include(q => q.product.include(r => r.category)), p.customer])
```

**SQL Result:**

```sql
-- the order
SELECT o.OrderID AS id, o.CustomerID AS customerId, o.EmployeeID AS employeeId, o.OrderDate AS orderDate,
  o.RequiredDate AS requiredDate, o.ShippedDate AS shippedDate, o.ShipVia AS shipViaId, o.Freight AS freight,
  o.ShipName AS name, o.ShipAddress AS address, o.ShipCity AS city, o.ShipRegion AS region,
  o.ShipPostalCode AS postalCode, o.ShipCountry AS country, o.OrderID AS `__id`, o.CustomerID AS `__customerId`
FROM Orders o
WHERE o.OrderID = ?

-- the details of the orders
SELECT o1.OrderID AS orderId, o1.ProductID AS productId, o1.UnitPrice AS unitPrice, o1.Quantity AS quantity,
  o1.Discount AS discount, o1.ProductID AS `__productId`, o1.OrderID AS LambdaOrmParentId
FROM `Order Details` o1
WHERE o1.OrderID IN (?)

-- the products of the details
SELECT p.ProductID AS id, p.ProductName AS name, p.SupplierID AS supplierId, p.CategoryID AS categoryId,
  p.QuantityPerUnit AS quantity, p.UnitPrice AS price, p.UnitsInStock AS inStock, p.UnitsOnOrder AS onOrder,
  p.ReorderLevel AS reorderLevel, p.Discontinued AS discontinued, p.CategoryID AS `__categoryId`,
  p.ProductID AS LambdaOrmParentId
FROM Products p
WHERE p.ProductID IN (?)

-- the categories of the products
SELECT c.CategoryID AS id, c.CategoryName AS name, c.Description AS description, c.CategoryID AS LambdaOrmParentId
FROM Categories c
WHERE c.CategoryID IN (?)

-- the customers of the orders
SELECT c1.CustomerID AS id, c1.CompanyName AS name, c1.ContactName AS contact, c1.ContactTitle AS phone,
  c1.Address AS address, c1.City AS city, c1.Region AS region, c1.PostalCode AS postalCode, c1.Country AS country,
  c1.CustomerID AS LambdaOrmParentId
FROM Customers c1
WHERE c1.CustomerID IN (?)
```

**Data Result:**

```json
[
  {
    "id": 10248,
    "customerId": "VINET",
    "employeeId": 5,
    "orderDate": "1996-07-03T22:00:00.000Z",
    "requiredDate": "1996-07-31T22:00:00.000Z",
    "shippedDate": "1996-07-15T22:00:00.000Z",
    "shipViaId": 3,
    "freight": 32.38,
    "name": "Vins et alcools Chevalier",
    "address": "59 rue de l-Abbaye",
    "city": "Reims",
    "region": null,
    "postalCode": "51100",
    "country": "France",
    "details": [
      {
        "orderId": 10248,
        "productId": 11,
        "unitPrice": 14,
        "quantity": 12,
        "discount": 0,
        "product": {
          "id": 11,
          "name": "Queso Cabrales",
          "supplierId": 5,
          "categoryId": 4,
          "quantity": "1 kg pkg.",
          "price": 21,
          "inStock": 22,
          "onOrder": 30,
          "reorderLevel": 30,
          "discontinued": false,
          "category": {
            "id": 4,
            "name": "Dairy Products",
            "description": "Cheeses"
          }
        }
      },
      {
        "orderId": 10248,
        "productId": 42,
        "unitPrice": 9.8,
        "quantity": 10,
        "discount": 0,
        "product": {
          "id": 42,
          "name": "Singaporean Hokkien Fried Mee",
          "supplierId": 20,
          "categoryId": 5,
          "quantity": "32 - 1 kg pkgs.",
          "price": 14,
          "inStock": 26,
          "onOrder": 0,
          "reorderLevel": 0,
          "discontinued": true,
          "category": {
            "id": 5,
            "name": "Grains/Cereals",
            "description": "Breads, crackers, pasta, and cereal"
          }
        }
      },
      {
        "orderId": 10248,
        "productId": 72,
        "unitPrice": 34.8,
        "quantity": 5,
        "discount": 0,
        "product": {
          "id": 72,
          "name": "Mozzarella di Giovanni",
          "supplierId": 14,
          "categoryId": 4,
          "quantity": "24 - 200 g pkgs.",
          "price": 34.8,
          "inStock": 14,
          "onOrder": 0,
          "reorderLevel": 0,
          "discontinued": false,
          "category": {
            "id": 4,
            "name": "Dairy Products",
            "description": "Cheeses"
          }
        }
      }
    ],
    "customer": {
      "id": "VINET",
      "name": "Vins et alcools Chevalier",
      "contact": "Paul Henriot",
      "phone": "Accounting Manager",
      "address": "59 rue de l'Abbaye",
      "city": "Reims",
      "region": null,
      "postalCode": "51100",
      "country": "France"
    }
  }
]
```

## Include only some properties

You can choose the properties to return both for the main entity and for each included entity, so that the query returns only the data you need. This example reads the date of an order; the name and full address of its customer; the quantity and unit price of its details; the name of each product and the name of its category.

**Lambda:**

```typescript
Orders.filter(p => p.id === id)
	.include(p => [
		// name of the customer and full address
		p.customer.map(p => ({
			name: p.name,
			address: concat(p.address, ', ', p.city, ' (', p.postalCode, ')  ', p.country)
		})),
		// quantity and unit price of the details, with the name of the product and of its category
		p.details.include(p => p.product
				.include(p => p.category.map(p => p.name))
				.map(p => p.name))
			.map(p => [p.quantity, p.unitPrice])
	])
	// date of the order
	.map(p => p.orderDate)
```

**SQL Result:**

```sql
-- the order
SELECT o.OrderDate AS orderDate, o.CustomerID AS `__customerId`, o.OrderID AS `__id`
FROM Orders o
WHERE o.OrderID = ?

-- the customers of the orders
SELECT c.CompanyName AS name,
  CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(c.Address,', '),c.City),' ('),c.PostalCode),')  '),c.Country) AS address,
  c.CustomerID AS LambdaOrmParentId
FROM Customers c
WHERE c.CustomerID IN (?)

-- the details of the orders
SELECT o1.Quantity AS quantity, o1.UnitPrice AS unitPrice, o1.ProductID AS `__productId`, o1.OrderID AS LambdaOrmParentId
FROM `Order Details` o1
WHERE o1.OrderID IN (?)

-- the products of the details
SELECT p.ProductName AS name, p.CategoryID AS `__categoryId`, p.ProductID AS LambdaOrmParentId
FROM Products p
WHERE p.ProductID IN (?)

-- the categories of the products
SELECT c1.CategoryName AS name, c1.CategoryID AS LambdaOrmParentId
FROM Categories c1
WHERE c1.CategoryID IN (?)
```

**Data Result:**

```json
[
  {
    "orderDate": "1996-07-03T22:00:00.000Z",
    "customer": {
      "name": "Vins et alcools Chevalier",
      "address": "59 rue de l'Abbaye, Reims (51100)  France"
    },
    "details": [
      {
        "quantity": 12,
        "unitPrice": 14,
        "product": {
          "name": "Queso Cabrales",
          "category": {
            "name": "Dairy Products"
          }
        }
      },
      {
        "quantity": 10,
        "unitPrice": 9.8,
        "product": {
          "name": "Singaporean Hokkien Fried Mee",
          "category": {
            "name": "Grains/Cereals"
          }
        }
      },
      {
        "quantity": 5,
        "unitPrice": 34.8,
        "product": {
          "name": "Mozzarella di Giovanni",
          "category": {
            "name": "Dairy Products"
          }
        }
      }
    ]
  }
]
```

## Relations in another source

The related entity can be in another source (another database or schema) of the stage. Since each include runs as a separate statement, `include` works across sources at any depth:

```typescript
// Orders and OrderLines in one source, Products and Categories in another
Orders.filter(p => p.id == id).include(p => p.lines.include(l => l.product.include(q => q.category)))
```

A `map`, `sort` or `having` can also read fields of a relation in another source without an include (`Orders.map(p => [p.id, p.customer.name])`): λORM includes the relation for you and finishes the query in memory. See [Queries across sources](CrossSource.md).

### Filter by a field of a relation in another source

A filter can also use a property of a relation whose entity is in another source. The other source is queried first, and the keys found are then used to filter with `in`:

**Lambda:**

```typescript
// OrderLines (source "sales") filtered by the name of its product (source "catalog")
OrderLines.filter(p => p.product.name == name && p.orderId == orderId)
```

**Executed as:**

```typescript
// 1. on the source of Products
Products.filter(p => p.name == name)
// 2. on the source of OrderLines, with the ids found in 1
OrderLines.filter(p => in(p.productId, ids) && p.orderId == orderId)
```

Each comparison is replaced on its own, so `&&`, `||` and `!` keep their meaning.

- It can be combined with other conditions, also with `||`: `OrderLines.filter(p => p.orderId == orderId && (p.product.name == name || p.quantity > 100))`.
- When the other source has no match, the query returns no rows.
- In a filter, only one level of relation is supported (`p.product.name`, not `p.product.category.name`); a `map` or a `sort` can read any level (see [Queries across sources](CrossSource.md)).
- The other side of each comparison must be a value (a literal or a variable). Comparing with a property, as in `p.product.name == p.description`, fails with an error saying that the relation is in another source.

## Code example

The query of [Include only some properties](#include-only-some-properties), run from Node with `@lambdaorm/lib`:

```typescript
import { orm } from '@lambdaorm/lib'
import { Orders } from './domain/model' // model generated by `lambdaorm build`

(async () => {
	try {
		await orm.init('./lambdaORM.yaml')
		const query = (id: number) => Orders
			.filter(p => p.id === id)
			.include(p => [
				p.customer.map(p => ({
					name: p.name,
					address: concat(p.address, ', ', p.city, ' (', p.postalCode, ')  ', p.country)
				})),
				p.details.include(p => p.product
						.include(p => p.category.map(p => p.name))
						.map(p => p.name))
					.map(p => [p.quantity, p.unitPrice])
			])
			.map(p => p.orderDate)
		const result = await orm.execute(query, { id: 10248 })
		console.log(JSON.stringify(result, null, 2))
	} catch (error: any) {
		console.error(error.stack)
	} finally {
		// releases the connections
		await orm.end()
	}
})()
```
