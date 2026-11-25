# Include {#include}

Diese Seite zeigt, wie Sie mit der Methode `include` verbundene Entitäten zusammen mit der Hauptentität laden. Verwenden Sie sie, wenn das Ergebnis ein Objekt mit seinen Beziehungen enthalten muss (eine Bestellung mit ihrem Kunden und ihren Positionen) oder wenn sich die verbundene Entität in einer anderen Quelle befindet.

`include` funktioniert mit jeder Art von Beziehung (`oneToMany`, `manyToOne` und `oneToOne`, siehe [Beziehungen](../schema/SchemaDefinition.md)). In der Terminologie von λORM verweist eine `oneToMany`-Beziehung auf einen Datensatz (jede Bestellung hat einen `customer`), und eine `manyToOne`-Beziehung ist eine Sammlung (jede Bestellung hat viele `details`). Innerhalb eines Includes können Sie die verbundenen Datensätze außerdem filtern und ihre Eigenschaften auswählen.

Für jedes Include führt λORM eine Anweisung aus, die alle benötigten verbundenen Datensätze liest, und setzt die Objekte anschließend im Speicher zusammen. So wird vermieden, eine Anweisung pro Datensatz auszuführen, was die Performance erheblich verbessert. Um die Datensätze zu verknüpfen, fügt λORM den Anweisungen die benötigten Schlüssel hinzu (`__customerId`, `LambdaOrmParentId` …); sie werden aus dem Ergebnis entfernt.

Includes können in Selects, Inserts, Upserts, Updates, Deletes und Bulk Inserts verwendet werden. Das auf dieser Seite gezeigte SQL ist das für MySQL erzeugte.

## Eine `oneToMany`-Beziehung einbinden {#include-a-onetomany-relation}

Liest eine Bestellung und ihren Kunden.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => p.customer)
```

**SQL-Ergebnis:**

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

**Datenergebnis:**

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

## `manyToOne`- und `oneToMany`-Beziehungen einbinden {#include-manytoone-and-onetomany-relations}

Liest eine Bestellung mit ihren Positionen und ihrem Kunden. Um mehrere Beziehungen einzubinden, geben Sie sie in einem Array zurück.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => [p.details, p.customer])
```

**SQL-Ergebnis:**

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

**Datenergebnis:**

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

## Verschachtelte Includes {#nested-includes}

Eine eingebundene Beziehung kann ihrerseits eigene Beziehungen einbinden. Dieses Beispiel liest eine Bestellung mit ihrem Kunden und ihren Positionen; für jede Position liest es das Produkt und für jedes Produkt dessen Kategorie.

**Lambda:**

```typescript
Orders
	.filter(p => p.id == id)
	.include(p => [p.details.include(q => q.product.include(r => r.category)), p.customer])
```

**SQL-Ergebnis:**

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

**Datenergebnis:**

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

## Nur einige Eigenschaften einbinden {#include-only-some-properties}

Sie können die zurückzugebenden Eigenschaften sowohl für die Hauptentität als auch für jede eingebundene Entität auswählen, sodass die Abfrage nur die benötigten Daten liefert. Dieses Beispiel liest das Datum einer Bestellung, den Namen und die vollständige Adresse ihres Kunden, Menge und Stückpreis ihrer Positionen sowie den Namen jedes Produkts und den Namen seiner Kategorie.

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

**SQL-Ergebnis:**

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

**Datenergebnis:**

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

## Beziehungen in einer anderen Quelle {#relations-in-another-source}

Die verbundene Entität kann sich in einer anderen Quelle (einer anderen Datenbank oder einem anderen Schema) des Stage befinden. Da jedes Include als separate Anweisung ausgeführt wird, funktioniert `include` quellenübergreifend in beliebiger Tiefe:

```typescript
// Orders and OrderLines in one source, Products and Categories in another
Orders.filter(p => p.id == id).include(p => p.lines.include(l => l.product.include(q => q.category)))
```

Ein `map`, `sort` oder `having` kann Felder einer Beziehung in einer anderen Quelle auch ohne Include lesen (`Orders.map(p => [p.id, p.customer.name])`): λORM bindet die Beziehung selbst ein und beendet die Abfrage im Speicher. Siehe [Abfragen über Quellen hinweg](CrossSource.md).

### Nach einem Feld einer Beziehung in einer anderen Quelle filtern {#filter-by-a-field-of-a-relation-in-another-source}

Ein Filter kann auch eine Eigenschaft einer Beziehung verwenden, deren Entität sich in einer anderen Quelle befindet. Zuerst wird die andere Quelle abgefragt, anschließend werden die gefundenen Schlüssel verwendet, um mit `in` zu filtern:

**Lambda:**

```typescript
// OrderLines (source "sales") filtered by the name of its product (source "catalog")
OrderLines.filter(p => p.product.name == name && p.orderId == orderId)
```

**Ausgeführt als:**

```typescript
// 1. on the source of Products
Products.filter(p => p.name == name)
// 2. on the source of OrderLines, with the ids found in 1
OrderLines.filter(p => in(p.productId, ids) && p.orderId == orderId)
```

Jeder Vergleich wird einzeln ersetzt, sodass `&&`, `||` und `!` ihre Bedeutung behalten.

- Er lässt sich mit anderen Bedingungen kombinieren, auch mit `||`: `OrderLines.filter(p => p.orderId == orderId && (p.product.name == name || p.quantity > 100))`.
- Gibt es in der anderen Quelle keinen Treffer, liefert die Abfrage keine Zeilen.
- In einem Filter wird nur eine Beziehungsebene unterstützt (`p.product.name`, nicht `p.product.category.name`); ein `map` oder `sort` kann jede Ebene lesen (siehe [Abfragen über Quellen hinweg](CrossSource.md)).
- Die andere Seite jedes Vergleichs muss ein Wert sein (ein Literal oder eine Variable). Ein Vergleich mit einer Eigenschaft, etwa `p.product.name == p.description`, schlägt mit einem Fehler fehl, der meldet, dass sich die Beziehung in einer anderen Quelle befindet.

## Codebeispiel {#code-example}

Die Abfrage aus [Nur einige Eigenschaften einbinden](#include-only-some-properties), ausgeführt aus Node mit `@lambdaorm/lib`:

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
