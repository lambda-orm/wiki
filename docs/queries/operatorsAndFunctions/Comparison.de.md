# Vergleichsoperatoren und -funktionen {#comparison-operators-and-functions}

Vergleichsoperatoren und -funktionen vergleichen zwei oder mehr Werte und geben einen booleschen Wert zurück. Sie werden meist im Prädikat von `filter` verwendet (der `WHERE`-Klausel des erzeugten SQL), können aber in jedem Ausdruck einer Abfrage eingesetzt werden.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

## Übersicht {#summary}

| Operator / Funktion | Beschreibung |
|---|---|
| `==`, `===` | Gleich |
| `!=`, `!==`, `<>` | Ungleich |
| `>` | Größer als |
| `<` | Kleiner als |
| `>=` | Größer oder gleich |
| `<=` | Kleiner oder gleich |
| `between` | Prüft, ob ein Wert innerhalb eines Bereichs liegt |
| `in` | Prüft, ob ein Wert in einer Liste von Werten enthalten ist |
| `includes` | Prüft, ob eine Liste einen Wert enthält |

## Gleich (`==`, `===`) {#equal}

Gibt `true` zurück, wenn beide Operanden gleich sind. `==` und `===` sind gleichwertig: Beide werden in SQL in `=` übersetzt.

**Syntax:**

- `a == b`
- `a === b`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> p.name)
```

**Ergebnis:** `[{"name":"Brazil"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 === "BRA").map(p=> p.name)
```

**Ergebnis:** `[{"name":"Brazil"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Ungleich (`!=`, `!==`, `<>`) {#not-equal}

Gibt `true` zurück, wenn sich die Operanden unterscheiden. Die drei Formen sind gleichwertig und werden in SQL in `<>` übersetzt.

**Syntax:**

- `a != b`
- `a !== b`
- `a <> b`

Ein Beispiel mit `!=` finden Sie auf der Seite [Logisch](Logical.md).

## Größer als, kleiner als (`>`, `<`, `>=`, `<=`) {#greater-than-less-than}

Vergleichen zwei Werte desselben Typs (Zahlen, Zeichenketten oder Datumswerte).

- `a > b`: `a` ist größer als `b`.
- `a < b`: `a` ist kleiner als `b`.
- `a >= b`: `a` ist größer oder gleich `b`.
- `a <= b`: `a` ist kleiner oder gleich `b`.

Name des ersten Landes (nach Name sortiert), dessen Breitengrad zwischen -11 und -9 (ausschließlich) liegt und dessen Längengrad -55 ist:

```typescript
Countries.filter(p=> p.latitude < -9 && p.latitude > -11 && p.longitude == -55 ).first(p=> p.name)
```

**Ergebnis:** `[{"name":"Brazil"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude < -9 AND (c.latitude > -11 AND c.longitude = -55))
ORDER BY c.name asc
LIMIT 0,1
```

## between {#between}

Gibt `true` zurück, wenn `value` im Bereich von `from` bis `to` liegt. In SQL wird es in `value BETWEEN from AND to` übersetzt, das beide Grenzen einschließt.

**Signatur:** `between(value: T, from: T, to: T): boolean`

```typescript
Countries.filter(p=> between(p.latitude,-11,-9) && p.longitude == -55 ).first(p=> p.name)
```

**Ergebnis:** `[{"name":"Brazil"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude BETWEEN -11 AND -9 AND c.longitude = -55)
ORDER BY c.name asc
LIMIT 0,1
```

## in {#in}

Gibt `true` zurück, wenn `value` einem der Werte von `list` entspricht. Es ersetzt mehrere mit `||` verknüpfte Bedingungen und wird in SQL in `value IN (...)` übersetzt.

**Signatur:** `in(value: T, list: T[]): boolean`

```typescript
Countries.filter(p=> in(p.iso3,["BRA","ARG"])).map(p=> p.name)
```

**Ergebnis:** `[{"name":"Argentina"},{"name":"Brazil"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 IN ('BRA', 'ARG')
```

## includes {#includes}

Gibt `true` zurück, wenn `list` den Wert `value` enthält. Es ist dieselbe Prüfung wie `in`, mit den Argumenten in umgekehrter Reihenfolge: Die Liste steht an erster Stelle. `contains` ist ein Alias von `includes`.

**Signatur:** `includes(list: T[], value: T): boolean`

Beispielsweise erzeugt `includes(["BRA","ARG"], p.iso3)` auf allen SQL-Engines dieselbe Bedingung `WHERE c.iso3 IN ('BRA', 'ARG')` wie das obige Beispiel mit `in`; auf MongoDB `{"iso3": {"$in": ["BRA", "ARG"]}}`. Die Methodenform `["BRA","ARG"].includes(p.iso3)` ist dieselbe.

Wie in JavaScript ist `includes` eines **Textes** eine andere Prüfung: `p.name.includes("ar")` gibt `true` zurück, wenn der Text `"ar"` enthält (`LIKE '%ar%'` auf SQL, eine wörtliche Suche auf MongoDB). Der Typ des ersten Arguments entscheidet: Eine Liste (oder eine Variable) ist die Listenprüfung, ein Text die Textprüfung.

## Datenbankunterstützung {#database-support}

!!! warning "Unterschiede zwischen Datenbank-Engines"
    - **MongoDB**: `between` wird in `{"$gte": from, "$lt": to}` übersetzt, sodass die Obergrenze – anders als bei SQL `BETWEEN` – **ausgeschlossen** ist.
