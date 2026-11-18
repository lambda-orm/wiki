# Nullable-Funktionen {#nullable-functions}

Nullable-Funktionen prüfen, ob ein Wert null ist, oder ersetzen Nullwerte durch einen anderen Wert.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entitäten `Countries` und `States` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM erzeugt hat. Im Testschema wird `Countries` in MySQL und `States` in PostgreSQL gespeichert (abgebildet auf die Tabelle `TBL_STATES`), daher wird das SQL jedes Beispiels im Dialekt seiner Datenquelle gezeigt. Um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

## Übersicht {#summary}

| Funktion | Beschreibung |
|---|---|
| `nvl` | Gibt einen Standardwert zurück, wenn der Wert null ist |
| `nvl2` | Gibt einen Wert zurück, wenn der Wert nicht null ist, und einen anderen, wenn er null ist |
| `isNull` | Prüft, ob ein Wert null ist |
| `isNotNull` | Prüft, ob ein Wert nicht null ist |

## nvl {#nvl}

Gibt `value` zurück, wenn er nicht null ist; andernfalls wird `default` zurückgegeben.

**Signatur:** `nvl(value: T, default: T): T`

Anzahl der Bundesstaaten, deren Breitengrad null ist (null wird durch -100 ersetzt, sodass die Bedingung zutrifft):

```typescript
States.filter(p=> nvl(p.latitude,-100)== -100).map(p=> count(1))
```

**Ergebnis:** `[{"count":68}]`

**Erzeugtes SQL (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (CASE WHEN s.LATITUDE IS NOT NULL THEN s.LATITUDE ELSE -100 END) = -100
```

Landessprachlicher Name des Landes mit dem ISO-3-Code „CIV“ oder „???“, wenn er null ist:

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl(p.native,"???")})
```

**Ergebnis:** `[{"native":"???"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT IFNULL(c.native,'???') AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## nvl2 {#nvl2}

Gibt `a` zurück, wenn `value` nicht null ist, und `b`, wenn er null ist.

**Signatur:** `nvl2(value: any, a: T, b: T): T`

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl2(p.native,"is not null","is null")})
```

**Ergebnis:** `[{"native":"is null"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (CASE WHEN c.native IS NOT NULL THEN 'is not null' ELSE 'is null' END) AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## isNull {#isnull}

Gibt `true` zurück, wenn `value` null ist.

**Signatur:** `isNull(value: any): boolean`

Anzahl der Bundesstaaten, deren Breitengrad null ist:

```typescript
States.filter(p=> isNull(p.latitude)).map(p=> count(1))
```

**Ergebnis:** `[{"count":68}]`

**Erzeugtes SQL (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NULL)
```

## isNotNull {#isnotnull}

Gibt `true` zurück, wenn `value` nicht null ist.

**Signatur:** `isNotNull(value: any): boolean`

Anzahl der Bundesstaaten, deren Breitengrad nicht null ist:

```typescript
States.filter(p=> isNotNull(p.latitude)).map(p=> count(1))
```

**Ergebnis:** `[{"count":4813}]`

**Erzeugtes SQL (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NOT NULL)
```

## Datenbankunterstützung {#database-support}

!!! warning "MongoDB"
    In der aktuellen Version können `nvl`, `nvl2`, `isNull` und `isNotNull` nicht in MongoDB-Abfragen übersetzt werden.
