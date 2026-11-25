# JSON, vetores e pontos {#json-vectors-and-points}

Esta página mostra como consultar três tipos de propriedades que guardam mais do que um valor simples: uma propriedade `json` (ler, filtrar por e escrever um caminho dentro dela), uma propriedade `vector` (busca por similaridade, como em RAG) e uma propriedade `point` (distâncias, retângulos e polígonos). Você escreve a mesma expressão para todos os motores; a tradução de cada função está na configuração de cada dialeto, e um motor que não a tem responde `Function X is not supported by <dialect>`.

Os tipos `json`, `vector` e `point` são declarados no esquema (veja [Definição do esquema](../schema/SchemaDefinition.md)).

## Caminhos de uma propriedade json {#paths-of-a-json-property}

Um caminho dentro de uma propriedade `json` é escrito como se fosse uma propriedade: `p.meta.address.zip` lê o campo `zip` do objeto `address` de `meta`. Você pode usá-lo em `map`, `filter` e `sort`:

```ts
Customers.map(p => [p.name, p.meta.address.zip])
Customers.filter(p => p.meta.city == "Madrid" && p.meta.age > 30)    // compared with a number, as a number
Customers.sort(p => p.meta.address.zip)
Customers.filter(p => p.meta.tags.includes("vip"))                   // a list of the json contains a value
Customers.filter(p => jsonHas(p.meta, "address.zip"))                // the path exists
Customers.filter(p => isNotNull(p.meta.city))
```

Um caminho assume o tipo da constante com a qual é comparado: `p.meta.age > 30` converte o valor em número antes de compará-lo. Sem comparação, o valor é devolvido como está.

| Motor | `p.meta.address.zip` |
| --- | --- |
| PostgreSQL | `jsonb_path_query_first(c.meta, '$.address.zip') #>> '{}'` |
| MySQL, MariaDB | `JSON_UNQUOTE(JSON_EXTRACT(c.meta, '$.address.zip'))` |
| SQL Server, Oracle | `JSON_VALUE(c.meta, '$.address.zip')` |
| SQLite | `json_extract(c.meta, '$.address.zip')` |
| MongoDB | `{"$let":{"vars":{"d":"$meta"},"in":"$$d.address.zip"}}` |

| Função | Descrição | Exemplo |
| --- | --- | --- |
| `includes` sobre uma lista do json | A lista contém o valor | `p.meta.tags.includes("vip")` |
| `jsonHas(json, path)` | O caminho existe | `jsonHas(p.meta, "address.zip")` |
| `jsonSet(json, path, value)` | O json com o valor escrito no caminho | `jsonSet(p.meta, "address.city", city)` |

Os caminhos e estas funções estão disponíveis em PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite e MongoDB. O caminho de `jsonHas` e `jsonSet` deve ser uma constante formada por nomes separados por pontos; qualquer outra coisa é um erro, de modo que nada além de um caminho entra na sentença.

### Escrever um caminho {#write-a-path}

`jsonSet(json, path, value)` escreve um caminho de um json sem reescrever o resto. Use-a em um [update](Update.md#update-a-path-of-a-json-property):

```ts
Customers.update(p => ({ meta: jsonSet(p.meta, "address.city", city) })).filter(p => p.id == id)
```

No PostgreSQL gera:

```sql
UPDATE Customers c SET meta = jsonb_set(COALESCE(c.meta, '{}'), string_to_array('address.city', '.'), CAST($1 AS jsonb))
WHERE c.id = $2
```

| Motor | Tradução |
| --- | --- |
| PostgreSQL | `jsonb_set(COALESCE(meta, '{}'), string_to_array('address.city', '.'), CAST(value AS jsonb))` |
| MySQL | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', CAST(value AS JSON))` |
| MariaDB | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', JSON_EXTRACT(value, '$'))` |
| SQL Server | `JSON_MODIFY(COALESCE(meta, '{}'), '$.address.city', …)`, conforme o tipo do valor |
| Oracle | `JSON_TRANSFORM(COALESCE(meta, TO_CLOB('{}')), SET '$.address.city' = value FORMAT JSON RETURNING CLOB)` |
| SQLite | `json_set(COALESCE(meta, '{}'), '$.address.city', json(value))` |
| MongoDB | `{ "meta.address.city": value }`, em um update com pipeline |

- O valor viaja como texto json, então um texto, um número, um booleano, uma lista ou um objeto são escritos como tais.
- Um json nulo começa como `{}`.
- No MongoDB os objetos intermediários do caminho são criados. Nos motores SQL só o último nome é criado: seu objeto pai precisa existir.
- No SQL Server, um valor `null` remove a chave.

## Vetores {#vectors}

Uma propriedade `vector` guarda um embedding com um número fixo de dimensões (`length`). Para encontrar os registros mais parecidos com um vetor, ordene pela distância até ele ou filtre por uma distância máxima:

```yaml
- { name: embedding, type: vector, length: 1536, required: true }
indexes: [{ name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }]
```

```ts
// the 5 documents most similar to query
Documents.map(p => [p.id, cosineDistance(p.embedding, query)]).sort(p => cosineDistance(p.embedding, query)).page(1, 5)
Documents.filter(p => cosineDistance(p.embedding, query) < 0.2)
```

O vetor passado como parâmetro (`query`) é um array de números.

| Função | PostgreSQL (pgvector) | SQL Server 2025 | Oracle 23ai | MariaDB 11.7 |
| --- | --- | --- | --- | --- |
| `cosineDistance(a, b)` | `a <=> b` | `VECTOR_DISTANCE('cosine', a, b)` | `VECTOR_DISTANCE(a, b, COSINE)` | `VEC_DISTANCE_COSINE(a, b)` |
| `l2Distance(a, b)` | `a <-> b` | `VECTOR_DISTANCE('euclidean', a, b)` | `VECTOR_DISTANCE(a, b, EUCLIDEAN)` | `VEC_DISTANCE_EUCLIDEAN(a, b)` |
| `innerProduct(a, b)` | `(a <#> b) * -1` | `VECTOR_DISTANCE('dot', a, b) * -1` | `VECTOR_DISTANCE(a, b, DOT) * -1` | — |

MySQL, SQLite e MongoDB não têm vetores. [`push`](../schema/SchemaSynchronization-Push.md) cria o índice vetorial declarado em `indexes` (`type`: `hnsw` ou `ivfflat`; `distance`: `cosine`, `l2` ou `ip`).

## Pontos {#points}

Um ponto é GeoJSON, tanto ao ser escrito quanto ao ser lido: `{ "type": "Point", "coordinates": [longitude, latitude] }`.

```yaml
- { name: location, type: point, required: true }
indexes: [{ name: ix_location, fields: [location], type: spatial }]
```

| Função | Descrição |
| --- | --- |
| `point(lng, lat)` | Um ponto |
| `distance(p.location, point)` | A distância em metros |
| `within(p.location, minLng, minLat, maxLng, maxLat)` | O ponto está no retângulo |
| `inside(p.location, area)` | O ponto está no polígono GeoJSON `area` (seu anel exterior), passado como parâmetro |

```ts
// the stores less than 5 km away, the nearest first
Stores.filter(p => distance(p.location, here) < 5000).map(p => ({ name: p.name, meters: distance(p.location, here) })).sort(p => p.meters)
Stores.filter(p => distance(p.location, point(-56.16, -34.90)) < 5000)
Stores.filter(p => within(p.location, -58.5, -34.7, -58.3, -34.5))
// area: { type: 'Polygon', coordinates: [[[lng, lat], …]] }
Stores.filter(p => inside(p.location, area))
```

O primeiro argumento de `distance`, `within` e `inside` é a propriedade; o ponto com o qual se compara é GeoJSON (um parâmetro ou `point(...)`).

| Motor | Tipo | `distance` | `inside` |
| --- | --- | --- | --- |
| PostgreSQL (PostGIS) | `geography(Point, 4326)` | `ST_Distance(…, false)` | `ST_Covers(ST_GeomFromGeoJSON(area)::geography, p)` |
| MySQL 8 | `POINT SRID 4326` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| MariaDB | `POINT` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| SQL Server | `geography` | `STDistance` (sobre o elipsoide: difere um pouco) | `STContains`, com o anel reorientado se necessário |
| Oracle (Spatial) | `SDO_GEOMETRY` | `SDO_GEOM.SDO_DISTANCE` (sobre o elipsoide) | `SDO_GEOM.RELATE(p, 'INSIDE+COVEREDBY', …)` |
| MongoDB | GeoJSON como está | fórmula de haversine | ray casting sobre o anel |

- O SQLite não tem pontos: `Function distance is not supported by SQLjs`.
- O PostgreSQL precisa da extensão PostGIS no banco de dados (`CREATE EXTENSION postgis`).
- O Oracle precisa do Oracle Spatial (as imagens `slim` do Oracle Free não o incluem), e `push` não cria seu índice espacial, que precisa de metadados em `USER_SDO_GEOM_METADATA`.
- Nos demais motores `push` cria o índice espacial (GIST no PostgreSQL, SPATIAL no MySQL, MariaDB e SQL Server).
