# Changes of the data and outbox

Every write that goes through λORM can be announced as a **change of the data**: which entity changed, how, and the
keys of the rows. Use it to invalidate a cache, notify other services or feed a search index without writing a
[listener](../schema/SchemaExample-Listener.md) for each entity. When the changes must be delivered even if the
process stops, declare an **outbox**: they are then written in the same transaction as the data.

## Listening to the changes

```ts
const off = orm.onDataChange(async changes => {
  for (const change of changes) {
    console.log(change.entity, change.action, change.keys)   // Orders update [ { id: 7 } ]
  }
})
// later: stop listening
off()
```

The listener receives a list of changes:

| Field | Description |
| :-- | :-- |
| `id` | Id of the change (a ULID). |
| `entity` | The entity written, for example `Orders`. |
| `action` | `insert`, `update`, `delete`, `upsert`, `bulkInsert`, `bulkMerge` or `bulkDelete`. |
| `keys` | The primary keys of the rows, when they are known. |
| `count` | The rows affected, when the engine reports them. |
| `source`, `stage`, `view` | Where it was written, and with which [view](../schema/Views.md). |
| `actor` | Who did it (`actor` of the query options, see [Context](../schema/Context.md)). |
| `transaction` | The id of the transaction: the changes of one commit share it. |
| `time` | When, in ISO 8601. |

- **One change per sentence that writes**: an insert of an order with its details is a change of `Orders` and one of
  `Orders.details`.
- **After the commit.** The changes of a [transaction](Transaction.md) or a [script](Script.md) arrive together, in
  order, when the commit has finished; a rollback emits nothing. Outside a transaction, each one arrives when its
  sentence ends well.
- **The keys, never the values written** (they may be personal data; whoever needs them reads them, with their view).
  An insert, an upsert or a write by key (`update(entity)`, `filter(p => p.id == id)`) gives the keys; an update or
  delete with another filter gives only the entity and its `count`.
- **The listeners aren't awaited**: they neither slow nor fail a write, and their errors go to the log.
- **Per process**: each λORM instance announces what it wrote. Several instances (for example several gateways) must
  share the changes through something external, such as Redis or Kafka.

## Outbox

`onDataChange` is lost if the process stops between the commit and the delivery. To deliver the changes with a
guarantee, declare an outbox: each change is written, **before the commit and in the same transaction**, in the entity
`LambdaOrmOutbox`, and a dispatcher delivers it afterwards.

```yaml
infrastructure:
  outbox:
    entities: [Orders, Customers]                            # without entities: all of them
    actions: [insert, update, delete]                        # without actions: all of them
    condition: 'action != "delete" || entity == "Orders"'    # an expression over the change
    maxAttempts: 10                                          # default: 10
```

`LambdaOrmOutbox` is added to the domain and created by [push](../cli/Commands/Push.md); it is routed by the stage like
any other entity. An event has the content of a change (without the values written) plus its delivery: `status`
(`pending`, `done` or `dead`), `attempts`, `nextAttempt` and `error`.

Deliver the events with a function:

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// ...
await dispatcher.stop()
```

Each event the function resolves is marked as done; one it rejects is retried later, with a wait that grows (1, 2, 4…
seconds, an hour at most), and is `dead` after `maxAttempts`. To deliver them yourself:

```ts
const events = await orm.outbox.pending({ limit: 100 })   // pending, and whose next attempt has come
await orm.outbox.done(events.map(p => p.id))
await orm.outbox.failed(id, error)                         // retried later, or dead
```

!!! note
    With a single database, the change and its event are atomic. With several sources, they commit as any λORM
    transaction across sources: one after the other. Run a single dispatcher per outbox: two could take the same
    event.
