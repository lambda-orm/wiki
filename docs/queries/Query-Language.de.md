# Abfragesprache {#query-language}

Diese Seite stellt die Abfragesprache von λORM vor: wie eine Abfrage aussieht, welche Arten von Abfragen es gibt und wo jede davon dokumentiert ist.

λORM-Abfragen werden als [JavaScript-Lambda-Ausdrücke](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) über die Entitäten der Domäne geschrieben. Sie können sie als TypeScript-/JavaScript-Code schreiben und dabei durch die Entitäten des Modells navigieren, oder sie als Zeichenkette senden (zum Beispiel aus der [CLI](../cli/index.md) oder an das [Data Gateway](../data-gateway/index.md)).

λORM übersetzt jede Abfrage in die Sprache der Datenbank-Engine jeder Quelle (SQL für MySQL, MariaDB, PostgreSQL, SQL Server, Oracle und SQLite MongoDB-Aggregations-Pipelines oder HTTP-Anfragen an eine REST-API für eine [Http-Quelle](../schema/HttpSource.md)). Eine Abfrage kann auch Entitäten verschiedener Quellen kombinieren: siehe [Abfragen über Quellen hinweg](CrossSource.md).

## JavaScript über Ihre Domäne {#javascript-over-your-domain}

Eine λORM-Abfrage ist **der Code, den Sie über ein Array von Objekten schreiben würden**. Nehmen Sie eine Liste von
Produkten im Speicher:

```typescript
// an array in memory: plain JavaScript
products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort((a, b) => b.price - a.price)
```

Dieselbe Absicht als λORM-Abfrage über die `Products` der Domäne:

```typescript
// a λORM query: the same lambdas, over the domain
Products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort(p => desc(p.price))
```

die λORM auf PostgreSQL so ausführt:

```sql
SELECT p.ProductName AS "name", c.CategoryName AS "category", p.UnitPrice AS "price"
FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (c.CategoryName = 'Beverages' AND p.UnitPrice > 20)
ORDER BY p.UnitPrice desc
```

Die Abfrage hat keine Tabelle, keine Spalte und keinen Join genannt: `p.category.name` genügt, und das Mapping des
Schemas legt fest, dass `Products` die Tabelle `Products` ist, `name` die Spalte `ProductName` und die Beziehung
`category` ein Join über `CategoryID`.

`filter`, `map`, `sort`, `includes`, `p.category.name`: Arrow Functions, Eigenschaftspfade und Operatoren von
JavaScript. λORM liest diesen Ausdruck und wandelt ihn in SQL, eine MongoDB-Pipeline oder Aufrufe einer REST-API um.
Das unterscheidet es von anderen ORMs und Abfragesprachen:

| | λORM | Andere Ansätze |
| --- | --- | --- |
| **Die Sprache** | JavaScript-Lambdas, wie bei einem Array | SQL in Zeichenketten, ein eigener Query Builder (`.where('price', '>', 20)`) oder eine DSL (GraphQL, JPQL, HQL) |
| **Was eine Abfrage benennt** | die Domäne: `p.category.name`, `p.details` | Tabellen, Spalten und Joins oder die Namen einer bestimmten Datenbank |
| **Beziehungen** | mit einem Punkt verfolgt (`p.category.name`): λORM schreibt die Joins oder die Abfragen pro Quelle | Joins von Hand geschrieben oder eine API, um sie zu laden |
| **Wo sie läuft** | MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, SQLite, MongoDB, REST-APIs, mehrere gleichzeitig | meist eine einzige Familie von Engines |
| **Wo Sie sie schreiben** | TypeScript-Code, eine Zeichenkette, die CLI, REST, WebSocket, MCP, die IDE: derselbe Text | für jeden Weg eine andere Form |

### Transparent in TypeScript und JavaScript {#transparent-in-typescript-and-javascript}

In einer Anwendung ist eine Abfrage Code. `lambdaorm build` erzeugt das Modell der Domäne (`Orders`, `Customers`…,
siehe [Verwendung des Schemas](../schema/Schema-Use.md)), und eine Abfrage ist eine Funktion darüber: Ihre Parameter sind die
Parameter der Abfrage.

```typescript
import { orm } from '@lambdaorm/lib'
import { Orders } from './domain/model'

const ordersOf = (country: string) => Orders
  .filter(p => p.customer.country == country)
  .map(p => ({ id: p.id, customer: p.customer.name, date: p.orderDate }))

const result = await orm.execute(ordersOf, { country: 'Germany' })
```

- **IntelliSense:** Der Editor vervollständigt die Entitäten, ihre Eigenschaften und ihre Beziehungen wie bei jedem
  typisierten Objekt; ein falscher Name ist ein Kompilierfehler, keine Überraschung zur Laufzeit.
- **Refactoring und Review:** Eine Abfrage liest sich wie der restliche Code, für jeden, der JavaScript kennt.
- **Typisierte Ergebnisse:** Die [benannten Abfragen](../usage/TypedQueries.md) des Schemas erhalten den Typ ihres
  Ergebnisses.

### Überall derselbe Text {#the-same-text-everywhere}

Derselbe Ausdruck reist als Zeichenkette dorthin, wo es kein TypeScript gibt: in die [CLI](../cli/index.md), die REST-,
WebSocket- und MCP-APIs des [Data Gateway](../data-gateway/index.md) oder zu einem KI-Agenten. In der
[Data Gateway IDE](../ide/Queries.md) vervollständigt der Abfrageeditor ihn beim Tippen anhand des Schemas: Entitäten,
Eigenschaften und Beziehungen (`p.customer.` listet die Eigenschaften von `Customers` auf), und der
[Abfrage-Assistent](../ide/QueryWizard.md) erstellt ihn für Sie.

Dieselbe Sprache wird im Schema selbst verwendet: Die Filter der [Sichten](../schema/Views.md), die Bedingungen der
Stages, Constraints und Standardwerte sind ebenfalls Lambda-Ausdrücke.

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
