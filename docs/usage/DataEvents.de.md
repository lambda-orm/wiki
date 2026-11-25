# Datenänderungen und Outbox {#changes-of-the-data-and-outbox}

## Auf die Änderungen hören {#listening-to-the-changes}

```ts
const off = orm.onDataChange(changes => {
  // [{ id, entity: 'Orders', action: 'update', keys: [{ id: 7 }], count: 1, source, stage, view, actor, transaction, time }]
})
```

Eine Änderung pro schreibender Anweisung, **nach ihrem Commit** (ein Rollback gibt nichts aus); die einer Transaktion
kommen zusammen mit ihrer ID. Die Schlüssel, wenn sie bekannt sind, niemals die geschriebenen Werte. Auf die Listener
wird nicht gewartet: Sie verlangsamen einen Schreibvorgang nicht und lassen ihn nicht fehlschlagen.

## Outbox {#outbox}

Um die Änderungen auch dann zuzustellen, wenn der Prozess vorher anhält, schreiben Sie sie in derselben Transaktion:

```yaml
infrastructure:
  outbox: { entities: [Orders], actions: [insert, update], condition: 'action != "delete"', maxAttempts: 10 }
```

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// or: orm.outbox.pending(), done(ids), failed(id, error)
```

Die Ereignisse gehen vor dem Commit in die Entität `LambdaOrmOutbox` (von `push` erstellt); ein fehlgeschlagenes wird mit
wachsender Wartezeit erneut versucht und ist nach `maxAttempts` tot.
