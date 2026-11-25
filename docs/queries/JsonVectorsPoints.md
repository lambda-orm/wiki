# JSON, vectors and points

## Paths of a json property

```ts
Customers.map(p => [p.name, p.meta.address.zip])
Customers.filter(p => p.meta.city == "Madrid" && p.meta.age > 30)    // compared with a number, as a number
Customers.filter(p => p.meta.tags.includes("vip"))
Customers.filter(p => jsonHas(p.meta, "address.zip"))
```

In the six engines.

## Vectors

```yaml
- { name: embedding, type: vector, length: 1536, required: true }
indexes: [{ name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }]
```

```ts
Documents.map(p => [p.id, cosineDistance(p.embedding, query)]).sort(p => cosineDistance(p.embedding, query)).page(1, 5)
```

`cosineDistance`, `l2Distance` and `innerProduct`, on PostgreSQL (pgvector), SQL Server 2025, Oracle 23ai and
MariaDB 11.7; `push` creates the vector index (`hnsw`, `ivfflat`).

## Points

A point is GeoJSON (`{ "type": "Point", "coordinates": [longitude, latitude] }`):

```yaml
- { name: location, type: point, required: true }
indexes: [{ name: ix_location, fields: [location], type: spatial }]
```

```ts
Stores.filter(p => distance(p.location, here) < 5000).map(p => ({ name: p.name, meters: distance(p.location, here) })).sort(p => p.meters)
Stores.filter(p => within(p.location, -58.5, -34.7, -58.3, -34.5))
Stores.filter(p => distance(p.location, point(-56.16, -34.90)) < 5000)
```

`distance` in meters, `within` a rectangle; on PostgreSQL (PostGIS), MySQL, MariaDB, SQL Server and MongoDB.

Every translation is in the configuration of each engine: an engine without one says
`Function X is not supported by <dialect>`.
