# Changes of the data and outbox

## Listening to the changes

```ts
const off = orm.onDataChange(changes => {
  // [{ id, entity: 'Orders', action: 'update', keys: [{ id: 7 }], count: 1, source, stage, view, actor, transaction, time }]
})
```

One change per sentence that writes, **after its commit** (a rollback emits nothing); the ones of a transaction come
together with its id. The keys when they are known, never the values written. The listeners aren't awaited: they
don't slow nor fail a write.

## Outbox

To deliver the changes even if the process stops before, write them in the same transaction:

```yaml
infrastructure:
  outbox: { entities: [Orders], actions: [insert, update], condition: 'action != "delete"', maxAttempts: 10 }
```

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// or: orm.outbox.pending(), done(ids), failed(id, error)
```

The events go to the entity `LambdaOrmOutbox` (created by `push`) before the commit; a failed one is retried with a
growing wait, and is dead after `maxAttempts`.
