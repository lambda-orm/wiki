# Abfragesprache {#query-language}

Diese Seite stellt die Abfragesprache von λORM vor: wie eine Abfrage aussieht, welche Arten von Abfragen es gibt und wo jede davon dokumentiert ist.

λORM-Abfragen werden als [JavaScript-Lambda-Ausdrücke](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) über die Entitäten der Domäne geschrieben. Sie können sie als TypeScript-/JavaScript-Code schreiben und dabei durch die Entitäten des Modells navigieren, oder sie als Zeichenkette senden (zum Beispiel aus der [CLI](../cli/index.md) oder an das [Data Gateway](../data-gateway/index.md)).

λORM übersetzt jede Abfrage in die Sprache der Datenbank-Engine jeder Quelle (SQL für MySQL, MariaDB, PostgreSQL, SQL Server, Oracle und SQLite MongoDB-Aggregations-Pipelines oder HTTP-Anfragen an eine REST-API für eine [Http-Quelle](../schema/HttpSource.md)). Eine Abfrage kann auch Entitäten verschiedener Quellen kombinieren: siehe [Abfragen über Quellen hinweg](CrossSource.md).

## Abfragetypen {#query-types}

### DQL {#dql}

DQL-Abfragen (Data Query Language) rufen Daten ab. Sie können so einfach sein wie das Lesen aller Datensätze einer Entität, oder sie können die Datensätze filtern, sortieren, gruppieren und paginieren, Werte daraus berechnen und verbundene Entitäten laden.

**Siehe:** [Select](Select.md), [Join](Join.md), [Grouping](Grouping.md), [Include](Include.md), [JSON, Vektoren und Punkte](JsonVectorsPoints.md), [Abfragen über Quellen hinweg](CrossSource.md)

### DML {#dml}

DML-Abfragen (Data Manipulation Language) ändern Daten. Sie umfassen die folgenden Operationen:

- **insert**: fügt einer Entität neue Datensätze hinzu (auch `bulkInsert` und `upsert`).
- **update**: ändert vorhandene Datensätze.
- **delete**: entfernt Datensätze.

**Siehe:** [Insert](Insert.md), [Bulk Insert](BulkInsert.md), [Update](Update.md), [Delete](Delete.md)

### DDL {#ddl}

DDL-Anweisungen (Data Definition Language) erstellen, ändern und löschen Datenbankstrukturen und zugehörige Objekte:

- **CREATE**: erstellt neue Objekte in der Datenbank, etwa Tabellen und Indizes.
- **ALTER**: ändert die Struktur vorhandener Objekte, zum Beispiel durch Hinzufügen, Ändern oder Entfernen der Spalten einer Tabelle.
- **DROP**: löscht Objekte aus der Datenbank.

DDL-Abfragen schreiben Sie nicht selbst: λORM erzeugt und führt sie aus, wenn Sie die Befehle zur Schemasynchronisierung verwenden.

**Siehe:** [Push](../schema/SchemaSynchronization-Push.md), [Pull](../schema/SchemaSynchronization-Pull.md), [Fetch](../schema/SchemaSynchronization-Fetch.md), [Introspect](../schema/SchemaSynchronization-Introspect.md), [Incorporate](../schema/SchemaSynchronization-Incorporate.md)

## Beispiel {#example}

Die folgende Abfrage liest die Länder einer Region mit ihren Bundesstaaten, deren Name mit „F“ beginnt. Sie gibt Name, Subregion und Position jedes Landes zurück, 3 Länder pro Seite:

```typescript
Countries
	.filter(p => p.region == region)
	.map(p => [p.name, p.subregion, p.latitude, p.longitude]) // properties of the country
	.include(p => p.states.filter(p => substr(p.name, 1, 1) == "F") // states starting with 'F'
		.map(p => [p.name, p.latitude, p.longitude])
	)
	.page(1, 3) // first page, 3 countries per page
```

In diesem Schema befindet sich `Countries` in einer MySQL-Quelle und `States` in einer PostgreSQL-Quelle (siehe [Stage mit mehreren Quellen](../schema/SchemaExample-StageMultiplesSources.md)). λORM führt eine Anweisung pro Quelle aus:

```sql
-- MySQL: the countries of the region, first page of 3 records
SELECT c.name AS name, c.subregion AS subregion, c.latitude AS latitude, c.longitude AS longitude, c.iso3 AS `__iso3`
FROM Countries c
WHERE c.region = ?
ORDER BY c.name asc
LIMIT 0,3

-- PostgreSQL: the states starting with 'F' of the countries read above
SELECT s.NAME AS "name", s.LATITUDE AS "latitude", s.LONGITUDE AS "longitude", s.COUNTRY_CODE AS "LambdaOrmParentId"
FROM TBL_STATES s
WHERE SUBSTR(s.NAME,1,1) = 'F'
  AND s.COUNTRY_CODE IN (?)
```

Anschließend werden die Bundesstaaten im Speicher ihrem Land zugeordnet, sodass jedes Land im Ergebnis ein Array `states` hat.

## Vorteile {#advantages}

- Abfragen werden in derselben Programmiersprache wie die Anwendung geschrieben.
- Es muss keine neue Sprache gelernt werden.
- Abfragen sind leicht zu schreiben und zu lesen.
- IntelliSense der IDE hilft beim Schreiben der Ausdrücke.
- Syntaxfehler werden bereits beim Schreiben erkannt.
