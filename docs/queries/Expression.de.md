# Lambda-Ausdrücke {#lambda-expressions}

Diese Seite fasst die Bausteine einer λORM-Abfrage zusammen: die Methoden, die Sie an einer Entität verketten, sowie die Operatoren und Funktionen, die Sie innerhalb der Lambdas verwenden können. Nutzen Sie sie als Kurzreferenz; jede Methode verweist auf die Seite mit ihren Beispielen.

Abfragen sind [Lambda-Ausdrücke](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions), die in der Programmiersprache selbst geschrieben werden. Sie beziehen sich auf die Entitäten und Eigenschaften der Domäne und sind daher unabhängig von der Sprache der Datenbank und davon, wie die Daten gespeichert sind.

## Beispiel {#example}

Die folgende Abfrage liest die Produkte, deren Name mit „A“ beginnt, zusammen mit dem Namen ihrer Kategorie, sortiert nach Kategorie (aufsteigend) und Produkt (absteigend), und gibt die erste Seite mit 10 Datensätzen zurück:

```typescript
Products
	.filter(p => upper(substr(p.name, 1, 1)) == "A")
	.map(p => ({ category: p.category.name, product: p.name }))
	.sort(p => [p.category, desc(p.product)])
	.page(1, 10)
```

Auf Oracle übersetzt λORM sie in:

```sql
SELECT c.CategoryName AS "category", p.ProductName AS "product"
FROM Products p
INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE UPPER(SUBSTR(p.ProductName,1,1)) = 'A'
ORDER BY "category" asc, "product" desc
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

Dieselbe Abfrage läuft auf jeder anderen Datenbank-Engine: Auf MySQL wird die Paginierung beispielsweise zu `LIMIT 0,10`.

## Vorteile {#advantages}

- Abfragen werden in derselben Programmiersprache wie die Anwendung geschrieben.
- Es muss keine neue Sprache gelernt werden.
- Ausdrücke sind leicht zu schreiben und zu lesen.
- IntelliSense der IDE hilft beim Schreiben der Ausdrücke.
- Syntaxfehler werden bereits beim Schreiben erkannt.

## Abfragemethoden {#query-methods}

| Methode | Beschreibung | SQL-Entsprechung | Beispiele |
|:--|:--|:--|:--|
| filter | Filtert die Datensätze. | WHERE | [Select](Select.md) |
| having | Filtert die Gruppen. | HAVING | [Grouping](Grouping.md) |
| map | Legt die zurückzugebenden Eigenschaften fest. | SELECT | [Select](Select.md) |
| distinct | Legt die zurückzugebenden Eigenschaften fest und entfernt doppelte Datensätze. | SELECT DISTINCT | [Select](Select.md) |
| first | Gibt den ersten Datensatz zurück. | SELECT + ORDER BY + LIMIT | [Select](Select.md) |
| last | Gibt den letzten Datensatz zurück. | SELECT + ORDER BY DESC + LIMIT | [Select](Select.md) |
| sort | Legt die Reihenfolge der Datensätze fest. | ORDER BY | [Select](Select.md) |
| page | Paginiert die Datensätze. | LIMIT / OFFSET (abhängig vom Dialekt) | [Select](Select.md) |
| include | Lädt die Datensätze verbundener Entitäten. | | [Include](Include.md) |
| insert | Fügt einen Datensatz ein. | INSERT | [Insert](Insert.md) |
| upsert | Fügt einen Datensatz ein oder aktualisiert ihn, falls einer mit demselben Primärschlüssel existiert. | INSERT … ON CONFLICT / MERGE | [Insert](Insert.md#upsert) |
| bulkInsert | Fügt viele Datensätze auf einmal ein. | INSERT | [Bulk Insert](BulkInsert.md) |
| update | Aktualisiert Datensätze; hat immer einen Filter. | UPDATE mit WHERE | [Update](Update.md) |
| updateAll | Aktualisiert alle Datensätze einer Entität. | UPDATE ohne WHERE | [Update](Update.md) |
| delete | Löscht Datensätze; hat immer einen Filter. | DELETE mit WHERE | [Delete](Delete.md) |
| deleteAll | Löscht alle Datensätze einer Entität. | DELETE ohne WHERE | [Delete](Delete.md) |

- Es gibt keine Methode für Joins: Ein INNER JOIN wird abgeleitet, wenn die Abfrage eine Beziehung durchläuft, wie in `p.category.name` (siehe [Join](Join.md)); liegt die verbundene Entität in einer anderen Quelle, wird die Abfrage quellenübergreifend gelöst (siehe [Abfragen über Quellen hinweg](CrossSource.md)).
- Es gibt keine Methode für GROUP BY: Es wird abgeleitet, wenn eine Aggregatfunktion verwendet wird (siehe [Grouping](Grouping.md)).

## Operatoren {#operators}

Die Operatoren sind dieselben wie in JavaScript.

| Kategorie | Operatoren | Weitere Informationen |
|:--|:--|:--|
| Arithmetisch | `-`, `+`, `*`, `/`, `**`, `//`, `%` | [Numeric](operatorsAndFunctions/Numeric.md) |
| Bitweise | `~`, `&`, `\|`, `^`, `<<`, `>>` | [Bitwise](operatorsAndFunctions/Bitwise.md) |
| Vergleich | `==`, `===`, `!=`, `!==`, `>`, `<`, `>=`, `<=` | [Comparison](operatorsAndFunctions/Comparison.md) |
| Logisch | `!`, `&&`, `\|\|` | [Logical](operatorsAndFunctions/Logical.md) |
| Array | `[]` | |

## Funktionen {#functions}

| Kategorie | Funktionen | Weitere Informationen |
|:--|:--|:--|
| Numerisch | abs, ceil, cos, exp, ln, log, remainder, round, sign, sin, tan, trunc… | [Numeric](operatorsAndFunctions/Numeric.md) |
| Zeichenkette | chr, lower, lpad, ltrim, replace, rpad, rtrim, substr, trim, upper, concat… | [String](operatorsAndFunctions/String.md) |
| Datum/Uhrzeit | curTime, today, now, time, date, dateTime, year, month, day, weekday, hour… | [Datetime](operatorsAndFunctions/Datetime.md) |
| Konvertierung | toString, toNumber | [String](operatorsAndFunctions/String.md) |
| Nullable | nvl, nvl2, isNull, isNotNull | [Nullable](operatorsAndFunctions/Nullable.md) |
| Allgemein | as, distinct | |
| Sortierung | asc, desc | [Sort](operatorsAndFunctions/Sort.md) |
| Bedingung | between, in, includes | [Comparison](operatorsAndFunctions/Comparison.md) |
| Gruppe | avg, count, first, last, max, min, sum | [Group](operatorsAndFunctions/Group.md) |
| Metadaten | user, source | |
| JSON | jsonHas, jsonSet, jsonIncludes (Pfade wie `p.meta.address.zip`) | [JSON, Vektoren und Punkte](JsonVectorsPoints.md) |
| Vektoren | cosineDistance, l2Distance, innerProduct | [JSON, Vektoren und Punkte](JsonVectorsPoints.md#vectors) |
| Geo | point, distance, within, inside | [JSON, Vektoren und Punkte](JsonVectorsPoints.md#points) |

Die vollständige Referenz finden Sie unter [Operatoren & Funktionen](operatorsAndFunctions/OperatorsAndFunctions.md).
