# REST API {#rest-api}

Der Transport `http` ([Transporte](Transports.md#http)) stellt alle Operationen von λORM auf einem Schema als REST
bereit, mit JSON als Ein- und Ausgabe. Das OpenAPI-3-Dokument wird vom Gateway unter `/doc` (Swagger UI) und
`/api-docs` bereitgestellt.

## Routen {#routes}

Die Beispiele verwenden ein Gateway unter `http://localhost:8080` mit einem API-Key. Die Methoden jedes Schemas liegen
unter seiner Route:

| Gateway | Schema `iot/v1` | Einziges Schema an der Wurzel |
| --- | --- | --- |
| `http://localhost:8080` | `http://localhost:8080/iot/v1/execute` | `http://localhost:8080/execute` |

Mit `transports.http.basePath: /data-gateway` liegt jede Route darunter: `/data-gateway/iot/v1/execute`.

- Jede Anfrage benötigt die Zugangsdaten, außer `/ping`, `/health` und `/metrics` (an der Wurzel und unter jedem
  Schema), `/schemas`, `/version`, `/doc` und die UI. Wie sie gesendet werden, hängt von der
  [Authentifizierung](Security.md) ab: `X-Api-Key: <key>`, `Authorization: Bearer <token>` oder
  `Authorization: Basic <base64>`.
- `?format=beautiful` rückt das JSON der Antwort ein.
- `data` (die Parameter einer Abfrage) und `options` (zum Beispiel `{ "stage": "default" }`) sind JSON-Objekte; JSON-Text
  (`"data": "{\"id\": 10}"`) wird ebenfalls akzeptiert.
- Ein Fehler liefert einen Status und `{ "error", "code"?, "message" }` ([Fehler](Security.md#errors)).
- Eine Abfrage mit einem Namen, den das Schema nicht hat, liefert `400` mit den nächstliegenden Namen, in der Meldung
  (`nam is neither a property nor a relation of Areas; did you mean name?`) und als Daten: `"suggestions": [{ "name": "nam", "didYouMean": ["name"] }]`.
- Eine Route, die es nicht gibt, liefert `404` als JSON, mit den nächstliegenden Routen in der Meldung.

## Methoden des Gateways {#gateway-methods}

| Methode | Route | Antwortet | Zugangsdaten |
| --- | --- | --- | --- |
| `GET` | `/ping` | `{ "message": "pong", "time" }` | nein |
| `GET` | `/health` | `200`, solange irgendein Schema `ready` ist, `503`, wenn keines | nein |
| `GET` | `/metrics` | die Metriken aller Worker, Prometheus-Text | nein |
| `GET` | `/version` | die Version des Gateways | nein |
| `GET` | `/schemas` | jedes Schema mit seinem Zustand | nein |
| `GET` | `/whoami` | der Name und die Berechtigungen der Zugangsdaten | ja |

```sh
curl http://localhost:8080/schemas
```

```json
[
  { "path": "iot/v1", "status": "ready", "since": "2026-11-18T13:35:56.407Z", "restarts": 0 },
  { "path": "iot/v2", "status": "error", "reason": "connect ECONNREFUSED 10.0.0.5:5432", "since": "…", "restarts": 3 }
]
```

Die Zustände sind `starting`, `ready`, `error` und `restarting`.

## Zustand eines Schemas {#state-of-a-schema}

Unter der Route jedes Schemas (`/iot/v1/…`) antworten diese nur zu diesem Schema:

| Methode | Route | Antwortet |
| --- | --- | --- |
| `GET` | `/{schema}/ping` | `200`, wenn das Schema `ready` ist, sonst `503` |
| `GET` | `/{schema}/health` | der Zustand des Schemas; `503`, wenn es nicht `ready` ist |
| `GET` | `/{schema}/metrics` | die Metriken dieses Schemas |
| `GET` | `/{schema}/version` | die Versionen des Gateways und des Schemas |
| `GET` | `/{schema}/whoami` | der Name und die Berechtigungen der Zugangsdaten mit der Authentifizierung dieses Schemas und ob Skripte aktiviert sind |

```sh
curl http://localhost:8080/iot/v1/whoami -H "X-Api-Key: $KEY"
```

```json
{ "name": "reader", "permissions": ["read"], "schema": "iot/v1", "scripts": true }
```

Das Secret der Zugangsdaten wird nie zurückgegeben.

## Abfragemethoden {#query-methods}

### execute {#execute}

`POST /{schema}/execute` führt eine Abfrage aus. Der Body ist `{ query, data?, options? }`.

```sh
curl -X POST "http://localhost:8080/execute?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.filter(p => p.customerId == customerId).include(p => p.details)", "data": {"customerId": "CENTC"}}'
```

```json
[
  {
    "id": 12,
    "customerId": "CENTC",
    "orderDate": "1996-07-18T00:00:00.000Z",
    "details": [
      { "orderId": 12, "productId": 21, "unitPrice": 8, "quantity": 10 },
      { "orderId": 12, "productId": 37, "unitPrice": 20.8, "quantity": 1 }
    ]
  }
]
```

- Ein Select liefert die Zeilen; `update` und `delete` liefern die Anzahl der betroffenen Zeilen (`0`, wenn nichts
  zutraf); `insert` liefert die eingefügten Daten.
- Mit nur der Berechtigung `read` wird eine schreibende Abfrage (`insert`, `update`, `delete`, `upsert`, `merge`,
  `bulk*`) mit `403` abgelehnt, bevor sie die Datenbank erreicht.

```sh
curl -X POST http://localhost:8080/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", "data": {"id": 10248, "freight": 40}}'
```

```json
1
```

### plan {#plan}

`POST /{schema}/plan` liefert, wie die Abfrage ausgeführt wird: den Dialekt, die Quelle und die Anweisung jedes Teils,
ohne sie auszuführen. Body `{ query, options? }`.

```sh
curl -X POST http://localhost:8080/plan -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.filter(p => p.customerId == customerId).include(p => p.details)"}'
```

```json
{
  "entity": "Orders",
  "dialect": "PostgreSQL",
  "source": "default",
  "sentence": "SELECT o.OrderID AS \"id\", o.CustomerID AS \"customerId\", o.OrderDate AS \"orderDate\", o.OrderID AS \"__id\" FROM Orders o  WHERE o.CustomerID = $1 ",
  "children": [
    {
      "entity": "Orders.details",
      "dialect": "PostgreSQL",
      "source": "default",
      "sentence": "SELECT o1.OrderID AS \"orderId\", o1.ProductID AS \"productId\", o1.UnitPrice AS \"unitPrice\", o1.Quantity AS \"quantity\", o1.OrderID AS \"LambdaOrmParentId\" FROM \"Order Details\" o1  WHERE  o1.OrderID IN ($1) "
    }
  ]
}
```

### model {#model}

`POST /{schema}/model` liefert die Struktur des Ergebnisses: seine Eigenschaften und deren Typen.

```json
[
  { "name": "id", "type": "integer" },
  { "name": "customerId", "type": "string" },
  { "name": "orderDate", "type": "dateTime" },
  { "name": "details", "type": "Orders.details[]", "children": [
    { "name": "orderId", "type": "integer" },
    { "name": "productId", "type": "integer" },
    { "name": "unitPrice", "type": "decimal" },
    { "name": "quantity", "type": "decimal" }
  ] }
]
```

### parameters {#parameters}

`POST /{schema}/parameters` liefert die Variablen, die die Abfrage verwendet und die in `data` übergeben werden.

```json
[ { "name": "customerId", "type": "string" } ]
```

### constraints {#constraints}

`POST /{schema}/constraints` liefert die Constraints, die für die Entitäten der Abfrage gelten.

```json
{ "entity": "Orders", "constraints": [], "children": [ { "entity": "Orders.details", "constraints": [] } ] }
```

### metadata {#metadata}

`POST /{schema}/metadata` liefert den analysierten Baum der Abfrage: jede Anweisung mit ihrer Aktion (`select`,
`insert`, …), Entität, Spalten, Parametern und Constraints.

```json
{ "classtype": "Sentence", "name": "select", "entity": "Orders", "columns": [ { "name": "id" } ], "parameters": [ { "name": "customerId", "type": "any" } ], "constraints": [] }
```

### script {#script}

`POST /{schema}/script` führt ein [Skript](../usage/Script.md) aus: mehrere Abfragen und Logik in einer Transaktion.
Body `{ script, data?, options? }`. Es benötigt `scripts.enabled` (sonst `403`) und die Berechtigung `script`; es gelten
die Limits von `scripts` (`maxLength`, `timeoutMs`, `maxIterations`).

```sh
curl -X POST http://localhost:8080/script -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{
  "script": "order = orm.execute(\"Orders.filter(p => p.id == id)\", { id: id }); if (order.length() == 0) { throw { status: 404, message: \"order not found\" }; } order[0]",
  "data": { "id": 10248 }
}'
```

Ein Skript kann den Status der Antwort mit `throw { status, message }` bestimmen.

### execute-queued {#execute-queued}

`POST /{schema}/execute-queued` führt eine Abfrage im Hintergrund aus und sendet ihr Ergebnis in Blöcken an ein
Kafka-Topic. Es antwortet sofort mit `{ "queueId": "…" }`; die Nachrichten tragen die Schlüssel `<queueId>-<chunk>`. Body
`{ topic, query, data?, chunk?, options? }`. Es benötigt die Berechtigung `queue` (und `write`, wenn die Abfrage
schreibt) sowie eine `infrastructure.queue` in der `lambdaORM.yaml` des Schemas.

```sh
curl -X POST http://localhost:8080/execute-queued -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Countries.map(p => [p.iso3, p.name])", "topic": "countries", "chunk": 1000}'
```

Die Warteschlange eines Schemas wird in seiner `lambdaORM.yaml` konfiguriert (`config` ist die
[kafkajs](https://kafka.js.org/docs/configuration)-Konfiguration), wo auch Consumer deklariert werden können:

```yaml
infrastructure:
  queue:
    config: $QUEUE_CONFIG
    consumers:
      - name: syncInsights
        config: { groupId: group1 }
        subscribe: { topic: insights-sync, fromBeginning: true }
        execute: orm.execute(message.query, message.data, { stage: "insights" })
```

Über die [WebSocket API](WebSocket.md) teilt `query.executeQueued` mit `notify: true` der Verbindung zusätzlich mit,
wann die Ausführung endet.

## Schema-Methoden {#schema-methods}

Das Modell des Schemas. Sie benötigen `read`. Die Verbindungen der Quellen werden nie zurückgegeben.

| Methode | Route | Antwortet |
| --- | --- | --- |
| `GET` | `/{schema}/schema` | die Version und die Domäne des Schemas |
| `GET` | `/{schema}/schema/version` | die Version des Schemas |
| `GET` | `/{schema}/domain` | die Domäne: Entitäten (Eigenschaften, Beziehungen, Schlüssel, Indizes, Constraints) und Enums |
| `GET` | `/{schema}/entities` | die Entitäten |
| `GET` | `/{schema}/entities/{entity}` | eine Entität |
| `GET` | `/{schema}/enums` | die Enums |
| `GET` | `/{schema}/enums/{enum}` | ein Enum |
| `GET` | `/{schema}/sources` | die Quellen, mit Name und Dialekt |
| `GET` | `/{schema}/sources/{source}` | eine Quelle |
| `GET` | `/{schema}/mappings` | die Mappings (Entitäten auf Tabellen und Spalten) |
| `GET` | `/{schema}/mappings/{mapping}` | ein Mapping |
| `GET` | `/{schema}/mappings/{mapping}/{entity}` | das Mapping einer Entität |
| `GET` | `/{schema}/views` | die Views |
| `GET` | `/{schema}/stages` | die Stages, mit ihren Quellen |
| `GET` | `/{schema}/stages/{stage}` | ein Stage |
| `GET` | `/{schema}/typings` | die Domäne als TypeScript-Deklarationen (`text/plain`), für die Autovervollständigung eines Editors |
| `GET` | `/{schema}/search?q={text}` | die Entitäten, Eigenschaften und Beziehungen, deren Name den Text enthält, kompakt ([große Schemas](#large-schemas)) |
| `GET` | `/{schema}/describe?entities={A,B}` | einige Entitäten in je zwei Zeilen, und die unbekannten Namen mit den nächstliegenden |

```sh
curl http://localhost:8080/sources -H "X-Api-Key: $KEY"
```

```json
[ { "name": "catalog", "dialect": "PostgreSQL" }, { "name": "accounts", "dialect": "PostgreSQL" } ]
```

```sh
curl http://localhost:8080/entities/Categories -H "X-Api-Key: $KEY"
```

```json
{
  "name": "Categories",
  "primaryKey": ["id"],
  "uniqueKey": ["name"],
  "properties": [
    { "name": "id", "type": "integer", "required": true, "autoIncrement": true },
    { "name": "name", "type": "string", "length": 80, "required": true },
    { "name": "description", "type": "string", "length": 1000 }
  ],
  "relations": []
}
```

### Große Schemas {#large-schemas}

Bei Hunderten von Entitäten ist die ganze Domäne zu viel, um sie vor einer Abfrage zu lesen. `/search` findet Namen
über einen Teil davon (`Products.cat` sucht nur in Products; ohne Treffer die nächstliegenden Namen), und `/describe`
liefert einige Entitäten in je zwei Zeilen. MCP hat dasselbe als [`schema_search` und `schema_describe`](Mcp.md#large-schemas).

```sh
curl "http://localhost:8080/search?q=Products.cat" -H "X-Api-Key: $KEY"
```

```json
{ "matches": [ "Products.categoryId: integer", "Products.category → Categories" ] }
```

```sh
curl "http://localhost:8080/describe?entities=Categories,Categorie" -H "X-Api-Key: $KEY"
```

```json
{
  "entities": [ "- Categories: id: integer (pk, auto); name: string (required)\n  relations: products → Products[]" ],
  "notFound": [ { "name": "Categorie", "didYouMean": [ "Categories" ] } ]
}
```

## Stage-Methoden {#stage-methods}

| Methode | Route | Antwortet | Berechtigung |
| --- | --- | --- | --- |
| `GET` | `/{schema}/stages/{stage}/exists` | `{ "exists": true }`, wenn der Stage erstellt wurde und ihre Zustandsdatei existiert | `read` |
| `GET` | `/{schema}/stages/{stage}/export` | die Zeilen aller Entitäten des Stages | `read` |
| `POST` | `/{schema}/stages/{stage}/import` | importiert Zeilen (der Body ist ein Export) in die Entitäten des Stages | `stageImport` |

```sh
curl http://localhost:8080/stages/default/export -H "X-Api-Key: $KEY" > data.json
curl -X POST http://localhost:8080/stages/default/import -H "X-Api-Key: $BACKEND_KEY" -H "Content-Type: application/json" -d @data.json
```

## Zusammenfassung {#summary}

| Operation | REST | [MCP-Tool](Mcp.md#tools) | [WebSocket-Methode](WebSocket.md#methods) | Berechtigung |
| --- | --- | --- | --- | --- |
| execute | `POST /execute` | `orm_execute` | `query.execute` | `read` (Selects) / `write` |
| Skript | `POST /script` | `orm_execute_script` | `query.script` | `script` |
| Ausführung in der Warteschlange | `POST /execute-queued` | `orm_execute_queued` | `query.executeQueued` | `queue` |
| plan | `POST /plan` | `orm_plan` | `query.plan` | `read` |
| metadata | `POST /metadata` | `orm_metadata` | `query.metadata` | `read` |
| model | `POST /model` | `orm_model` | `query.model` | `read` |
| parameters | `POST /parameters` | `orm_parameters` | `query.parameters` | `read` |
| constraints | `POST /constraints` | `orm_constraints` | `query.constraints` | `read` |
| Schema | `GET /schema` | `schema_get` | `schema.schema` | `read` |
| Schema-Version | `GET /schema/version` | `schema_version` | `schema.version` | `read` |
| Domäne | `GET /domain` | `schema_domain` | `schema.domain` | `read` |
| Entitäten | `GET /entities[/{entity}]` | `schema_entities` | `schema.entities`, `schema.entity` | `read` |
| Enums | `GET /enums[/{enum}]` | `schema_enums` | `schema.enums`, `schema.enum` | `read` |
| Quellen | `GET /sources[/{source}]` | `schema_sources` | `schema.sources`, `schema.source` | `read` |
| Mappings | `GET /mappings[/{mapping}[/{entity}]]` | `schema_mappings` | `schema.mappings`, `schema.mapping`, `schema.entityMapping` | `read` |
| Views | `GET /views` | `schema_views` | `schema.views` | `read` |
| Stages | `GET /stages[/{stage}]` | `schema_stages` | `schema.stages`, `schema.stage` | `read` |
| Typings | `GET /typings` | — | `schema.typings` | `read` |
| Search | `GET /search?q=` | `schema_search` | `schema.search` | `read` |
| Describe | `GET /describe?entities=` | `schema_describe` | `schema.describe` | `read` |
| Stage existiert | `GET /stages/{stage}/exists` | `stage_exists` | `stage.exists` | `read` |
| Stage-Export | `GET /stages/{stage}/export` | `stage_export` | `stage.export` | `read` |
| Stage-Import | `POST /stages/{stage}/import` | `stage_import` | `stage.import` | `stageImport` |
| Version | `GET /version` | `gateway_version` | `general.version` | — |
| Health | `GET /health` | `gateway_health` | `general.health` | — |
| ping | `GET /ping` | — | `general.ping` | — |
