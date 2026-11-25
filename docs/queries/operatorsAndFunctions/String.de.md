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
| `maskLeft` | Verbirgt alles außer den letzten Zeichen |
| `maskRight` | Verbirgt alles außer den ersten Zeichen |
| `maskEmail` | Verbirgt den Benutzer einer E-Mail-Adresse |
| `hash` | SHA-256- oder HMAC-SHA256-Token eines Werts |
| `substr`, `substring` | Extrahiert einen Teil einer Zeichenkette |
| `strCount` | Zählt die Vorkommen eines Werts |
| `length` | Anzahl der Zeichen |
| `left` | Erste Zeichen einer Zeichenkette |
| `right` | Letzte Zeichen einer Zeichenkette |
| `like` | Entspricht einem SQL-Muster |
| `startsWith` | Beginnt mit einem Text |
| `includes` | Enthält einen Text |
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

Die Maskierungsfunktionen verbergen einen Teil eines personenbezogenen Werts. λORM übersetzt sie für jede Engine mit demselben Ergebnis wie im Speicher, sodass ein von der Datenbank maskierter Wert genauso aussieht wie einer, den die Anwendung maskiert hat. Eine [View](../../schema/Views.md#personal-data-pii) kann sie auf jede als personenbezogen markierte Eigenschaft (`pii`) anwenden, ohne sie zu nennen.

Maskiert einen Wert: auf jeder Seite bleibt ein Viertel der Zeichen sichtbar (höchstens 3), der Rest wird durch `*` ersetzt, eines pro Zeichen. Ein Wert mit weniger als 4 Zeichen wird ganz zu `*`. Ein null-Wert bleibt null.

**Signatur:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Ergebnis:** `[{"result":"Sou*******ica"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.subregion) < 4 THEN REPEAT('*', CHAR_LENGTH(c.subregion))
  ELSE CONCAT(LEFT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), REPEAT('*', CHAR_LENGTH(c.subregion) - 2 * LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), RIGHT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskLeft {#maskleft}

Maskiert alle Zeichen außer den letzten `n` (eine Karten- oder Telefonnummer). Ein Wert mit `n` oder weniger Zeichen wird ganz zu `*`.

**Signatur:** `maskLeft(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskLeft(p.name, 2)})
```

**Ergebnis:** `[{"result":"****il"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(REPEAT('*', CHAR_LENGTH(c.name) - 2), RIGHT(c.name, 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskRight {#maskright}

Maskiert alle Zeichen außer den ersten `n` (ein Nachname). Ein Wert mit `n` oder weniger Zeichen wird ganz zu `*`.

**Signatur:** `maskRight(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskRight(p.name, 2)})
```

**Ergebnis:** `[{"result":"Br****"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(LEFT(c.name, 2), REPEAT('*', CHAR_LENGTH(c.name) - 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskEmail {#maskemail}

Maskiert eine E-Mail-Adresse: das erste Zeichen des Benutzers und die Domain bleiben erhalten. Ein Wert ohne Benutzer vor `@` wird ganz zu `*`.

**Signatur:** `maskEmail(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskEmail("ana.lopez@example.com")})
```

**Ergebnis:** `[{"result":"a********@example.com"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CASE WHEN LOCATE('@', 'ana.lopez@example.com') < 2 THEN REPEAT('*', CHAR_LENGTH('ana.lopez@example.com'))
  ELSE CONCAT(LEFT('ana.lopez@example.com', 1), REPEAT('*', LOCATE('@', 'ana.lopez@example.com') - 2),
    SUBSTRING('ana.lopez@example.com', LOCATE('@', 'ana.lopez@example.com'))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## hash {#hash}

Gibt ein Token des Werts zurück: seinen SHA-256 in Hexadezimal oder, mit einem `key`, seinen HMAC-SHA256. Derselbe Wert ergibt immer dasselbe Token, sodass das Ergebnis weiterhin gruppiert oder verknüpft werden kann. Ohne Schlüssel wird es auf PostgreSQL, MySQL, MariaDB, SQL Server und Oracle übersetzt, mit Schlüssel nur auf PostgreSQL (das die Erweiterung `pgcrypto` benötigt). Auf MongoDB und SQLite schlägt es mit `Function hash is not supported by <dialect>` fehl.

**Signatur:** `hash(value: string, key?: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: hash(p.iso3)})
```

**Ergebnis:** `[{"result":"b437fc1d678d9524fcaf93312f07f0fc9338283110a81edc0233bd0fb7932f69"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT SHA2(c.iso3, 256) AS result
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

## length {#length}

Gibt die Anzahl der Zeichen von `value` zurück.

**Signatur:** `length(value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: length(p.subregion)})
```

**Ergebnis:** `[{"result":13}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CHAR_LENGTH(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## left {#left}

Gibt die ersten `n` Zeichen von `value` zurück.

**Signatur:** `left(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: left(p.subregion, 5)})
```

**Ergebnis:** `[{"result":"South"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT LEFT(c.subregion, 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## right {#right}

Gibt die letzten `n` Zeichen von `value` zurück.

**Signatur:** `right(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: right(p.subregion, 7)})
```

**Ergebnis:** `[{"result":"America"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT RIGHT(c.subregion, 7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## like {#like}

Gibt `true` zurück, wenn `value` dem SQL-Muster entspricht: `%` steht für eine beliebige Zeichenfolge und `_` für ein Zeichen. Auf MongoDB wird das Muster zu einem regulären Ausdruck.

**Signatur:** `like(value: string, pattern: string): boolean`

```typescript
Countries.filter(p=> like(p.name, "B%l")).map(p=> p.name)
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'B%l'
```

## startsWith {#startswith}

Gibt `true` zurück, wenn `value` mit `prefix` beginnt. Es kann als Funktion oder als Methode geschrieben werden: `startsWith(p.name, "Bra")` oder `p.name.startsWith("Bra")`.

**Signatur:** `startsWith(value: string, prefix: string): boolean`

```typescript
Countries.filter(p=> p.name.startsWith("Bra")).map(p=> p.name)
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'Bra%'
```

## includes {#includes}

Gibt `true` zurück, wenn der Text `value` den Text `text` enthält; als Methode geschrieben: `p.subregion.includes("America")`. Mit einer Liste statt eines Texts prüft `includes`, ob die Liste einen Wert enthält (siehe [Vergleich](Comparison.md#includes)).

**Signatur:** `includes(value: string, text: string): boolean`

```typescript
Countries.filter(p=> p.subregion.includes("America")).map(p=> p.name)
```

**Erzeugtes SQL (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.subregion LIKE '%America%'
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

## Textkonstanten {#text-constants}

Eine in der Abfrage geschriebene Textkonstante (`"O'Brien"`) gelangt so maskiert in die Anweisung, wie es jeder Dialekt verlangt (ab `@lambdaorm/lib` 3.15.0): Standard-SQL verdoppelt das Anführungszeichen, MySQL und MariaDB maskieren es mit einem Backslash. Dasselbe gilt für die Listen eines `in`. Als Parameter übergebene Werte sind nicht betroffen: sie werden als Parameter der Anweisung übertragen.

```typescript
Customers.filter(p => p.name == "O'Brien")
```

```sql
-- PostgreSQL, SQL Server, Oracle, SQLite
WHERE c.CompanyName = 'O''Brien'
-- MySQL, MariaDB
WHERE c.CompanyName = 'O\'Brien'
```

## Datenbankunterstützung {#database-support}

!!! warning "MongoDB"
    `chr`, `lpad`, `rpad` und `hash` haben keine Entsprechung in MongoDB und können nicht übersetzt werden. Die übrigen
    Funktionen dieser Seite sind verfügbar. `like`, `startsWith` und `includes` eines Textes vergleichen den Text
    wörtlich (`includes` und `startsWith` mit `$indexOfCP`, `like` mit einem aus dem Muster gebildeten regulären
    Ausdruck); in einem Filter stehen sie in einem `$expr`.

!!! note "Maskierungsfunktionen und hash"
    `mask`, `maskLeft`, `maskRight` und `maskEmail` sind auf jeder Engine verfügbar, auch auf MongoDB. `hash` ist auf MongoDB und SQLite nicht verfügbar, und `hash` mit Schlüssel nur auf PostgreSQL.
