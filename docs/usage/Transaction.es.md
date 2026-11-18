# Transacción {#transaction}

Una transacción agrupa varias ejecuciones para que se confirmen todas juntas o se reviertan todas. En λORM una
transacción se abre con `orm.transaction(options, callback)`.

## Uso {#usage}

`orm.transaction` recibe:

- `options`: las opciones de la consulta, por ejemplo el stage (`{ stage: 'default' }`);
- `callback`: una función asíncrona que recibe un objeto de transacción (llamado `tr` en los ejemplos) y ejecuta las
  consultas con `tr.execute(query, data, options)`.

Cuando el callback termina, λORM confirma (commit); si lanza un error, λORM revierte (rollback).

```typescript
await orm.transaction({ stage: 'default' }, async tr => {
  await tr.execute('Quotes.insert()', quote)
  // orm.execute inside the callback also joins the transaction
  await orm.execute('Accounts.update(p => ({ lastQuoteAt: at })).filter(p => p.id == id)', { id: quote.accountId, at: new Date() })
  // another stage: same transaction
  await tr.execute('QuoteSummaries.insert()', summary, { stage: 'insights' })
})
```

## Comportamiento {#behavior}

- La promesa se resuelve después del commit y **se rechaza con el error del callback después del rollback**. Si el
  propio rollback falla, el error que se informa sigue siendo el del callback.
- **Todo lo que se ejecuta dentro del callback se une a la transacción**: `tr.execute`, `orm.execute`, los repositorios y
  el `orm.execute` de un listener o de una expresión. Se ejecutan sobre las conexiones de la transacción (una por
  fuente), así que un rollback los deshace en todas las fuentes.
- Un `orm.transaction` anidado se une al externo: hay un único commit, que hace la transacción externa.
- Una ejecución sin stage se ejecuta en el stage de la transacción. **Una ejecución con otro stage también se une a la
  transacción** (desde @lambdaorm/lib 3.3.0): todos los stages comparten las conexiones de la transacción, y se
  confirman o revierten juntos.
- Una transacción terminada rechaza las ejecuciones posteriores.

!!! warning "Advertencia"
    No hay commit en dos fases: con varias bases de datos, el commit se hace fuente por fuente. Si un commit posterior
    falla, los anteriores se mantienen.

Para ejecutar varias consultas en una sola transacción con una única llamada —también a través del
[Data Gateway](../data-gateway/index.md) o de la CLI—, ver [Script](Script.md).

## Ejemplo {#example}

El pedido y sus detalles se insertan, se leen, se actualizan y se eliminan en la misma transacción:

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
