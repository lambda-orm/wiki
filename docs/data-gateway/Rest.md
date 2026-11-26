# REST API

The `http` transport ([Transports](Transports.md#http)) exposes every operation of λORM on a schema as REST, with JSON
in and out: the way in for an application in any language, or for a tool that speaks HTTP. The gateway serves its
OpenAPI 3 document at `/openapi.json` and Swagger UI, to read and try every method, at `/doc` (and `/api-docs`).

## Routes

The examples use a gateway at `http://localhost:8080` with an API key. Each schema's methods are under its route:

| Gateway | Schema `iot/v1` | Only schema at the root |
| --- | --- | --- |
| `http://localhost:8080` | `http://localhost:8080/iot/v1/execute` | `http://localhost:8080/execute` |

With `transports.http.basePath: /data-gateway`, every route is under it: `/data-gateway/iot/v1/execute`.

- Every request needs the credential, except `/ping`, `/health`, `/metrics` and `/version` (at the root and under
  each schema), `/schemas`, `/transports` and the documentation (`/openapi.json`, `/doc`, `/api-docs`). How it is sent
  depends on the [authentication](Security.md):
  `X-Api-Key: <key>`, `Authorization: Bearer <token>` or `Authorization: Basic <base64>`.
- `?format=beautiful` indents the JSON of the answer.
- `data` (the parameters of a query) and `options` (for example `{ "stage": "default" }`) are JSON objects; JSON text
  (`"data": "{\"id\": 10}"`) is also accepted.
- An error answers a status and `{ "error", "code"?, "message" }` ([Errors](Security.md#errors)).
- A query with a name the schema doesn't have answers `400` with the closest names, in the message (`nam is neither a
  property nor a relation of Areas; did you mean name?`) and as data: `"suggestions": [{ "name": "nam", "didYouMean": ["name"] }]`.
- A route that doesn't exist answers `404` in JSON, with the closest routes in the message.

## Gateway methods

| Method | Route | Answers | Credential |
| --- | --- | --- | --- |
| `GET` | `/ping` | `{ "message": "pong", "time" }` | no |
| `GET` | `/health` | `{ "message", "time", "uptime", "schemas" }`: `OK` when every schema is `ready`, `DEGRADED` if not; always `200` while the gateway answers | no |
| `GET` | `/metrics` | the metrics of every worker, Prometheus text | no |
| `GET` | `/version` | `{ "version" }`, the version of the gateway | no |
| `GET` | `/schemas` | each schema with its state | no |
| `GET` | `/transports` | the transports of the gateway: port, base path, how a schema is reached, its document ([Transports](Transports.md#http)) | no |
| `GET` | `/openapi.json` | the OpenAPI 3 document (with `swagger.enabled`) | no |

With a single schema at the root, its own routes (below) take the place of `/ping`, `/health` and `/version`, and
`/whoami` is at the root too.

```sh
curl http://localhost:8080/schemas
```

```json
[
  { "path": "iot/v1", "status": "ready", "since": "2026-11-18T13:35:56.407Z", "restarts": 0 },
  { "path": "iot/v2", "status": "error", "reason": "connect ECONNREFUSED 10.0.0.5:5432", "since": "…", "restarts": 3 }
]
```

The states are `starting`, `ready`, `error` and `restarting`; `reason` says why a schema is not `ready`, and `pending`
why a new version of its workspace didn't start while the last one keeps serving
([Administration](Admin.md#workspaces-in-the-volume)).

## State of a schema

Under each schema's route (`/iot/v1/…`), these answer only about that schema:

| Method | Route | Answers |
| --- | --- | --- |
| `GET` | `/{schema}/ping` | `200` if the schema is `ready`, `503` if not |
| `GET` | `/{schema}/health` | `{ "message": "OK", "time", "uptime" }`; `503` if the schema is not `ready` |
| `GET` | `/{schema}/metrics` | the metrics of that schema |
| `GET` | `/{schema}/version` | `{ "version" }`, the version of the gateway (the version of the schema is `GET /{schema}/schema/version`) |
| `GET` | `/{schema}/whoami` | the name and permissions of the credential with the authentication of that schema, and whether it has scripts enabled (needs the credential) |

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
- **Since 4.2.0**, the answer of a read has an `ETag` (and `Cache-Control: private, no-cache`); a request with the
  same `If-None-Match` is answered `304` without a body. Also `POST /queries/{name}`. With the
  [cache](Configuration.md#cache), a repeated read doesn't reach the database.
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
answers at once the id of the execution, as a JSON string (`"…"`); the messages carry the keys `<queueId>-<chunk>`. Body
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

### Named queries {#named-queries}

Since data-gateway 4.1.0. The queries of the application declared in the schema with a name
([`application.queries`](../usage/TypedQueries.md)) are served by their name: a client (or an agent) uses a curated
query instead of writing its own, and never sees its text.

```yaml
# lambdaORM.yaml
application:
  queries:
    - name: customersOf
      description: the customers of a country, by their id
      query: 'Customers.filter(p => p.country == country).map(p => [p.id, p.city]).sort(p => p.id)'
```

```sh
curl http://localhost:8080/queries -H "X-Api-Key: $KEY"
# [{ "name": "customersOf", "description": "…", "parameters": [{ "name": "country", "type": "string" }],
#    "model": [{ "name": "id", "type": "string" }, { "name": "city", "type": "string" }], "writes": false }]
curl -X POST http://localhost:8080/queries/customersOf -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{ "data": { "country": "Germany" } }'
```

- In the [view of who calls](Security.md#views): a query that uses what its view excludes is not listed to it, and its
  rows are those of its view.
- It runs as `execute`: a query that writes needs `write`, and the [audit](Security.md#audit) says its `name`.
- Its limits, besides those of the gateway: `orm.schemas[].queries: { customersOf: { maxRows: 100, timeout: 5s } }`
  in the [configuration](Configuration.md#reference); more rows is `422 TooManyRowsError`, longer is `504`.
- Over [WebSocket](WebSocket.md#methods), `queries.list` and `queries.execute`; over [MCP](Mcp.md#named-queries), a
  tool `query_<name>` each.

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
| `GET` | `/{schema}/search?q={text}` | the entities, properties and relations whose name contains the text, compact ([large schemas](#large-schemas)) |
| `GET` | `/{schema}/describe?entities={A,B}` | some entities in two lines each, and the names it doesn't know with the closest ones |

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

### Large schemas

With hundreds of entities, the whole domain is too much to read to write one query. `/search` finds names by part of
them (`Products.cat` searches only in Products; with no match, the closest names) and `/describe` gives some entities
in two lines each. MCP has the same as [`schema_search` and `schema_describe`](Mcp.md#large-schemas).

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
| [named queries](#named-queries) (4.1.0) | `GET /queries`, `POST /queries/{name}` | `query_<name>` | `queries.list`, `queries.execute` | `read` / `write` |
| [subscribe](Changes.md#subscriptions) (4.2.0) | `GET /subscribe` (SSE) | — | `subscribe.entity`, `subscribe.query`, `unsubscribe` | `read` |
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
| search | `GET /search?q=` | `schema_search` | `schema.search` | `read` |
| describe | `GET /describe?entities=` | `schema_describe` | `schema.describe` | `read` |
| stage exists | `GET /stages/{stage}/exists` | `stage_exists` | `stage.exists` | `read` |
| stage export | `GET /stages/{stage}/export` | `stage_export` | `stage.export` | `read` |
| stage import | `POST /stages/{stage}/import` | `stage_import` | `stage.import` | `stageImport` |
| version | `GET /version` | `gateway_version` | `general.version` | — |
| health | `GET /health` | `gateway_health` | `general.health` | — |
| ping | `GET /ping` | — | `general.ping` | — |

## Administration {#administration}

On the [`management` transport](Transports.md#management) ([Administration](Admin.md)), under `/admin`. A workspace is named by its route in one segment (`iot%2Fv1`; `~` the root). Every read answers its version (`ETag`); every write says the one it changes (`If-Match`, or the element as it was read): another version is a `412` with what there is now.

| Method | Route | | Permission |
| --- | --- | --- | --- |
| `GET` | `/admin` | `{ enabled, can }`: what this credential can do | — |
| `GET` / `POST` | `/admin/workspaces` | the workspaces / a new one (`{ path, template?, copyOf?, name?, description? }`) | `schemaRead` / `schemaAdmin` |
| `DELETE` | `/admin/workspaces/{route}?confirm={route}` | to `.trash` | `schemaAdmin` |
| `GET` / `PUT` / `PATCH` | `/admin/workspaces/{route}/schema` | the `lambdaORM.yaml`; replaced; one element changed (`{ op, at, value?, to?, expected? }`) | `schemaRead` / `schemaWrite` |
| `POST` | `/admin/workspaces/{route}/references` | who uses an element | `schemaRead` |
| `POST` | `/admin/validate` | `{ text }` → `{ valid, issues }` | `schemaRead` |
| `GET` / `PUT` | `/admin/workspaces/{route}/variables` | the variables of the connections (never their value) / set or removed (`{ set?, remove? }`) | `schemaRead` / `schemaAdmin` |
| `GET` | `/admin/workspaces/{route}/files?dir=`, `…/files/content?path=` | the files of `data/` and `src/` / the text of one (never `.env`, `orm_state/` or a hidden file) | `schemaRead` |
| `GET` / `POST` | `/admin/expressions`, `/admin/expressions/check` | the language of the expressions (3xpr) / one expression checked (`{ expression, context? }`), for the condition of a source of a stage | `schemaRead` |
| `GET` / `PUT` | `/admin/session` | where the IDE of this credential was (its tabs, what was unfolded) / saved | any |
| `GET` / `PUT` / `POST` | `/admin/workbench`, `/admin/workbench/remove` | what is saved / saved / removed | `read` / `workbenchWrite` |
| `GET` | `/admin/workspaces/{route}/commands` | the stages and what may be run | `read` |
| `POST` | `/admin/workspaces/{route}/commands/{command}/preview` | what it will do | the command's |
| `POST` | `/admin/workspaces/{route}/commands/{command}` | runs it (`{ stage?, previewId?, force?, save? }`) → a job | the command's |
| `GET` | `/admin/workspaces/{route}/jobs[/{id}]` | the last jobs / one with its result | `read` |
| `POST` / `GET` | `/admin/workspaces/{route}/build`, `…/build.zip` | the code of the domain in `src/` / as a zip | `build` |

Since 4.1.0: `GET /admin/workspaces/{route}/history` (the changes of the schema,
with who and the diff; `schemaRead`), `GET /admin/workspaces/{route}/stages/{stage}/routing` (the source of each entity
of a stage; `schemaRead`), `GET …/files.zip?dir=` (a folder of `data/` or `src/` as a zip; `schemaRead`) and
`DELETE …/files?dir=src/…` (removes a generated code; `build`).
