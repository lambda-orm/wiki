# Consultas entre fuentes {#queries-across-sources}

Esta página explica qué pasa cuando una consulta lee campos de una relación cuya entidad vive en **otra fuente** del stage, incluso de otro motor (pedidos en PostgreSQL, clientes en MongoDB). Escribes la consulta como si todo estuviera en una sola base de datos; λORM la divide, ejecuta una sentencia en cada fuente y termina el trabajo en memoria.

Una relación entre dos entidades de la misma fuente sigue siendo un join de SQL (ver [Join](Join.md)). Lo que describe esta página se aplica solo cuando la relación cruza fuentes.

## Leer, ordenar y agrupar por campos de otra fuente {#read-sort-and-group-by-fields-of-another-source}

```ts
// Orders in PostgreSQL, Customers in MongoDB
Orders.map(p => [p.id, p.customer.name])
Orders.map(p => ({ id: p.id, who: p.customer.name })).sort(p => desc(p.who)).page(1, 20)
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

λORM ejecuta estas consultas en dos partes:

1. **En las bases de datos:** la entidad raíz con sus filtros y un [include](Include.md) de las relaciones leídas, cada fuente con su propia sentencia en su propio dialecto.
2. **En memoria:** el `map` (agrupando por los demás campos cuando tiene `count`, `sum`, `avg`, `min` o `max`), el `having`, el `sort` y el `page`.

Las relaciones pueden estar en cualquier nivel: `p.customer.country.name` (`Customers` y `Countries` en otra fuente) trae `include(p => [p.customer.include(p1 => [p1.country])])`, y cada relación viene de su propia fuente.

```ts
Orders.map(p => ({ country: p.customer.country.name, orders: count(p.id) })).sort(p => p.country)
```

## Límites {#limits}

- **Ordenar y paginar en la base de datos cuando es posible.** Si el `sort` lee solo campos de la raíz y no se agrupa nada, el `sort` y el `page` van a la base de datos de la raíz (`ORDER BY … LIMIT`) y en memoria corre solo el `map`, así que una consulta paginada no trae toda la tabla.
- **Como máximo `maxRows` filas en memoria.** Para ordenar, agrupar o paginar en memoria, λORM trae como máximo `maxRows` filas (10.000 por defecto; se configura en `infrastructure.crossSource.maxRows` del esquema o en `options.maxRows` de `orm.execute`). Si hay más, la consulta falla con `CrossSourceError: Orders brings more than 10000 rows to sort in memory: filter it or raise maxRows`. Nunca corta en silencio, porque un resultado ordenado sobre una parte de las filas sería incorrecto.
- **No soportado:** `include`, `distinct` o `first` en la misma consulta lanzan un `CrossSourceError`.

## Ver el plan {#see-the-plan}

[`orm.plan`](Metadata.md) muestra la sentencia de cada fuente y, en `inMemory`, lo que corre en memoria:

```ts
orm.plan('Orders.map(p => ({ who: p.customer.name, orders: count(p.id) })).sort(p => p.who)')
```

```json
{
  "entity": "Orders",
  "dialect": "PostgreSQL",
  "source": "sales",
  "sentence": "SELECT o.id AS \"id\", …, o.customerId AS \"__customerId\" FROM orders o ORDER BY o.id asc OFFSET 0 LIMIT 10001",
  "children": [
    {
      "entity": "Customers",
      "dialect": "MongoDB",
      "source": "crm",
      "sentence": "…"
    }
  ],
  "inMemory": ["map", "sort"]
}
```

## Filtrar por un campo de otra fuente {#filter-by-a-field-of-another-source}

Un filtro por un campo de una relación en otra fuente (`Orders.filter(p => p.customer.name == "Ann")`) primero busca las claves en esa fuente y luego filtra la raíz con `in`. Admite un nivel de relación y comparaciones con valores; ver [Filtrar por un campo de una relación en otra fuente](Include.md#filter-by-a-field-of-a-relation-in-another-source).
