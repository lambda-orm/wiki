# REST API

The `http` transport ([Transports](Transports.md#http)) exposes every operation of λORM on a schema as REST, with JSON
in and out. The OpenAPI 3 document is served by the gateway at `/doc` (Swagger UI) and `/api-docs`.

## Routes

The examples use a gateway at `http://localhost:8080` with an API key. Each schema's methods are under its route:

| Gateway | Schema `iot/v1` | Only schema at the root |
| --- | --- | --- |
| `http://localhost:8080` | `http://localhost:8080/iot/v1/execute` | `http://localhost:8080/execute` |

With `transports.http.basePath: /data-gateway`, every route is under it: `/data-gateway/iot/v1/execute`.

- Every request needs the credential, except `/ping`, `/health` and `/metrics` (at the root and under each schema),
  `/schemas`, `/version`, `/doc` and the UI. How it is sent depends on the [authentication](Security.md):
  `X-Api-Key: <key>`, `Authorization: Bearer <token>` or `Authorization: Basic <base64>`.
- `?format=beautiful` indents the JSON of the answer.
- `data` (the parameters of a query) and `options` (for example `{ "stage": "default" }`) are JSON objects; JSON text
  (`"data": "{\"id\": 10}"`) is also accepted.
- An error answers a status and `{ "error", "code"?, "message" }` ([Errors](Security.md#errors)).

## Gateway methods

| Method | Route | Answers | Credential |
| --- | --- | --- | --- |
| `GET` | `/ping` | `{ "message": "pong", "time" }` | no |
| `GET` | `/health` | `200` while some schema is `ready`, `503` if none | no |
| `GET` | `/metrics` | the metrics of every worker, Prometheus text | no |
| `GET` | `/version` | the version of the gateway | no |
| `GET` | `/schemas` | each schema with its state | no |
| `GET` | `/whoami` | the name and permissions of the credential | yes |

```sh
curl http://localhost:8080/schemas
```

```json
[
  { "path": "iot/v1", "status": "ready", "since": "2026-11-18T13:35:56.407Z", "restarts": 0 },
  { "path": "iot/v2", "status": "error", "reason": "connect ECONNREFUSED 10.0.0.5:5432", "since": "…", "restarts": 3 }
]
```

The states are `starting`, `ready`, `error` and `restarting`.

## State of a schema

Under each schema's route (`/iot/v1/…`), these answer only about that schema:

| Method | Route | Answers |
| --- | --- | --- |
| `GET` | `/{schema}/ping` | `200` if the schema is `ready`, `503` if not |
| `GET` | `/{schema}/health` | the state of the schema; `503` if it is not `ready` |
| `GET` | `/{schema}/metrics` | the metrics of that schema |
| `GET` | `/{schema}/version` | the versions of the gateway and the schema |
| `GET` | `/{schema}/whoami` | the name and permissions of the credential with the authentication of that schema, and whether it has scripts enabled |

```sh
curl http://localhost:8080/iot/v1/whoami -H "X-Api-Key: $KEY"
```

```json
{ "name": "reader", "permissions": ["read"], "schema": "iot/v1", "scripts": true }
```

The secret of the credential is never answered.

## Query methods

### execute

`POST /{schema}/execute` runs a query. The body is `{ query, data?, options? }`.

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

- A select answers the rows; `update` and `delete` answer the number of affected rows (`0` when nothing matched);
  `insert` answers the inserted data.
- With only the `read` permission, a query that writes (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`) is
  refused with `403` before reaching the database.

```sh
curl -X POST http://localhost:8080/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", "data": {"id": 10248, "freight": 40}}'
```

```json
1
```

### plan

`POST /{schema}/plan` answers how the query is executed: the dialect, the source and the sentence of each part, without
running it. Body `{ query, options? }`.

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

### model

`POST /{schema}/model` answers the shape of the result: its properties and their types.

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

### parameters

`POST /{schema}/parameters` answers the variables the query uses, which go in `data`.

```json
[ { "name": "customerId", "type": "string" } ]
```

### constraints

`POST /{schema}/constraints` answers the constraints that apply to the entities of the query.

```json
{ "entity": "Orders", "constraints": [], "children": [ { "entity": "Orders.details", "constraints": [] } ] }
```

### metadata

`POST /{schema}/metadata` answers the analysed tree of the query: each sentence with its action (`select`, `insert`,
…), entity, columns, parameters and constraints.

```json
{ "classtype": "Sentence", "name": "select", "entity": "Orders", "columns": [ { "name": "id" } ], "parameters": [ { "name": "customerId", "type": "any" } ], "constraints": [] }
```

### script

`POST /{schema}/script` runs a [script](../usage/Script.md): several queries and logic in one transaction. Body
`{ script, data?, options? }`. It needs `scripts.enabled` (otherwise `403`) and the `script` permission; the limits of
`scripts` apply (`maxLength`, `timeoutMs`, `maxIterations`).

```sh
curl -X POST http://localhost:8080/script -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{
  "script": "order = orm.execute(\"Orders.filter(p => p.id == id)\", { id: id }); if (order.length() == 0) { throw { status: 404, message: \"order not found\" }; } order[0]",
  "data": { "id": 10248 }
}'
```

A script can choose the status of the answer with `throw { status, message }`.

### execute-queued

`POST /{schema}/execute-queued` runs a query in the background and sends its result to a Kafka topic, in chunks. It
answers at once `{ "queueId": "…" }`; the messages carry the keys `<queueId>-<chunk>`. Body
`{ topic, query, data?, chunk?, options? }`. It needs the `queue` permission (and `write` if the query writes) and an
`infrastructure.queue` in the schema's `lambdaORM.yaml`.

```sh
curl -X POST http://localhost:8080/execute-queued -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Countries.map(p => [p.iso3, p.name])", "topic": "countries", "chunk": 1000}'
```

The queue of a schema is configured in its `lambdaORM.yaml` (`config` is the [kafkajs](https://kafka.js.org/docs/configuration)
configuration), where consumers can also be declared:

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

Over the [WebSocket API](WebSocket.md), `query.executeQueued` with `notify: true` also tells the connection when the
execution ends.

## Schema methods

The model of the schema. They need `read`. The connections of the sources are never answered.

| Method | Route | Answers |
| --- | --- | --- |
| `GET` | `/{schema}/schema` | the version and the domain of the schema |
| `GET` | `/{schema}/schema/version` | the version of the schema |
| `GET` | `/{schema}/domain` | the domain: entities (properties, relations, keys, indexes, constraints) and enums |
| `GET` | `/{schema}/entities` | the entities |
| `GET` | `/{schema}/entities/{entity}` | one entity |
| `GET` | `/{schema}/enums` | the enums |
| `GET` | `/{schema}/enums/{enum}` | one enum |
| `GET` | `/{schema}/sources` | the sources, with their name and dialect |
| `GET` | `/{schema}/sources/{source}` | one source |
| `GET` | `/{schema}/mappings` | the mappings (entities to tables and columns) |
| `GET` | `/{schema}/mappings/{mapping}` | one mapping |
| `GET` | `/{schema}/mappings/{mapping}/{entity}` | the mapping of one entity |
| `GET` | `/{schema}/views` | the views |
| `GET` | `/{schema}/stages` | the stages, with their sources |
| `GET` | `/{schema}/stages/{stage}` | one stage |
| `GET` | `/{schema}/typings` | the domain as TypeScript declarations (`text/plain`), for an editor's autocompletion |

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

## Stage methods

| Method | Route | Answers | Permission |
| --- | --- | --- | --- |
| `GET` | `/{schema}/stages/{stage}/exists` | `{ "exists": true }` when the stage was created and its state file exists | `read` |
| `GET` | `/{schema}/stages/{stage}/export` | the rows of every entity of the stage | `read` |
| `POST` | `/{schema}/stages/{stage}/import` | imports rows (the body is an export) into the entities of the stage | `stageImport` |

```sh
curl http://localhost:8080/stages/default/export -H "X-Api-Key: $KEY" > data.json
curl -X POST http://localhost:8080/stages/default/import -H "X-Api-Key: $BACKEND_KEY" -H "Content-Type: application/json" -d @data.json
```

## Summary

| Operation | REST | [MCP tool](Mcp.md#tools) | [WebSocket method](WebSocket.md#methods) | Permission |
| --- | --- | --- | --- | --- |
| execute | `POST /execute` | `orm_execute` | `query.execute` | `read` (selects) / `write` |
| script | `POST /script` | `orm_execute_script` | `query.script` | `script` |
| execute queued | `POST /execute-queued` | `orm_execute_queued` | `query.executeQueued` | `queue` |
| plan | `POST /plan` | `orm_plan` | `query.plan` | `read` |
| metadata | `POST /metadata` | `orm_metadata` | `query.metadata` | `read` |
| model | `POST /model` | `orm_model` | `query.model` | `read` |
| parameters | `POST /parameters` | `orm_parameters` | `query.parameters` | `read` |
| constraints | `POST /constraints` | `orm_constraints` | `query.constraints` | `read` |
| schema | `GET /schema` | `schema_get` | `schema.schema` | `read` |
| schema version | `GET /schema/version` | `schema_version` | `schema.version` | `read` |
| domain | `GET /domain` | `schema_domain` | `schema.domain` | `read` |
| entities | `GET /entities[/{entity}]` | `schema_entities` | `schema.entities`, `schema.entity` | `read` |
| enums | `GET /enums[/{enum}]` | `schema_enums` | `schema.enums`, `schema.enum` | `read` |
| sources | `GET /sources[/{source}]` | `schema_sources` | `schema.sources`, `schema.source` | `read` |
| mappings | `GET /mappings[/{mapping}[/{entity}]]` | `schema_mappings` | `schema.mappings`, `schema.mapping`, `schema.entityMapping` | `read` |
| views | `GET /views` | `schema_views` | `schema.views` | `read` |
| stages | `GET /stages[/{stage}]` | `schema_stages` | `schema.stages`, `schema.stage` | `read` |
| typings | `GET /typings` | — | `schema.typings` | `read` |
| stage exists | `GET /stages/{stage}/exists` | `stage_exists` | `stage.exists` | `read` |
| stage export | `GET /stages/{stage}/export` | `stage_export` | `stage.export` | `read` |
| stage import | `POST /stages/{stage}/import` | `stage_import` | `stage.import` | `stageImport` |
| version | `GET /version` | `gateway_version` | `general.version` | — |
| health | `GET /health` | `gateway_health` | `general.health` | — |
| ping | `GET /ping` | — | `general.ping` | — |
