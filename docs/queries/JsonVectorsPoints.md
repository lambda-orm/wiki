# JSON, vectors and points

This page shows how to query three kinds of properties that hold more than a single value: a `json` property (read, filter by and write a path inside it), a `vector` property (search by similarity, as in RAG) and a `point` property (distances, rectangles and polygons). You write the same expression for every engine; the translation of each function is in the configuration of each dialect, and an engine that has no translation answers `Function X is not supported by <dialect>`.

The types `json`, `vector` and `point` are declared in the schema (see [Schema definition](../schema/SchemaDefinition.md)).

## Paths of a json property

A path inside a `json` property is written as if it were a property: `p.meta.address.zip` reads the field `zip` of the object `address` of `meta`. You can use it in `map`, `filter` and `sort`:

```ts
Customers.map(p => [p.name, p.meta.address.zip])
Customers.filter(p => p.meta.city == "Madrid" && p.meta.age > 30)    // compared with a number, as a number
Customers.sort(p => p.meta.address.zip)
Customers.filter(p => p.meta.tags.includes("vip"))                   // a list of the json contains a value
Customers.filter(p => jsonHas(p.meta, "address.zip"))                // the path exists
Customers.filter(p => isNotNull(p.meta.city))
```

A path takes the type of the constant it is compared with: `p.meta.age > 30` converts the value to a number before comparing it. Without a comparison, the value is returned as it is.

| Engine | `p.meta.address.zip` |
| --- | --- |
| PostgreSQL | `jsonb_path_query_first(c.meta, '$.address.zip') #>> '{}'` |
| MySQL, MariaDB | `JSON_UNQUOTE(JSON_EXTRACT(c.meta, '$.address.zip'))` |
| SQL Server, Oracle | `JSON_VALUE(c.meta, '$.address.zip')` |
| SQLite | `json_extract(c.meta, '$.address.zip')` |
| MongoDB | `{"$let":{"vars":{"d":"$meta"},"in":"$$d.address.zip"}}` |

| Function | Description | Example |
| --- | --- | --- |
| `includes` on a list of the json | The list contains the value | `p.meta.tags.includes("vip")` |
| `jsonHas(json, path)` | The path exists | `jsonHas(p.meta, "address.zip")` |
| `jsonSet(json, path, value)` | The json with the value written in the path | `jsonSet(p.meta, "address.city", city)` |

Paths and these functions are available on PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite and MongoDB. The path of `jsonHas` and `jsonSet` must be a constant made of names separated by dots; anything else is an error, so nothing but a path gets into the statement.

### Write a path

`jsonSet(json, path, value)` writes one path of a json without rewriting the rest of it. Use it in an [update](Update.md#update-a-path-of-a-json-property):

```ts
Customers.update(p => ({ meta: jsonSet(p.meta, "address.city", city) })).filter(p => p.id == id)
```

On PostgreSQL it generates:

```sql
UPDATE Customers c SET meta = jsonb_set(COALESCE(c.meta, '{}'), string_to_array('address.city', '.'), CAST($1 AS jsonb))
WHERE c.id = $2
```

| Engine | Translation |
| --- | --- |
| PostgreSQL | `jsonb_set(COALESCE(meta, '{}'), string_to_array('address.city', '.'), CAST(value AS jsonb))` |
| MySQL | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', CAST(value AS JSON))` |
| MariaDB | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', JSON_EXTRACT(value, '$'))` |
| SQL Server | `JSON_MODIFY(COALESCE(meta, '{}'), '$.address.city', …)`, according to the type of the value |
| Oracle | `JSON_TRANSFORM(COALESCE(meta, TO_CLOB('{}')), SET '$.address.city' = value FORMAT JSON RETURNING CLOB)` |
| SQLite | `json_set(COALESCE(meta, '{}'), '$.address.city', json(value))` |
| MongoDB | `{ "meta.address.city": value }`, in an update with a pipeline |

- The value travels as json text, so a text, a number, a boolean, a list or an object is written as such.
- A null json starts as `{}`.
- On MongoDB the intermediate objects of the path are created. On the SQL engines only the last name is created: its parent object must exist.
- On SQL Server, a `null` value removes the key.

## Vectors

A `vector` property stores an embedding with a fixed number of dimensions (`length`). To find the records most similar to a vector, sort by the distance to it, or filter by a maximum distance:

```yaml
- { name: embedding, type: vector, length: 1536, required: true }
indexes: [{ name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }]
```

```ts
// the 5 documents most similar to query
Documents.map(p => [p.id, cosineDistance(p.embedding, query)]).sort(p => cosineDistance(p.embedding, query)).page(1, 5)
Documents.filter(p => cosineDistance(p.embedding, query) < 0.2)
```

The vector passed as a parameter (`query`) is an array of numbers.

| Function | PostgreSQL (pgvector) | SQL Server 2025 | Oracle 23ai | MariaDB 11.7 |
| --- | --- | --- | --- | --- |
| `cosineDistance(a, b)` | `a <=> b` | `VECTOR_DISTANCE('cosine', a, b)` | `VECTOR_DISTANCE(a, b, COSINE)` | `VEC_DISTANCE_COSINE(a, b)` |
| `l2Distance(a, b)` | `a <-> b` | `VECTOR_DISTANCE('euclidean', a, b)` | `VECTOR_DISTANCE(a, b, EUCLIDEAN)` | `VEC_DISTANCE_EUCLIDEAN(a, b)` |
| `innerProduct(a, b)` | `(a <#> b) * -1` | `VECTOR_DISTANCE('dot', a, b) * -1` | `VECTOR_DISTANCE(a, b, DOT) * -1` | — |

MySQL, SQLite and MongoDB have no vectors. [`push`](../schema/SchemaSynchronization-Push.md) creates the vector index declared in `indexes` (`type`: `hnsw` or `ivfflat`; `distance`: `cosine`, `l2` or `ip`).

## Points

A point is GeoJSON, both when it is written and when it is read: `{ "type": "Point", "coordinates": [longitude, latitude] }`.

```yaml
- { name: location, type: point, required: true }
indexes: [{ name: ix_location, fields: [location], type: spatial }]
```

| Function | Description |
| --- | --- |
| `point(lng, lat)` | A point |
| `distance(p.location, point)` | The distance in meters |
| `within(p.location, minLng, minLat, maxLng, maxLat)` | The point is in the rectangle |
| `inside(p.location, area)` | The point is in the GeoJSON polygon `area` (its exterior ring), passed as a parameter |

```ts
// the stores less than 5 km away, the nearest first
Stores.filter(p => distance(p.location, here) < 5000).map(p => ({ name: p.name, meters: distance(p.location, here) })).sort(p => p.meters)
Stores.filter(p => distance(p.location, point(-56.16, -34.90)) < 5000)
Stores.filter(p => within(p.location, -58.5, -34.7, -58.3, -34.5))
// area: { type: 'Polygon', coordinates: [[[lng, lat], …]] }
Stores.filter(p => inside(p.location, area))
```

The first argument of `distance`, `within` and `inside` is the property; the point it is compared with is GeoJSON (a parameter or `point(...)`).

| Engine | Type | `distance` | `inside` |
| --- | --- | --- | --- |
| PostgreSQL (PostGIS) | `geography(Point, 4326)` | `ST_Distance(…, false)` | `ST_Covers(ST_GeomFromGeoJSON(area)::geography, p)` |
| MySQL 8 | `POINT SRID 4326` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| MariaDB | `POINT` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| SQL Server | `geography` | `STDistance` (on the ellipsoid: it differs slightly) | `STContains`, with the ring reoriented if needed |
| Oracle (Spatial) | `SDO_GEOMETRY` | `SDO_GEOM.SDO_DISTANCE` (on the ellipsoid) | `SDO_GEOM.RELATE(p, 'INSIDE+COVEREDBY', …)` |
| MongoDB | GeoJSON as it is | haversine formula | ray casting over the ring |

- SQLite has no points: `Function distance is not supported by SQLjs`.
- PostgreSQL needs the PostGIS extension in the database (`CREATE EXTENSION postgis`).
- Oracle needs Oracle Spatial (the `slim` images of Oracle Free do not include it), and `push` does not create its spatial index, which needs metadata in `USER_SDO_GEOM_METADATA`.
- On the other engines `push` creates the spatial index (GIST on PostgreSQL, SPATIAL on MySQL, MariaDB and SQL Server).
