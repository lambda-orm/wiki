# Update {#update}

Esta página mostra como atualizar registros: todas as propriedades ou apenas algumas, com um filtro ou para todos os registros, junto com entidades relacionadas, e como salvar um agregado inteiro (um pai com seus filhos compostos). O SQL mostrado é o gerado para MySQL, salvo indicação em contrário.

Uma consulta se baseia tanto na expressão quanto no esquema. Se as propriedades a atualizar não forem especificadas, todas as propriedades da entidade são atualizadas. A forma como cada propriedade é armazenada em cada fonte (nomes de tabelas e colunas) é resolvida pelo mapeamento dessa fonte no esquema.

## Resultado: linhas afetadas {#result-affected-rows}

`update` retorna o **número de linhas afetadas** (como faz `delete`). `0` significa que nenhuma linha atendeu ao filtro, o que é útil para responder "não encontrado" ou para detectar um conflito com um bloqueio otimista:

```typescript
const query = 'Orders.update(p => ({ status: status, version: version + 1 })).filter(p => p.id == id && p.version == version)'
const first = await orm.execute(query, { id: orderId, status: 'sent', version: 1 })     // 1
const second = await orm.execute(query, { id: orderId, status: 'accepted', version: 1 }) // 0: the version changed
```

Quando o update tem includes, o resultado é o número de linhas afetadas na entidade principal.

## Atualizar todas as propriedades de um registro {#update-all-the-properties-of-a-record}

Sem filtro, `update` filtra pela chave primária, cujo valor é obtido dos dados passados.

**Lambda:**

```typescript
Orders.update()
```

**Resultado SQL:**

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

## Atualizar uma propriedade em todos os registros {#update-one-property-in-all-the-records}

Para atualizar todos os registros de uma entidade, use `updateAll` em vez de `update`. Isso evita atualizar todos os registros por engano.

**Lambda:**

```typescript
Orders.updateAll({ postalCode: postalCode })
```

**Resultado SQL:**

```sql
UPDATE Orders o SET ShipPostalCode = ?
```

## Atualizar uma propriedade com um filtro {#update-one-property-with-a-filter}

Atualiza o nome do pedido cujo id é `entity.id`.

**Lambda:**

```typescript
Orders.update({ name: entity.name }).filter(p => p.id === entity.id)
```

**Resultado SQL:**

```sql
UPDATE Orders o SET ShipName = ? WHERE o.OrderID = ?
```

## Atualizar com uma entidade relacionada {#update-with-a-related-entity}

Atualiza o nome de um pedido e, para cada detalhe enviado, todas as propriedades do detalhe. Cada detalhe é filtrado pela sua chave primária.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => p))
	.filter(p => p.id === entity.id)
```

**Resultado SQL:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?,Quantity = ?,Discount = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

## Atualizar campos da entidade relacionada {#update-fields-of-the-related-entity}

Atualiza o nome de um pedido e apenas o preço unitário de cada detalhe enviado. No update da relação, `unitPrice` é o valor enviado para cada detalhe.

**Lambda:**

```typescript
Orders.update({ name: entity.name })
	.include(p => p.details.update(p => ({ unitPrice: unitPrice })))
	.filter(p => p.id === entity.id)
```

**Resultado SQL:**

```sql
-- the order
UPDATE Orders o SET ShipName = ?
WHERE o.OrderID = ?

-- each detail sent
UPDATE `Order Details` o1 SET UnitPrice = ?
WHERE (o1.OrderID = ? AND o1.ProductID = ?)
```

!!! note "Nota"
    Dentro do update de uma relação, `p.unitPrice` se refere ao valor atual da coluna, não ao valor enviado: `p.details.update(p => ({ unitPrice: p.unitPrice }))` gera `SET UnitPrice = o1.UnitPrice`, o que deixa a coluna como está.

## Atualizar uma entidade e várias entidades relacionadas {#update-an-entity-and-several-related-entities}

Atualiza um cliente, seus pedidos e os detalhes de cada pedido.

**Lambda:**

```typescript
Customers.update().include(p => p.orders.include(p => p.details))
```

**Resultado SQL:**

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

## Atualizar um agregado (relação composta) {#update-an-aggregate-composite-relation}

Quando a relação incluída é **composta** (`composite: true`) e é incluída tal como está (`include(p => p.lines)`), o update salva o agregado inteiro:

- os filhos enviados que já existem são atualizados,
- os filhos enviados que não existem são inseridos (com a chave do pai),
- os filhos do pai que não foram enviados são excluídos,
- se a relação estiver ausente dos dados, os filhos não são alterados.

A entidade filha precisa de uma chave primária. Neste exemplo, `Orders` tem uma relação composta `lines`:

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

**Resultado SQL (PostgreSQL):**

```sql
UPDATE orders o SET status = $1 WHERE o.id = $2
-- one per child sent
INSERT INTO order_lines(order_id,line,product,quantity) VALUES($1,$2,$3,$4)
ON CONFLICT (order_id,line) DO UPDATE SET product = EXCLUDED.product, quantity = EXCLUDED.quantity
-- the children not sent
DELETE FROM order_lines WHERE order_id = $1 AND NOT ((order_id = $2 AND line = $3) OR (order_id = $4 AND line = $5))
```

É suportado em PostgreSQL, MySQL, MariaDB, SQL Server e Oracle (estes dois a partir de `@lambdaorm/lib` 3.5.0), que salvam os filhos com [upsert](Insert.md#upsert). No MongoDB, os filhos compostos ficam embutidos no documento do pai, por isso são substituídos ali.

Para atualizar apenas os filhos enviados (sem inserir nem excluir), inclua a relação com um update explícito: `Orders.update().include(p => p.lines.update(l => ({ quantity: quantity })))`. Dentro dele, `quantity` é o valor enviado para cada filho (veja [Atualizar campos da entidade relacionada](#update-fields-of-the-related-entity)).

## Exemplo de código {#code-example}

Atualiza um cliente com seus pedidos e os detalhes deles, e imprime o número de clientes atualizados.

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
