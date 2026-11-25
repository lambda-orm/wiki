# Abfragen über Quellen hinweg {#queries-across-sources}

Diese Seite erklärt, was passiert, wenn eine Abfrage Felder einer Beziehung liest, deren Entität in einer **anderen Quelle** des Stage liegt, auch einer anderen Engine (Bestellungen in PostgreSQL, Kunden in MongoDB). Man schreibt die Abfrage, als läge alles in einer einzigen Datenbank; λORM teilt sie auf, führt in jeder Quelle eine Anweisung aus und erledigt den Rest im Speicher.

Eine Beziehung zwischen zwei Entitäten derselben Quelle bleibt ein SQL-Join (siehe [Join](Join.md)). Was diese Seite beschreibt, gilt nur, wenn die Beziehung Quellen überschreitet.

## Nach Feldern einer anderen Quelle lesen, sortieren und gruppieren {#read-sort-and-group-by-fields-of-another-source}

```ts
// Orders in PostgreSQL, Customers in MongoDB
Orders.map(p => [p.id, p.customer.name])
Orders.map(p => ({ id: p.id, who: p.customer.name })).sort(p => desc(p.who)).page(1, 20)
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

λORM führt diese Abfragen in zwei Teilen aus:

1. **In den Datenbanken:** die Wurzelentität mit ihren Filtern und ein [include](Include.md) der gelesenen Beziehungen, jede Quelle mit ihrer eigenen Anweisung in ihrem eigenen Dialekt.
2. **Im Speicher:** das `map` (gruppiert nach den übrigen Feldern, wenn es `count`, `sum`, `avg`, `min` oder `max` enthält), das `having`, das `sort` und das `page`.

Die Beziehungen können auf jeder Ebene liegen: `p.customer.country.name` (`Customers` und `Countries` in einer anderen Quelle) lädt `include(p => [p.customer.include(p1 => [p1.country])])`, und jede Beziehung kommt aus ihrer eigenen Quelle.

```ts
Orders.map(p => ({ country: p.customer.country.name, orders: count(p.id) })).sort(p => p.country)
```

## Grenzen {#limits}

- **Sortieren und Paginieren wenn möglich in der Datenbank.** Liest das `sort` nur Felder der Wurzel und wird nichts gruppiert, gehen `sort` und `page` an die Datenbank der Wurzel (`ORDER BY … LIMIT`) und im Speicher läuft nur das `map`, sodass eine paginierte Abfrage nicht die ganze Tabelle lädt.
- **Höchstens `maxRows` Zeilen im Speicher.** Zum Sortieren, Gruppieren oder Paginieren im Speicher lädt λORM höchstens `maxRows` Zeilen (standardmäßig 10.000; einstellbar in `infrastructure.crossSource.maxRows` des Schemas oder in `options.maxRows` von `orm.execute`). Sind es mehr, schlägt die Abfrage mit `CrossSourceError: Orders brings more than 10000 rows to sort in memory: filter it or raise maxRows` fehl. Es wird nie stillschweigend abgeschnitten, denn ein über einen Teil der Zeilen sortiertes Ergebnis wäre falsch.
- **Nicht unterstützt:** `include`, `distinct` oder `first` in derselben Abfrage lösen einen `CrossSourceError` aus.

## Den Plan ansehen {#see-the-plan}

[`orm.plan`](Metadata.md) zeigt die Anweisung jeder Quelle und in `inMemory`, was im Speicher läuft:

```ts
orm.plan('Orders.map(p => ({ who: p.customer.name, orders: count(p.id) })).sort(p => p.who)')
```

```json
{
  "entity": "Orders",
  "dialect": "PostgreSQL",
  "source": "sales",
  "sentence": "SELECT o.id AS \"id\", …, o.customerId AS \"__customerId\" FROM orders o ORDER BY o.id asc OFFSET 0 LIMIT 10001",
  "children": [
    {
      "entity": "Customers",
      "dialect": "MongoDB",
      "source": "crm",
      "sentence": "…"
    }
  ],
  "inMemory": ["map", "sort"]
}
```

## Nach einem Feld einer anderen Quelle filtern {#filter-by-a-field-of-another-source}

Ein Filter nach einem Feld einer Beziehung in einer anderen Quelle (`Orders.filter(p => p.customer.name == "Ann")`) sucht zuerst die Schlüssel in dieser Quelle und filtert dann die Wurzel mit `in`. Er unterstützt eine Beziehungsebene und Vergleiche mit Werten; siehe [Nach einem Feld einer Beziehung in einer anderen Quelle filtern](Include.md#filter-by-a-field-of-a-relation-in-another-source).
