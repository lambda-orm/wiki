# Repositories {#repositories}

Ein Repository ist einer Entität zugeordnet und bietet Methoden, um sie abzufragen und zu ändern, ohne die gesamte Abfrage zu schreiben.

## Repositories erzeugen {#generating-repositories}

Der Befehl [`lambdaorm build`](../cli/Commands/Build.md) erzeugt das Modell (`model.ts`) und ein Repository pro
Entität (`repository<Entity>.ts`) im Domänenpfad des Projekts:

```sh
lambdaorm build -w lab/northwind -r
```

Eine Repository-Datei wird nur erzeugt, wenn sie noch nicht existiert; daher können Sie ihr gefahrlos eigene Methoden hinzufügen.

```typescript
import { Repository, IOrm } from '@lambdaorm/lib'
import { Product, QryProduct } from './model'

export class ProductRepository extends Repository<Product, QryProduct> {
  constructor (stage?: string, orm?: IOrm, view?: string) {
    super('Products', stage, orm, view)
  }
  // Add your code here
}
```

Der Konstruktor erhält den Stage (optional: der Standard-Stage, wenn weggelassen) und optional die `orm`-Instanz und
die [View](../schema/Views.md), die seine Abfragen verwenden. Mit `lambdaorm build --view <Name>` ist die View der
Standardwert des erzeugten Konstruktors.

## Beispiel {#example}

```typescript
import { orm } from '@lambdaorm/lib'
import { ProductRepository } from './northwind/domain/repositoryProduct'

(async () => {
  await orm.init()
  const productRepository = new ProductRepository('default')
  const country = 'USA'
  const result = await productRepository.query()
    .filter(p => (p.price > 5 && p.supplier.country == country) || (p.inStock < 3))
    .having(p => max(p.price) > 50)
    .map(p => ({ category: p.category.name, largestPrice: max(p.price) }))
    .sort(p => desc(p.largestPrice))
    .execute({ country })
  console.log(JSON.stringify(result, null, 2))
  await orm.end()
})()
```

## Methoden {#methods}

| Methode | Beschreibung |
| :-- | :-- |
| `insert(entity, include?)` | Fügt einen Datensatz ein (und mit `include` seine zugehörigen Datensätze). |
| `bulkInsert(entities, include?)` | Fügt mehrere Datensätze ein. |
| `update(entity, include?)` | Aktualisiert einen Datensatz. |
| `updateAll(data, map, filter?, include?)` | Aktualisiert alle Datensätze, die dem Filter entsprechen (oder alle Datensätze der Entität). |
| `upsert(entity, include?)` | Fügt einen Datensatz ein oder aktualisiert ihn, falls bereits einer mit demselben Primärschlüssel existiert ([upsert](../queries/Insert.md#upsert)). |
| `bulkMerge(entities, include?)` | Fügt mehrere Datensätze ein oder aktualisiert sie. |
| `delete(entity, include?)` | Löscht einen Datensatz. |
| `bulkDelete(entities, include?)` | Löscht mehrere Datensätze. |
| `deleteAll(data, filter?, include?)` | Löscht alle Datensätze, die dem Filter entsprechen (oder alle Datensätze der Entität). |
| `list(data, filter?, include?)` | Gibt die Datensätze zurück, die dem Filter entsprechen. |
| `distinct(data, filter?, include?)` | Gibt die eindeutigen Datensätze zurück, die dem Filter entsprechen. |
| `first(data, filter?, include?)` | Gibt den ersten Datensatz oder `null` zurück. |
| `last(data, filter?, include?)` | Gibt den letzten Datensatz oder `null` zurück. |
| `query()` | Startet eine benutzerdefinierte Abfrage auf der Entität (`filter`, `include`, `having`, `map`, `sort`, `page`, …), ausgeführt mit `execute(data)`. |
| `execute(query, data?)` | Führt eine an die Entität angehängte Abfragezeichenfolge aus, zum Beispiel `.filter(p => p.id == id)`. |

`data` enthält die Werte der Parameter, die von `filter` und `map` verwendet werden.
