# Funktionen {#features}

Ein Überblick über das, was λORM heute kann, mit Links zu den Seiten, die jede Funktion beschreiben.

## Quellen {#sources}

- Datenbanken: MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB und SQLite (über sql.js, Dialekt `SQLjs`).
- [Eine REST-API als Quelle](schema/HttpSource.md): der Dialekt `Http`, mit OAuth2 Client Credentials und Headern, die
  aus dem Kontext des Aufrufers weitergereicht werden.
- Eine Abfrage kann mehrere Quellen einbeziehen, auch unterschiedlicher Engines; die
  [Stages](schema/SchemaExample-MultiplesStages.md) entscheiden, wo jede Entität gespeichert wird.
- [Datenbank-Engines](schema/Engines.md): worin sie sich unterscheiden (Typen, leere Strings, `upsert`, …).

## Abfragesprache {#query-language}

- Eine [Abfragesprache](queries/Query-Language.md) auf Basis von JavaScript-Lambda-Ausdrücken, geschrieben als
  TypeScript-Code oder als String.
- [Select](queries/Select.md), [Insert](queries/Insert.md), [Bulk Insert](queries/BulkInsert.md),
  [Update](queries/Update.md) und [Delete](queries/Delete.md).
- Implizite [Joins](queries/Join.md) und [Gruppierung](queries/Grouping.md).
- Eager Loading von Beziehungen mit [include](queries/Include.md), auch über Datenbanken hinweg: eine Abfrage pro
  Beziehung, nie eine pro Zeile.
- [Abfragen über Quellen hinweg](queries/CrossSource.md): filtern, abbilden, gruppieren und sortieren nach Feldern von
  Beziehungen, die in anderen Quellen gespeichert sind.
- [JSON-Pfade, Vektoren und Punkte](queries/JsonVectorsPoints.md): `p.meta.address.zip` und `jsonSet`;
  `cosineDistance`, `l2Distance` und `innerProduct` für die Ähnlichkeitssuche (RAG); `distance` in Metern, `within`
  und `inside` (ein Polygon) für Geodaten.
- [Operatoren und Funktionen](queries/operatorsAndFunctions/OperatorsAndFunctions.md).
- [Abfrage-Metadaten](queries/Metadata.md): die Parameter, das Modell, die Constraints und der Ausführungsplan einer
  Abfrage, ohne sie auszuführen.

## Schreiben {#writes}

- Inserts mit ihren Kindern (`Orders.insert().include(p => p.details)`), [Bulk Insert](queries/BulkInsert.md),
  `upsert`, `bulkMerge` und `bulkDelete`.
- `update` und `delete` liefern die Anzahl der betroffenen Zeilen: 0 bedeutet nicht gefunden oder einen Konflikt beim
  optimistischen Sperren.
- `update().include()` einer zusammengesetzten Beziehung speichert das ganze Aggregat.

## Verwendung {#usage}

- [Anwendungsbeispiele](usage/Usage.md): eine einzelne Quelle, mehrere Quellen, CQRS und der Node.js-Client.
- [Repositories](usage/Repository.md), von `lambdaorm build` erzeugt und mit eigenen Methoden erweitert.
- [Transaktionen](usage/Transaction.md) über Quellen und Stages hinweg.
- [Skripte](usage/Script.md): ein ganzer Anwendungsfall (Variablen, Bedingungen, Schleifen und mehrere Abfragen) in
  einer Transaktion, auch über das Data Gateway.
- [Datenänderungen und Outbox](usage/DataEvents.md): `orm.onDataChange` nach jedem Commit und eine Outbox, die in
  derselben Transaktion geschrieben wird.
- [Typisierte Abfragen](usage/TypedQueries.md): benannte Abfragen im Schema und die Typen ihrer Ergebnisse.

## Schema {#schema}

- Ein [Schema](schema/Schema.md) in YAML oder JSON, das die Domäne von der Infrastruktur entkoppelt.
- [Mappings](schema/SchemaDefinition.md) zwischen der Domäne und den Datenbanken, und
  [Entitätsvererbung](schema/SchemaExample-Extend.md) (`extends`).
- [Umgebungsvariablen](schema/SchemaDefinition-EnvironmentVariables.md) für Verbindungen und Geheimnisse.
- Indizes, eindeutige Schlüssel, Constraints, Standardwerte und berechnete Eigenschaften, geschrieben als
  [Ausdrücke](schema/SchemaDefinition-Expressions.md) von [3xpr](https://www.npmjs.com/package/3xpr).
- [Stages](schema/SchemaExample-MultiplesStages.md): mehrere Infrastrukturen für dieselbe Domäne (Entwicklung,
  Produktion, CQRS).
- [Listener und Subscriber](schema/SchemaExample-Listener.md): werden abgewartet (await) und laufen in der Transaktion
  der Anweisung, die sie auslöst.

## Zugriffskontrolle {#access-control}

- [Views](schema/Views.md): schränken Entitäten und Eigenschaften ein, maskieren sie, fügen berechnete hinzu und
  kennzeichnen personenbezogene Daten (PII).
- [Kontext und Zeilenfilter](schema/Context.md): wer eine Abfrage ausführt und welche Zeilen jede View sieht.
- Das [Data Gateway](data-gateway/Security.md): Zugangsdaten mit Berechtigungen und ein Audit jedes Schreibvorgangs.

## Synchronisation und Migrationen {#synchronization-and-migrations}

- [Synchronisation](schema/SchemaSynchronization.md) zwischen dem Schema und den Datenbanken:
  [push](schema/SchemaSynchronization-Push.md), [pull](schema/SchemaSynchronization-Pull.md),
  [fetch](schema/SchemaSynchronization-Fetch.md) (die Abweichungen, mit Exit-Code 1 für CI),
  [introspect](schema/SchemaSynchronization-Introspect.md) und
  [incorporate](schema/SchemaSynchronization-Incorporate.md).
- [Migrationen](schema/SchemaSynchronization-Migrations.md): Änderungen, die Daten verlieren können, stoppen `push`,
  sofern sie nicht erlaubt werden; jede Änderung wird mit ihrem Undo geschrieben, und `migrate` kehrt zu einer Version
  zurück.
- [Seed](schema/SchemaSynchronization-Seed.md): die Daten, mit denen eine Stage beginnt, nur dort eingefügt, wo sie
  fehlen.

## Performance und Betrieb {#performance-and-operations}

- [Bulk Insert](queries/BulkInsert.md), und Includes, die die Schlüssel jeder Ebene mit `IN` lesen, in Blöcken, die
  parallel laufen.
- Connection Pooling.
- [Observability](schema/Observability.md): Logs, Metriken und Traces mit OpenTelemetry.

## Werkzeuge und Clients {#tools-and-clients}

- Die [CLI](cli/index.md) (`npm i -g @lambdaorm/cli`, Befehl `lambdaorm`): Projekte, Codegenerierung, Synchronisation,
  Import und Export, Abfragen und Skripte.
- Das [Data Gateway](data-gateway/index.md) (Docker-Image `flaviorita/data-gateway`):
    - [REST](data-gateway/Rest.md), [WebSocket](data-gateway/WebSocket.md) und [MCP](data-gateway/Mcp.md) für
      KI-Agenten, mit mehreren Schemas pro Instanz;
    - [Zugangsdaten mit Berechtigungen](data-gateway/Security.md), Audit der Schreibvorgänge, Metriken und Health
      Checks.
- Die [IDE](ide/index.md) des Data Gateway (Docker oder Desktop): Verbindungen, Explorer, Entitätsformulare, Abfragen
  mit Autovervollständigung, Diagramme und Administration; ihre React-Komponenten sind
  [`@lambdaorm/ui`](ide/Embedding.md).
- [Clients](data-gateway/Clients.md):
    - der Node.js-Client (`@lambdaorm/client`, REST oder WebSocket), mit der Schnittstelle der Bibliothek;
    - andere Sprachen: einen Client aus dem OpenAPI-3-Dokument des Data Gateway generieren.
