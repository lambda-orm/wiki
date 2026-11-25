# JSON, Vektoren und Punkte {#json-vectors-and-points}

Diese Seite zeigt, wie man drei Arten von Eigenschaften abfragt, die mehr als einen einfachen Wert enthalten: eine `json`-Eigenschaft (einen Pfad darin lesen, danach filtern und ihn schreiben), eine `vector`-Eigenschaft (Ähnlichkeitssuche, wie bei RAG) und eine `point`-Eigenschaft (Entfernungen, Rechtecke und Polygone). Man schreibt für jede Engine denselben Ausdruck; die Übersetzung jeder Funktion steht in der Konfiguration des jeweiligen Dialekts, und eine Engine ohne Übersetzung antwortet mit `Function X is not supported by <dialect>`.

Die Typen `json`, `vector` und `point` werden im Schema deklariert (siehe [Schemadefinition](../schema/SchemaDefinition.md)).

## Pfade einer json-Eigenschaft {#paths-of-a-json-property}

Ein Pfad innerhalb einer `json`-Eigenschaft wird geschrieben, als wäre er eine Eigenschaft: `p.meta.address.zip` liest das Feld `zip` des Objekts `address` von `meta`. Er kann in `map`, `filter` und `sort` verwendet werden:

```ts
Customers.map(p => [p.name, p.meta.address.zip])
Customers.filter(p => p.meta.city == "Madrid" && p.meta.age > 30)    // compared with a number, as a number
Customers.sort(p => p.meta.address.zip)
Customers.filter(p => p.meta.tags.includes("vip"))                   // a list of the json contains a value
Customers.filter(p => jsonHas(p.meta, "address.zip"))                // the path exists
Customers.filter(p => isNotNull(p.meta.city))
```

Ein Pfad übernimmt den Typ der Konstante, mit der er verglichen wird: `p.meta.age > 30` wandelt den Wert vor dem Vergleich in eine Zahl um. Ohne Vergleich wird der Wert unverändert zurückgegeben.

| Engine | `p.meta.address.zip` |
| --- | --- |
| PostgreSQL | `jsonb_path_query_first(c.meta, '$.address.zip') #>> '{}'` |
| MySQL, MariaDB | `JSON_UNQUOTE(JSON_EXTRACT(c.meta, '$.address.zip'))` |
| SQL Server, Oracle | `JSON_VALUE(c.meta, '$.address.zip')` |
| SQLite | `json_extract(c.meta, '$.address.zip')` |
| MongoDB | `{"$let":{"vars":{"d":"$meta"},"in":"$$d.address.zip"}}` |

| Funktion | Beschreibung | Beispiel |
| --- | --- | --- |
| `includes` auf einer Liste des json | Die Liste enthält den Wert | `p.meta.tags.includes("vip")` |
| `jsonHas(json, path)` | Der Pfad existiert | `jsonHas(p.meta, "address.zip")` |
| `jsonSet(json, path, value)` | Das json mit dem in den Pfad geschriebenen Wert | `jsonSet(p.meta, "address.city", city)` |

Pfade und diese Funktionen sind auf PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite und MongoDB verfügbar. Der Pfad von `jsonHas` und `jsonSet` muss eine Konstante aus durch Punkte getrennten Namen sein; alles andere ist ein Fehler, sodass nichts außer einem Pfad in die Anweisung gelangt.

### Einen Pfad schreiben {#write-a-path}

`jsonSet(json, path, value)` schreibt einen Pfad eines json, ohne den Rest neu zu schreiben. Man verwendet es in einem [Update](Update.md#update-a-path-of-a-json-property):

```ts
Customers.update(p => ({ meta: jsonSet(p.meta, "address.city", city) })).filter(p => p.id == id)
```

Auf PostgreSQL entsteht:

```sql
UPDATE Customers c SET meta = jsonb_set(COALESCE(c.meta, '{}'), string_to_array('address.city', '.'), CAST($1 AS jsonb))
WHERE c.id = $2
```

| Engine | Übersetzung |
| --- | --- |
| PostgreSQL | `jsonb_set(COALESCE(meta, '{}'), string_to_array('address.city', '.'), CAST(value AS jsonb))` |
| MySQL | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', CAST(value AS JSON))` |
| MariaDB | `JSON_SET(COALESCE(meta, JSON_OBJECT()), '$.address.city', JSON_EXTRACT(value, '$'))` |
| SQL Server | `JSON_MODIFY(COALESCE(meta, '{}'), '$.address.city', …)`, je nach Typ des Werts |
| Oracle | `JSON_TRANSFORM(COALESCE(meta, TO_CLOB('{}')), SET '$.address.city' = value FORMAT JSON RETURNING CLOB)` |
| SQLite | `json_set(COALESCE(meta, '{}'), '$.address.city', json(value))` |
| MongoDB | `{ "meta.address.city": value }`, in einem Update mit Pipeline |

- Der Wert wird als json-Text übertragen, sodass ein Text, eine Zahl, ein Boolean, eine Liste oder ein Objekt als solche geschrieben werden.
- Ein null-json beginnt als `{}`.
- Auf MongoDB werden die Zwischenobjekte des Pfads angelegt. Auf den SQL-Engines wird nur der letzte Name angelegt: sein übergeordnetes Objekt muss existieren.
- Auf SQL Server entfernt ein `null`-Wert den Schlüssel.

## Vektoren {#vectors}

Eine `vector`-Eigenschaft speichert ein Embedding mit einer festen Anzahl von Dimensionen (`length`). Um die Datensätze zu finden, die einem Vektor am ähnlichsten sind, sortiert man nach der Entfernung zu ihm oder filtert nach einer maximalen Entfernung:

```yaml
- { name: embedding, type: vector, length: 1536, required: true }
indexes: [{ name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }]
```

```ts
// the 5 documents most similar to query
Documents.map(p => [p.id, cosineDistance(p.embedding, query)]).sort(p => cosineDistance(p.embedding, query)).page(1, 5)
Documents.filter(p => cosineDistance(p.embedding, query) < 0.2)
```

Der als Parameter übergebene Vektor (`query`) ist ein Array von Zahlen.

| Funktion | PostgreSQL (pgvector) | SQL Server 2025 | Oracle 23ai | MariaDB 11.7 |
| --- | --- | --- | --- | --- |
| `cosineDistance(a, b)` | `a <=> b` | `VECTOR_DISTANCE('cosine', a, b)` | `VECTOR_DISTANCE(a, b, COSINE)` | `VEC_DISTANCE_COSINE(a, b)` |
| `l2Distance(a, b)` | `a <-> b` | `VECTOR_DISTANCE('euclidean', a, b)` | `VECTOR_DISTANCE(a, b, EUCLIDEAN)` | `VEC_DISTANCE_EUCLIDEAN(a, b)` |
| `innerProduct(a, b)` | `(a <#> b) * -1` | `VECTOR_DISTANCE('dot', a, b) * -1` | `VECTOR_DISTANCE(a, b, DOT) * -1` | — |

MySQL, SQLite und MongoDB haben keine Vektoren. [`push`](../schema/SchemaSynchronization-Push.md) legt den in `indexes` deklarierten Vektorindex an (`type`: `hnsw` oder `ivfflat`; `distance`: `cosine`, `l2` oder `ip`).

## Punkte {#points}

Ein Punkt ist GeoJSON, sowohl beim Schreiben als auch beim Lesen: `{ "type": "Point", "coordinates": [longitude, latitude] }`.

```yaml
- { name: location, type: point, required: true }
indexes: [{ name: ix_location, fields: [location], type: spatial }]
```

| Funktion | Beschreibung |
| --- | --- |
| `point(lng, lat)` | Ein Punkt |
| `distance(p.location, point)` | Die Entfernung in Metern |
| `within(p.location, minLng, minLat, maxLng, maxLat)` | Der Punkt liegt im Rechteck |
| `inside(p.location, area)` | Der Punkt liegt im GeoJSON-Polygon `area` (seinem äußeren Ring), das als Parameter übergeben wird |

```ts
// the stores less than 5 km away, the nearest first
Stores.filter(p => distance(p.location, here) < 5000).map(p => ({ name: p.name, meters: distance(p.location, here) })).sort(p => p.meters)
Stores.filter(p => distance(p.location, point(-56.16, -34.90)) < 5000)
Stores.filter(p => within(p.location, -58.5, -34.7, -58.3, -34.5))
// area: { type: 'Polygon', coordinates: [[[lng, lat], …]] }
Stores.filter(p => inside(p.location, area))
```

Das erste Argument von `distance`, `within` und `inside` ist die Eigenschaft; der Punkt, mit dem verglichen wird, ist GeoJSON (ein Parameter oder `point(...)`).

| Engine | Typ | `distance` | `inside` |
| --- | --- | --- | --- |
| PostgreSQL (PostGIS) | `geography(Point, 4326)` | `ST_Distance(…, false)` | `ST_Covers(ST_GeomFromGeoJSON(area)::geography, p)` |
| MySQL 8 | `POINT SRID 4326` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| MariaDB | `POINT` | `ST_Distance_Sphere` | `ST_Within(p, ST_GeomFromGeoJSON(area))` |
| SQL Server | `geography` | `STDistance` (auf dem Ellipsoid: weicht leicht ab) | `STContains`, mit bei Bedarf umorientiertem Ring |
| Oracle (Spatial) | `SDO_GEOMETRY` | `SDO_GEOM.SDO_DISTANCE` (auf dem Ellipsoid) | `SDO_GEOM.RELATE(p, 'INSIDE+COVEREDBY', …)` |
| MongoDB | GeoJSON unverändert | Haversine-Formel | Ray Casting über den Ring |

- SQLite hat keine Punkte: `Function distance is not supported by SQLjs`.
- PostgreSQL benötigt die Erweiterung PostGIS in der Datenbank (`CREATE EXTENSION postgis`).
- Oracle benötigt Oracle Spatial (die `slim`-Images von Oracle Free enthalten es nicht), und `push` legt seinen räumlichen Index nicht an, da dieser Metadaten in `USER_SDO_GEOM_METADATA` braucht.
- Auf den übrigen Engines legt `push` den räumlichen Index an (GIST auf PostgreSQL, SPATIAL auf MySQL, MariaDB und SQL Server).
