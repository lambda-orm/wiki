# Funciones de fecha y hora {#date-and-time-functions}

Las funciones de fecha y hora obtienen la fecha y la hora actuales, convierten strings a fechas, extraen partes de una fecha, suman intervalos a una fecha y calculan la diferencia entre dos fechas.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

!!! note "Los resultados dependen del motor de base de datos y de la zona horaria"
    Los valores de fecha y hora los calcula la base de datos. Los resultados siguientes se obtuvieron en MySQL en una sesión que no estaba en UTC, por lo que algunos valores (por ejemplo los de `date`, `time` u `hour`) están desplazados por la zona horaria. En otros motores de base de datos o zonas horarias los valores serán distintos.

## Resumen {#summary}

| Función | Descripción |
|---|---|
| `now` | Fecha y hora actuales |
| `today` | Fecha actual |
| `curTime` | Hora actual |
| `dateTime` | Convierte un string a fecha y hora |
| `date` | Convierte un string a fecha |
| `time` | Convierte un string a hora |
| `dateToString` | Convierte una fecha a un string ISO 8601 |
| `year` | Año de una fecha |
| `month` | Mes de una fecha |
| `day` | Día del mes de una fecha |
| `weekday` | Día de la semana de una fecha |
| `hour` | Hora de una fecha |
| `minute` | Minuto de una fecha |
| `second` | Segundo de una fecha |
| `millisecond` | Milisegundo de una fecha |
| `addYear` | Suma años a una fecha |
| `addMonth` | Suma meses a una fecha |
| `addDay` | Suma días a una fecha |
| `addHour` | Suma horas a una fecha |
| `addMinute` | Suma minutos a una fecha |
| `addSecond` | Suma segundos a una fecha |
| `addMillisecond` | Suma milisegundos a una fecha |
| `addTime` | Suma una hora a una fecha |
| `subtractTime` | Resta una hora de una fecha |
| `dayDiff` | Diferencia entre dos fechas en días |
| `hourDiff` | Diferencia entre dos fechas en horas |
| `secondDiff` | Diferencia entre dos fechas en segundos |
| `millisecondDiff` | Diferencia entre dos fechas en milisegundos |
| `dayToDate` | Fecha correspondiente a un número de días desde 1970-01-01 |
| `hourToDate` | Fecha correspondiente a un número de horas desde 1970-01-01 |
| `secondToDate` | Fecha correspondiente a un número de segundos desde 1970-01-01 |
| `millisecondToDate` | Fecha correspondiente a un número de milisegundos desde 1970-01-01 |

## Fecha y hora actuales {#current-date-and-time}

### now {#now}

Devuelve la fecha y la hora actuales.

**Firma:** `now(): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:now()})
```

**Resultado:** `[{"result":"2022-08-15T09:54:22.000Z"}]`

**SQL generado (MySQL):**

```sql
SELECT NOW() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### today {#today}

Devuelve la fecha actual.

**Firma:** `today(): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:today()})
```

**Resultado:** `[{"result":"2022-08-14T22:00:00.000Z"}]`

**SQL generado (MySQL):**

```sql
SELECT CURDATE() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### curTime {#curtime}

Devuelve la hora actual.

**Firma:** `curTime(): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:curTime()})
```

**Resultado:** `[{"result":"11:54:22"}]`

**SQL generado (MySQL):**

```sql
SELECT CURTIME() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Conversiones {#conversions}

### dateTime {#datetime}

Convierte `value` a fecha y hora.

**Firma:** `dateTime(value: string): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateTime("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":"2021-09-06T12:39:11.000Z"}]`

**SQL generado (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATETIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### date {#date}

Convierte `value` a fecha (sin la hora).

**Firma:** `date(value: string): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:date("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":"2021-09-05T22:00:00.000Z"}]`

**SQL generado (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATE) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### time {#time}

Convierte `value` a hora (sin la fecha).

**Firma:** `time(value: string): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:time("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":"00:20:21"}]`

**SQL generado (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', TIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### dateToString {#datetostring}

Convierte `date` a un string en formato ISO 8601.

**Firma:** `dateToString(date: dateTime): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateToString(dateTime("2021-09-06T14:39:11.444Z"))})
```

**Resultado:** `[{"result":"2021-09-06T14:39:11Z"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_FORMAT(CONVERT('2021-09-06T14:39:11.444Z', DATETIME), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Partes de una fecha {#date-parts}

Estas funciones devuelven una parte de una fecha como un entero.

### year {#year}

Devuelve el año de `value`.

**Firma:** `year(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:year("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":2021}]`

**SQL generado (MySQL):**

```sql
SELECT EXTRACT(YEAR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### month {#month}

Devuelve el mes de `value` (de 1 a 12).

**Firma:** `month(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:month("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":9}]`

**SQL generado (MySQL):**

```sql
SELECT EXTRACT(MONTH FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### day {#day}

Devuelve el día del mes de `value`.

**Firma:** `day(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:day("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":6}]`

**SQL generado (MySQL):**

```sql
SELECT DAYOFMONTH('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### weekday {#weekday}

Devuelve el día de la semana de `value`. La numeración depende del motor de base de datos: en MySQL, MariaDB y SQLite (`DAYOFWEEK`) 1 es domingo y 7 es sábado, por lo que el ejemplo (un lunes) devuelve 2; en PostgreSQL (`extract(dow ...)`) 0 es domingo.

**Firma:** `weekday(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:weekday("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":2}]`

**SQL generado (MySQL):**

```sql
SELECT DAYOFWEEK('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hour {#hour}

Devuelve la hora de `value`.

**Firma:** `hour(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hour("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":0}]`

**SQL generado (MySQL):**

```sql
SELECT EXTRACT(HOUR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### minute {#minute}

Devuelve el minuto de `value`.

**Firma:** `minute(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:minute("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":20}]`

**SQL generado (MySQL):**

```sql
SELECT EXTRACT(MINUTE FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### second {#second}

Devuelve el segundo de `value`.

**Firma:** `second(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:second("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":21}]`

**SQL generado (MySQL):**

```sql
SELECT EXTRACT(SECOND FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecond {#millisecond}

Devuelve el milisegundo de `value`.

**Firma:** `millisecond(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecond("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":0}]`

**SQL generado (MySQL):**

```sql
SELECT ROUND(EXTRACT(MICROSECOND FROM '2021-09-06T14:39:11.444Z')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Sumar intervalos {#adding-intervals}

Estas funciones suman `value` unidades a `date` y devuelven la nueva fecha. Para restar se usa un `value` negativo.

### addYear {#addyear}

Suma `value` años a `date`.

**Firma:** `addYear(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addYear("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2023-09-06 14:39:11.444000"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 YEAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMonth {#addmonth}

Suma `value` meses a `date`.

**Firma:** `addMonth(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMonth("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-11-06 14:39:11.444000"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 MONTH) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addDay {#addday}

Suma `value` días a `date`.

**Firma:** `addDay(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addDay("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-08 14:39:11.444000"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 DAY) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addHour {#addhour}

Suma `value` horas a `date`.

**Firma:** `addHour(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addHour("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 16:39:11.444000"}]`

**SQL generado (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' HOUR AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMinute {#addminute}

Suma `value` minutos a `date`.

**Firma:** `addMinute(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMinute("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 14:41:11.444000"}]`

**SQL generado (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' MINUTE AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addSecond {#addsecond}

Suma `value` segundos a `date`.

**Firma:** `addSecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addSecond("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 14:39:13.444000"}]`

**SQL generado (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' SECOND AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMillisecond {#addmillisecond}

Suma `value` milisegundos a `date`.

**Firma:** `addMillisecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMillisecond("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 14:39:11.446000"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL (2 * 1000) MICROSECOND) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addTime {#addtime}

Suma `time` a `date`.

**Firma:** `addTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Resultado:** `[{"result":"08:42:33"}]`

**SQL generado (MySQL):**

```sql
SELECT ADDTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### subtractTime {#subtracttime}

Resta `time` de `date`.

**Firma:** `subtractTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:subtractTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Resultado:** `[{"result":"-08:01:51"}]`

**SQL generado (MySQL):**

```sql
SELECT SUBTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Diferencias entre fechas {#differences-between-dates}

Estas funciones devuelven `date1 - date2` en la unidad indicada, como un entero.

### dayDiff {#daydiff}

Devuelve la diferencia entre `date1` y `date2` en días.

**Firma:** `dayDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":4}]`

**SQL generado (MySQL):**

```sql
SELECT DATEDIFF('2021-09-06T14:39:11','2021-09-02T12:30:10') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourDiff {#hourdiff}

Devuelve la diferencia entre `date1` y `date2` en horas.

**Firma:** `hourDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":98}]`

**SQL generado (MySQL):**

```sql
SELECT TIMESTAMPDIFF(HOUR, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondDiff {#seconddiff}

Devuelve la diferencia entre `date1` y `date2` en segundos.

**Firma:** `secondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":353341}]`

**SQL generado (MySQL):**

```sql
SELECT TIMESTAMPDIFF(SECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondDiff {#milliseconddiff}

Devuelve la diferencia entre `date1` y `date2` en milisegundos.

**Firma:** `millisecondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":353341000}]`

**SQL generado (MySQL):**

```sql
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## De números a fechas {#numbers-to-dates}

Estas funciones convierten a fecha un número de unidades de tiempo transcurridas desde 1970-01-01T00:00:00Z (la época Unix).

### dayToDate {#daytodate}

Devuelve la fecha que está `value` días después de la época Unix.

**Firma:** `dayToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayToDate(2000)})
```

**Resultado:** `[{"result":"1975-06-24T00:00:00Z"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*24*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourToDate {#hourtodate}

Devuelve la fecha que está `value` horas después de la época Unix.

**Firma:** `hourToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourToDate(2000)})
```

**Resultado:** `[{"result":"1970-03-25T08:00:00Z"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondToDate {#secondtodate}

Devuelve la fecha que está `value` segundos después de la época Unix.

**Firma:** `secondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondToDate(2000)})
```

**Resultado:** `[{"result":"1970-01-01T00:33:20Z"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondToDate {#millisecondtodate}

Devuelve la fecha que está `value` milisegundos después de la época Unix.

**Firma:** `millisecondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondToDate(2000)})
```

**Resultado:** `[{"result":"1970-01-01T00:00:02Z"}]`

**SQL generado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000/1000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Soporte por base de datos {#database-support}

Cada motor tiene sus propias funciones de fecha, y λORM usa las de cada uno: `DATEADD`, `DATEDIFF` y `DATEPART` en
SQL Server, `NUMTODSINTERVAL`, `ADD_MONTHS` y la aritmética de fechas en Oracle, `$dateAdd`, `$dateDiff` y `$year` en
MongoDB. Las diferencias (`dayDiff(date1, date2)`, …) son siempre `date1 - date2`.

!!! note "MongoDB"
    Todas las funciones de esta página están disponibles en MongoDB. λORM guarda las fechas en MongoDB como fechas
    BSON (desde `@lambdaorm/lib` 3.6.0; antes, como texto ISO 8601), también las fechas escritas en un filtro
    (`p.orderDate >= "2026-01-01"`). Cada argumento de fecha de una función pasa por `$toDate`, así que también se leen
    las fechas guardadas como texto por versiones anteriores.
    En un filtro, una comparación con una función (`year(p.orderDate) == 2026`) se traduce a un `$expr`.
