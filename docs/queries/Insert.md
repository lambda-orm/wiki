# Insert

Since the queries are based on both the expression and the definition in the schema, in the case of wanting to insert all the fields it is not necessary to define them since it is assumed if none are defined.

The mapping to the source(s) is resolved according to the mapping configuration associated with each source in the schema.

## Insert Simple

In the case that the fields to be inserted are not specified, it is assumed that an object with all fields will be passed.

**Lambda:**

```Typescript
// Inserting into Categories table without specifying fields
Categories.insert()
```

**SQL Result:**

```sql
-- Inserting into Categories table with CategoryName and Description fields
INSERT INTO Categories(CategoryName,Description) VALUES(?,?)
```

## Insert specific

In this case, only the fields that are specified will be inserted

**Lambda:**

```Typescript
// Inserting into Categories table with only the name field specified
Categories.insert({ name: name })
```

**SQL Result:**

```sql
-- Inserting into Categories table with CategoryName field specified
INSERT INTO Categories(CategoryName) VALUES(?)
```

## Insert with include

In the case that we need to insert an object which in turn has a relation, we can insert the set using include.

**Lambda:**

```Typescript
// Inserting into Orders table and including details
Orders.insert().include(p => p.details)
```

**SQL Result:**

```sql
-- Inserting into Orders table with all required fields
INSERT INTO Orders(CustomerID,EmployeeID,OrderDate,RequiredDate,ShippedDate,ShipVia,Freight,ShipName,ShipAddress,ShipCity,ShipRegion,ShipPostalCode,ShipCountry) 
VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)

-- Inserting into Order Details table with all required fields
INSERT INTO `Order Details`(OrderID,ProductID,UnitPrice,Quantity,Discount) 
VALUES(?,?,?,?,?)
```

## Upsert

`upsert()` inserts the record or, if a record with the same primary key already exists, updates it. It is written as an insert (same syntax: `upsert()` with all the fields, or with the fields specified). The entity needs a primary key, and the data must carry it (an auto-increment key is not useful here).

**Lambda:**

```Typescript
// inserts the country, or updates it when one with the same iso3 exists
Countries.upsert()
```

```Typescript
await orm.execute('Countries.upsert()', { iso3: 'ARG', name: 'Argentine' }) // inserted
await orm.execute('Countries.upsert()', { iso3: 'ARG', name: 'Argentina' }) // updated: the same row
```

**SQL Result:**

```sql
-- MySQL / MariaDB
INSERT INTO Countries(iso3,name) VALUES(?,?) ON DUPLICATE KEY UPDATE name = VALUES(name)

-- PostgreSQL
INSERT INTO Countries(iso3,name) VALUES($1,$2)
ON CONFLICT (iso3) DO UPDATE SET name = EXCLUDED.name
```

Supported on PostgreSQL, MySQL and MariaDB. On SQL Server, Oracle and MongoDB it fails with a clear "not supported yet" error; SQLite (SQLjs) does not support it either.

Upsert is also what [update with include](Update.md#update-an-aggregate-composite-relation) of a composite relation uses to save the children.

## Code example

```Typescript
import { orm } from '../../lib'
import { Orders } from '../northwind/model/__model'
(async () => {	
	try {		
		await orm.init('./config/northwind.yaml')
		const order = {
			customerId: 'VINET',
			employeeId: 5,
			orderDate: '1996-07-03T22:00:00.000Z',
			requiredDate: '1996-07-31T22:00:00.000Z',
			shippedDate: '1996-07-15T22:00:00.000Z',
			shipViaId: 3,
			freight: 32.38,
			name: 'Vins et alcools Chevalier',
			address: '59 rue de l-Abbaye',
			city: 'Reims',
			postalCode: '51100',
			country: 'France',
			details: [
				{
					productId: 11,
					unitPrice: 14,
					quantity: 12,
					discount: 10,
					orderId: 833
				},
				{
					productId: 42,
					unitPrice: 9.8,
					quantity: 10,
					discount: 10,
					orderId: 833
				}
			]
		}
		// Defining a query to insert into Orders and include details
		const query = () => Orders.insert().include(p => p.details)
		// Executing the query using the ORM with the specified order parameter
		const result = await orm.execute(query, order)
		// return ID of order created
		console.log(JSON.stringify(result))		
	} catch (error:any) {
		console.error(error.stack)
	} finally {
		// Ending the ORM connection
		await orm.end()
	}
})()
```
