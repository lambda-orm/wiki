# Datenbank-Engines {#engines}

Diese Seite listet die Unterschiede zwischen den von λORM unterstützten Datenbank-Engines auf. Lesen Sie sie, wenn Sie eine Datenbank-Engine auswählen, ein Modell von einer Datenbank-Engine auf eine andere übertragen oder dasselbe Modell auf mehreren Datenbank-Engines betreiben.

λORM führt dieselben Abfragen und Stage-Befehle auf PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB und SQLite (Dialekt `SQLjs`, mit [sql.js](https://www.npmjs.com/package/sql.js)) aus.
Dasselbe Modell liefert auf jeder Datenbank-Engine dieselben Ergebnisse, mit Ausnahme der unten aufgeführten Unterschiede.
Diese Unterschiede werden durch das [Engines-Lab](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines) geprüft, das dieselben Tests auf PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free und MongoDB 7 ausführt; SQLite wird durch die Unit-Tests von `@lambdaorm/lib` auf einem echten sql.js geprüft.

Auch eine REST-API kann eine Quelle sein, mit dem Dialekt `Http`: siehe [Eine REST-API als Quelle](HttpSource.md).

## Zusammenfassung {#summary}

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | SQLite (SQLjs) | MongoDB |
| --- | --- | --- | --- | --- | --- | --- |
| String ohne `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | `VARCHAR(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | `JSON` (Text) | nativ |
| `point` | `geography` (PostGIS) | `POINT` | `geography` | `SDO_GEOMETRY` (Spatial) | `TEXT`, ohne Geo-Funktionen | GeoJSON |
| `vector` | `vector` (pgvector) | nur MariaDB 11.7 | SQL Server 2025 | Oracle 23ai | nein | nein |
| `''` (leerer String) | `''` | `''` | `''` | **NULL** | `''` | `''` |
| `upsert()` | ja | ja | ja (`MERGE`) | ja (`MERGE`) | ja | noch nicht (eindeutige Fehlermeldung) |
| `update().include()` einer Komposit-Beziehung | ja | ja | ja | ja | ja | ja (die Kinder sind eingebettet) |
| Komposit-Kinder | eigene Tabelle | eigene Tabelle | eigene Tabelle | eigene Tabelle | eigene Tabelle | im Dokument des Elternobjekts eingebettet |
| push / fetch von Spalten | ja | ja | ja | ja | ja; Typ oder Nullbarkeit einer Spalte können nicht geändert werden | schemalos: nur, ob die Collection existiert |
| Unique Key | Constraint | Constraint | Constraint | Constraint | eindeutiger Index | — |
| Fremdschlüssel | ja | ja | ja | ja | werden nicht erstellt | — |
| Umbenennen einer Spalte (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | `RENAME COLUMN` | — |
| `hash(x)` / `hash(x, key)` | ja / ja (`pgcrypto`) | ja / nein | ja / nein | ja / nein | nein / nein | nein / nein |
| Transaktionen | ja | ja | ja | ja | ja | erfordert ein Replica Set |

## Typen {#types}

- **String ohne Länge**: Nur auf PostgreSQL unbegrenzt (`TEXT`); auf den anderen Datenbank-Engines ist er `VARCHAR(80)`. Setzen Sie `length` für längere Werte oder `dbType` im Mapping der Eigenschaft.
- **json**: Objekte und Listen werden auf jeder Datenbank-Engine als solche geschrieben und gelesen; nur der Spaltentyp ändert sich (siehe Tabelle). Ein Pfad darin (`p.meta.address.city`) kann auf jeder Datenbank-Engine gelesen, gefiltert und geschrieben werden.
- **point**: ein GeoJSON-Punkt auf jeder Datenbank-Engine, die ihn unterstützt. PostgreSQL benötigt PostGIS (`CREATE EXTENSION postgis`); Oracle benötigt Spatial (die `slim`-Images von Oracle Free enthalten es nicht), und push erstellt seinen räumlichen Index nicht. SQL Server und Oracle messen `distance` auf dem Ellipsoid, daher weichen ihre Meter geringfügig von denen der anderen Datenbank-Engines ab. SQLite speichert den Punkt als Text, hat aber keine der Funktionen (`distance`, `within`, `inside`).
- **vector**: PostgreSQL mit pgvector, MariaDB 11.7, SQL Server 2025 und Oracle 23ai. MySQL, SQLite und MongoDB unterstützen ihn nicht (`$vectorSearch` von MongoDB Atlas wird noch nicht unterstützt). `innerProduct` ist auf MariaDB nicht verfügbar.
- **dateTime**: PostgreSQL schreibt den Wert mit Millisekunden und Offset, sodass eine Spalte `timestamptz(3)` (`dbType`) den exakten Zeitpunkt behält. Auf den anderen Datenbank-Engines hängt die Genauigkeit vom Spaltentyp ab (`DATETIME` behält mindestens die Sekunden).
- **boolean** und **json** werden auf SQLite als `0`/`1` bzw. als Text gespeichert und kommen so zurück, wie das Modell sie definiert.
- **Leerer String**: `''`, `0` und `false` sind Werte, niemals NULL. Oracle ist die Ausnahme: Es kennt keinen leeren String und speichert `''` als NULL, sodass ein als `''` geschriebener Wert als `null` zurückkommt und ein Filter `p.email == ""` nichts findet.

Siehe [Eigenschaftstypen](SchemaDefinition.md#property-types) und [JSON, Vektoren und Punkte](../queries/JsonVectorsPoints.md).

## Schreibvorgänge {#writes}

- `update` und `delete` geben auf jeder Datenbank-Engine die Anzahl der betroffenen Zeilen zurück.
- [`upsert()`](../queries/Insert.md#upsert) verwendet `ON CONFLICT … DO UPDATE` auf PostgreSQL und SQLite, `ON DUPLICATE KEY UPDATE` auf MySQL und MariaDB sowie `MERGE` auf SQL Server und Oracle (ab @lambdaorm/lib 3.5.0). Auf MongoDB schlägt es mit dem Fehler „not supported yet“ fehl.
- [`update().include()` einer Komposit-Beziehung](../queries/Update.md#update-an-aggregate-composite-relation) fügt die Kinder per Upsert ein, aktualisiert und löscht sie und wird daher in gleichem Umfang unterstützt. Auf MongoDB sind die Komposit-Kinder im Dokument des Elternobjekts eingebettet, daher ersetzt die Aktualisierung sie dort.
- Ein `autoIncrement`-Schlüssel ist `AUTO_INCREMENT` auf MySQL und MariaDB, `IDENTITY` auf SQL Server und die Rowid auf SQLite (ein `INTEGER`-Primärschlüssel).

## Maskierung {#masking}

Die Maskierungsfunktionen der [Sichten](Views.md#mask-functions) (`mask`, `maskLeft`, `maskRight`, `maskEmail`) werden in jede Datenbank-Engine übersetzt. `hash(x)` (SHA-256) gibt es auf PostgreSQL, MySQL, MariaDB, SQL Server und Oracle; `hash(x, key)` (HMAC) nur auf PostgreSQL, mit `pgcrypto`. Fehlt eine Funktion, schlägt die Abfrage beim Kompilieren fehl, statt im Speicher berechnet zu werden.

## Stage-Befehle {#stage-commands}

- `push` und `fetch` vergleichen Tabellen und Spalten auf jeder SQL-Datenbank-Engine.
- `push` ändert Typ, Länge oder Nullbarkeit einer Spalte mit der Syntax der jeweiligen Datenbank-Engine: `MODIFY` mit der vollständigen Definition auf MySQL und MariaDB (es behält `AUTO_INCREMENT`), `ALTER COLUMN` mit Typ und Nullbarkeit auf SQL Server, `ALTER COLUMN … SET DATA TYPE` / `SET NOT NULL` auf PostgreSQL und `MODIFY` auf Oracle.
- SQLite fügt einer bestehenden Tabelle keine Constraints hinzu und ändert keine Spalte: Der Unique Key ist ein eindeutiger Index, Fremdschlüssel werden nicht erstellt (SQLite prüft sie standardmäßig nicht), und eine Änderung des Typs oder der Nullbarkeit einer Spalte ist ein eindeutiger Fehler. Push liest seine Struktur aus `sqlite_master`.
- PostgreSQL liest den Typ von Spalten vom Typ `geography` und `vector`, sodass ein zweiter Push oder ein Fetch bei ihnen keinen Unterschied findet.
- MongoDB ist schemalos: `fetch` gibt nur an, ob jede Collection existiert, und ihre Felder sind diejenigen, die ihre Dokumente enthalten.

Siehe [Push](SchemaSynchronization-Push.md) und [Fetch](SchemaSynchronization-Fetch.md).

## Transaktionen {#transactions}

- Auf jeder SQL-Datenbank-Engine verwendet eine Transaktion eine Verbindung pro Quelle und führt Commit oder Rollback Quelle für Quelle aus (es gibt kein Two-Phase-Commit).
- SQLite hat echte Transaktionen (`BEGIN`, `COMMIT`, `ROLLBACK`). Alle seine Verbindungen teilen sich dieselbe Datenbank im Speicher, die beim Öffnen der ersten Verbindung aus der Datei gelesen und beim Beenden des ORM (`orm.end()`) in sie geschrieben wird.
- MongoDB-Transaktionen erfordern ein Replica Set.
- Eine Http-Quelle hat kein Rollback: Innerhalb einer Transaktion warten ihre Schreibvorgänge auf den Commit, den sie vor den Datenbanken ausführt (siehe [Eine REST-API als Quelle](HttpSource.md)).
