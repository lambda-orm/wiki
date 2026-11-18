# Operatoren und Funktionen {#operators-and-functions}

λORM-Abfragen sind Lambda-Ausdrücke, in denen Sie die in dieser Referenz aufgeführten Operatoren und Funktionen verwenden können. λORM übersetzt jeden davon in die Sprache der Datenbank-Engine der Datenquelle: SQL für MySQL, MariaDB, PostgreSQL, SQL Server, Oracle und SQLite sowie Aggregation-Pipelines für MongoDB. Eine Einführung in Abfragen finden Sie unter [Abfragesprache](../Query-Language.md).

Jede Seite beschreibt die Operatoren und Funktionen einer Kategorie mit ihrer Signatur, einer Beispielabfrage, deren Ergebnis und dem dafür erzeugten SQL. Nicht jede Funktion lässt sich in jede Datenbank-Engine übersetzen; jede Seite endet mit einem Abschnitt *Datenbankunterstützung*, der die Unterschiede auflistet.

## Skalare Operatoren und Funktionen {#scalar-operators-and-functions}

| Seite | Inhalt |
|---|---|
| [Vergleich](Comparison.md) | `==`, `!=`, `>`, `<`, `>=`, `<=`, `between`, `in`, `includes` |
| [Logisch](Logical.md) | `!`, `&&`, `||` |
| [Numerisch](Numeric.md) | Arithmetische Operatoren und mathematische Funktionen (`abs`, `round`, `log`, `sin`, ...) |
| [Zeichenketten](String.md) | Textfunktionen (`concat`, `lower`, `upper`, `replace`, `substring`, ...) |
| [Datum und Uhrzeit](Datetime.md) | Aktuelles Datum, Konvertierungen, Datumsbestandteile, Intervalle und Datumsdifferenzen |
| [Nullable](Nullable.md) | `nvl`, `nvl2`, `isNull`, `isNotNull` |
| [Bitweise](Bitwise.md) | `~`, `&`, `|`, `^`, `<<`, `>>` |

## Aggregation und Sortierung {#aggregation-and-sorting}

| Seite | Inhalt |
|---|---|
| [Gruppe](Group.md) | Aggregatfunktionen: `count`, `sum`, `avg`, `min`, `max`, `first`, `last` |
| [Sortierung](Sort.md) | `asc` und `desc`, verwendet in `sort` |

!!! tip "Tipp"
    Um zu prüfen, wie eine Abfrage für eine bestimmte Datenquelle übersetzt wird, ohne sie auszuführen, verwenden Sie [`orm.plan`](../Metadata.md).
