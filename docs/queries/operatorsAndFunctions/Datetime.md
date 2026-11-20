# Date and Time Functions

Date and time functions get the current date and time, convert strings to dates, extract parts of a date, add intervals to a date and calculate the difference between two dates.

!!! note "About the examples"
    The examples run against the `Countries` entity of the countries sample schema. Each one shows the query, the result it returned on the test database and the SQL sentence that λORM generated for MySQL. Other engines receive their own translation; to see the sentence generated for your data source, use [`orm.plan`](../Metadata.md).

!!! note "Dates are stored in UTC"
    Since `@lambdaorm/lib` 3.7.0 (Data Gateway 3.0.2) λORM stores dates in UTC on every engine and opens every session in UTC, so the functions of the database (`hour`, `date`, `now`, ...) see the same time whatever the time zone of the application. Date and time values are calculated by the database. The results below were obtained before, on MySQL in a session that was not in UTC, so some values (for example those of `date`, `time` or `hour`) are shifted by that time zone. Expect different values on other engines.

## Summary

| Function | Description |
|---|---|
| `now` | Current date and time |
| `today` | Current date |
| `curTime` | Current time |
| `dateTime` | Converts a string to a date and time |
| `date` | Converts a string to a date |
| `time` | Converts a string to a time |
| `dateToString` | Converts a date to an ISO 8601 string |
| `year` | Year of a date |
| `month` | Month of a date |
| `day` | Day of the month of a date |
| `weekday` | Day of the week of a date |
| `hour` | Hour of a date |
| `minute` | Minute of a date |
| `second` | Second of a date |
| `millisecond` | Millisecond of a date |
| `addYear` | Adds years to a date |
| `addMonth` | Adds months to a date |
| `addDay` | Adds days to a date |
| `addHour` | Adds hours to a date |
| `addMinute` | Adds minutes to a date |
| `addSecond` | Adds seconds to a date |
| `addMillisecond` | Adds milliseconds to a date |
| `addTime` | Adds a time to a date |
| `subtractTime` | Subtracts a time from a date |
| `dayDiff` | Difference between two dates in days |
| `hourDiff` | Difference between two dates in hours |
| `secondDiff` | Difference between two dates in seconds |
| `millisecondDiff` | Difference between two dates in milliseconds |
| `dayToDate` | Date for a number of days since 1970-01-01 |
| `hourToDate` | Date for a number of hours since 1970-01-01 |
| `secondToDate` | Date for a number of seconds since 1970-01-01 |
| `millisecondToDate` | Date for a number of milliseconds since 1970-01-01 |

## Current date and time

### now

Returns the current date and time.

**Signature:** `now(): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:now()})
```

**Result:** `[{"result":"2022-08-15T09:54:22.000Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT NOW() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### today

Returns the current date.

**Signature:** `today(): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:today()})
```

**Result:** `[{"result":"2022-08-14T22:00:00.000Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT CURDATE() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### curTime

Returns the current time.

**Signature:** `curTime(): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:curTime()})
```

**Result:** `[{"result":"11:54:22"}]`

**Generated SQL (MySQL):**

```sql
SELECT CURTIME() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Conversions

### dateTime

Converts `value` to a date and time.

**Signature:** `dateTime(value: string): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateTime("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":"2021-09-06T12:39:11.000Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATETIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### date

Converts `value` to a date (without the time).

**Signature:** `date(value: string): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:date("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":"2021-09-05T22:00:00.000Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATE) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### time

Converts `value` to a time (without the date).

**Signature:** `time(value: string): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:time("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":"00:20:21"}]`

**Generated SQL (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', TIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### dateToString

Converts `date` to a string in ISO 8601 format.

**Signature:** `dateToString(date: dateTime): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateToString(dateTime("2021-09-06T14:39:11.444Z"))})
```

**Result:** `[{"result":"2021-09-06T14:39:11Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_FORMAT(CONVERT('2021-09-06T14:39:11.444Z', DATETIME), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Date parts

These functions return a part of a date as an integer.

### year

Returns the year of `value`.

**Signature:** `year(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:year("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":2021}]`

**Generated SQL (MySQL):**

```sql
SELECT EXTRACT(YEAR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### month

Returns the month of `value` (1 to 12).

**Signature:** `month(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:month("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":9}]`

**Generated SQL (MySQL):**

```sql
SELECT EXTRACT(MONTH FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### day

Returns the day of the month of `value`.

**Signature:** `day(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:day("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":6}]`

**Generated SQL (MySQL):**

```sql
SELECT DAYOFMONTH('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### weekday

Returns the day of the week of `value`. The numbering depends on the engine: on MySQL, MariaDB and SQLite (`DAYOFWEEK`) 1 is Sunday and 7 is Saturday, so the example (a Monday) returns 2; on PostgreSQL (`extract(dow ...)`) 0 is Sunday.

**Signature:** `weekday(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:weekday("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":2}]`

**Generated SQL (MySQL):**

```sql
SELECT DAYOFWEEK('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hour

Returns the hour of `value`.

**Signature:** `hour(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hour("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":0}]`

**Generated SQL (MySQL):**

```sql
SELECT EXTRACT(HOUR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### minute

Returns the minute of `value`.

**Signature:** `minute(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:minute("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":20}]`

**Generated SQL (MySQL):**

```sql
SELECT EXTRACT(MINUTE FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### second

Returns the second of `value`.

**Signature:** `second(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:second("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":21}]`

**Generated SQL (MySQL):**

```sql
SELECT EXTRACT(SECOND FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecond

Returns the millisecond of `value`.

**Signature:** `millisecond(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecond("2021-09-06T14:39:11.444Z")})
```

**Result:** `[{"result":0}]`

**Generated SQL (MySQL):**

```sql
SELECT ROUND(EXTRACT(MICROSECOND FROM '2021-09-06T14:39:11.444Z')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Adding intervals

These functions add `value` units to `date` and return the new date. Use a negative `value` to subtract.

### addYear

Adds `value` years to `date`.

**Signature:** `addYear(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addYear("2021-09-06T14:39:11.444Z",2)})
```

**Result:** `[{"result":"2023-09-06 14:39:11.444000"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 YEAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMonth

Adds `value` months to `date`.

**Signature:** `addMonth(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMonth("2021-09-06T14:39:11.444Z",2)})
```

**Result:** `[{"result":"2021-11-06 14:39:11.444000"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 MONTH) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addDay

Adds `value` days to `date`.

**Signature:** `addDay(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addDay("2021-09-06T14:39:11.444Z",2)})
```

**Result:** `[{"result":"2021-09-08 14:39:11.444000"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 DAY) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addHour

Adds `value` hours to `date`.

**Signature:** `addHour(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addHour("2021-09-06T14:39:11.444Z",2)})
```

**Result:** `[{"result":"2021-09-06 16:39:11.444000"}]`

**Generated SQL (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' HOUR AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMinute

Adds `value` minutes to `date`.

**Signature:** `addMinute(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMinute("2021-09-06T14:39:11.444Z",2)})
```

**Result:** `[{"result":"2021-09-06 14:41:11.444000"}]`

**Generated SQL (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' MINUTE AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addSecond

Adds `value` seconds to `date`.

**Signature:** `addSecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addSecond("2021-09-06T14:39:11.444Z",2)})
```

**Result:** `[{"result":"2021-09-06 14:39:13.444000"}]`

**Generated SQL (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' SECOND AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMillisecond

Adds `value` milliseconds to `date`.

**Signature:** `addMillisecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMillisecond("2021-09-06T14:39:11.444Z",2)})
```

**Result:** `[{"result":"2021-09-06 14:39:11.446000"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL (2 * 1000) MICROSECOND) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addTime

Adds `time` to `date`.

**Signature:** `addTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Result:** `[{"result":"08:42:33"}]`

**Generated SQL (MySQL):**

```sql
SELECT ADDTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### subtractTime

Subtracts `time` from `date`.

**Signature:** `subtractTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:subtractTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Result:** `[{"result":"-08:01:51"}]`

**Generated SQL (MySQL):**

```sql
SELECT SUBTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Differences between dates

These functions return `date1 - date2` in the given unit, as an integer.

### dayDiff

Returns the difference between `date1` and `date2` in days.

**Signature:** `dayDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Result:** `[{"result":4}]`

**Generated SQL (MySQL):**

```sql
SELECT DATEDIFF('2021-09-06T14:39:11','2021-09-02T12:30:10') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourDiff

Returns the difference between `date1` and `date2` in hours.

**Signature:** `hourDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Result:** `[{"result":98}]`

**Generated SQL (MySQL):**

```sql
SELECT TIMESTAMPDIFF(HOUR, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondDiff

Returns the difference between `date1` and `date2` in seconds.

**Signature:** `secondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Result:** `[{"result":353341}]`

**Generated SQL (MySQL):**

```sql
SELECT TIMESTAMPDIFF(SECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondDiff

Returns the difference between `date1` and `date2` in milliseconds.

**Signature:** `millisecondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Result:** `[{"result":353341000}]`

**Generated SQL (MySQL):**

```sql
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Numbers to dates

These functions convert a number of time units elapsed since 1970-01-01T00:00:00Z (the Unix epoch) to a date.

### dayToDate

Returns the date that is `value` days after the Unix epoch.

**Signature:** `dayToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayToDate(2000)})
```

**Result:** `[{"result":"1975-06-24T00:00:00Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*24*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourToDate

Returns the date that is `value` hours after the Unix epoch.

**Signature:** `hourToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourToDate(2000)})
```

**Result:** `[{"result":"1970-03-25T08:00:00Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondToDate

Returns the date that is `value` seconds after the Unix epoch.

**Signature:** `secondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondToDate(2000)})
```

**Result:** `[{"result":"1970-01-01T00:33:20Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondToDate

Returns the date that is `value` milliseconds after the Unix epoch.

**Signature:** `millisecondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondToDate(2000)})
```

**Result:** `[{"result":"1970-01-01T00:00:02Z"}]`

**Generated SQL (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000/1000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Database support

Every engine has its own date functions, and λORM uses each engine's: `DATEADD`, `DATEDIFF` and `DATEPART` on SQL
Server, `NUMTODSINTERVAL`, `ADD_MONTHS` and date arithmetic on Oracle, `$dateAdd`, `$dateDiff` and `$year` on MongoDB.
The differences (`dayDiff(date1, date2)`, …) are always `date1 - date2`.

!!! note "MongoDB"
    Every function on this page is available on MongoDB. λORM stores dates in MongoDB as BSON dates (from
    `@lambdaorm/lib` 3.6.0; before, as ISO 8601 text), also the dates written in a filter (`p.orderDate >= "2026-01-01"`).
    Each date argument of a function goes through `$toDate`, so dates stored as text by earlier versions are read too. In a filter, a comparison with a
    function (`year(p.orderDate) == 2026`) is translated to a `$expr`.
