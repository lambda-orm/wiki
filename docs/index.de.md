# λORM {#orm}

[![npm-Version](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![Sprache TypeScript](https://img.shields.io/badge/language-typescript-blue)](https://www.npmjs.com/package/@lambdaorm/lib)
[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Treten Sie der Community auf GitHub Discussions bei](https://img.shields.io/badge/Join%20the%20community-on%20GitHub%20Discussions-blue.svg)](https://github.com/lambda-orm/wiki/discussions)
[![Slack](https://img.shields.io/badge/chat-on%20slack-orange)](https://join.slack.com/t/nuevoespaciod-xo58767/shared_invite/zt-29ix7pc2r-Wd_ZBWnWRDv_5DM4NPtVhQ)
[![Gitter](https://badges.gitter.im/lambdaorm/community.svg)](https://app.gitter.im/#/room/#lambdaorm-how-to-contribute:gitter.im)
[![Discord](https://img.shields.io/badge/chat-on%20discord-orange)](https://discord.com/invite/yXT6XBX2)

λORM (LambdaORM) ist ein TypeScript-ORM, das **verteilte Abfragen** über verschiedene Datenbank-Engines hinweg ausführt:
MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB und SQLite.

Abfragen werden als **Lambda-Ausdrücke** über ein **Domänenmodell** geschrieben, das von der Infrastruktur unabhängig ist.
Eine einzige Abfrage kann Entitäten lesen oder schreiben, die in verschiedenen Datenbanken gespeichert sind – zum Beispiel
einige in MySQL, andere in PostgreSQL und wieder andere in MongoDB –, und λORM zerlegt sie in eine Anweisung pro Quelle
und führt die Ergebnisse zusammen.

Dieselbe Domäne kann mehrere **Stages** (Infrastruktur-Szenarien) haben. In einem Stage können die Daten auf SQL Server,
MongoDB und Oracle verteilt sein; in einem anderen kann alles in einer einzigen PostgreSQL-Datenbank liegen. So lassen sich
Muster wie [CQRS](https://microservices.io/patterns/data/cqrs.html) per Konfiguration umsetzen, ohne den Code zu ändern.

Eine vollständige Liste finden Sie unter [Funktionen](Features.md).

## Verwendung {#how-to-use-it}

| Weg | Paket | Wann verwenden |
| --- | --- | --- |
| Node.js-Bibliothek | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | Abfragen aus einer Node.js-/TypeScript-Anwendung ausführen. Siehe [Verwendung](usage/Usage.md). |
| Kommandozeile | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) (Befehl `lambdaorm`) | Ein Projekt erstellen, die Datenbanken synchronisieren, Daten importieren und exportieren und Abfragen aus einem Terminal oder in CI ausführen. Siehe [CLI](cli/index.md). |
| Data Gateway | Docker-Image [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | λORM-Schemas über das Netzwerk bereitstellen: eine REST API, MCP für KI-Agenten, eine WebSocket API und eine Web-UI. Siehe [Data Gateway](data-gateway/index.md). |
| Node.js-Client | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | Dieselben Abfragen aus Node.js gegen ein Data Gateway ausführen. Siehe [Clients](data-gateway/Clients.md). |

```sh
npm install @lambdaorm/lib      # the library
npm install -g @lambdaorm/cli   # the lambdaorm command
```

!!! note "Hinweis"
    Die Pakete ohne Scope `lambdaorm`, `lambdaorm-cli` und `lambdaorm-client-node` werden nicht mehr gepflegt: Verwenden
    Sie die Pakete `@lambdaorm/*`.

## Abfragesprache {#query-language}

Die folgende Abfrage liefert den höchsten Preis jeder Produktkategorie, wobei nur die Produkte berücksichtigt werden, die
dem Filter entsprechen, und nur die Kategorien, deren höchster Preis über 50 liegt:

```typescript
import { orm } from '@lambdaorm/lib'
import { Products } from './northwind/domain/model'

const query = (country: string) => Products
  .filter(p => (p.price > 5 && p.supplier.country == country) || (p.inStock < 3))
  .having(p => max(p.price) > 50)
  .map(p => ({ category: p.category.name, largestPrice: max(p.price) }))
  .sort(p => desc(p.largestPrice))

await orm.init('./lambdaORM.yaml')
// run the query, passing the value of the country parameter
const result = await orm.execute(query, { country: 'ARG' })
await orm.end()
```

In dieser Abfrage:

- `filter` behält die Produkte, deren Preis größer als 5 ist und deren Lieferant im angegebenen Land ansässig ist, sowie
  diejenigen mit weniger als 3 Einheiten auf Lager.
- `map` liefert den Kategorienamen und den höchsten Preis. Die Gruppierung ist implizit: Die Produkte werden nach
  Kategorie gruppiert, weil `max` eine Aggregatfunktion ist.
- `having` behält nur die Kategorien, deren höchster Preis größer als 50 ist.
- `sort` sortiert das Ergebnis absteigend nach dem höchsten Preis.
- `supplier` und `category` sind Beziehungen: Die Joins sind implizit.

**Siehe auch:** [Abfragesprache](queries/Query-Language.md) |
[Select](queries/Select.md) |
[Join](queries/Join.md) |
[Gruppierung](queries/Grouping.md) |
[include](queries/Include.md) |
[Insert](queries/Insert.md) |
[Bulk Insert](queries/BulkInsert.md) |
[Update](queries/Update.md) |
[Delete](queries/Delete.md) |
[Metadaten](queries/Metadata.md) |
[Repository](usage/Repository.md) |
[Verwendung](usage/Usage.md)

### Include {#include}

`include` liefert eine Entität zusammen mit ihren Beziehungen in derselben Abfrage, auch wenn diese in verschiedenen
Datenbanken gespeichert sind. In diesem Beispiel wird die Abfrage als String geschrieben, eine Alternative zum
Lambda-Ausdruck:

```typescript
import { orm } from '@lambdaorm/lib'

(async () => {
  try {
    await orm.init('./config/northwind.yaml')
    const query = `Orders
      .filter(p => p.id === id)
      .include(p => [
        p.customer.map(p => p.name),
        p.details
          .include(p => p.product
            .include(p => p.category.map(p => p.name))
            .map(p => p.name))
          .map(p => [p.quantity, p.unitPrice])
      ])`
    const result = await orm.execute(query, { id: 102 }, { stage: 'PostgreSQL' })
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error(error.message)
  } finally {
    await orm.end()
  }
})()
```

**Ergebnis:**

```json
[
  {
    "id": 102,
    "customerId": "SPLIR",
    "employeeId": 7,
    "orderDate": "1996-11-07T23:00:00.000Z",
    "requiredDate": "1996-12-05T23:00:00.000Z",
    "shippedDate": "1996-11-14T23:00:00.000Z",
    "shipViaId": 1,
    "freight": 8.63,
    "name": "Split Rail Beer & Ale",
    "address": "P.O. Box 555",
    "city": "Lander",
    "region": "WY",
    "postalCode": "82520",
    "country": "USA",
    "customer": {
      "name": "Split Rail Beer & Ale"
    },
    "details": [
      {
        "quantity": 24,
        "unitPrice": 5.9,
        "product": {
          "name": "Tourtire",
          "category": {
            "name": "Meat/Poultry"
          }
        }
      }
    ]
  }
]
```

**Weitere Informationen:** [include](queries/Include.md)

## Schema {#schema}

Das Schema definiert Entitäten, Enumerationen, Indizes, eindeutige Schlüssel, Standardwerte, Constraints, Mappings,
Quellen, Stages, Listener und mehr. Es wird in YAML oder JSON geschrieben. Bedingungen und Aktionen verwenden dieselbe
[Ausdruckssprache](https://www.npmjs.com/package/3xpr) wie Abfragen.

**Siehe auch:** [Schema](schema/Schema.md) |
[Definition](schema/SchemaDefinition.md) |
[Verwendung](schema/Schema-Use.md) |
[Ausdrücke](schema/SchemaDefinition-Expressions.md) |
[Umgebungsvariablen](schema/SchemaDefinition-EnvironmentVariables.md) |
[Composite](schema/SchemaDefinition-Composite.md) |
[Listener](schema/SchemaExample-Listener.md) |
[mehrere Stages](schema/SchemaExample-MultiplesStages.md) |
[mehrere Quellen](schema/SchemaExample-StageMultiplesSources.md) |
[Datenbank-Engines](schema/Engines.md)

### Synchronisierung {#synchronization}

λORM hält die Datenbanken und das Schema in beide Richtungen synchron:
[Synchronisierung](schema/SchemaSynchronization.md) |
[push](schema/SchemaSynchronization-Push.md) |
[pull](schema/SchemaSynchronization-Pull.md) |
[fetch](schema/SchemaSynchronization-Fetch.md) |
[introspect](schema/SchemaSynchronization-Introspect.md) |
[incorporate](schema/SchemaSynchronization-Incorporate.md)

## Transaktionen und Skripte {#transactions-and-scripts}

- [Transaktionen](usage/Transaction.md): `orm.transaction` führt mehrere Abfragen in einer Transaktion aus, auch über
  Quellen und Stages hinweg.
- [Skripte](usage/Script.md): ein ganzer Anwendungsfall (Variablen, Bedingungen, Schleifen und mehrere Abfragen) in
  einer Transaktion und in einem einzigen Aufruf – aus Node.js, der CLI oder dem Data Gateway.

## Labs {#labs}

Vollständige Beispiele finden Sie in den [λORM Labs](labs/index.md).

## Verwandte Projekte {#related-projects}

- [λORM CLI](https://www.npmjs.com/package/@lambdaorm/cli): Kommandozeilenschnittstelle für λORM.
- [Data Gateway](data-gateway/index.md): λORM-Schemas über REST, MCP und WebSocket, mit einer Web-UI.
- [λORM-Client](https://www.npmjs.com/package/@lambdaorm/client): Node.js-Client für das Data Gateway.
- [3xpr](https://www.npmjs.com/package/3xpr): erweiterbare Ausdrucks-Engine, die mathematische und logische Ausdrücke
  auswertet; λORM-Abfragen und -Skripte bauen darauf auf.
