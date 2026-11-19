# Zeichenkettenfunktionen {#string-functions}

Zeichenkettenfunktionen wandeln Textwerte um: Sie ändern die Groß-/Kleinschreibung, füllen auf, entfernen Leerzeichen, ersetzen oder extrahieren einen Teil einer Zeichenkette und konvertieren Werte in Zeichenketten.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

## Übersicht {#summary}

| Funktion | Beschreibung |
|---|---|
| `chr` | Zeichen zu einem ASCII-Code |
| `concat` | Verkettet Zeichenketten |
| `lower` | Wandelt in Kleinbuchstaben um |
| `upper` | Wandelt in Großbuchstaben um |
| `lpad` | Füllt eine Zeichenkette links auf |
| `rpad` | Füllt eine Zeichenkette rechts auf |
| `ltrim` | Entfernt führende Leerzeichen |
| `rtrim` | Entfernt nachgestellte Leerzeichen |
| `trim` | Entfernt führende und nachgestellte Leerzeichen |
| `replace` | Ersetzt jedes Vorkommen eines Werts |
| `mask` | Verbirgt den mittleren Teil einer Zeichenkette |
| `substr`, `substring` | Extrahiert einen Teil einer Zeichenkette |
| `strCount` | Zählt die Vorkommen eines Werts |
| `toString` | Konvertiert einen Wert in eine Zeichenkette |

## chr {#chr}

Gibt das Zeichen zurück, dessen ASCII-Code `ascii` ist.

**Signatur:** `chr(ascii: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: chr(68)})
```

**Ergebnis:** `[{"result":"D"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CHAR(68 USING ASCII) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## concat {#concat}

Verkettet alle Argumente zu einer Zeichenkette.

**Signatur:** `concat(...values: any): string`

Region und Subregion von Brasilien, durch ein Leerzeichen getrennt:

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: concat(p.region," ",p.subregion) })
```

**Ergebnis:** `[{"result":"Americas South America"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CONCAT(CONCAT(c.region,' '),c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lower {#lower}

Wandelt `value` in Kleinbuchstaben um.

**Signatur:** `lower(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lower(p.subregion) })
```

**Ergebnis:** `[{"result":"south america"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT LOWER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## upper {#upper}

Wandelt `value` in Großbuchstaben um.

**Signatur:** `upper(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: upper(p.subregion) })
```

**Ergebnis:** `[{"result":"SOUTH AMERICA"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT UPPER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lpad {#lpad}

Füllt `value` links mit `pad` auf, bis es `len` Zeichen lang ist.

**Signatur:** `lpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lpad(p.region,12,"_") })
```

**Ergebnis:** `[{"result":"____Americas"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT LPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rpad {#rpad}

Füllt `value` rechts mit `pad` auf, bis es `len` Zeichen lang ist.

**Signatur:** `rpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rpad(p.region,12,"_") })
```

**Ergebnis:** `[{"result":"Americas____"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT RPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ltrim {#ltrim}

Entfernt die führenden Leerzeichen von `value`.

**Signatur:** `ltrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ltrim("  a  ")})
```

**Ergebnis:** `[{"result":"a  "}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT LTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rtrim {#rtrim}

Entfernt die nachgestellten Leerzeichen von `value`.

**Signatur:** `rtrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rtrim("  a  ")})
```

**Ergebnis:** `[{"result":"  a"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT RTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trim {#trim}

Entfernt die führenden und nachgestellten Leerzeichen von `value`. In SQL wird es in `TRIM(value)` übersetzt.

**Signatur:** `trim(value: string): string`

## replace {#replace}

Gibt `value` zurück, wobei jedes Vorkommen von `source` durch `target` ersetzt ist.

**Signatur:** `replace(value: string, source: string, target: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: replace(p.region,"a","*")})
```

**Ergebnis:** `[{"result":"Americ*s"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT REPLACE(c.region,'a','*') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## mask {#mask}

Maskiert einen sensiblen Wert: Die ersten drei und die letzten drei Zeichen bleiben erhalten, der Rest wird durch `***` ersetzt.

**Signatur:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Ergebnis:** `[{"result":"Sou***ica"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT Concat(LEFT(c.subregion,3),'***',RIGHT(c.subregion,3)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## substr, substring {#substr-substring}

Gibt den Teil von `value` zurück, der an Position `from` beginnt (das erste Zeichen hat in SQL die Position 1) und `count` Zeichen lang ist. `substr` und `substring` sind gleichwertig.

**Signatur:**

- `substr(value: string, from: number, count: number): string`
- `substring(value: string, from: number, count: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substr(p.subregion,1,3)})
```

**Ergebnis:** `[{"result":"Sou"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substring(p.subregion,1,3)})
```

**Ergebnis:** `[{"result":"Sou"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## strCount {#strcount}

Gibt zurück, wie oft `value` in `source` vorkommt. Bei der Suche wird zwischen Groß- und Kleinschreibung unterschieden.

**Signatur:** `strCount(source: string, value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: strCount(p.subregion,"a")})
```

**Ergebnis:** `[{"result":1}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (LENGTH(c.subregion)-LENGTH(REPLACE(c.subregion,'a',''))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## toString {#tostring}

Konvertiert `value` in eine Zeichenkette.

**Signatur:** `toString(value: any): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toString(p.latitude)})
```

**Ergebnis:** `[{"result":"-10.0000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CONVERT(c.latitude, CHAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Datenbankunterstützung {#database-support}

!!! warning "MongoDB"
    `chr`, `lpad` und `rpad` haben keine Entsprechung in MongoDB und können nicht übersetzt werden. Die übrigen
    Funktionen dieser Seite sind verfügbar. `like`, `startsWith` und `includes` eines Textes vergleichen den Text
    wörtlich (`includes` und `startsWith` mit `$indexOfCP`, `like` mit einem aus dem Muster gebildeten regulären
    Ausdruck); in einem Filter stehen sie in einem `$expr`.
