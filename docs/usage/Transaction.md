# Transaction

To work with transactions use the `orm.transaction(options, callback)` method.

It receives the options (the stage, `{ stage: 'default' }`) and a callback that receives a transaction object, in the
examples named `tr`. When the callback ends the orm commits; if it throws, the orm rolls back.

## Behaviour

- The promise resolves after the commit and **rejects with the callback's error after the rollback**. If the rollback
  itself fails, the callback's error is still the one reported.
- **Everything executed inside the callback joins the transaction**: `tr.execute`, `orm.execute`, repositories, the
  `orm.execute` of a listener or of an expression. It runs on the transaction's connections (one per source), so a
  rollback undoes it in every source.
- A nested `orm.transaction` joins the outer one: one commit, done by the outer.
- An execution without stage runs on the transaction's stage. **An execution with another stage joins the transaction
  too** (since @lambdaorm/lib 3.3.0): every stage shares the transaction's connections and they commit or roll back
  together.
- A finished transaction refuses later executions.
- There is no two-phase commit: with several databases the commit goes source by source; if a later commit fails the
  earlier ones stay.
- To send several queries in one transaction from a single call (also over REST), see [Script](Script.md).

```Typescript
await orm.transaction({ stage: 'default' }, async tr => {
	await tr.execute('Quotes.insert()', quote)
	// orm.execute inside the callback also joins the transaction
	await orm.execute('Accounts.update(p => ({ lastQuoteAt: at })).filter(p => p.id == id)', { id: quote.accountId, at: new Date() })
	// another stage: same transaction
	await tr.execute('QuoteSummaries.insert()', summary, { stage: 'insights' })
})
```

**Example:**

```Typescript
import { orm } from '../../lib'
import { Orders } from '../northwind/model/__model'
(async () => {	
	try {		
		await orm.init('./config/northwind.yaml')
		const order = { customerId: 'VINET', employeeId: 5, orderDate: '1996-07-03T22:00:00.000Z', requiredDate: '1996-07-31T22:00:00.000Z', shippedDate: '1996-07-15T22:00:00.000Z', shipViaId: 3, freight: 32.38, name: 'Vins et alcools Chevalier', address: '59 rue de l-Abbaye', city: 'Reims', region: null, postalCode: '51100', country: 'France', details: [{ productId: 11, unitPrice: 14, quantity: 12, discount: !1 }, { productId: 42, unitPrice: 9.8, quantity: 10, discount: !1 }, { productId: 72, unitPrice: 34.8, quantity: 5, discount: !1 }] }

		await orm.transaction({ stage: 'source' }, async (tr) => {
		// create order
		const orderId = await tr.execute(() => Orders.insert().include(p => p.details), order)
		// get order
		const result = await tr.execute((id: number) => Orders.filter(p => p.id === id).include(p => p.details), { id: orderId })
		const order2 = result[0]
		// updated order
		order2.address = 'changed 59 rue de l-Abbaye'
		order2.details[0].discount = true
		order2.details[1].unitPrice = 10
		order2.details[2].quantity = 7
		const updateCount = await tr.execute(() => Orders.update().include(p => p.details), order2)
		console.log(updateCount)
		// get order
		const order3 = await tr.execute((id: number) => Orders.filter(p => p.id === id).include(p => p.details), { id: orderId })
		console.log(JSON.stringify(order3))
		// delete
		const deleteCount = await tr.execute(() => Orders.delete().include(p => p.details), order3[0])
		console.log(deleteCount)
		// get order
		const order4 = await tr.execute((id: number) => Orders.filter(p => p.id === id).include(p => p.details), { id: orderId })
		console.log(JSON.stringify(order4))
	})	
} catch (error:any) {
	console.error(error.stack)
} finally {
	// Ending the ORM connection
	await orm.end()
}
})()
```
