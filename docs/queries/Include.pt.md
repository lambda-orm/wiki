# Include {#include}

Esta página mostra como carregar entidades relacionadas junto com a entidade principal, usando o método `include`. Use-o quando o resultado precisar conter um objeto com suas relações (um pedido com seu cliente e seus detalhes), ou quando a entidade relacionada estiver em outra fonte.

`include` funciona com todos os tipos de relação (`oneToMany`, `manyToOne` e `oneToOne`, veja [relações](../schema/SchemaDefinition.md)). Na terminologia do λORM, uma relação `oneToMany` aponta para um registro (cada pedido tem um `customer`) e uma relação `manyToOne` é uma coleção (cada pedido tem muitos `details`). Dentro de um include também é possível filtrar os registros relacionados e escolher suas propriedades.

Para cada include, o λORM executa uma sentença que lê todos os registros relacionados necessários e, em seguida, monta os objetos em memória. Isso evita executar uma sentença por registro, o que melhora consideravelmente o desempenho. Para vincular os registros, o λORM adiciona às sentenças as chaves de que precisa (`__customerId`, `LambdaOrmParentId`…); elas são removidas do resultado.

Os includes podem ser usados em selects, inserts, upserts, updates, deletes e inserções em massa. O SQL mostrado nesta página é o gerado para MySQL.

## Incluir uma relação `oneToMany` {#include-a-onetomany-relation}

Lê um pedido e seu cliente.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => p.customer)
```

**Resultado SQL:**

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

**Resultado dos dados:**

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

## Incluir relações `manyToOne` e `oneToMany` {#include-manytoone-and-onetomany-relations}

Lê um pedido com seus detalhes e seu cliente. Para incluir várias relações, retorne-as em um array.

**Lambda:**

```typescript
Orders.filter(p => p.id == id).include(p => [p.details, p.customer])
```

**Resultado SQL:**

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

**Resultado dos dados:**

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

## Includes aninhados {#nested-includes}

Uma relação incluída pode incluir suas próprias relações. Este exemplo lê um pedido com seu cliente e seus detalhes; para cada detalhe lê o produto e, para cada produto, sua categoria.

**Lambda:**

```typescript
Orders
	.filter(p => p.id == id)
	.include(p => [p.details.include(q => q.product.include(r => r.category)), p.customer])
```

**Resultado SQL:**

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

**Resultado dos dados:**

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

## Incluir apenas algumas propriedades {#include-only-some-properties}

É possível escolher as propriedades a retornar tanto da entidade principal quanto de cada entidade incluída, para que a consulta retorne apenas os dados necessários. Este exemplo lê a data de um pedido; o nome e o endereço completo do seu cliente; a quantidade e o preço unitário dos seus detalhes; o nome de cada produto e o nome da sua categoria.

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

**Resultado SQL:**

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

**Resultado dos dados:**

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

## Relações em outra fonte {#relations-in-another-source}

A entidade relacionada pode estar em outra fonte (outro banco de dados ou esquema) do stage. Como cada include é executado como uma sentença separada, `include` funciona entre fontes em qualquer profundidade:

```typescript
// Orders and OrderLines in one source, Products and Categories in another
Orders.filter(p => p.id == id).include(p => p.lines.include(l => l.product.include(q => q.category)))
```

Um `map`, um `sort` ou um `having` também podem ler campos de uma relação em outra fonte sem um include (`Orders.map(p => [p.id, p.customer.name])`): o λORM inclui a relação por você e termina a consulta em memória. Veja [Consultas entre fontes](CrossSource.md).

### Filtrar por um campo de uma relação em outra fonte {#filter-by-a-field-of-a-relation-in-another-source}

Um filtro também pode usar uma propriedade de uma relação cuja entidade está em outra fonte. A outra fonte é consultada primeiro e as chaves encontradas são então usadas para filtrar com `in`:

**Lambda:**

```typescript
// OrderLines (source "sales") filtered by the name of its product (source "catalog")
OrderLines.filter(p => p.product.name == name && p.orderId == orderId)
```

**Executado como:**

```typescript
// 1. on the source of Products
Products.filter(p => p.name == name)
// 2. on the source of OrderLines, with the ids found in 1
OrderLines.filter(p => in(p.productId, ids) && p.orderId == orderId)
```

Cada comparação é substituída individualmente, por isso `&&`, `||` e `!` mantêm seu significado.

- Pode ser combinado com outras condições, inclusive com `||`: `OrderLines.filter(p => p.orderId == orderId && (p.product.name == name || p.quantity > 100))`.
- Quando a outra fonte não tem correspondência, a consulta não retorna linhas.
- Em um filtro só é suportado um nível de relação (`p.product.name`, não `p.product.category.name`); um `map` ou um `sort` podem ler qualquer nível (veja [Consultas entre fontes](CrossSource.md)).
- O outro lado de cada comparação deve ser um valor (um literal ou uma variável). Comparar com uma propriedade, como em `p.product.name == p.description`, falha com um erro informando que a relação está em outra fonte.

## Exemplo de código {#code-example}

A consulta de [Incluir apenas algumas propriedades](#include-only-some-properties), executada a partir do Node com `@lambdaorm/lib`:

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
