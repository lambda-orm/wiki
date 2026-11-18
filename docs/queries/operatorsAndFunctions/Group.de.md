# Aggregatfunktionen {#aggregate-functions}

Aggregat- (Gruppen-)Funktionen berechnen einen einzelnen Wert aus einer Menge von Zeilen. Wenn das `map` einer Abfrage Aggregatfunktionen mit anderen Feldern mischt, gruppiert λORM die Zeilen nach diesen anderen Feldern (`GROUP BY` in SQL). Weitere Beispiele, auch mit `having`, finden Sie unter [Gruppierung](../Grouping.md).

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

## Übersicht {#summary}

| Funktion | Beschreibung |
|---|---|
| `avg` | Durchschnitt der Werte |
| `count` | Anzahl der Zeilen |
| `first` | Erster Wert der Menge |
| `last` | Letzter Wert der Menge |
| `max` | Maximalwert |
| `min` | Minimalwert |
| `sum` | Summe der Werte |

## count {#count}

Gibt die Anzahl der Zeilen der Menge zurück. `count(1)` zählt alle Zeilen.

**Signatur:** `count(value: any): integer`

Anzahl der Länder der Region Americas:

```typescript
Countries.filter(p=> p.region == "Americas").map(p=> {result:count(1)})
```

**Ergebnis:** `[{"result":57}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE c.region = 'Americas'
```

Anzahl der Länder in jeder Region:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)})
```

**Ergebnis:**

```json
[{"region":"","countries":2}
,{"region":"Africa","countries":60}
,{"region":"Americas","countries":57}
,{"region":"Asia","countries":50}
,{"region":"Europe","countries":53}
,{"region":"Oceania","countries":27}
,{"region":"Polar","countries":1}
]
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
```

## max {#max}

Gibt den Maximalwert der Menge zurück.

**Signatur:** `max(value: T): T`

Maximaler Breitengrad der Länder jeder Region:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)})
```

**Ergebnis:**

```json
[{"region":"","max":-53.1}
,{"region":"Africa","max":34}
,{"region":"Americas","max":72}
,{"region":"Asia","max":48}
,{"region":"Europe","max":78}
,{"region":"Oceania","max":15.2}
,{"region":"Polar","max":-74.65}
]
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
```

## min {#min}

Gibt den Minimalwert der Menge zurück.

**Signatur:** `min(value: T): T`

Minimaler Breitengrad der Länder jeder Region:

```typescript
Countries.map(p=> {region:p.region,min:min(p.latitude)})
```

**Ergebnis:**

```json
[{"region":"","min":-54.4333}
,{"region":"Africa","min":-49.25}
,{"region":"Americas","min":-54.5}
,{"region":"Asia","min":-8.8333}
,{"region":"Europe","min":35}
,{"region":"Oceania","min":-41}
,{"region":"Polar","min":-74.65}
]
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.region AS region, MIN(c.latitude) AS min
FROM Countries c
GROUP BY c.region
```

## avg {#avg}

Gibt den Durchschnitt der Werte der Menge zurück.

**Signatur:** `avg(value: number): number`

Durchschnittlicher Breitengrad der Länder jeder Region:

```typescript
Countries.map(p=> {region:p.region,avg:avg(p.latitude)})
```

**Ergebnis:**

```json
[{"region":"","avg":-53.76665}
,{"region":"Africa","avg":1.283335}
,{"region":"Americas","avg":10.42610526}
,{"region":"Asia","avg":25.822002}
,{"region":"Europe","avg":49.35021321}
,{"region":"Oceania","avg":-10.93023704}
,{"region":"Polar","avg":-74.65}
]
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.region AS region, AVG(c.latitude) AS avg
FROM Countries c
GROUP BY c.region
```

## sum {#sum}

Gibt die Summe der Werte der Menge zurück. In SQL wird sie in `SUM(...)` übersetzt.

**Signatur:** `sum(value: number): number`

## first {#first}

Gibt den ersten Wert der Menge zurück.

**Signatur:** `first(value: T): T`

## last {#last}

Gibt den letzten Wert der Menge zurück.

**Signatur:** `last(value: T): T`

!!! warning "first und last auf SQL-Datenbanken"
    Auf SQL-Datenbanken werden `first` und `last` als Aggregate in `FIRST(...)` und `LAST(...)` übersetzt; prüfen Sie, ob Ihre Datenbank-Engine diese Aggregatfunktionen unterstützt. Auf MongoDB werden sie in `$first` und `$last` übersetzt.

    Verwechseln Sie sie nicht mit den Abfragemethoden `first` und `last` (zum Beispiel `Countries.first(p=> p.name)`), die die erste bzw. letzte Zeile einer Abfrage zurückgeben; siehe [Select](../Select.md).
