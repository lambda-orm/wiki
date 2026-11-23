# λORM {#orm}

[![npm version](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Schreiben Sie eine Abfrage einmal. Führen Sie sie auf jeder Datenbank aus: aus Ihrem Code, einem Terminal, einer API oder einem KI-Agenten.**

λORM ist eine Abfragesprache und eine Laufzeitumgebung für Ihre Daten. Sie beschreiben Ihre **Domäne** einmal
(Entitäten, Beziehungen, Regeln) in einem Schema und schreiben Abfragen als **Lambda-Ausdrücke** darüber:

```typescript
Orders
  .filter(p => p.customer.country == country && p.orderDate >= since)
  .include(p => [p.customer.map(c => c.name), p.details.include(d => d.product.map(p => p.name))])
```

λORM übersetzt diese Abfrage in SQL für **MySQL, MariaDB, PostgreSQL, SQL Server, Oracle und SQLite** oder in eine
Aggregations-Pipeline für **MongoDB**, auch wenn die Entitäten einer Abfrage in **verschiedenen Datenbanken** liegen.
Und dieselbe Abfrage läuft aus einer Node.js-Bibliothek, der Kommandozeile, einer REST- oder WebSocket-API oder einem
KI-Agenten über MCP.

## Warum λORM {#why-orm}

- **Eine Domäne, jede Datenbank.** Abfragen sprechen von `Orders` und `Customers`, nicht von Tabellen, Dialekten oder
  davon, wo jede Entität gespeichert ist.
- **Eine Abfrage über mehrere Datenbanken.** Bestellungen in MongoDB, Kunden in PostgreSQL, Produkte in MySQL: eine
  Abfrage, ein Ergebnis. λORM teilt sie pro Quelle auf und führt die Ergebnisse zusammen.
- **Stages.** Dieselbe Domäne auf einer SQLite in der Entwicklung und verteilt auf drei Engines in der Produktion, oder
  eine Schreib- und eine Leseseite ([CQRS](https://microservices.io/patterns/data/cqrs.html)), per Konfiguration, nicht
  per Code.
- **Jeder Kanal.** TypeScript (typisiert), ein Text, die CLI, REST, WebSocket, MCP: überall dieselbe Sprache.
- **Kontrollierter Zugriff.** Das [Data Gateway](data-gateway/index.md) veröffentlicht Ihre Schemas mit
  Zugangsdaten, Berechtigungen (`read`, `write`, …) und einem Audit jeder Änderung, für Anwendungen, Menschen und
  KI-Agenten gleichermaßen.
- **Schema-first, in beide Richtungen.** Von einem YAML zu den Tabellen (`push`), von den Datenbanken zum YAML
  (`pull`) oder von einer JSON-Datei mit Daten zu einem Schema, seinen Tabellen und Zeilen (`incorporate`).

Siehe die [Funktionen](Features.md) für eine vollständige Liste.

## Dieselbe Abfrage, von überall {#the-same-query-from-everywhere}

Der Ausdruck `Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])` ist in jedem Kanal derselbe.

### Node.js / TypeScript {#nodejs-typescript}

Die Bibliothek, [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib). Siehe [Verwendung](usage/Usage.md).

```typescript
import { orm } from '@lambdaorm/lib'

await orm.init('./lambdaORM.yaml')
const products = await orm.execute(
  (minPrice: number) => Products.filter(p => p.price > minPrice).map(p => [p.name, p.price]),
  { minPrice: 50 })
```

### Kommandozeile {#command-line}

Der Befehl `lambdaorm`, [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli). Siehe [CLI](cli/index.md).

```sh
lambdaorm execute -q "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])" -d '{"minPrice": 50}'
```

### REST-API, aus jeder Sprache {#rest-api-from-any-language}

Das [Data Gateway](data-gateway/index.md) veröffentlicht das Schema über HTTP. Siehe [REST-API](data-gateway/Rest.md).

```sh
curl -X POST http://gateway:8080/northwind/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])", "data": {"minPrice": 50}}'
```

```python
import requests

products = requests.post("http://gateway:8080/northwind/execute", headers={"X-Api-Key": key}, json={
    "query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])",
    "data": {"minPrice": 50},
}).json()
```

### Node.js-Client {#nodejs-client}

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client): die Schnittstelle der Bibliothek, ausgeführt
auf einem Data Gateway über REST oder WebSocket. Siehe [Clients](data-gateway/Clients.md) und
[WebSocket-API](data-gateway/WebSocket.md).

```typescript
import { orm } from '@lambdaorm/client'

await orm.init('ws://gateway:8083/northwind', { headers: { 'X-Api-Key': key } })
const products = await orm.execute('Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])', { minPrice: 50 })
orm.on('schema.statusChanged', ({ status }) => console.log(status))
```

### KI-Agenten {#ai-agents}

Das Data Gateway spricht [MCP](data-gateway/Mcp.md): Ein Agent erkundet die Domäne und fragt sie mit den
Berechtigungen seiner Zugangsdaten ab, nie mehr.

```sh
claude mcp add --transport http northwind http://gateway:8081/northwind/mcp --header "X-Api-Key: $KEY"
```

> *"Welche Produkte kosten mehr als 50?"*: Der Agent liest die Domäne des Schemas aus den Tools und ruft
> `orm_execute` mit `Products.filter(p => p.price > 50).map(p => [p.name, p.price])` auf. Mit `read`-Zugangsdaten kann
> er nichts ändern.

### Der Browser {#the-browser}

Die [IDE](ide/Guide.md) des Data Gateway, gebaut mit [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui):
sich mit Gateways verbinden, Schemas durchsuchen, jede Entität als Formular lesen, Abfragen mit Autovervollständigung schreiben und Diagramme
zeichnen.

![Die UI des Data Gateway](data-gateway/images/ui-query.png)

## Eine Abfrage, drei Datenbanken {#one-query-three-databases}

Eine Stage des [Northwind-Labs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
hält den Katalog in MySQL, die Kunden in PostgreSQL und die Bestellungen in MongoDB:

```yaml
stages:
  - name: default
    sources:
      - name: Catalog                                   # MySQL
        condition: entity.in(["Categories","Products"])
      - name: Crm                                       # PostgreSQL
        condition: entity.in(["Address","Customers"])
      - name: Ordering                                  # MongoDB
        condition: entity.in(["Orders","Orders.details"])
```

Die Anwendung weiß davon nichts. Sie fragt nach den Bestellungen eines Kunden mit dem Namen des Kunden und, für jede
Position, nach dem Produkt und seiner Kategorie:

```typescript
Orders
  .filter(p => p.customerId == customerId)
  .include(p => [
    p.customer.map(c => c.name),
    p.details
      .include(d => d.product.include(pr => pr.category.map(c => c.name)).map(pr => pr.name))
      .map(d => [d.quantity, d.unitPrice])
  ])
```

und `orm.plan` zeigt, was λORM ausführen wird (gekürzt):

```text
Orders            MongoDB     Ordering   aggregate [{ $match: { CustomerID: … } }, { $project: … }]
├─ Customers      PostgreSQL  Crm        SELECT c.CompanyName AS "name", … FROM Customers c WHERE c.CustomerID IN ($1)
└─ Orders.details MongoDB     Ordering   aggregate [{ $unwind: … }, { $match: { OrderID: { $in: … } } }, …]
   └─ Products    MySQL       Catalog    SELECT p.ProductName AS name, … FROM Products p WHERE p.ProductID IN (?)
      └─ Categories MySQL     Catalog    SELECT c1.CategoryName AS name, … FROM Categories c1 WHERE c1.CategoryID IN (?)
```

**Eine Abfrage pro Beziehung, nie eine pro Zeile:** Jede Ebene liest die Schlüssel der darüberliegenden Ebene mit
einem `IN`. Sind es viele, werden die Schlüssel in Blöcke aufgeteilt (höchstens 999 bei Oracle, 7000 bei den anderen),
die parallel laufen. Das Ergebnis ist ein einziger JSON-Baum, als läge alles in einer Datenbank. Siehe
[include](queries/Include.md).

## Eine Abfrage, der Dialekt jeder Engine {#one-query-each-engines-dialect}

```typescript
Products
  .filter(p => p.price > minPrice && p.category.name == category)
  .map(p => ({ name: p.name, price: p.price }))
  .sort(p => desc(p.price))
  .page(1, 10)
```

```sql
-- MySQL
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > ? AND c.CategoryName = ?) ORDER BY p.UnitPrice desc LIMIT 0,10

-- PostgreSQL
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > $1 AND c.CategoryName = $2) ORDER BY p.UnitPrice desc OFFSET 0 LIMIT 10

-- SQL Server
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > @minPrice AND c.CategoryName = @category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY

-- Oracle
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > :minPrice AND c.CategoryName = :category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

Der Join ist implizit (`p.category.name`), die Parameter werden immer gebunden, und die Eigenschaftsnamen sind die
der Domäne (`price`), nicht die der Spalten (`UnitPrice`): Das [Mapping](schema/SchemaDefinition.md) steht im Schema.
Siehe die [Engines](schema/Engines.md) und die [Abfragesprache](queries/Query-Language.md).

## Stages: derselbe Code, eine andere Infrastruktur {#stages-the-same-code-another-infrastructure}

```yaml
infrastructure:
  stages:
    - name: dev                  # everything in one database
      sources: [ { name: Local } ]
    - name: prod                 # the same domain, spread over three engines
      sources:
        - { name: Catalog,  condition: 'entity.in(["Categories","Products"])' }
        - { name: Crm,      condition: 'entity.in(["Address","Customers"])' }
        - { name: Ordering, condition: 'entity.in(["Orders","Orders.details"])' }
```

```typescript
await orm.execute(query, data, { stage: 'prod' })
```

Eine Schreib-Stage und eine Lese-Stage über verschiedene Datenbanken sind
[CQRS per Konfiguration](schema/SchemaExample-MultiplesStages.md).

## Kontrollierter Zugriff: das Data Gateway {#governed-access-the-data-gateway}

Das [Data Gateway](data-gateway/index.md) (Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway))
veröffentlicht ein oder mehrere Schemas über REST, WebSocket und MCP, mit einer Web-UI, ohne ein Backend zu
schreiben:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: agent,   value: $AGENT_KEY,   permissions: [ read ] }
    - { name: backend, value: $BACKEND_KEY, permissions: [ read, write, script ] }
transports:
  http:       { port: 8080 }    # REST, OpenAPI
  mcpHttp:    { port: 8081 }    # KI-Agenten
  management: { port: 9090 }    # die IDE (nur internes Netzwerk; in Produktion weggelassen)
```

- Dieselben Berechtigungen auf jedem Transport: Ein Agent mit `read` kann abfragen, nie schreiben.
- Jeder Schreibvorgang hinterlässt eine Audit-Zeile: wer, was, welche Entitäten, wie viele Zeilen.
- Jedes Schema in seinem eigenen Worker; Prometheus-Metriken, Health-Probes für Kubernetes, Raten- und
  Größenlimits.

**In zehn Minuten ausprobieren:** [Erste Schritte](data-gateway/GettingStarted.md), von einem leeren Ordner bis zur
REST-API, der IDE, MCP und WebSocket.

## Das Ökosystem {#the-ecosystem}

| Projekt | Veröffentlicht als | Was es ist |
| --- | --- | --- |
| [Bibliothek](usage/Usage.md) | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | das ORM: führt die Abfragen gegen die Datenbanken aus |
| [CLI](cli/index.md) | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) | der Befehl `lambdaorm`: Projekte, Synchronisation, Import / Export, Abfragen, Skripte |
| [Data Gateway](data-gateway/index.md) | Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | die Schemas über REST, MCP und WebSocket |
| [Data Gateway IDE](ide/index.md) | Docker [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide) · [Desktop: Linux, Windows, macOS](ide/index.md#download) | die IDE der Gateways: Verbindungen, Explorer, Abfragen, Diagramme, Administration |
| [Node.js-Client](data-gateway/Clients.md) | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | die Schnittstelle der Bibliothek, ausgeführt auf einem Data Gateway |
| [UI-Komponenten](ide/Guide.md) | [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui) | React-Komponenten: der Abfrage-Editor, die Ergebnisse, der Explorer und die Diagramme |
| [3xpr](https://www.npmjs.com/package/3xpr) | [`3xpr`](https://www.npmjs.com/package/3xpr) | die Ausdrucks-Engine, auf der die Abfragen, Skripte und Schemaregeln aufbauen |

Der Quellcode liegt unter [github.com/lambda-orm/core](https://github.com/lambda-orm/core).

!!! note "Hinweis"
    Die Pakete ohne Scope `lambdaorm`, `lambdaorm-cli` und `lambdaorm-client-node` werden nicht mehr gepflegt:
    Verwenden Sie die Pakete `@lambdaorm/*`.

## Erste Schritte {#get-started}

| Ich möchte… | Hier beginnen |
| --- | --- |
| meine Datenbanken aus Node.js / TypeScript abfragen | [Verwendung](usage/Usage.md) |
| ein Projekt anlegen, die Datenbanken synchronisieren, Daten importieren | [CLI](cli/index.md) |
| Anwendungen in jeder Sprache oder KI-Agenten Zugriff auf meine Daten geben | [Data Gateway: Erste Schritte](data-gateway/GettingStarted.md) |
| die Abfragesprache lernen | [Abfragesprache](queries/Query-Language.md) |
| die Domäne, die Quellen und die Stages definieren | [Schema](schema/Schema.md) |
| vollständige Beispiele sehen | [Labs](labs/index.md) |

## Mehr erfahren {#learn-more}

- **Abfragen:** [Abfragesprache](queries/Query-Language.md) | [select](queries/Select.md) | [join](queries/Join.md) |
  [Gruppierung](queries/Grouping.md) | [include](queries/Include.md) | [insert](queries/Insert.md) |
  [bulk insert](queries/BulkInsert.md) | [update](queries/Update.md) | [delete](queries/Delete.md) |
  [Metadaten](queries/Metadata.md) | [Operatoren und Funktionen](queries/operatorsAndFunctions/OperatorsAndFunctions.md)
- **Schema:** [Schema](schema/Schema.md) | [Definition](schema/SchemaDefinition.md) |
  [Ausdrücke](schema/SchemaDefinition-Expressions.md) |
  [Umgebungsvariablen](schema/SchemaDefinition-EnvironmentVariables.md) |
  [Komposition](schema/SchemaDefinition-Composite.md) | [Listener](schema/SchemaExample-Listener.md) |
  [mehrere Stages](schema/SchemaExample-MultiplesStages.md) |
  [mehrere Quellen](schema/SchemaExample-StageMultiplesSources.md) | [Engines](schema/Engines.md)
- **Synchronisation:** [Überblick](schema/SchemaSynchronization.md) | [push](schema/SchemaSynchronization-Push.md) |
  [pull](schema/SchemaSynchronization-Pull.md) | [fetch](schema/SchemaSynchronization-Fetch.md) |
  [introspect](schema/SchemaSynchronization-Introspect.md) | [incorporate](schema/SchemaSynchronization-Incorporate.md)
- **Verwendung:** [Verwendung](usage/Usage.md) | [Repository](usage/Repository.md) | [Transaktionen](usage/Transaction.md) |
  [Skripte](usage/Script.md)

## Community {#community}

Fragen, Ideen und Feedback sind in [GitHub Discussions](https://github.com/lambda-orm/wiki/discussions) und auf
[Discord](https://discord.com/invite/yXT6XBX2) willkommen; Issues und Pull Requests unter
[github.com/lambda-orm/core](https://github.com/lambda-orm/core).
