# Abfragen über Quellen hinweg {#queries-across-sources}

Eine Abfrage kann Felder einer Beziehung lesen, deren Entität in **einer anderen Quelle** liegt, sogar in einer anderen
Datenbank (Bestellungen in PostgreSQL, Kunden in MongoDB):

```ts
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

λORM holt die Wurzel mit ihren Filtern und ein `include` der anderen Quelle (jede Quelle ihre eigene Anweisung) und
mappt, gruppiert, sortiert und paginiert dann **im Speicher**:

- eine Sortierung nach Feldern der Wurzel geht mit der Seite an deren Datenbank;
- um im Speicher zu sortieren oder zu gruppieren, holt es höchstens `maxRows` Zeilen (10.000;
  `infrastructure.crossSource.maxRows` oder `options.maxRows`): darüber hinaus ein `CrossSourceError`;
- `orm.plan` zeigt die Anweisung jeder Quelle und `inMemory: ['map', 'sort', …]`.

Ein Filter nach einem Feld der anderen Quelle (`Orders.filter(p => p.customer.name == "Ann")`) sucht zuerst die
Schlüssel in dieser Quelle.
