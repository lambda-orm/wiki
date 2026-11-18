# Update

This page shows how to update records: all the properties or only some of them, with a filter or for all the records, together with related entities, and how to save a whole aggregate (a parent with its composite children). The SQL shown is the one generated for MySQL, unless stated otherwise.

A query is based on both the expression and the schema. If you do not specify the properties to update, all the properties of the entity are updated. How each property is stored in each source (table and column names) is resolved by the mapping of that source in the schema.

## Result: affected rows

`update` returns the **number of affected rows** (as `delete` does). `0` means that no row matched the filter, which is useful to answer "not found" or to detect a conflict with an optimistic lock:

```typescript
const query = 'Orders.update(p => ({ status: status, version: version + 1 })).filter(p => p.id == id && p.version == version)'
const first = await orm.execute(query, { id: orderId, status: 'sent', version: 1 })     // 1
const second = await orm.execute(query, { id: orderId, status: 'accepted', version: 1 }) // 0: the version changed
```

When the update has includes, the result is the number of rows affected in the main entity.

## Update all the properties of a record

Without a filter, `update` filters by the primary key, whose value is taken from the data passed.

**Lambda:**

```typescript
Orders.update()
```

**SQL Result:**

```sql
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

## Update one property in all the records

To update all the records of an entity, use `updateAll` instead of `update`. This prevents updating all the records by mistake.

**Lambda:**

```typescript
Orders.updateAll({ postalCode: postalCode })
```

**SQL Result:**

```sql
UPDATE Orders o SET ShipPostalCode = ?
```

## Update one property with a filter

Updates the name of the order whose id is `entity.id`.

**Lambda:**

```typescript
Orders.update({ name: entity.name }).filter(p => p.id === entity.id)
```

**SQL Result:**

```sql
UPDATE Orders o SET ShipName = ? WHERE o.OrderID = ?
```

## Update with a related entity

Updates the name of an order and, for each detail sent, all the properties of the detail. Each detail is filtered by its primary key.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => p))
	.filter(p => p.id === entity.id)
```

**SQL Result:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?,Quantity = ?,Discount = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

## Update fields of the related entity

Updates the name of an order and only the unit price of each detail sent. In the update of the relation, `unitPrice` is the value sent for each detail.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => ({ unitPrice: unitPrice })))
	.filter(p => p.id === entity.id)
```

**SQL Result:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

!!! note
    Inside the update of a relation, `p.unitPrice` refers to the current value of the column, not to the value sent: `p.details.update(p => ({ unitPrice: p.unitPrice }))` generates `SET UnitPrice = o1.UnitPrice`, which leaves the column as it is.

## Update an entity and several related entities

Updates a customer, its orders and the details of each order.

**Lambda:**

```typescript
Customers.update().include(p => p.orders.include(p => p.details))
```

**SQL Result:**

```sql
-- the customer
UPDATE Customers c SET CustomerID = ?,CompanyName = ?,ContactName = ?,ContactTitle = ?,Address = ?,City = ?,Region = ?,PostalCode = ?,Country = ?
WHERE c.CustomerID = ?

-- each order of the customer
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

The child entity needs a primary key. In this example, `Orders` has a composite relation `lines`:

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

```typescript
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

It is supported on PostgreSQL, MySQL, MariaDB, SQL Server and Oracle (these two from `@lambdaorm/lib` 3.5.0), which save the children with [upsert](Insert.md#upsert). On MongoDB the composite children are embedded in the parent's document, so they are replaced there.

To only update the children sent (without inserting or deleting), include the relation with an explicit update: `Orders.update().include(p => p.lines.update(l => ({ quantity: quantity })))`. Inside it, `quantity` is the value sent for each child (see [Update fields of the related entity](#update-fields-of-the-related-entity)).

## Code example

Updates a customer with its orders and their details, and prints the number of customers updated.

```typescript
import { orm } from '@lambdaorm/lib'
import { Customers } from './domain/model' // model generated by `lambdaorm build`

(async () => {
	try {
		await orm.init('./lambdaORM.yaml')
		// customer with its orders and their details
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
		const query = () => Customers.update().include(p => p.orders.include(p => p.details))
		// returns the number of customers updated
		const result = await orm.execute(query, customer)
		console.log(result)
	} catch (error: any) {
		console.error(error.stack)
	} finally {
		// releases the connections
		await orm.end()
	}
})()
```
