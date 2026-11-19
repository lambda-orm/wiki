# Funciones de agregación {#aggregate-functions}

Las funciones de agregación (de grupo) calculan un único valor a partir de un conjunto de filas. Cuando el `map` de una consulta mezcla funciones de agregación con otros campos, λORM agrupa las filas por esos otros campos (`GROUP BY` en SQL). Ver [Agrupación](../Grouping.md) para más ejemplos, incluido `having`.

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

## Resumen {#summary}

| Función | Descripción |
|---|---|
| `avg` | Promedio de los valores |
| `count` | Número de filas |
| `first` | Primer valor del conjunto |
| `last` | Último valor del conjunto |
| `max` | Valor máximo |
| `min` | Valor mínimo |
| `sum` | Suma de los valores |

## count {#count}

Devuelve el número de filas del conjunto. `count(1)` cuenta todas las filas.

**Firma:** `count(value: any): integer`

Número de países de la región de las Américas:

```typescript
Countries.filter(p=> p.region == "Americas").map(p=> {result:count(1)})
```

**Resultado:** `[{"result":57}]`

**SQL generado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE c.region = 'Americas'
```

Número de países de cada región:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)})
```

**Resultado:**

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

**SQL generado (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
```

## max {#max}

Devuelve el valor máximo del conjunto.

**Firma:** `max(value: T): T`

Latitud máxima de los países de cada región:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)})
```

**Resultado:**

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

**SQL generado (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
```

## min {#min}

Devuelve el valor mínimo del conjunto.

**Firma:** `min(value: T): T`

Latitud mínima de los países de cada región:

```typescript
Countries.map(p=> {region:p.region,min:min(p.latitude)})
```

**Resultado:**

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

**SQL generado (MySQL):**

```sql
SELECT c.region AS region, MIN(c.latitude) AS min
FROM Countries c
GROUP BY c.region
```

## avg {#avg}

Devuelve el promedio de los valores del conjunto.

**Firma:** `avg(value: number): number`

Latitud promedio de los países de cada región:

```typescript
Countries.map(p=> {region:p.region,avg:avg(p.latitude)})
```

**Resultado:**

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

**SQL generado (MySQL):**

```sql
SELECT c.region AS region, AVG(c.latitude) AS avg
FROM Countries c
GROUP BY c.region
```

## sum {#sum}

Devuelve la suma de los valores del conjunto. Se traduce a `SUM(...)` en SQL.

**Firma:** `sum(value: number): number`

## first {#first}

Devuelve el primer valor del conjunto.

**Firma:** `first(value: T): T`

## last {#last}

Devuelve el último valor del conjunto.

**Firma:** `last(value: T): T`

!!! warning "first y last como agregados: solo MongoDB"
    Ninguna base de datos SQL tiene un agregado `FIRST` o `LAST`, y en SQL el orden de las filas de un grupo no está definido: en las bases de datos SQL, `first` y `last` usadas como agregados son un error al armar la consulta. Use `min` o `max`, o la cláusula `.first()` / `.last()` de la consulta. En MongoDB se traducen a `$first` y `$last`.

    No hay que confundirlas con los métodos de consulta `first` y `last` (por ejemplo `Countries.first(p=> p.name)`), que devuelven la primera o la última fila de una consulta; ver [Select](../Select.md).
