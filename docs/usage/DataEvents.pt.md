# Mudanças dos dados e outbox {#changes-of-the-data-and-outbox}

Cada escrita que passa pelo λORM pode ser anunciada como uma **mudança dos dados**: qual entidade mudou, como e as
chaves das linhas. Serve para invalidar um cache, avisar outros serviços ou alimentar um índice de busca sem escrever
um [listener](../schema/SchemaExample-Listener.md) por entidade. Quando as mudanças precisam ser entregues mesmo que o
processo pare, declara-se um **outbox**: então elas são escritas na mesma transação que os dados.

## Escutar as mudanças {#listening-to-the-changes}

```ts
const off = orm.onDataChange(async changes => {
  for (const change of changes) {
    console.log(change.entity, change.action, change.keys)   // Orders update [ { id: 7 } ]
  }
})
// depois: parar de escutar
off()
```

O listener recebe uma lista de mudanças:

| Campo | Descrição |
| :-- | :-- |
| `id` | Id da mudança (um ULID). |
| `entity` | A entidade escrita, por exemplo `Orders`. |
| `action` | `insert`, `update`, `delete`, `upsert`, `bulkInsert`, `bulkMerge` ou `bulkDelete`. |
| `keys` | As chaves primárias das linhas, quando são conhecidas. |
| `count` | As linhas afetadas, quando o mecanismo as informa. |
| `source`, `stage`, `view` | Onde foi escrita e com qual [view](../schema/Views.md). |
| `actor` | Quem a fez (`actor` das opções da consulta, veja [Contexto](../schema/Context.md)). |
| `transaction` | O id da transação: as mudanças de um mesmo commit o compartilham. |
| `time` | Quando, em ISO 8601. |

- **Uma mudança por sentença que escreve**: inserir um pedido com seus detalhes gera uma mudança de `Orders` e uma de
  `Orders.details`.
- **Depois do commit.** As mudanças de uma [transação](Transaction.md) ou de um [script](Script.md) chegam juntas, em
  ordem, quando o commit terminou; um rollback não emite nada. Fora de uma transação, cada uma chega quando sua
  sentença termina bem.
- **As chaves, nunca os valores escritos** (podem ser dados pessoais; quem precisa deles os lê, com sua view). Um
  insert, um upsert ou uma escrita por chave (`update(entity)`, `filter(p => p.id == id)`) dá as chaves; um update ou
  delete com outro filtro dá apenas a entidade e seu `count`.
- **Os listeners não são aguardados**: não atrasam nem fazem falhar uma escrita, e seus erros vão para o log.
- **Por processo**: cada instância do λORM anuncia o que ela escreveu. Várias instâncias (por exemplo vários gateways)
  precisam compartilhar as mudanças por meio de algo externo, como Redis ou Kafka.

## Outbox {#outbox}

`onDataChange` se perde se o processo parar entre o commit e a entrega. Para entregar as mudanças com garantia,
declara-se um outbox: cada mudança é escrita, **antes do commit e na mesma transação**, na entidade `LambdaOrmOutbox`,
e um despachante a entrega depois.

```yaml
infrastructure:
  outbox:
    entities: [Orders, Customers]                            # sem entities: todas
    actions: [insert, update, delete]                        # sem actions: todas
    condition: 'action != "delete" || entity == "Orders"'    # uma expressão sobre a mudança
    maxAttempts: 10                                          # padrão: 10
```

`LambdaOrmOutbox` é adicionada ao domínio e criada pelo [push](../cli/Commands/Push.md); o stage a roteia como qualquer
outra entidade. Um evento tem o conteúdo de uma mudança (sem os valores escritos) mais sua entrega: `status`
(`pending`, `done` ou `dead`), `attempts`, `nextAttempt` e `error`.

Entregar os eventos com uma função:

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// ...
await dispatcher.stop()
```

Cada evento que a função resolve fica concluído; um que ela rejeita é tentado de novo mais tarde, com uma espera que
cresce (1, 2, 4… segundos, uma hora no máximo), e fica `dead` depois de `maxAttempts`. Para entregá-los você mesmo:

```ts
const events = await orm.outbox.pending({ limit: 100 })   // pendentes, e cuja próxima tentativa chegou
await orm.outbox.done(events.map(p => p.id))
await orm.outbox.failed(id, error)                         // tentado de novo mais tarde, ou morto
```

!!! note "Nota"
    Com um único banco de dados, a mudança e seu evento são atômicos. Com várias fontes, eles são confirmados como
    qualquer transação do λORM entre fontes: uma depois da outra. Deve haver um único despachante por outbox: dois
    poderiam pegar o mesmo evento.
