# Aktualisieren {#update}

Diese Seite zeigt, wie Sie Datensätze aktualisieren: alle Eigenschaften oder nur einige davon, mit einem Filter oder für alle Datensätze, zusammen mit verbundenen Entitäten, und wie Sie ein ganzes Aggregat speichern (ein Elternelement mit seinen Kompositions-Kindelementen). Das gezeigte SQL ist das für MySQL erzeugte, sofern nicht anders angegeben.

Eine Abfrage beruht sowohl auf dem Ausdruck als auch auf dem Schema. Wenn Sie die zu aktualisierenden Eigenschaften nicht angeben, werden alle Eigenschaften der Entität aktualisiert. Wie jede Eigenschaft in jeder Quelle gespeichert wird (Tabellen- und Spaltennamen), wird durch das Mapping dieser Quelle im Schema aufgelöst.

## Ergebnis: betroffene Zeilen {#result-affected-rows}

`update` gibt die **Anzahl der betroffenen Zeilen** zurück (wie `delete`). `0` bedeutet, dass keine Zeile dem Filter entsprach. Das ist nützlich, um mit „nicht gefunden“ zu antworten oder einen Konflikt bei optimistischem Sperren zu erkennen:

```typescript
const query = 'Orders.update(p => ({ status: status, version: version + 1 })).filter(p => p.id == id && p.version == version)'
const first = await orm.execute(query, { id: orderId, status: 'sent', version: 1 })     // 1
const second = await orm.execute(query, { id: orderId, status: 'accepted', version: 1 }) // 0: the version changed
```

Hat das Update Includes, ist das Ergebnis die Anzahl der betroffenen Zeilen in der Hauptentität.

## Alle Eigenschaften eines Datensatzes aktualisieren {#update-all-the-properties-of-a-record}

Ohne Filter filtert `update` nach dem Primärschlüssel, dessen Wert aus den übergebenen Daten genommen wird.

**Lambda:**

```typescript
Orders.update()
```

**SQL-Ergebnis:**

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

## Eine Eigenschaft in allen Datensätzen aktualisieren {#update-one-property-in-all-the-records}

Um alle Datensätze einer Entität zu aktualisieren, verwenden Sie `updateAll` statt `update`. So wird verhindert, dass versehentlich alle Datensätze aktualisiert werden.

**Lambda:**

```typescript
Orders.updateAll({ postalCode: postalCode })
```

**SQL-Ergebnis:**

```sql
UPDATE Orders o SET ShipPostalCode = ?
```

## Eine Eigenschaft mit einem Filter aktualisieren {#update-one-property-with-a-filter}

Aktualisiert den Namen der Bestellung, deren ID `entity.id` ist.

**Lambda:**

```typescript
Orders.update({ name: entity.name }).filter(p => p.id === entity.id)
```

**SQL-Ergebnis:**

```sql
UPDATE Orders o SET ShipName = ? WHERE o.OrderID = ?
```

## Einen Pfad einer json-Eigenschaft aktualisieren {#update-a-path-of-a-json-property}

Um einen Wert innerhalb einer `json`-Eigenschaft zu ändern, ohne das ganze json zu senden, verwenden Sie `jsonSet(json, path, value)`. Der Rest des json bleibt unverändert.

**Lambda:**

```typescript
Customers.update(p => ({ meta: jsonSet(p.meta, "address.city", city) })).filter(p => p.id == id)
```

**SQL-Ergebnis:**

```sql
UPDATE Customers c SET meta = JSON_SET(COALESCE(c.meta, JSON_OBJECT()), '$.address.city', CAST(? AS JSON))
WHERE c.id = ?
```

Die Übersetzung für jede Engine steht unter [JSON, Vektoren und Punkte](JsonVectorsPoints.md#write-a-path).

## Aktualisieren mit einer verbundenen Entität {#update-with-a-related-entity}

Aktualisiert den Namen einer Bestellung und für jede übermittelte Position alle Eigenschaften der Position. Jede Position wird über ihren Primärschlüssel gefiltert.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => p))
	.filter(p => p.id === entity.id)
```

**SQL-Ergebnis:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?,Quantity = ?,Discount = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

## Felder der verbundenen Entität aktualisieren {#update-fields-of-the-related-entity}

Aktualisiert den Namen einer Bestellung und nur den Stückpreis jeder übermittelten Position. Im Update der Beziehung ist `unitPrice` der für jede Position gesendete Wert.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => ({ unitPrice: unitPrice })))
	.filter(p => p.id === entity.id)
```

**SQL-Ergebnis:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

!!! note "Hinweis"
    Innerhalb des Updates einer Beziehung bezieht sich `p.unitPrice` auf den aktuellen Wert der Spalte, nicht auf den gesendeten Wert: `p.details.update(p => ({ unitPrice: p.unitPrice }))` erzeugt `SET UnitPrice = o1.UnitPrice`, wodurch die Spalte unverändert bleibt.

## Eine Entität und mehrere verbundene Entitäten aktualisieren {#update-an-entity-and-several-related-entities}

Aktualisiert einen Kunden, seine Bestellungen und die Positionen jeder Bestellung.

**Lambda:**

```typescript
Customers.update().include(p => p.orders.include(p => p.details))
```

**SQL-Ergebnis:**

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

## Ein Aggregat aktualisieren (Kompositionsbeziehung) {#update-an-aggregate-composite-relation}

Wenn die eingebundene Beziehung eine **Komposition** ist (`composite: true`) und unverändert eingebunden wird (`include(p => p.lines)`), speichert das Update das gesamte Aggregat:

- gesendete Kindelemente, die bereits existieren, werden aktualisiert,
- gesendete Kindelemente, die nicht existieren, werden eingefügt (mit dem Schlüssel des Elternelements),
- Kindelemente des Elternelements, die nicht gesendet wurden, werden gelöscht,
- fehlt die Beziehung in den Daten, bleiben die Kindelemente unverändert.

Die Kind-Entität benötigt einen Primärschlüssel. In diesem Beispiel hat `Orders` eine Kompositionsbeziehung `lines`:

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

**SQL-Ergebnis (PostgreSQL):**

```sql
UPDATE orders o SET status = $1 WHERE o.id = $2
-- one per child sent
INSERT INTO order_lines(order_id,line,product,quantity) VALUES($1,$2,$3,$4)
ON CONFLICT (order_id,line) DO UPDATE SET product = EXCLUDED.product, quantity = EXCLUDED.quantity
-- the children not sent
DELETE FROM order_lines WHERE order_id = $1 AND NOT ((order_id = $2 AND line = $3) OR (order_id = $4 AND line = $5))
```

Dies wird auf PostgreSQL, MySQL, MariaDB, SQL Server und Oracle (die beiden letzteren ab `@lambdaorm/lib` 3.5.0) sowie auf SQLite (ab 3.15.0) unterstützt, die die Kindelemente mit [upsert](Insert.md#upsert) speichern. Auf MongoDB sind die Kompositions-Kindelemente in das Dokument des Elternelements eingebettet und werden daher dort ersetzt.

Um nur die gesendeten Kindelemente zu aktualisieren (ohne Einfügen oder Löschen), binden Sie die Beziehung mit einem expliziten Update ein: `Orders.update().include(p => p.lines.update(l => ({ quantity: quantity })))`. Darin ist `quantity` der für jedes Kindelement gesendete Wert (siehe [Felder der verbundenen Entität aktualisieren](#update-fields-of-the-related-entity)).

## Codebeispiel {#code-example}

Aktualisiert einen Kunden mit seinen Bestellungen und deren Positionen und gibt die Anzahl der aktualisierten Kunden aus.

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
