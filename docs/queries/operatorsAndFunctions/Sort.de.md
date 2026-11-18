# Sortierfunktionen {#sort-functions}

Die Methode `sort` sortiert die Zeilen einer Abfrage (`ORDER BY` in SQL). Ihr Prädikat gibt das Feld zurück, nach dem sortiert wird, optional umschlossen von `asc` oder `desc`, um die Richtung festzulegen. Ohne `asc` oder `desc` werden die Zeilen aufsteigend sortiert.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

## Übersicht {#summary}

| Funktion | Beschreibung |
|---|---|
| `asc` | Sortiert aufsteigend (Standard) |
| `desc` | Sortiert absteigend |

## Standardreihenfolge {#default-order}

Gibt das Prädikat ein Feld ohne `asc` oder `desc` zurück, werden die Zeilen aufsteigend sortiert.

Anzahl der Länder in jeder Region, von der kleinsten zur größten:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)}).sort(p=> p.countries)
```

**Ergebnis:**

```json
[{"region":"Polar","countries":1}
,{"region":"","countries":2}
,{"region":"Oceania","countries":27}
,{"region":"Asia","countries":50}
,{"region":"Europe","countries":53}
,{"region":"Americas","countries":57}
,{"region":"Africa","countries":60}
]
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
ORDER BY countries asc
```

## asc {#asc}

Sortiert die Zeilen aufsteigend nach `value`.

**Signatur:** `asc(value: any): void`

Maximaler Breitengrad jeder Region, sortiert nach diesem Maximum:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)}).sort(p=> asc(p.max))
```

**Ergebnis:**

```json
[{"region":"Polar","max":-74.65}
,{"region":"","max":-53.1}
,{"region":"Oceania","max":15.2}
,{"region":"Africa","max":34}
,{"region":"Asia","max":48}
,{"region":"Americas","max":72}
,{"region":"Europe","max":78}
]
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
ORDER BY max asc
```

## desc {#desc}

Sortiert die Zeilen absteigend nach `value`.

**Signatur:** `desc(value: any): void`

ISO-3-Codes der Länder Südamerikas in absteigender Reihenfolge:

```typescript
Countries.filter(p=> p.subregion == "South America").map(p=> p.iso3).sort(p=> desc(p.iso3))
```

**Ergebnis:**

```json
[{"iso3":"VEN"}
,{"iso3":"URY"}
,{"iso3":"SUR"}
,{"iso3":"SGS"}
,{"iso3":"PRY"}
,{"iso3":"PER"}
,{"iso3":"GUY"}
,{"iso3":"GUF"}
,{"iso3":"FLK"}
,{"iso3":"ECU"}
,{"iso3":"COL"}
,{"iso3":"CHL"}
,{"iso3":"BRA"}
,{"iso3":"BOL"}
,{"iso3":"ARG"}
]
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.iso3 AS iso3
FROM Countries c
WHERE c.subregion = 'South America'
ORDER BY c.iso3 desc
```

!!! warning "Felder über den Lambda-Parameter referenzieren"
    Schreiben Sie `desc(p.iso3)`, nicht `desc(iso3)`. Ein Name, der nicht über den Lambda-Parameter (`p`) erreicht wird, wird als Abfrageparameter gelesen: `sort(p=> desc(iso3))` erzeugt `ORDER BY ? desc`, und die Zeilen werden nicht nach dem Feld sortiert.
