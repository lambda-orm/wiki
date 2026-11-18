# Transaction

A transaction groups several executions so that they are all committed together or all rolled back. In λORM a
transaction is opened with `orm.transaction(options, callback)`.

## Usage

`orm.transaction` receives:

- `options`: the query options, for example the stage (`{ stage: 'default' }`);
- `callback`: an async function that receives a transaction object (named `tr` in the examples) and executes the
  queries with `tr.execute(query, data, options)`.

When the callback ends, λORM commits; if it throws, λORM rolls back.

```typescript
await orm.transaction({ stage: 'default' }, async tr => {
  await tr.execute('Quotes.insert()', quote)
  // orm.execute inside the callback also joins the transaction
  await orm.execute('Accounts.update(p => ({ lastQuoteAt: at })).filter(p => p.id == id)', { id: quote.accountId, at: new Date() })
  // another stage: same transaction
  await tr.execute('QuoteSummaries.insert()', summary, { stage: 'insights' })
})
```

## Behavior

- The promise resolves after the commit and **rejects with the callback's error after the rollback**. If the rollback
  itself fails, the callback's error is still the one reported.
- **Everything executed inside the callback joins the transaction**: `tr.execute`, `orm.execute`, repositories, and the
  `orm.execute` of a listener or of an expression. They run on the transaction's connections (one per source), so a
  rollback undoes them in every source.
- A nested `orm.transaction` joins the outer one: there is a single commit, done by the outer transaction.
- An execution without a stage runs on the transaction's stage. **An execution with another stage joins the
  transaction too** (since @lambdaorm/lib 3.3.0): every stage shares the transaction's connections, and they commit or
  roll back together.
- A finished transaction rejects later executions.

!!! warning
    There is no two-phase commit: with several databases, the commit is done source by source. If a later commit
    fails, the earlier ones are kept.

To run several queries in one transaction from a single call — also over the [Data Gateway](../data-gateway/index.md)
or the CLI — see [Script](Script.md).

## Example

The order and its details are inserted, read, updated and deleted in the same transaction:

```typescript
import { orm } from '@lambdaorm/lib'
import { Orders } from './northwind/domain/model'

(async () => {
  try {
    await orm.init('./config/northwind.yaml')
    const order = {
      customerId: 'VINET', employeeId: 5, orderDate: '1996-07-03T22:00:00.000Z', requiredDate: '1996-07-31T22:00:00.000Z',
      shippedDate: '1996-07-15T22:00:00.000Z', shipViaId: 3, freight: 32.38, name: 'Vins et alcools Chevalier',
      address: '59 rue de l-Abbaye', city: 'Reims', region: null, postalCode: '51100', country: 'France',
      details: [
        { productId: 11, unitPrice: 14, quantity: 12, discount: false },
        { productId: 42, unitPrice: 9.8, quantity: 10, discount: false },
        { productId: 72, unitPrice: 34.8, quantity: 5, discount: false }
      ]
    }
    await orm.transaction({ stage: 'default' }, async (tr) => {
      // create the order
      const orderId = await tr.execute(() => Orders.insert().include(p => p.details), order)
      // get the order
      const result = await tr.execute((id: number) => Orders.filter(p => p.id === id).include(p => p.details), { id: orderId })
      const order2 = result[0]
      // update the order
      order2.address = 'changed 59 rue de l-Abbaye'
      order2.details[0].discount = true
      order2.details[1].unitPrice = 10
      order2.details[2].quantity = 7
      const updateCount = await tr.execute(() => Orders.update().include(p => p.details), order2)
      console.log(updateCount)
      // get the order again
      const order3 = await tr.execute((id: number) => Orders.filter(p => p.id === id).include(p => p.details), { id: orderId })
      console.log(JSON.stringify(order3))
      // delete the order
      const deleteCount = await tr.execute(() => Orders.delete().include(p => p.details), order3[0])
      console.log(deleteCount)
      // the order no longer exists
      const order4 = await tr.execute((id: number) => Orders.filter(p => p.id === id).include(p => p.details), { id: orderId })
      console.log(JSON.stringify(order4))
    })
  } catch (error: any) {
    console.error(error.stack)
  } finally {
    // close the connections
    await orm.end()
  }
})()
```
