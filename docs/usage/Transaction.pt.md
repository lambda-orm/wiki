# Transação {#transaction}

Uma transação agrupa várias execuções para que todas sejam confirmadas juntas ou todas revertidas. No λORM, uma
transação é aberta com `orm.transaction(options, callback)`.

## Uso {#usage}

`orm.transaction` recebe:

- `options`: as opções da consulta, por exemplo o stage (`{ stage: 'default' }`);
- `callback`: uma função assíncrona que recebe um objeto de transação (chamado `tr` nos exemplos) e executa as
  consultas com `tr.execute(query, data, options)`.

Quando o callback termina, o λORM faz o commit; se ele lançar um erro, o λORM faz o rollback.

```typescript
await orm.transaction({ stage: 'default' }, async tr => {
  await tr.execute('Quotes.insert()', quote)
  // orm.execute inside the callback also joins the transaction
  await orm.execute('Accounts.update(p => ({ lastQuoteAt: at })).filter(p => p.id == id)', { id: quote.accountId, at: new Date() })
  // another stage: same transaction
  await tr.execute('QuoteSummaries.insert()', summary, { stage: 'insights' })
})
```

## Comportamento {#behavior}

- A promise é resolvida após o commit e **rejeitada com o erro do callback após o rollback**. Se o próprio rollback
  falhar, o erro informado continua sendo o do callback.
- **Tudo o que é executado dentro do callback participa da transação**: `tr.execute`, `orm.execute`, os repositórios e
  o `orm.execute` de um listener ou de uma expressão. Eles são executados nas conexões da transação (uma por fonte), de
  modo que um rollback os desfaz em todas as fontes.
- Um `orm.transaction` aninhado participa da transação externa: há um único commit, feito pela transação externa.
- Uma execução sem stage é executada no stage da transação. **Uma execução com outro stage também participa da
  transação** (desde @lambdaorm/lib 3.3.0): todos os stages compartilham as conexões da transação, e o commit ou o
  rollback é feito em conjunto.
- Uma transação finalizada rejeita execuções posteriores.

!!! warning "Aviso"
    Não há commit em duas fases (two-phase commit): com vários bancos de dados, o commit é feito fonte por fonte. Se um
    commit posterior falhar, os anteriores são mantidos.

Para executar várias consultas em uma transação a partir de uma única chamada — também pelo [Data Gateway](../data-gateway/index.md)
ou pela CLI —, veja [Script](Script.md).

## Exemplo {#example}

O pedido e seus detalhes são inseridos, lidos, atualizados e excluídos na mesma transação:

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
