# Funciones de ordenación {#sort-functions}

El método `sort` ordena las filas de una consulta (`ORDER BY` en SQL). Su predicado devuelve el campo por el que ordenar, opcionalmente envuelto en `asc` o `desc` para indicar la dirección. Sin `asc` ni `desc`, las filas se ordenan en orden ascendente. Para ordenar por varios campos o por una expresión, ver [Varios campos y expresiones](#several-fields-and-expressions).

!!! note "Sobre los ejemplos"
    Los ejemplos se ejecutan sobre la entidad `Countries` del esquema de ejemplo de países. Cada uno muestra la consulta, el resultado que devolvió en la base de datos de pruebas y la sentencia SQL que λORM generó para MySQL. Los demás motores de base de datos reciben su propia traducción; para ver la sentencia generada para tu fuente de datos, se usa [`orm.plan`](../Metadata.md).

## Resumen {#summary}

| Función | Descripción |
|---|---|
| `asc` | Ordena en orden ascendente (por defecto) |
| `desc` | Ordena en orden descendente |

## Orden por defecto {#default-order}

Cuando el predicado devuelve un campo sin `asc` ni `desc`, las filas se ordenan en orden ascendente.

Número de países de cada región, de menor a mayor:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)}).sort(p=> p.countries)
```

**Resultado:**

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

**SQL generado (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
ORDER BY countries asc
```

## asc {#asc}

Ordena las filas por `value` en orden ascendente.

**Firma:** `asc(value: any): void`

Latitud máxima de cada región, ordenada por ese máximo:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)}).sort(p=> asc(p.max))
```

**Resultado:**

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

**SQL generado (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
ORDER BY max asc
```

## desc {#desc}

Ordena las filas por `value` en orden descendente.

**Firma:** `desc(value: any): void`

Códigos ISO 3 de los países de América del Sur en orden descendente:

```typescript
Countries.filter(p=> p.subregion == "South America").map(p=> p.iso3).sort(p=> desc(p.iso3))
```

**Resultado:**

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

**SQL generado (MySQL):**

```sql
SELECT c.iso3 AS iso3
FROM Countries c
WHERE c.subregion = 'South America'
ORDER BY c.iso3 desc
```

!!! warning "Hacer referencia a los campos a través del parámetro de la lambda"
    Hay que escribir `desc(p.iso3)`, no `desc(iso3)`. Un nombre al que no se accede a través del parámetro de la lambda (`p`) se interpreta como un parámetro de la consulta: `sort(p=> desc(iso3))` genera `ORDER BY ? desc`, y las filas no se ordenan por el campo.

## Varios campos y expresiones {#several-fields-and-expressions}

Para ordenar por varios campos, devuélvelos en un arreglo, por orden de prioridad; cada uno puede tener su propia dirección. También se puede ordenar por una expresión (una función o una operación), no solo por un campo. Clientes del ejemplo Northwind ordenados por país y, dentro de cada país, por la longitud del nombre, de mayor a menor:

```typescript
Customers.map(p => [p.country, p.name]).sort(p => [p.country, desc(length(p.name))])
```

**SQL generado (MySQL):**

```sql
SELECT c.Country AS country, c.CompanyName AS name
FROM Customers c
ORDER BY c.Country asc, CHAR_LENGTH(c.CompanyName) desc
```

## Soporte por base de datos {#database-support}

!!! note "MongoDB"
    MongoDB solo ordena por campos, así que λORM escribe cada expresión del orden como un campo de una etapa `$addFields` antes del `$sort` (a partir de `@lambdaorm/lib` 3.15.0). La consulta anterior queda así:

    ```json
    [
      { "$addFields": { "__lambdaOrmSort1": { "$strLenCP": "$CompanyName" } } },
      { "$sort": { "Country": 1, "__lambdaOrmSort1": -1 } },
      { "$project": { "_id": 0, "country": "$Country", "name": "$CompanyName" } }
    ]
    ```

    Una consulta agrupada ordenada por una expresión falla con `MongoDB doesn't sort a grouped query by an expression`: ordénala por un campo de su `map`.
