# Numerische Operatoren und Funktionen {#numeric-operators-and-functions}

Numerische Operatoren und Funktionen führen arithmetische, Rundungs-, trigonometrische und logarithmische Berechnungen durch.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

## Übersicht {#summary}

### Operatoren {#operators}

| Operator | Beschreibung |
|---|---|
| `-` | Negation (`-a`) oder Subtraktion (`a - b`) |
| `+` | Addition |
| `*` | Multiplikation |
| `/` | Division |
| `**` | Potenzierung: `a` hoch `b` |
| `//` | Wurzel: die `b`-te Wurzel aus `a` |
| `%` | Modulo: Rest von `a / b` |

### Funktionen {#functions}

| Funktion | Beschreibung |
|---|---|
| `abs` | Absolutwert |
| `acos` | Arkuskosinus |
| `asin` | Arkussinus |
| `atan` | Arkustangens |
| `atan2` | Arkustangens von `y / x` |
| `ceil` | Kleinste ganze Zahl, die größer oder gleich einer Zahl ist |
| `cos` | Kosinus |
| `cosh` | Kosinus hyperbolicus |
| `exp` | *e* hoch einer Potenz |
| `floor` | Größte ganze Zahl, die kleiner oder gleich einer Zahl ist |
| `ln` | Natürlicher Logarithmus |
| `log` | Logarithmus zu einer angegebenen Basis |
| `log10` | Logarithmus zur Basis 10 |
| `remainder` | Rest einer Division |
| `round` | Rundet auf eine Anzahl von Dezimalstellen |
| `sign` | Vorzeichen einer Zahl |
| `sin` | Sinus |
| `sinh` | Sinus hyperbolicus |
| `tan` | Tangens |
| `tanh` | Tangens hyperbolicus |
| `trunc` | Schneidet auf eine Anzahl von Dezimalstellen ab |
| `toNumber` | Konvertiert einen Wert in eine Zahl |

## Arithmetische Operatoren {#arithmetic-operators}

Die arithmetischen Operatoren erhalten Zahlen und geben eine Zahl zurück. Die Rangfolge folgt den üblichen Rechenregeln (`**` vor `*` und `/`, die wiederum vor `+` und `-` kommen); verwenden Sie Klammern, um sie zu ändern. In SQL wird `**` in `POWER(a,b)`, `//` in `POWER(a,(1/b))` und `%` in `MOD(a,b)` übersetzt.

**Syntax:**

- `-a`, `a - b`
- `a + b`
- `a * b`
- `a / b`
- `a ** b`
- `a // b`
- `a % b`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 3+2-1 })
```

**Ergebnis:** `[{"result":4}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ((3 + 2) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 3*4-1})
```

**Ergebnis:** `[{"result":11}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ((3 * 4) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1-2-5})
```

**Ergebnis:** `[{"result":-6}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ((1 - 2) - 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (2+3)*2})
```

**Ergebnis:** `[{"result":10}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ((2 + 3) * 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 2*(3+2)})
```

**Ergebnis:** `[{"result":10}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (2 * (3 + 2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2*3*4})
```

**Ergebnis:** `[{"result":25}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (1 + ((2 * 3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (1+(2**3)*4)})
```

**Ergebnis:** `[{"result":33}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (1 + (POWER(2,3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2**(3*4)})
```

**Ergebnis:** `[{"result":4097}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (1 + POWER(2,(3 * 4))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## abs {#abs}

Gibt den Absolutwert von `value` zurück.

**Signatur:** `abs(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: abs(-9)})
```

**Ergebnis:** `[{"result":9}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ABS(-9) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## acos {#acos}

Gibt den Arkuskosinus von `value` im Bogenmaß zurück.

**Signatur:** `acos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: acos(0.434)})
```

**Ergebnis:** `[{"result":1.121868332427735}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ACOS(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## asin {#asin}

Gibt den Arkussinus von `value` im Bogenmaß zurück.

**Signatur:** `asin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: asin(0.434)})
```

**Ergebnis:** `[{"result":0.44892799436716174}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ASIN(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan {#atan}

Gibt den Arkustangens von `value` im Bogenmaß zurück.

**Signatur:** `atan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan(2)})
```

**Ergebnis:** `[{"result":1.1071487177940904}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ATAN(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan2 {#atan2}

Gibt den Arkustangens von `y / x` im Bogenmaß zurück und bestimmt den Quadranten anhand der Vorzeichen beider Argumente.

**Signatur:** `atan2(y: number, x: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan2(90, 15)})
```

**Ergebnis:** `[{"result":1.4056476493802699}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ATAN(90,15) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ceil {#ceil}

Gibt die kleinste ganze Zahl zurück, die größer oder gleich `value` ist.

**Signatur:** `ceil(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ceil(2)})
```

**Ergebnis:** `[{"result":2}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CEIL(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cos {#cos}

Gibt den Kosinus von `value` (im Bogenmaß) zurück.

**Signatur:** `cos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cos(2)})
```

**Ergebnis:** `[{"result":-0.4161468365471424}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT COS(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cosh {#cosh}

Gibt den Kosinus hyperbolicus von `value` zurück.

**Signatur:** `cosh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cosh(2)})
```

**Ergebnis:** `[{"result":3.7621956910836314}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ((EXP(2) + EXP(-2)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## exp {#exp}

Gibt *e* hoch `value` zurück.

**Signatur:** `exp(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: exp(7)})
```

**Ergebnis:** `[{"result":1096.6331584284585}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT EXP(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## floor {#floor}

Gibt die größte ganze Zahl zurück, die kleiner oder gleich `value` ist.

**Signatur:** `floor(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: floor(7)})
```

**Ergebnis:** `[{"result":7}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT FLOOR(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ln {#ln}

Gibt den natürlichen Logarithmus (Basis *e*) von `value` zurück.

**Signatur:** `ln(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ln(7)})
```

**Ergebnis:** `[{"result":1.9459101490553132}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT LN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log {#log}

Gibt den Logarithmus von `value` zur Basis `base` zurück. Beispielsweise ist `log(7,10)` der Logarithmus von 10 zur Basis 7.

**Signatur:** `log(base: number, value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log(7,10)})
```

**Ergebnis:** `[{"result":1.1832946624549385}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT LOG(7,10) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log10 {#log10}

Gibt den Logarithmus von `value` zur Basis 10 zurück.

**Signatur:** `log10(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log10(7)})
```

**Ergebnis:** `[{"result":0.8450980400142568}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT LOG10(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## remainder {#remainder}

Gibt den Rest der Division von `n1` durch `n2` zurück. Auf MySQL, MariaDB und SQLite wird er als `n1 - n2 * ROUND(n1 / n2)` berechnet, sodass das Ergebnis negativ sein kann (siehe Beispiel); auf PostgreSQL wird er in `MOD(n1,n2)` übersetzt, das für dasselbe Beispiel 1 zurückgibt.

**Signatur:** `remainder(n1: number, n2: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: remainder(7,2)})
```

**Ergebnis:** `[{"result":-1}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (7 - 2*ROUND(7/2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## round {#round}

Rundet `value` auf `decimals` Dezimalstellen.

**Signatur:** `round(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: round(7.984938,2)})
```

**Ergebnis:** `[{"result":7.98}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ROUND(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sign {#sign}

Gibt das Vorzeichen von `value` zurück: -1, wenn er negativ ist, 0, wenn er null ist, und 1, wenn er positiv ist.

**Signatur:** `sign(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sign(-7)})
```

**Ergebnis:** `[{"result":-1}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT SIGN(-7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sin {#sin}

Gibt den Sinus von `value` (im Bogenmaß) zurück.

**Signatur:** `sin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sin(7)})
```

**Ergebnis:** `[{"result":0.6569865987187891}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT SIN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sinh {#sinh}

Gibt den Sinus hyperbolicus von `value` zurück.

**Signatur:** `sinh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sinh(7)})
```

**Ergebnis:** `[{"result":548.3161232732465}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ((EXP(7) - EXP(-7)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tan {#tan}

Gibt den Tangens von `value` (im Bogenmaß) zurück.

**Signatur:** `tan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tan(7)})
```

**Ergebnis:** `[{"result":0.8714479827243188}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT TAN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tanh {#tanh}

Gibt den Tangens hyperbolicus von `value` zurück.

**Signatur:** `tanh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tanh(7)})
```

**Ergebnis:** `[{"result":0.9999983369439447}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT (EXP(2*7) - 1)/(EXP(2*7) + 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trunc {#trunc}

Schneidet `value` ohne Rundung auf `decimals` Dezimalstellen ab.

**Signatur:** `trunc(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: trunc(7.984938,2)})
```

**Ergebnis:** `[{"result":7.98}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT TRUNCATE(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## toNumber {#tonumber}

Konvertiert `value` in eine Zahl. Auf MySQL wird dies in `CONVERT(value, DECIMAL)` übersetzt, das keine Dezimalstellen hat, daher gibt das Beispiel 3 zurück; auf PostgreSQL wird es in `CAST(value AS INTEGER)` übersetzt.

**Signatur:** `toNumber(value: any): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toNumber("3.141516")})
```

**Ergebnis:** `[{"result":3}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CONVERT('3.141516', DECIMAL) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Datenbankunterstützung {#database-support}

Einige Funktionen haben nicht in jeder Datenbank-Engine eine direkte Entsprechung, daher übersetzt λORM sie in einen gleichwertigen Ausdruck. Beispielsweise werden auf MySQL, MariaDB und SQLite `cosh`, `sinh` und `tanh` mit `EXP` berechnet und `trunc` in `TRUNCATE` übersetzt; auf SQL Server wird `trunc` in `ROUND(value,decimals,1)`, `ceil` in `CEILING` und `atan2` in `ATN2` übersetzt.

!!! warning "MongoDB"
    - `remainder` und `toNumber` können derzeit nicht in MongoDB-Abfragen übersetzt werden.
    - `trunc` wird ohne die Anzahl der Dezimalstellen in `$trunc` übersetzt, sodass der Wert auf eine ganze Zahl abgeschnitten wird.
