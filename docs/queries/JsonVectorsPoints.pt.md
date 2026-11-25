# JSON, vetores e pontos {#json-vectors-and-points}

## Caminhos de uma propriedade json {#paths-of-a-json-property}

```ts
Customers.map(p => [p.name, p.meta.address.zip])
Customers.filter(p => p.meta.city == "Madrid" && p.meta.age > 30)    // compared with a number, as a number
Customers.filter(p => p.meta.tags.includes("vip"))
Customers.filter(p => jsonHas(p.meta, "address.zip"))
```

Nos seis bancos de dados.

## Vetores {#vectors}

```yaml
- { name: embedding, type: vector, length: 1536, required: true }
indexes: [{ name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }]
```

```ts
Documents.map(p => [p.id, cosineDistance(p.embedding, query)]).sort(p => cosineDistance(p.embedding, query)).page(1, 5)
```

`cosineDistance`, `l2Distance` e `innerProduct`, no PostgreSQL (pgvector), SQL Server 2025, Oracle 23ai e
MariaDB 11.7; o `push` cria o índice vetorial (`hnsw`, `ivfflat`).

## Pontos {#points}

Um ponto é GeoJSON (`{ "type": "Point", "coordinates": [longitude, latitude] }`):

```yaml
- { name: location, type: point, required: true }
indexes: [{ name: ix_location, fields: [location], type: spatial }]
```

```ts
Stores.filter(p => distance(p.location, here) < 5000).map(p => ({ name: p.name, meters: distance(p.location, here) })).sort(p => p.meters)
Stores.filter(p => within(p.location, -58.5, -34.7, -58.3, -34.5))
Stores.filter(p => distance(p.location, point(-56.16, -34.90)) < 5000)
```

`distance` em metros, `within` um retângulo; no PostgreSQL (PostGIS), MySQL, MariaDB, SQL Server e MongoDB.

Cada tradução está na configuração de cada banco de dados: um banco de dados sem ela diz
`Function X is not supported by <dialect>`.
