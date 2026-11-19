# Datums- und Zeitfunktionen {#date-and-time-functions}

Datums- und Zeitfunktionen ermitteln das aktuelle Datum und die aktuelle Uhrzeit, konvertieren Zeichenketten in Datumswerte, extrahieren Bestandteile eines Datums, addieren Intervalle zu einem Datum und berechnen die Differenz zwischen zwei Datumswerten.

!!! note "Zu den Beispielen"
    Die Beispiele laufen gegen die Entität `Countries` des Beispielschemas für Länder. Jedes zeigt die Abfrage, das Ergebnis, das sie auf der Testdatenbank geliefert hat, und die SQL-Anweisung, die λORM für MySQL erzeugt hat. Andere Datenbank-Engines erhalten ihre eigene Übersetzung; um die für Ihre Datenquelle erzeugte Anweisung zu sehen, verwenden Sie [`orm.plan`](../Metadata.md).

!!! note "Ergebnisse hängen von der Datenbank-Engine und der Zeitzone ab"
    Datums- und Zeitwerte werden von der Datenbank berechnet. Die folgenden Ergebnisse wurden auf MySQL in einer Sitzung ermittelt, die nicht in UTC lief, daher sind einige Werte (zum Beispiel die von `date`, `time` oder `hour`) um die Zeitzone verschoben. Auf anderen Datenbank-Engines oder in anderen Zeitzonen sind abweichende Werte zu erwarten.

## Übersicht {#summary}

| Funktion | Beschreibung |
|---|---|
| `now` | Aktuelles Datum und aktuelle Uhrzeit |
| `today` | Aktuelles Datum |
| `curTime` | Aktuelle Uhrzeit |
| `dateTime` | Konvertiert eine Zeichenkette in Datum und Uhrzeit |
| `date` | Konvertiert eine Zeichenkette in ein Datum |
| `time` | Konvertiert eine Zeichenkette in eine Uhrzeit |
| `dateToString` | Konvertiert ein Datum in eine ISO-8601-Zeichenkette |
| `year` | Jahr eines Datums |
| `month` | Monat eines Datums |
| `day` | Tag des Monats eines Datums |
| `weekday` | Wochentag eines Datums |
| `hour` | Stunde eines Datums |
| `minute` | Minute eines Datums |
| `second` | Sekunde eines Datums |
| `millisecond` | Millisekunde eines Datums |
| `addYear` | Addiert Jahre zu einem Datum |
| `addMonth` | Addiert Monate zu einem Datum |
| `addDay` | Addiert Tage zu einem Datum |
| `addHour` | Addiert Stunden zu einem Datum |
| `addMinute` | Addiert Minuten zu einem Datum |
| `addSecond` | Addiert Sekunden zu einem Datum |
| `addMillisecond` | Addiert Millisekunden zu einem Datum |
| `addTime` | Addiert eine Uhrzeit zu einem Datum |
| `subtractTime` | Subtrahiert eine Uhrzeit von einem Datum |
| `dayDiff` | Differenz zwischen zwei Datumswerten in Tagen |
| `hourDiff` | Differenz zwischen zwei Datumswerten in Stunden |
| `secondDiff` | Differenz zwischen zwei Datumswerten in Sekunden |
| `millisecondDiff` | Differenz zwischen zwei Datumswerten in Millisekunden |
| `dayToDate` | Datum zu einer Anzahl von Tagen seit 1970-01-01 |
| `hourToDate` | Datum zu einer Anzahl von Stunden seit 1970-01-01 |
| `secondToDate` | Datum zu einer Anzahl von Sekunden seit 1970-01-01 |
| `millisecondToDate` | Datum zu einer Anzahl von Millisekunden seit 1970-01-01 |

## Aktuelles Datum und aktuelle Uhrzeit {#current-date-and-time}

### now {#now}

Gibt das aktuelle Datum und die aktuelle Uhrzeit zurück.

**Signatur:** `now(): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:now()})
```

**Ergebnis:** `[{"result":"2022-08-15T09:54:22.000Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT NOW() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### today {#today}

Gibt das aktuelle Datum zurück.

**Signatur:** `today(): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:today()})
```

**Ergebnis:** `[{"result":"2022-08-14T22:00:00.000Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CURDATE() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### curTime {#curtime}

Gibt die aktuelle Uhrzeit zurück.

**Signatur:** `curTime(): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:curTime()})
```

**Ergebnis:** `[{"result":"11:54:22"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CURTIME() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Konvertierungen {#conversions}

### dateTime {#datetime}

Konvertiert `value` in Datum und Uhrzeit.

**Signatur:** `dateTime(value: string): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateTime("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":"2021-09-06T12:39:11.000Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATETIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### date {#date}

Konvertiert `value` in ein Datum (ohne Uhrzeit).

**Signatur:** `date(value: string): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:date("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":"2021-09-05T22:00:00.000Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATE) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### time {#time}

Konvertiert `value` in eine Uhrzeit (ohne Datum).

**Signatur:** `time(value: string): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:time("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":"00:20:21"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', TIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### dateToString {#datetostring}

Konvertiert `date` in eine Zeichenkette im Format ISO 8601.

**Signatur:** `dateToString(date: dateTime): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateToString(dateTime("2021-09-06T14:39:11.444Z"))})
```

**Ergebnis:** `[{"result":"2021-09-06T14:39:11Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_FORMAT(CONVERT('2021-09-06T14:39:11.444Z', DATETIME), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Datumsbestandteile {#date-parts}

Diese Funktionen geben einen Bestandteil eines Datums als ganze Zahl zurück.

### year {#year}

Gibt das Jahr von `value` zurück.

**Signatur:** `year(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:year("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":2021}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT EXTRACT(YEAR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### month {#month}

Gibt den Monat von `value` zurück (1 bis 12).

**Signatur:** `month(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:month("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":9}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT EXTRACT(MONTH FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### day {#day}

Gibt den Tag des Monats von `value` zurück.

**Signatur:** `day(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:day("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":6}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DAYOFMONTH('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### weekday {#weekday}

Gibt den Wochentag von `value` zurück. Die Nummerierung hängt von der Datenbank-Engine ab: Auf MySQL, MariaDB und SQLite (`DAYOFWEEK`) ist 1 Sonntag und 7 Samstag, daher gibt das Beispiel (ein Montag) 2 zurück; auf PostgreSQL (`extract(dow ...)`) ist 0 Sonntag.

**Signatur:** `weekday(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:weekday("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":2}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DAYOFWEEK('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hour {#hour}

Gibt die Stunde von `value` zurück.

**Signatur:** `hour(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hour("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":0}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT EXTRACT(HOUR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### minute {#minute}

Gibt die Minute von `value` zurück.

**Signatur:** `minute(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:minute("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":20}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT EXTRACT(MINUTE FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### second {#second}

Gibt die Sekunde von `value` zurück.

**Signatur:** `second(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:second("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":21}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT EXTRACT(SECOND FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecond {#millisecond}

Gibt die Millisekunde von `value` zurück.

**Signatur:** `millisecond(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecond("2021-09-06T14:39:11.444Z")})
```

**Ergebnis:** `[{"result":0}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ROUND(EXTRACT(MICROSECOND FROM '2021-09-06T14:39:11.444Z')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Intervalle addieren {#adding-intervals}

Diese Funktionen addieren `value` Einheiten zu `date` und geben das neue Datum zurück. Verwenden Sie einen negativen `value`, um zu subtrahieren.

### addYear {#addyear}

Addiert `value` Jahre zu `date`.

**Signatur:** `addYear(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addYear("2021-09-06T14:39:11.444Z",2)})
```

**Ergebnis:** `[{"result":"2023-09-06 14:39:11.444000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 YEAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMonth {#addmonth}

Addiert `value` Monate zu `date`.

**Signatur:** `addMonth(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMonth("2021-09-06T14:39:11.444Z",2)})
```

**Ergebnis:** `[{"result":"2021-11-06 14:39:11.444000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 MONTH) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addDay {#addday}

Addiert `value` Tage zu `date`.

**Signatur:** `addDay(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addDay("2021-09-06T14:39:11.444Z",2)})
```

**Ergebnis:** `[{"result":"2021-09-08 14:39:11.444000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 DAY) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addHour {#addhour}

Addiert `value` Stunden zu `date`.

**Signatur:** `addHour(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addHour("2021-09-06T14:39:11.444Z",2)})
```

**Ergebnis:** `[{"result":"2021-09-06 16:39:11.444000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' HOUR AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMinute {#addminute}

Addiert `value` Minuten zu `date`.

**Signatur:** `addMinute(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMinute("2021-09-06T14:39:11.444Z",2)})
```

**Ergebnis:** `[{"result":"2021-09-06 14:41:11.444000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' MINUTE AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addSecond {#addsecond}

Addiert `value` Sekunden zu `date`.

**Signatur:** `addSecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addSecond("2021-09-06T14:39:11.444Z",2)})
```

**Ergebnis:** `[{"result":"2021-09-06 14:39:13.444000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' SECOND AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMillisecond {#addmillisecond}

Addiert `value` Millisekunden zu `date`.

**Signatur:** `addMillisecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMillisecond("2021-09-06T14:39:11.444Z",2)})
```

**Ergebnis:** `[{"result":"2021-09-06 14:39:11.446000"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL (2 * 1000) MICROSECOND) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addTime {#addtime}

Addiert `time` zu `date`.

**Signatur:** `addTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Ergebnis:** `[{"result":"08:42:33"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ADDTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### subtractTime {#subtracttime}

Subtrahiert `time` von `date`.

**Signatur:** `subtractTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:subtractTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Ergebnis:** `[{"result":"-08:01:51"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT SUBTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Differenzen zwischen Datumswerten {#differences-between-dates}

Diese Funktionen geben `date1 - date2` in der jeweiligen Einheit als ganze Zahl zurück.

### dayDiff {#daydiff}

Gibt die Differenz zwischen `date1` und `date2` in Tagen zurück.

**Signatur:** `dayDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Ergebnis:** `[{"result":4}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATEDIFF('2021-09-06T14:39:11','2021-09-02T12:30:10') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourDiff {#hourdiff}

Gibt die Differenz zwischen `date1` und `date2` in Stunden zurück.

**Signatur:** `hourDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Ergebnis:** `[{"result":98}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT TIMESTAMPDIFF(HOUR, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondDiff {#seconddiff}

Gibt die Differenz zwischen `date1` und `date2` in Sekunden zurück.

**Signatur:** `secondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Ergebnis:** `[{"result":353341}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT TIMESTAMPDIFF(SECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondDiff {#milliseconddiff}

Gibt die Differenz zwischen `date1` und `date2` in Millisekunden zurück.

**Signatur:** `millisecondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Ergebnis:** `[{"result":353341000}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Zahlen in Datumswerte {#numbers-to-dates}

Diese Funktionen konvertieren eine Anzahl von Zeiteinheiten, die seit 1970-01-01T00:00:00Z (der Unix-Epoche) vergangen sind, in ein Datum.

### dayToDate {#daytodate}

Gibt das Datum zurück, das `value` Tage nach der Unix-Epoche liegt.

**Signatur:** `dayToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayToDate(2000)})
```

**Ergebnis:** `[{"result":"1975-06-24T00:00:00Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*24*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourToDate {#hourtodate}

Gibt das Datum zurück, das `value` Stunden nach der Unix-Epoche liegt.

**Signatur:** `hourToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourToDate(2000)})
```

**Ergebnis:** `[{"result":"1970-03-25T08:00:00Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondToDate {#secondtodate}

Gibt das Datum zurück, das `value` Sekunden nach der Unix-Epoche liegt.

**Signatur:** `secondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondToDate(2000)})
```

**Ergebnis:** `[{"result":"1970-01-01T00:33:20Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondToDate {#millisecondtodate}

Gibt das Datum zurück, das `value` Millisekunden nach der Unix-Epoche liegt.

**Signatur:** `millisecondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondToDate(2000)})
```

**Ergebnis:** `[{"result":"1970-01-01T00:00:02Z"}]`

**Erzeugtes SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000/1000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Datenbankunterstützung {#database-support}

Jede Engine hat ihre eigenen Datumsfunktionen, und λORM verwendet die der jeweiligen Engine: `DATEADD`, `DATEDIFF` und
`DATEPART` bei SQL Server, `NUMTODSINTERVAL`, `ADD_MONTHS` und Datumsarithmetik bei Oracle, `$dateAdd`, `$dateDiff`
und `$year` bei MongoDB. Die Differenzen (`dayDiff(date1, date2)`, …) sind immer `date1 - date2`.

!!! note "MongoDB"
    Alle Funktionen dieser Seite sind auf MongoDB verfügbar. λORM speichert Datumswerte in MongoDB als BSON-Daten
    (ab `@lambdaorm/lib` 3.6.0; vorher als ISO-8601-Text), auch die in einem Filter geschriebenen Daten
    (`p.orderDate >= "2026-01-01"`). Jedes Datumsargument einer Funktion durchläuft `$toDate`, sodass auch von früheren
    Versionen als Text gespeicherte Daten gelesen werden.
    In einem Filter wird ein Vergleich mit einer Funktion (`year(p.orderDate) == 2026`) in einen `$expr` übersetzt.
