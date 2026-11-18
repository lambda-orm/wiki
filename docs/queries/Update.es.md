# Update {#update}

Esta página muestra cómo actualizar registros: todas las propiedades o solo algunas, con un filtro o para todos los registros, junto con entidades relacionadas, y cómo guardar un agregado completo (un padre con sus hijos de composición). El SQL que se muestra es el generado para MySQL, salvo que se indique otra cosa.

Una consulta se basa tanto en la expresión como en el esquema. Si no se indican las propiedades a actualizar, se actualizan todas las propiedades de la entidad. Cómo se almacena cada propiedad en cada fuente (nombres de tablas y columnas) lo resuelve el mapping de esa fuente en el esquema.

## Resultado: filas afectadas {#result-affected-rows}

`update` devuelve el **número de filas afectadas** (como hace `delete`). `0` significa que ninguna fila cumplió el filtro, lo que sirve para responder "no encontrado" o para detectar un conflicto con un bloqueo optimista:

```typescript
const query = 'Orders.update(p => ({ status: status, version: version + 1 })).filter(p => p.id == id && p.version == version)'
const first = await orm.execute(query, { id: orderId, status: 'sent', version: 1 })     // 1
const second = await orm.execute(query, { id: orderId, status: 'accepted', version: 1 }) // 0: the version changed
```

Cuando el update tiene includes, el resultado es el número de filas afectadas en la entidad principal.

## Actualizar todas las propiedades de un registro {#update-all-the-properties-of-a-record}

Sin filtro, `update` filtra por la clave primaria, cuyo valor se toma de los datos pasados.

**Lambda:**

```typescript
Orders.update()
```

**SQL resultante:**

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

## Actualizar una propiedad en todos los registros {#update-one-property-in-all-the-records}

Para actualizar todos los registros de una entidad se usa `updateAll` en lugar de `update`. Así se evita actualizar todos los registros por error.

**Lambda:**

```typescript
Orders.updateAll({ postalCode: postalCode })
```

**SQL resultante:**

```sql
UPDATE Orders o SET ShipPostalCode = ?
```

## Actualizar una propiedad con un filtro {#update-one-property-with-a-filter}

Actualiza el nombre del pedido cuyo id es `entity.id`.

**Lambda:**

```typescript
Orders.update({ name: entity.name }).filter(p => p.id === entity.id)
```

**SQL resultante:**

```sql
UPDATE Orders o SET ShipName = ? WHERE o.OrderID = ?
```

## Actualizar con una entidad relacionada {#update-with-a-related-entity}

Actualiza el nombre de un pedido y, para cada detalle enviado, todas las propiedades del detalle. Cada detalle se filtra por su clave primaria.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => p))
	.filter(p => p.id === entity.id)
```

**SQL resultante:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?,Quantity = ?,Discount = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

## Actualizar campos de la entidad relacionada {#update-fields-of-the-related-entity}

Actualiza el nombre de un pedido y solo el precio unitario de cada detalle enviado. En el update de la relación, `unitPrice` es el valor enviado para cada detalle.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => ({ unitPrice: unitPrice })))
	.filter(p => p.id === entity.id)
```

**SQL resultante:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

!!! note "Nota"
    Dentro del update de una relación, `p.unitPrice` hace referencia al valor actual de la columna, no al valor enviado: `p.details.update(p => ({ unitPrice: p.unitPrice }))` genera `SET UnitPrice = o1.UnitPrice`, lo que deja la columna como está.

## Actualizar una entidad y varias entidades relacionadas {#update-an-entity-and-several-related-entities}

Actualiza un cliente, sus pedidos y los detalles de cada pedido.

**Lambda:**

```typescript
Customers.update().include(p => p.orders.include(p => p.details))
```

**SQL resultante:**

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

## Actualizar un agregado (relación de composición) {#update-an-aggregate-composite-relation}

Cuando la relación incluida es de **composición** (`composite: true`) y se incluye tal cual (`include(p => p.lines)`), el update guarda el agregado completo:

- los hijos enviados que ya existen se actualizan,
- los hijos enviados que no existen se insertan (con la clave del padre),
- los hijos del padre que no se enviaron se eliminan,
- si la relación no está en los datos, los hijos no se tocan.

La entidad hija necesita una clave primaria. En este ejemplo, `Orders` tiene una relación de composición `lines`:

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

**SQL resultante (PostgreSQL):**

```sql
UPDATE orders o SET status = $1 WHERE o.id = $2
-- one per child sent
INSERT INTO order_lines(order_id,line,product,quantity) VALUES($1,$2,$3,$4)
ON CONFLICT (order_id,line) DO UPDATE SET product = EXCLUDED.product, quantity = EXCLUDED.quantity
-- the children not sent
DELETE FROM order_lines WHERE order_id = $1 AND NOT ((order_id = $2 AND line = $3) OR (order_id = $4 AND line = $5))
```

Está disponible en PostgreSQL, MySQL, MariaDB, SQL Server y Oracle (estos dos a partir de `@lambdaorm/lib` 3.5.0), que guardan los hijos con [upsert](Insert.md#upsert). En MongoDB los hijos de composición están embebidos en el documento del padre, por lo que se reemplazan allí.

Para actualizar solo los hijos enviados (sin insertar ni eliminar), se incluye la relación con un update explícito: `Orders.update().include(p => p.lines.update(l => ({ quantity: quantity })))`. Dentro de él, `quantity` es el valor enviado para cada hijo (ver [Actualizar campos de la entidad relacionada](#update-fields-of-the-related-entity)).

## Ejemplo de código {#code-example}

Actualiza un cliente con sus pedidos y sus detalles, e imprime el número de clientes actualizados.

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
