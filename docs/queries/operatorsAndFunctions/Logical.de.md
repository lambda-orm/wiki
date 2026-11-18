# Logische Operatoren {#logical-operators}

Logische Operatoren verknüpfen oder negieren boolesche Ausdrücke, zum Beispiel um mehrere Bedingungen im Prädikat von `filter` zu verbinden.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

## Übersicht {#summary}

| Operator | Beschreibung | SQL |
|---|---|---|
| `!` | Logisches NOT | `NOT` |
| `&&` | Logisches AND | `AND` |
| `||` | Logisches OR | `OR` |

## NOT (`!`) {#not}

Negiert einen booleschen Ausdruck: gibt `true` zurück, wenn `value` `false` ist, und `false`, wenn er `true` ist.

**Syntax:** `!value`

Beispielsweise erzeugt `Countries.filter(p=> !(p.iso3 == "BRA"))` die Bedingung `WHERE NOT c.iso3 = 'BRA'`.

## AND (`&&`) {#and}

Gibt `true` zurück, wenn beide Operanden `true` sind.

**Syntax:** `a && b`

Anzahl der Länder in Südamerika, deren Längengrad kleiner als -30 ist:

```typescript
Countries.filter(p=> p.subregion == "South America" &&  p.longitude < -30 ).map(p=> {result:count(1)})
```

**Ergebnis:** `[{"result":15}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' AND c.longitude < -30)
```

## OR (`||`) {#or}

Gibt `true` zurück, wenn mindestens einer der Operanden `true` ist.

**Syntax:** `a || b`

Anzahl der Länder in Südamerika oder Mittelamerika:

```typescript
Countries.filter(p=> p.subregion == "South America" || p.subregion == "Central America" ).map(p=> {result:count(1)})
```

**Ergebnis:** `[{"result":23}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' OR c.subregion = 'Central America')
```

## Bedingungen kombinieren {#combining-conditions}

Die Operatoren lassen sich mit den unter [Vergleich](Comparison.md) beschriebenen Vergleichsoperatoren kombinieren. Anzahl der Länder der Region Americas, die nicht in Nordamerika liegen:

```typescript
Countries.filter(p=> p.region == "Americas" &&  p.subregion != "Northern America" ).map(p=> {result:count(1)})
```

**Ergebnis:** `[{"result":51}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.region = 'Americas' AND c.subregion <> 'Northern America')
```
