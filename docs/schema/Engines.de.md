# Datenbank-Engines {#engines}

Diese Seite listet die Unterschiede zwischen den von λORM unterstützten Datenbank-Engines auf.

λORM führt dieselben Abfragen und Stage-Befehle auf PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, MongoDB und SQLite (Dialekt `SQLjs`) aus.
Dasselbe Modell liefert auf jeder Datenbank-Engine dieselben Ergebnisse, mit Ausnahme der unten aufgeführten Unterschiede.
Diese Unterschiede werden durch das [Engines-Lab](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines) geprüft, das dieselben Tests auf PostgreSQL 17, MySQL 8.4, MariaDB 11.4, SQL Server 2022, Oracle 23 Free und MongoDB 7 ausführt.

## Zusammenfassung {#summary}

| | PostgreSQL | MySQL / MariaDB | SQL Server | Oracle | MongoDB |
| --- | --- | --- | --- | --- | --- |
| String ohne `length` | `TEXT` | `VARCHAR(80)` | `VARCHAR(80)` | `VARCHAR2(80)` | — |
| `json` | `JSONB` | `JSON` | `NVARCHAR(MAX)` | `CLOB` | nativ |
| `''` (leerer String) | `''` | `''` | `''` | **NULL** | `''` |
| `upsert()` | ja | ja | ja (`MERGE`) | ja (`MERGE`) | noch nicht (eindeutige Fehlermeldung) |
| `update().include()` einer Komposit-Beziehung | ja | ja | ja | ja | ja (die Kinder sind eingebettet) |
| Komposit-Kinder | eigene Tabelle | eigene Tabelle | eigene Tabelle | eigene Tabelle | im Dokument des Elternobjekts eingebettet |
| push / fetch von Spalten | ja | ja | ja | ja | schemalos: nur, ob die Collection existiert |
| Umbenennen einer Spalte (`previousMapping`) | `RENAME COLUMN` | `RENAME COLUMN` | `sp_rename` | `RENAME COLUMN` | — |

## Typen {#types}

- **String ohne Länge**: Nur auf PostgreSQL unbegrenzt (`TEXT`); auf den anderen Datenbank-Engines ist er `VARCHAR(80)`. Setzen Sie `length` für längere Werte oder `dbType` im Mapping der Eigenschaft.
- **json**: Objekte und Listen werden auf jeder Datenbank-Engine als solche geschrieben und gelesen; nur der Spaltentyp ändert sich (siehe Tabelle).
- **dateTime**: PostgreSQL schreibt den Wert mit Millisekunden und Offset, sodass eine Spalte `timestamptz(3)` (`dbType`) den exakten Zeitpunkt behält. Auf den anderen Datenbank-Engines hängt die Genauigkeit vom Spaltentyp ab (`DATETIME` behält mindestens die Sekunden).
- **Leerer String**: `''`, `0` und `false` sind Werte, niemals NULL. Oracle ist die Ausnahme: Es kennt keinen leeren String und speichert `''` als NULL, sodass ein als `''` geschriebener Wert als `null` zurückkommt und ein Filter `p.email == ""` nichts findet.

Siehe [Eigenschaftstypen](SchemaDefinition.md#property-types).

## Schreibvorgänge {#writes}

- `update` und `delete` geben auf jeder Datenbank-Engine die Anzahl der betroffenen Zeilen zurück.
- [`upsert()`](../queries/Insert.md#upsert) verwendet `ON CONFLICT … DO UPDATE` auf PostgreSQL, `ON DUPLICATE KEY UPDATE` auf MySQL und MariaDB sowie `MERGE` auf SQL Server und Oracle (ab @lambdaorm/lib 3.5.0). Auf MongoDB schlägt es mit dem Fehler „not supported yet“ fehl.
- [`update().include()` einer Komposit-Beziehung](../queries/Update.md#update-an-aggregate-composite-relation) fügt die Kinder per Upsert ein, aktualisiert und löscht sie und wird daher in gleichem Umfang unterstützt. Auf MongoDB sind die Komposit-Kinder im Dokument des Elternobjekts eingebettet, daher ersetzt die Aktualisierung sie dort.

## Stage-Befehle {#stage-commands}

- `push` und `fetch` vergleichen Tabellen und Spalten auf jeder SQL-Datenbank-Engine.
- MongoDB ist schemalos: `fetch` gibt nur an, ob jede Collection existiert, und ihre Felder sind diejenigen, die ihre Dokumente enthalten.

Siehe [Push](SchemaSynchronization-Push.md) und [Fetch](SchemaSynchronization-Fetch.md).

## Transaktionen {#transactions}

- Auf jeder SQL-Datenbank-Engine verwendet eine Transaktion eine Verbindung pro Quelle und führt Commit oder Rollback Quelle für Quelle aus (es gibt kein Two-Phase-Commit).
- MongoDB-Transaktionen erfordern ein Replica Set.
