# Include {#include}

Esta página muestra cómo cargar entidades relacionadas junto con la entidad principal, usando el método `include`. Se usa cuando el resultado debe contener un objeto con sus relaciones (un pedido con su cliente y sus detalles), o cuando la entidad relacionada está en otra fuente.

`include` funciona con todos los tipos de relación (`oneToMany`, `manyToOne` y `oneToOne`, ver [relaciones](../schema/SchemaDefinition.md)). En términos de λORM, una relación `oneToMany` apunta a un registro (cada pedido tiene un `customer`) y una relación `manyToOne` es una colección (cada pedido tiene muchos `details`). Dentro de un include también se pueden filtrar los registros relacionados y elegir sus propiedades.

Por cada include, λORM ejecuta una sentencia que lee todos los registros relacionados necesarios y después arma los objetos en memoria. Así se evita ejecutar una sentencia por registro, lo que mejora considerablemente el rendimiento. Para vincular los registros, λORM añade a las sentencias las claves que necesita (`__customerId`, `LambdaOrmParentId`…); estas se eliminan del resultado.

Los includes se pueden usar en selects, inserts, upserts, updates, deletes e inserciones masivas. El SQL que se muestra en esta página es el generado para MySQL.

## Incluir una relación `oneToMany` {#include-a-onetomany-relation}

Lee un pedido y su cliente.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => p.customer)
```

**SQL resultante:**

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

**Datos resultantes:**

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

## Incluir relaciones `manyToOne` y `oneToMany` {#include-manytoone-and-onetomany-relations}

Lee un pedido con sus detalles y su cliente. Para incluir varias relaciones, se devuelven en un array.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => [p.details, p.customer])
```

**SQL resultante:**

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

**Datos resultantes:**

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

## Includes anidados {#nested-includes}

Una relación incluida puede incluir sus propias relaciones. Este ejemplo lee un pedido con su cliente y sus detalles; para cada detalle lee el producto, y para cada producto su categoría.

**Lambda:**

```typescript
Orders
	.filter(p => p.id == id)
	.include(p => [p.details.include(q => q.product.include(r => r.category)), p.customer])
```

**SQL resultante:**

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

**Datos resultantes:**

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

## Incluir solo algunas propiedades {#include-only-some-properties}

Se pueden elegir las propiedades a devolver tanto para la entidad principal como para cada entidad incluida, de modo que la consulta devuelva solo los datos necesarios. Este ejemplo lee la fecha de un pedido; el nombre y la dirección completa de su cliente; la cantidad y el precio unitario de sus detalles; el nombre de cada producto y el nombre de su categoría.

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

**SQL resultante:**

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

**Datos resultantes:**

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

## Relaciones en otra fuente {#relations-in-another-source}

La entidad relacionada puede estar en otra fuente (otra base de datos u otro esquema) del stage. Como cada include se ejecuta como una sentencia separada, `include` funciona entre fuentes a cualquier profundidad:

```typescript
// Orders and OrderLines in one source, Products and Categories in another
Orders.filter(p => p.id == id).include(p => p.lines.include(l => l.product.include(q => q.category)))
```

Un `map`, un `sort` o un `having` también pueden leer campos de una relación en otra fuente sin un include (`Orders.map(p => [p.id, p.customer.name])`): λORM incluye la relación por ti y termina la consulta en memoria. Ver [Consultas entre fuentes](CrossSource.md).

### Filtrar por un campo de una relación en otra fuente {#filter-by-a-field-of-a-relation-in-another-source}

Un filtro también puede usar una propiedad de una relación cuya entidad está en otra fuente. Primero se consulta la otra fuente, y después las claves encontradas se usan para filtrar con `in`:

**Lambda:**

```typescript
// OrderLines (source "sales") filtered by the name of its product (source "catalog")
OrderLines.filter(p => p.product.name == name && p.orderId == orderId)
```

**Se ejecuta como:**

```typescript
// 1. on the source of Products
Products.filter(p => p.name == name)
// 2. on the source of OrderLines, with the ids found in 1
OrderLines.filter(p => in(p.productId, ids) && p.orderId == orderId)
```

Cada comparación se reemplaza por separado, por lo que `&&`, `||` y `!` mantienen su significado.

- Se puede combinar con otras condiciones, también con `||`: `OrderLines.filter(p => p.orderId == orderId && (p.product.name == name || p.quantity > 100))`.
- Cuando la otra fuente no tiene coincidencias, la consulta no devuelve filas.
- En un filtro solo se admite un nivel de relación (`p.product.name`, no `p.product.category.name`); un `map` o un `sort` pueden leer cualquier nivel (ver [Consultas entre fuentes](CrossSource.md)).
- El otro lado de cada comparación debe ser un valor (un literal o una variable). Comparar con una propiedad, como en `p.product.name == p.description`, falla con un error que indica que la relación está en otra fuente.

## Ejemplo de código {#code-example}

La consulta de [Incluir solo algunas propiedades](#include-only-some-properties), ejecutada desde Node con `@lambdaorm/lib`:

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
