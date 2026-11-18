# Transaktion {#transaction}

Eine Transaktion fasst mehrere Ausführungen zusammen, sodass sie entweder alle gemeinsam bestätigt (Commit) oder alle zurückgerollt werden. In λORM wird eine
Transaktion mit `orm.transaction(options, callback)` geöffnet.

## Verwendung {#usage}

`orm.transaction` erhält:

- `options`: die Abfrageoptionen, zum Beispiel den Stage (`{ stage: 'default' }`);
- `callback`: eine asynchrone Funktion, die ein Transaktionsobjekt erhält (in den Beispielen `tr` genannt) und die
  Abfragen mit `tr.execute(query, data, options)` ausführt.

Wenn der Callback endet, führt λORM den Commit aus; wirft er einen Fehler, führt λORM einen Rollback aus.

```typescript
await orm.transaction({ stage: 'default' }, async tr => {
  await tr.execute('Quotes.insert()', quote)
  // orm.execute inside the callback also joins the transaction
  await orm.execute('Accounts.update(p => ({ lastQuoteAt: at })).filter(p => p.id == id)', { id: quote.accountId, at: new Date() })
  // another stage: same transaction
  await tr.execute('QuoteSummaries.insert()', summary, { stage: 'insights' })
})
```

## Verhalten {#behavior}

- Das Promise wird nach dem Commit erfüllt und **nach dem Rollback mit dem Fehler des Callbacks abgelehnt**. Schlägt der Rollback
  selbst fehl, wird weiterhin der Fehler des Callbacks gemeldet.
- **Alles, was innerhalb des Callbacks ausgeführt wird, nimmt an der Transaktion teil**: `tr.execute`, `orm.execute`, Repositories und das
  `orm.execute` eines Listeners oder eines Ausdrucks. Sie laufen auf den Verbindungen der Transaktion (eine pro Quelle), sodass ein
  Rollback sie in jeder Quelle rückgängig macht.
- Eine verschachtelte `orm.transaction` nimmt an der äußeren teil: Es gibt einen einzigen Commit, der von der äußeren Transaktion ausgeführt wird.
- Eine Ausführung ohne Stage läuft auf dem Stage der Transaktion. **Auch eine Ausführung mit einem anderen Stage nimmt an der
  Transaktion teil** (seit @lambdaorm/lib 3.3.0): Alle Stages teilen sich die Verbindungen der Transaktion und werden gemeinsam bestätigt oder
  zurückgerollt.
- Eine abgeschlossene Transaktion lehnt spätere Ausführungen ab.

!!! warning "Warnung"
    Es gibt keinen Zwei-Phasen-Commit: Bei mehreren Datenbanken erfolgt der Commit Quelle für Quelle. Schlägt ein späterer Commit
    fehl, bleiben die früheren erhalten.

Um mehrere Abfragen mit einem einzigen Aufruf in einer Transaktion auszuführen — auch über das [Data Gateway](../data-gateway/index.md)
oder die CLI —, siehe [Skript](Script.md).

## Beispiel {#example}

Die Bestellung und ihre Positionen werden in derselben Transaktion eingefügt, gelesen, aktualisiert und gelöscht:

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
