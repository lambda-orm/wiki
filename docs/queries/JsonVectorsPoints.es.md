# JSON, vectores y puntos {#json-vectors-and-points}

Esta página muestra cómo consultar tres tipos de propiedades que guardan más que un valor simple: una propiedad `json` (leer, filtrar por y escribir una ruta dentro de ella), una propiedad `vector` (buscar por similitud, como en RAG) y una propiedad `point` (distancias, rectángulos y polígonos). Escribes la misma expresión para todos los motores; la traducción de cada función está en la configuración de cada dialecto, y un motor que no la tiene responde `Function X is not supported by <dialect>`.

Los tipos `json`, `vector` y `point` se declaran en el esquema (ver [Definición del esquema](../schema/SchemaDefinition.md)).

## Rutas de una propiedad json {#paths-of-a-json-property}

Una ruta dentro de una propiedad `json` se escribe como si fuera una propiedad: `p.meta.address.zip` lee el campo `zip` del objeto `address` de `meta`. Puedes usarla en `map`, `filter` y `sort`:

```ts
Customers.map(p => [p.name, p.meta.address.zip])
Customers.filter(p => p.meta.city == "Madrid" && p.meta.age > 30)    // compared with a number, as a number
Customers.sort(p => p.meta.address.zip)
Customers.filter(p => p.meta.tags.includes("vip"))                   // a list of the json contains a value
Customers.filter(p => jsonHas(p.meta, "address.zip"))                // the path exists
Customers.filter(p => isNotNull(p.meta.city))
```

Una ruta toma el tipo de la constante con la que se compara: `p.meta.age > 30` convierte el valor a número antes de compararlo. Sin comparación, el valor se devuelve tal cual.

| Motor | `p.meta.address.zip` |
| --- | --- |
| PostgreSQL | `jsonb_path_query_first(c.meta, '$.address.zip') #>> '{}'` |
| MySQL, MariaDB | `JSON_UNQUOTE(JSON_EXTRACT(c.meta, '$.address.zip'))` |
| SQL Server, Oracle | `JSON_VALUE(c.meta, '$.address.zip')` |
| SQLite | `json_extract(c.meta, '$.address.zip')` |
| MongoDB | `{"$let":{"vars":{"d":"$meta"},"in":"$$d.address.zip"}}` |

| Función | Descripción | Ejemplo |
| --- | --- | --- |
| `includes` sobre una lista del json | La lista contiene el valor | `p.meta.tags.includes("vip")` |
| `jsonHas(json, path)` | La ruta existe | `jsonHas(p.meta, "address.zip")` |
| `jsonSet(json, path, value)` | El json con el valor escrito en la ruta | `jsonSet(p.meta, "address.city", city)` |

Las rutas y estas funciones están disponibles en PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite y MongoDB. La ruta de `jsonHas` y `jsonSet` debe ser una constante formada por nombres separados por puntos; cualquier otra cosa es un error, de modo que en la sentencia no entra nada más que una ruta.

### Escribir una ruta {#write-a-path}

`jsonSet(json, path, value)` escribe una ruta de un json sin reescribir el resto. Úsala en un [update](Update.md#update-a-path-of-a-json-property):

```ts
Customers.update(p => ({ meta: jsonSet(p.meta, "address.city", city) })).filter(p => p.id == id)
```

En PostgreSQL genera:

```sql
UPDATE Customers c SET meta = jsonb_set(COALESCE(c.meta, '{}'), string_to_array('address.city', '.'), CAST($1 AS jsonb))
WHERE c.id = $2
```

| Motor | Traducción |
| --- | --- |
| PostgreSQL | `jsonb_set(COALESCE(meta, '{}'), string_to_array('address.city', '.'), CAST(value AS jsonb))` |
| MySQL | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', CAST(value AS JSON))` |
| MariaDB | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', JSON_EXTRACT(value, '$'))` |
| SQL Server | `JSON_MODIFY(COALESCE(meta, '{}'), '$.address.city', …)`, según el tipo del valor |
| Oracle | `JSON_TRANSFORM(COALESCE(meta, TO_CLOB('{}')), SET '$.address.city' = value FORMAT JSON RETURNING CLOB)` |
| SQLite | `json_set(COALESCE(meta, '{}'), '$.address.city', json(value))` |
| MongoDB | `{ "meta.address.city": value }`, en un update con pipeline |

- El valor viaja como texto json, así que un texto, un número, un booleano, una lista o un objeto se escriben como tales.
- Un json nulo empieza como `{}`.
- En MongoDB se crean los objetos intermedios de la ruta. En los motores SQL solo se crea el último nombre: su objeto padre tiene que existir.
- En SQL Server, un valor `null` borra la clave.

## Vectores {#vectors}

Una propiedad `vector` guarda un embedding con un número fijo de dimensiones (`length`). Para encontrar los registros más parecidos a un vector, ordena por la distancia a él o filtra por una distancia máxima:

```yaml
- { name: embedding, type: vector, length: 1536, required: true }
indexes: [{ name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }]
```

```ts
// the 5 documents most similar to query
Documents.map(p => [p.id, cosineDistance(p.embedding, query)]).sort(p => cosineDistance(p.embedding, query)).page(1, 5)
Documents.filter(p => cosineDistance(p.embedding, query) < 0.2)
```

El vector que se pasa como parámetro (`query`) es un arreglo de números.

| Función | PostgreSQL (pgvector) | SQL Server 2025 | Oracle 23ai | MariaDB 11.7 |
| --- | --- | --- | --- | --- |
| `cosineDistance(a, b)` | `a <=> b` | `VECTOR_DISTANCE('cosine', a, b)` | `VECTOR_DISTANCE(a, b, COSINE)` | `VEC_DISTANCE_COSINE(a, b)` |
| `l2Distance(a, b)` | `a <-> b` | `VECTOR_DISTANCE('euclidean', a, b)` | `VECTOR_DISTANCE(a, b, EUCLIDEAN)` | `VEC_DISTANCE_EUCLIDEAN(a, b)` |
| `innerProduct(a, b)` | `(a <#> b) * -1` | `VECTOR_DISTANCE('dot', a, b) * -1` | `VECTOR_DISTANCE(a, b, DOT) * -1` | — |

MySQL, SQLite y MongoDB no tienen vectores. [`push`](../schema/SchemaSynchronization-Push.md) crea el índice vectorial declarado en `indexes` (`type`: `hnsw` o `ivfflat`; `distance`: `cosine`, `l2` o `ip`).

## Puntos {#points}

Un punto es GeoJSON, tanto al escribirlo como al leerlo: `{ "type": "Point", "coordinates": [longitude, latitude] }`.

```yaml
- { name: location, type: point, required: true }
indexes: [{ name: ix_location, fields: [location], type: spatial }]
```

| Función | Descripción |
| --- | --- |
| `point(lng, lat)` | Un punto |
| `distance(p.location, point)` | La distancia en metros |
| `within(p.location, minLng, minLat, maxLng, maxLat)` | El punto está en el rectángulo |
| `inside(p.location, area)` | El punto está en el polígono GeoJSON `area` (su anillo exterior), que llega como parámetro |

```ts
// the stores less than 5 km away, the nearest first
Stores.filter(p => distance(p.location, here) < 5000).map(p => ({ name: p.name, meters: distance(p.location, here) })).sort(p => p.meters)
Stores.filter(p => distance(p.location, point(-56.16, -34.90)) < 5000)
Stores.filter(p => within(p.location, -58.5, -34.7, -58.3, -34.5))
// area: { type: 'Polygon', coordinates: [[[lng, lat], …]] }
Stores.filter(p => inside(p.location, area))
```

El primer argumento de `distance`, `within` e `inside` es la propiedad; el punto con el que se compara es GeoJSON (un parámetro o `point(...)`).

| Motor | Tipo | `distance` | `inside` |
| --- | --- | --- | --- |
| PostgreSQL (PostGIS) | `geography(Point, 4326)` | `ST_Distance(…, false)` | `ST_Covers(ST_GeomFromGeoJSON(area)::geography, p)` |
| MySQL 8 | `POINT SRID 4326` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| MariaDB | `POINT` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| SQL Server | `geography` | `STDistance` (sobre el elipsoide: difiere un poco) | `STContains`, con el anillo reorientado si hace falta |
| Oracle (Spatial) | `SDO_GEOMETRY` | `SDO_GEOM.SDO_DISTANCE` (sobre el elipsoide) | `SDO_GEOM.RELATE(p, 'INSIDE+COVEREDBY', …)` |
| MongoDB | GeoJSON tal cual | fórmula de haversine | ray casting sobre el anillo |

- SQLite no tiene puntos: `Function distance is not supported by SQLjs`.
- PostgreSQL necesita la extensión PostGIS en la base de datos (`CREATE EXTENSION postgis`).
- Oracle necesita Oracle Spatial (las imágenes `slim` de Oracle Free no lo incluyen), y `push` no crea su índice espacial, que necesita metadatos en `USER_SDO_GEOM_METADATA`.
- En los demás motores `push` crea el índice espacial (GIST en PostgreSQL, SPATIAL en MySQL, MariaDB y SQL Server).
