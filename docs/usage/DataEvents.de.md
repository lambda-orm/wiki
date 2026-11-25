# Datenänderungen und Outbox {#changes-of-the-data-and-outbox}

Jeder Schreibvorgang, der über λORM läuft, kann als **Datenänderung** gemeldet werden: welche Entität sich geändert
hat, wie, und die Schlüssel der Zeilen. Damit lässt sich ein Cache invalidieren, andere Dienste benachrichtigen oder
ein Suchindex füllen, ohne für jede Entität einen [Listener](../schema/SchemaExample-Listener.md) zu schreiben. Wenn
die Änderungen auch dann zugestellt werden müssen, wenn der Prozess anhält, wird eine **Outbox** deklariert: Dann
werden sie in derselben Transaktion wie die Daten geschrieben.

## Auf die Änderungen hören {#listening-to-the-changes}

```ts
const off = orm.onDataChange(async changes => {
  for (const change of changes) {
    console.log(change.entity, change.action, change.keys)   // Orders update [ { id: 7 } ]
  }
})
// später: nicht mehr zuhören
off()
```

Der Listener erhält eine Liste von Änderungen:

| Feld | Beschreibung |
| :-- | :-- |
| `id` | Id der Änderung (eine ULID). |
| `entity` | Die geschriebene Entität, zum Beispiel `Orders`. |
| `action` | `insert`, `update`, `delete`, `upsert`, `bulkInsert`, `bulkMerge` oder `bulkDelete`. |
| `keys` | Die Primärschlüssel der Zeilen, wenn sie bekannt sind. |
| `count` | Die betroffenen Zeilen, wenn die Engine sie meldet. |
| `source`, `stage`, `view` | Wo geschrieben wurde, und mit welcher [View](../schema/Views.md). |
| `actor` | Wer es getan hat (`actor` der Abfrageoptionen, siehe [Kontext](../schema/Context.md)). |
| `transaction` | Die Id der Transaktion: Die Änderungen eines Commits teilen sie. |
| `time` | Wann, in ISO 8601. |

- **Eine Änderung pro schreibender Anweisung**: Das Einfügen einer Bestellung mit ihren Positionen ergibt eine
  Änderung von `Orders` und eine von `Orders.details`.
- **Nach dem Commit.** Die Änderungen einer [Transaktion](Transaction.md) oder eines [Skripts](Script.md) kommen
  zusammen und in Reihenfolge an, wenn der Commit abgeschlossen ist; ein Rollback meldet nichts. Außerhalb einer
  Transaktion kommt jede an, sobald ihre Anweisung erfolgreich endet.
- **Die Schlüssel, nie die geschriebenen Werte** (es können personenbezogene Daten sein; wer sie braucht, liest sie
  mit seiner View). Ein Insert, ein Upsert oder ein Schreibvorgang per Schlüssel (`update(entity)`,
  `filter(p => p.id == id)`) liefert die Schlüssel; ein Update oder Delete mit einem anderen Filter liefert nur die
  Entität und ihren `count`.
- **Die Listener werden nicht abgewartet**: Sie bremsen keinen Schreibvorgang und lassen ihn nicht fehlschlagen; ihre
  Fehler gehen ins Log.
- **Pro Prozess**: Jede λORM-Instanz meldet, was sie geschrieben hat. Mehrere Instanzen (zum Beispiel mehrere
  Gateways) müssen die Änderungen über etwas Externes teilen, etwa Redis oder Kafka.

## Outbox {#outbox}

`onDataChange` geht verloren, wenn der Prozess zwischen Commit und Zustellung anhält. Um die Änderungen garantiert
zuzustellen, wird eine Outbox deklariert: Jede Änderung wird **vor dem Commit und in derselben Transaktion** in die
Entität `LambdaOrmOutbox` geschrieben, und ein Dispatcher stellt sie danach zu.

```yaml
infrastructure:
  outbox:
    entities: [Orders, Customers]                            # ohne entities: alle
    actions: [insert, update, delete]                        # ohne actions: alle
    condition: 'action != "delete" || entity == "Orders"'    # ein Ausdruck über die Änderung
    maxAttempts: 10                                          # Standard: 10
```

`LambdaOrmOutbox` wird der Domäne hinzugefügt und von [push](../cli/Commands/Push.md) angelegt; die Stage routet sie
wie jede andere Entität. Ein Ereignis hat den Inhalt einer Änderung (ohne die geschriebenen Werte) plus seine
Zustellung: `status` (`pending`, `done` oder `dead`), `attempts`, `nextAttempt` und `error`.

Die Ereignisse mit einer Funktion zustellen:

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// ...
await dispatcher.stop()
```

Jedes Ereignis, das die Funktion auflöst, gilt als erledigt; eines, das sie ablehnt, wird später erneut versucht, mit
einer wachsenden Wartezeit (1, 2, 4… Sekunden, höchstens eine Stunde), und ist nach `maxAttempts` `dead`. Um sie
selbst zuzustellen:

```ts
const events = await orm.outbox.pending({ limit: 100 })   // ausstehend, und deren nächster Versuch fällig ist
await orm.outbox.done(events.map(p => p.id))
await orm.outbox.failed(id, error)                         // später erneut versucht, oder tot
```

!!! note "Hinweis"
    Mit einer einzigen Datenbank sind die Änderung und ihr Ereignis atomar. Mit mehreren Quellen werden sie wie jede
    λORM-Transaktion über Quellen hinweg bestätigt: eine nach der anderen. Pro Outbox darf nur ein Dispatcher laufen:
    Zwei könnten dasselbe Ereignis nehmen.
