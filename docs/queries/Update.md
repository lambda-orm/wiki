# Update

Since the queries are based on both the expression and the definition in the schema, in the case of wanting to update all the fields it is not necessary to define them since it is assumed if none are defined.

The mapping to the source(s) is resolved according to the mapping configuration associated with each source in the schema.

## Result: affected rows

`update` returns the **number of affected rows** (as `delete` does). `0` means that no row matched the filter, which is useful to answer "not found" or to detect a conflict with an optimistic lock:

```Typescript
const query = 'Orders.update(p => ({ status: status, version: version + 1 })).filter(p => p.id == id && p.version == version)'
const first = await orm.execute(query, { id: orderId, status: 'sent', version: 1 })     // 1
const second = await orm.execute(query, { id: orderId, status: 'accepted', version: 1 }) // 0: the version changed
```

When the update has includes, the result is the number of rows affected in the main entity.

## Update one entity complete

**Lambda:**

```Typescript
// Updates all fields of the Orders entity
Orders.update()
```

**SQL Result:**

```sql
-- Updates all fields of the Orders entity where OrderID matches the provided parameter
UPDATE Orders o SET 
	CustomerID = ?,
	EmployeeID = ?,
	OrderDate = ?,
	RequiredDate = ?,
	ShippedDate = ?,
	ShipVia = ?,
	Freight = ?,
	ShipName = ?,
	ShipAddress = ?,
	ShipCity = ?,
	ShipRegion = ?,
	ShipPostalCode = ?,
	ShipCountry = ? 
WHERE o.OrderID = ?
```

## Update one field of entity in all records

**Lambda:**

```Typescript
// Updates the ShipPostalCode field in all records of the Orders entity
Orders.updateAll({ postalCode: postalCode })
```

**SQL Result:**

```sql
-- Updates the ShipPostalCode field in all records of the Orders entity
UPDATE Orders o SET ShipPostalCode = ?
```

## Update one field of entity filtered

**Lambda:**

```Typescript
// Updates the ShipName field of the Orders entity where OrderID matches the provided entity's ID
Orders.update({ name: entity.name }).filter(p => p.id === entity.id)
```

**SQL Result:**

```sql
-- Updates the ShipName field of the Orders entity where OrderID matches the provided entity's ID
UPDATE Orders o SET ShipName = ? WHERE o.OrderID = ?
```

## Update one field of entity filtered and related entity

**Lambda:**

```Typescript
// Updates the ShipName field of the Orders entity and updates related details
Orders.update({ name: entity.name }).include(p => p.details(p => p)).filter(p => p.id === entity.id)
```

**SQL Result:**

```sql
-- Updates the ShipName field of the Orders entity where OrderID matches the provided entity's ID
UPDATE Orders o SET ShipName = ? 
WHERE o.OrderID = ? 

-- Updates UnitPrice, Quantity, and Discount fields in the Order Details table where OrderID and ProductID 
-- match the provided parameters
UPDATE `Order Details` o1 SET UnitPrice = o1.UnitPrice,Quantity = o1.Quantity,Discount = o1.Discount 
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

## Update one field of entity filtered and fields of related entity

**Lambda:**

```Typescript
// Updates the ShipName field of the Orders entity and updates related details' UnitPrice and ProductID
Orders.update({ name: entity.name })
      .include(p => p.details(p => ({ unitPrice: p.unitPrice, productId: p.productId })))
			.filter(p => p.id === entity.id)
```

**SQL Result:**

```sql
-- Updates the ShipName field of the Orders entity where OrderID matches the provided entity's ID
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- Updates UnitPrice and ProductID fields in the Order Details table where OrderID and ProductID 
-- match the provided parameters
UPDATE `Order Details` o1 SET UnitPrice = o1.UnitPrice,ProductID = o1.ProductID 
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

## Update entity and multiples related entities

**Lambda:**

```Typescript
// Updates all fields of the Customers entity and includes related orders and details
Customers.update().include(p => p.orders.include(p => p.details))
```

**SQL Result:**

```sql
-- Updates all fields of the Customers entity where CustomerID matches the provided parameter
UPDATE Customers c SET CustomerID = ?,CompanyName = ?,ContactName = ?,ContactTitle = ?,Address = ?,City = ?,Region = ?,PostalCode = ?,Country = ? 
WHERE c.CustomerID = ? 

-- Updates all fields of the Orders entity where CustomerID matches the provided parameter
UPDATE Orders o SET CustomerID = ?,EmployeeID = ?,OrderDate = ?,RequiredDate = ?,ShippedDate = ?,ShipVia = ?,Freight = ?,ShipName = ?,ShipAddress = ?,ShipCity = ?,ShipRegion = ?,ShipPostalCode = ?,ShipCountry = ? 
WHERE o.OrderID = ? 

-- details is a composite relation included as it is: each detail sent is inserted or updated (upsert),
-- and the details of the order that were not sent are deleted (see "Update an aggregate" below)
INSERT INTO `Order Details`(OrderID,ProductID,UnitPrice,Quantity,Discount) VALUES(?,?,?,?,?)
ON DUPLICATE KEY UPDATE UnitPrice = VALUES(UnitPrice),Quantity = VALUES(Quantity),Discount = VALUES(Discount)
```

## Update an aggregate (composite relation)

When the included relation is **composite** (`composite: true`) and is included as it is (`include(p => p.lines)`), the update saves the whole aggregate:

- children sent that already exist are updated,
- children sent that do not exist are inserted (with the parent's key),
- children of the parent that were not sent are deleted,
- if the relation is absent from the data, the children are untouched.

The child entity needs a primary key.

```yaml
domain:
  entities:
    - name: Orders
      primaryKey: [id]
      properties:
        - { name: id, length: 36, required: true }
        - { name: status, length: 20, required: true }
      relations:
        - { name: lines, type: manyToOne, composite: true, from: id, entity: OrderLines, to: orderId }
    - name: OrderLines
      primaryKey: [orderId, line]
      properties:
        - { name: orderId, length: 36, required: true }
        - { name: line, type: integer, required: true }
        - { name: product, length: 40, required: true }
        - { name: quantity, type: integer }
```

**Lambda:**

```Typescript
const [order] = await orm.execute('Orders.filter(p => p.id == id).include(p => p.lines)', { id: orderId })
const kept = { ...order.lines.find(p => p.line === 1), quantity: 7 } // updated
const added = { orderId, line: 3, product: 'c', quantity: 3 }        // inserted
// line 2 is not sent: deleted
await orm.execute('Orders.update().include(p => p.lines)', { ...order, status: 'sent', lines: [kept, added] })
```

**SQL Result (PostgreSQL):**

```sql
UPDATE orders o SET status = $1 WHERE o.id = $2
-- one per child sent
INSERT INTO order_lines(order_id,line,product,quantity) VALUES($1,$2,$3,$4)
ON CONFLICT (order_id,line) DO UPDATE SET product = EXCLUDED.product, quantity = EXCLUDED.quantity
-- the children not sent
DELETE FROM order_lines WHERE order_id = $1 AND NOT ((order_id = $2 AND line = $3) OR (order_id = $4 AND line = $5))
```

Supported on PostgreSQL, MySQL and MariaDB, which have [upsert](Insert.md#upsert). On SQL Server and Oracle it fails with a clear "not supported yet" error. On MongoDB the composite children are embedded in the parent's document, so they are replaced there.

To only update the children sent (without inserting or deleting), include the relation with an explicit update: `Orders.update().include(p => p.lines.update(l => ({ quantity: l.quantity })))`.

## Code example

```Typescript
import { orm } from '../../lib'
import { Customers } from '../northwind/model/__model'
(async () => {	
	try {		
		await orm.init('./config/northwind.yaml')
		// entity customer with orders and order details
		const customer = {
			id: 'ALFKI',
			name: 'Alfreds Futterkiste',
			contact: 'Maria Anders',
			phone: 'Sales Representative',
			address: 'Obere Str. 57',
			city: 'Berlin',
			region: null,
			postalCode: '12209',
			country: 'Germany',
			orders: [
				{
					id: 1,
					customerId: 'ALFKI',
					employeeId: 6,
					orderDate: '1997-08-24T22:00:00.000Z',
					requiredDate: '1997-09-21T22:00:00.000Z',
					shippedDate: '1997-09-01T22:00:00.000Z',
					shipViaId: 1,
					freight: '29.4600',
					name: 'Alfreds Futterkiste',
					address: 'Obere Str. 57',
					city: 'Berlin',
					region: null,
					postalCode: '12209',
					country: 'Germany',
					details: [
						{
							orderId: 1,
							productId: 28,
							unitPrice: '45.6000',
							quantity: '15.0000',
							discount: '0.0000'
						},
						{
							orderId: 1,
							productId: 39,
							unitPrice: '18.0000',
							quantity: '21.0000',
							discount: '0.0000'
						},
						{
							orderId: 1,
							productId: 46,
							unitPrice: '12.0000',
							quantity: '2.0000',
							discount: '0.0000'
						}
					]
				},
				{
					id: 2,
					customerId: 'ALFKI',
					employeeId: 4,
					orderDate: '1997-10-02T22:00:00.000Z',
					requiredDate: '1997-10-30T23:00:00.000Z',
					shippedDate: '1997-10-12T22:00:00.000Z',
					shipViaId: 2,
					freight: '61.0200',
					name: 'Alfred-s Futterkiste',
					address: 'Obere Str. 57',
					city: 'Berlin',
					region: null,
					postalCode: '12209',
					country: 'Germany',
					details: [
						{
							orderId: 2,
							productId: 63,
							unitPrice: '43.9000',
							quantity: '20.0000',
							discount: '0.0000'
						}
					]
				}
			]
		}
		// Defining a query to update Customers and include related orders and details
		const query = () => Customers.update().include(p => p.orders.include(p => p.details))
		// Executing the query using the ORM with the specified customer parameter
		// the number of customers updated
		const result = await orm.execute(query, customer)
		console.log(result)		
	} catch (error:any) {
		console.error(error.stack)
	} finally {
		// Ending the ORM connection
		await orm.end()
	}
})()
```
