# Funções de data e hora {#date-and-time-functions}

As funções de data e hora obtêm a data e a hora atuais, convertem strings em datas, extraem partes de uma data, somam intervalos a uma data e calculam a diferença entre duas datas.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

!!! note "Os resultados dependem do mecanismo de banco de dados e do fuso horário"
    Os valores de data e hora são calculados pelo banco de dados. Os resultados abaixo foram obtidos no MySQL em uma sessão que não estava em UTC, por isso alguns valores (por exemplo os de `date`, `time` ou `hour`) estão deslocados pelo fuso horário. Espere valores diferentes em outros mecanismos de banco de dados ou fusos horários.

## Resumo {#summary}

| Função | Descrição |
|---|---|
| `now` | Data e hora atuais |
| `today` | Data atual |
| `curTime` | Hora atual |
| `dateTime` | Converte uma string em data e hora |
| `date` | Converte uma string em data |
| `time` | Converte uma string em hora |
| `dateToString` | Converte uma data em uma string ISO 8601 |
| `year` | Ano de uma data |
| `month` | Mês de uma data |
| `day` | Dia do mês de uma data |
| `weekday` | Dia da semana de uma data |
| `hour` | Hora de uma data |
| `minute` | Minuto de uma data |
| `second` | Segundo de uma data |
| `millisecond` | Milissegundo de uma data |
| `addYear` | Soma anos a uma data |
| `addMonth` | Soma meses a uma data |
| `addDay` | Soma dias a uma data |
| `addHour` | Soma horas a uma data |
| `addMinute` | Soma minutos a uma data |
| `addSecond` | Soma segundos a uma data |
| `addMillisecond` | Soma milissegundos a uma data |
| `addTime` | Soma uma hora (time) a uma data |
| `subtractTime` | Subtrai uma hora (time) de uma data |
| `dayDiff` | Diferença entre duas datas em dias |
| `hourDiff` | Diferença entre duas datas em horas |
| `secondDiff` | Diferença entre duas datas em segundos |
| `millisecondDiff` | Diferença entre duas datas em milissegundos |
| `dayToDate` | Data correspondente a um número de dias desde 1970-01-01 |
| `hourToDate` | Data correspondente a um número de horas desde 1970-01-01 |
| `secondToDate` | Data correspondente a um número de segundos desde 1970-01-01 |
| `millisecondToDate` | Data correspondente a um número de milissegundos desde 1970-01-01 |

## Data e hora atuais {#current-date-and-time}

### now {#now}

Retorna a data e a hora atuais.

**Assinatura:** `now(): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:now()})
```

**Resultado:** `[{"result":"2022-08-15T09:54:22.000Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT NOW() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### today {#today}

Retorna a data atual.

**Assinatura:** `today(): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:today()})
```

**Resultado:** `[{"result":"2022-08-14T22:00:00.000Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT CURDATE() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### curTime {#curtime}

Retorna a hora atual.

**Assinatura:** `curTime(): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:curTime()})
```

**Resultado:** `[{"result":"11:54:22"}]`

**SQL gerado (MySQL):**

```sql
SELECT CURTIME() AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Conversões {#conversions}

### dateTime {#datetime}

Converte `value` em data e hora.

**Assinatura:** `dateTime(value: string): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateTime("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":"2021-09-06T12:39:11.000Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATETIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### date {#date}

Converte `value` em data (sem a hora).

**Assinatura:** `date(value: string): date`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:date("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":"2021-09-05T22:00:00.000Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', DATE) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### time {#time}

Converte `value` em hora (sem a data).

**Assinatura:** `time(value: string): time`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:time("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":"00:20:21"}]`

**SQL gerado (MySQL):**

```sql
SELECT CONVERT('2021-09-06T14:39:11.444Z', TIME) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### dateToString {#datetostring}

Converte `date` em uma string no formato ISO 8601.

**Assinatura:** `dateToString(date: dateTime): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dateToString(dateTime("2021-09-06T14:39:11.444Z"))})
```

**Resultado:** `[{"result":"2021-09-06T14:39:11Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_FORMAT(CONVERT('2021-09-06T14:39:11.444Z', DATETIME), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Partes de uma data {#date-parts}

Estas funções retornam uma parte de uma data como inteiro.

### year {#year}

Retorna o ano de `value`.

**Assinatura:** `year(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:year("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":2021}]`

**SQL gerado (MySQL):**

```sql
SELECT EXTRACT(YEAR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### month {#month}

Retorna o mês de `value` (de 1 a 12).

**Assinatura:** `month(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:month("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":9}]`

**SQL gerado (MySQL):**

```sql
SELECT EXTRACT(MONTH FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### day {#day}

Retorna o dia do mês de `value`.

**Assinatura:** `day(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:day("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":6}]`

**SQL gerado (MySQL):**

```sql
SELECT DAYOFMONTH('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### weekday {#weekday}

Retorna o dia da semana de `value`. A numeração depende do mecanismo de banco de dados: no MySQL, MariaDB e SQLite (`DAYOFWEEK`) 1 é domingo e 7 é sábado, por isso o exemplo (uma segunda-feira) retorna 2; no PostgreSQL (`extract(dow ...)`) 0 é domingo.

**Assinatura:** `weekday(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:weekday("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":2}]`

**SQL gerado (MySQL):**

```sql
SELECT DAYOFWEEK('2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hour {#hour}

Retorna a hora de `value`.

**Assinatura:** `hour(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hour("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":0}]`

**SQL gerado (MySQL):**

```sql
SELECT EXTRACT(HOUR FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### minute {#minute}

Retorna o minuto de `value`.

**Assinatura:** `minute(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:minute("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":20}]`

**SQL gerado (MySQL):**

```sql
SELECT EXTRACT(MINUTE FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### second {#second}

Retorna o segundo de `value`.

**Assinatura:** `second(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:second("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":21}]`

**SQL gerado (MySQL):**

```sql
SELECT EXTRACT(SECOND FROM '2021-09-06T14:39:11.444Z') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecond {#millisecond}

Retorna o milissegundo de `value`.

**Assinatura:** `millisecond(value: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecond("2021-09-06T14:39:11.444Z")})
```

**Resultado:** `[{"result":0}]`

**SQL gerado (MySQL):**

```sql
SELECT ROUND(EXTRACT(MICROSECOND FROM '2021-09-06T14:39:11.444Z')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Somando intervalos {#adding-intervals}

Estas funções somam `value` unidades a `date` e retornam a nova data. Use um `value` negativo para subtrair.

### addYear {#addyear}

Soma `value` anos a `date`.

**Assinatura:** `addYear(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addYear("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2023-09-06 14:39:11.444000"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 YEAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMonth {#addmonth}

Soma `value` meses a `date`.

**Assinatura:** `addMonth(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMonth("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-11-06 14:39:11.444000"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 MONTH) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addDay {#addday}

Soma `value` dias a `date`.

**Assinatura:** `addDay(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addDay("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-08 14:39:11.444000"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL 2 DAY) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addHour {#addhour}

Soma `value` horas a `date`.

**Assinatura:** `addHour(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addHour("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 16:39:11.444000"}]`

**SQL gerado (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' HOUR AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMinute {#addminute}

Soma `value` minutos a `date`.

**Assinatura:** `addMinute(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMinute("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 14:41:11.444000"}]`

**SQL gerado (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' MINUTE AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addSecond {#addsecond}

Soma `value` segundos a `date`.

**Assinatura:** `addSecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addSecond("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 14:39:13.444000"}]`

**SQL gerado (MySQL):**

```sql
SELECT '2021-09-06T14:39:11.444Z' + interval '2' SECOND AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addMillisecond {#addmillisecond}

Soma `value` milissegundos a `date`.

**Assinatura:** `addMillisecond(date: dateTime, value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addMillisecond("2021-09-06T14:39:11.444Z",2)})
```

**Resultado:** `[{"result":"2021-09-06 14:39:11.446000"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_ADD('2021-09-06T14:39:11.444Z', INTERVAL (2 * 1000) MICROSECOND) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### addTime {#addtime}

Soma `time` a `date`.

**Assinatura:** `addTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:addTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Resultado:** `[{"result":"08:42:33"}]`

**SQL gerado (MySQL):**

```sql
SELECT ADDTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### subtractTime {#subtracttime}

Subtrai `time` de `date`.

**Assinatura:** `subtractTime(date: dateTime, time: time): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:subtractTime("2021-09-06T14:39:11.444Z","08:22:12")})
```

**Resultado:** `[{"result":"-08:01:51"}]`

**SQL gerado (MySQL):**

```sql
SELECT SUBTIME('2021-09-06T14:39:11.444Z','08:22:12') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Diferenças entre datas {#differences-between-dates}

Estas funções retornam `date1 - date2` na unidade indicada, como inteiro.

### dayDiff {#daydiff}

Retorna a diferença entre `date1` e `date2` em dias.

**Assinatura:** `dayDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":4}]`

**SQL gerado (MySQL):**

```sql
SELECT DATEDIFF('2021-09-06T14:39:11','2021-09-02T12:30:10') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourDiff {#hourdiff}

Retorna a diferença entre `date1` e `date2` em horas.

**Assinatura:** `hourDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":98}]`

**SQL gerado (MySQL):**

```sql
SELECT TIMESTAMPDIFF(HOUR, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondDiff {#seconddiff}

Retorna a diferença entre `date1` e `date2` em segundos.

**Assinatura:** `secondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":353341}]`

**SQL gerado (MySQL):**

```sql
SELECT TIMESTAMPDIFF(SECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondDiff {#milliseconddiff}

Retorna a diferença entre `date1` e `date2` em milissegundos.

**Assinatura:** `millisecondDiff(date1: dateTime, date2: dateTime): integer`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondDiff("2021-09-06T14:39:11","2021-09-02T12:30:10")})
```

**Resultado:** `[{"result":353341000}]`

**SQL gerado (MySQL):**

```sql
SELECT ROUND(TIMESTAMPDIFF(MICROSECOND, '2021-09-02T12:30:10','2021-09-06T14:39:11')/1000,0) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Números para datas {#numbers-to-dates}

Estas funções convertem um número de unidades de tempo decorridas desde 1970-01-01T00:00:00Z (a época Unix) em uma data.

### dayToDate {#daytodate}

Retorna a data que fica `value` dias após a época Unix.

**Assinatura:** `dayToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:dayToDate(2000)})
```

**Resultado:** `[{"result":"1975-06-24T00:00:00Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*24*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### hourToDate {#hourtodate}

Retorna a data que fica `value` horas após a época Unix.

**Assinatura:** `hourToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:hourToDate(2000)})
```

**Resultado:** `[{"result":"1970-03-25T08:00:00Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000*3600), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### secondToDate {#secondtodate}

Retorna a data que fica `value` segundos após a época Unix.

**Assinatura:** `secondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:secondToDate(2000)})
```

**Resultado:** `[{"result":"1970-01-01T00:33:20Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

### millisecondToDate {#millisecondtodate}

Retorna a data que fica `value` milissegundos após a época Unix.

**Assinatura:** `millisecondToDate(value: number): dateTime`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result:millisecondToDate(2000)})
```

**Resultado:** `[{"result":"1970-01-01T00:00:02Z"}]`

**SQL gerado (MySQL):**

```sql
SELECT DATE_FORMAT(FROM_UNIXTIME(2000/1000), '%Y-%m-%dT%TZ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Suporte nos bancos de dados {#database-support}

!!! warning "MongoDB"
    Na versão atual, apenas `now`, `today`, `date`, `year`, `month`, `day` e `weekday` podem ser traduzidas para consultas MongoDB. As demais funções de data e hora desta página não estão disponíveis no MongoDB.
