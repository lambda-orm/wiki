# Funktionen {#features}

Ein Überblick über das, was λORM bietet, mit Links zu den Seiten, die jede Funktion beschreiben.

## Datenbank-Engines {#database-engines}

- MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB und SQLite (SQLjs).
- Eine einzige Abfrage kann mehrere Datenbanken einbeziehen, auch unterschiedlicher Datenbank-Engines.
- [Datenbank-Engines](schema/Engines.md): die Unterschiede zwischen den Datenbank-Engines (Typen, leere Strings, `upsert`, …).

## Abfragesprache {#query-language}

- [Abfragesprache](queries/Query-Language.md) auf Basis von JavaScript-Lambda-Ausdrücken.
- Abfragen können als JavaScript-/TypeScript-Code oder als String geschrieben werden.
- Klauseln für [Select](queries/Select.md), [Insert](queries/Insert.md), [Bulk Insert](queries/BulkInsert.md),
  [Update](queries/Update.md) und [Delete](queries/Delete.md).
- Implizite [Joins](queries/Join.md) und [Gruppierung](queries/Grouping.md).
- Eager Loading von Beziehungen mit [include](queries/Include.md), auch über Datenbanken hinweg.
- [Operatoren und Funktionen](queries/operatorsAndFunctions/OperatorsAndFunctions.md).
- [Abfrage-Metadaten](queries/Metadata.md): die Parameter, das Modell, die Constraints und der Ausführungsplan einer Abfrage.

## Verwendung {#usage}

- [Repositories und benutzerdefinierte Repositories](usage/Repository.md).
- [Transaktionen und verteilte Transaktionen](usage/Transaction.md), über Quellen und Stages hinweg.
- [Skripte](usage/Script.md): ein ganzer Anwendungsfall (Variablen, Bedingungen, Schleifen und mehrere Abfragen) in einer
  Transaktion, auch über das Data Gateway.
- [Verwendungsbeispiele](usage/Usage.md): eine einzelne Quelle, mehrere Quellen, CQRS und der Node.js-Client.

## Schema {#schema}

- [Schema](schema/Schema.md)-Konfiguration, die das Domänenmodell von der Infrastruktur entkoppelt.
- Konfiguration in JSON oder YAML.
- [Mappings](schema/SchemaDefinition.md) zwischen der Domäne und der Infrastruktur.
- [Vererbung von Entitäten](schema/SchemaExample-Extend.md) (`extends`).
- [Umgebungsvariablen](schema/SchemaDefinition-EnvironmentVariables.md).
- Indizes, eindeutige Schlüssel und Constraints.
- Bedingungen und Aktionen auf Basis der Ausdrucks-Engine [3xpr](https://www.npmjs.com/package/3xpr)
  ([Ausdrücke](schema/SchemaDefinition-Expressions.md)).
- [Stages](schema/SchemaExample-MultiplesStages.md): mehrere Infrastruktur-Szenarien für dieselbe Domäne.
- [Synchronisierung](schema/SchemaSynchronization.md) zwischen dem Schema und den Datenbanken:
  [push](schema/SchemaSynchronization-Push.md), [pull](schema/SchemaSynchronization-Pull.md),
  [fetch](schema/SchemaSynchronization-Fetch.md), [introspect](schema/SchemaSynchronization-Introspect.md) und
  [incorporate](schema/SchemaSynchronization-Incorporate.md).
- [Listener und Subscriber](schema/SchemaExample-Listener.md): werden abgewartet und in der Transaktion der Anweisung
  ausgeführt, die sie auslöst.

## Performance {#performance}

- [Bulk Insert](queries/BulkInsert.md).
- Hochperformante Abfragen.
- Connection Pooling.

## Tools und Clients {#tools-and-clients}

- Unterstützung für TypeScript und JavaScript.
- [CLI](cli/index.md) (`npm i -g @lambdaorm/cli`, Befehl `lambdaorm`).
- [Data Gateway](data-gateway/index.md) (Docker-Image `flaviorita/data-gateway`):
    - eine REST API, MCP für KI-Agenten und eine WebSocket API, mit mehreren Schemas pro Instanz;
    - Zugangsdaten mit Berechtigungen, Audit von Schreibvorgängen, Metriken und Health Checks;
    - eine Web-UI: Explorer, Entitätsformulare, gespeicherte Abfragen und Diagramme der Domäne.
- [Clients](data-gateway/Clients.md):
    - [Node.js-Client](https://www.npmjs.com/package/@lambdaorm/client) (`@lambdaorm/client`, REST oder WebSocket);
    - andere Sprachen: Generieren Sie einen Client aus dem OpenAPI-3-Dokument des Data Gateways.
