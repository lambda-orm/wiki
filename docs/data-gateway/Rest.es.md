# API REST {#rest-api}

El transporte `http` ([Transportes](Transports.md#http)) expone todas las operaciones de λORM sobre un esquema como REST, con JSON
de entrada y de salida. El gateway sirve el documento OpenAPI 3 en `/doc` (Swagger UI) y `/api-docs`.

## Rutas {#routes}

Los ejemplos usan un gateway en `http://localhost:8080` con una API key. Los métodos de cada esquema están bajo su ruta:

| Gateway | Esquema `iot/v1` | Único esquema en la raíz |
| --- | --- | --- |
| `http://localhost:8080` | `http://localhost:8080/iot/v1/execute` | `http://localhost:8080/execute` |

Con `transports.http.basePath: /data-gateway`, todas las rutas quedan bajo ella: `/data-gateway/iot/v1/execute`.

- Todas las peticiones necesitan la credencial, excepto `/ping`, `/health` y `/metrics` (en la raíz y bajo cada esquema),
  `/schemas`, `/version`, `/doc` y la UI. Cómo se envía depende de la [autenticación](Security.md):
  `X-Api-Key: <key>`, `Authorization: Bearer <token>` o `Authorization: Basic <base64>`.
- `?format=beautiful` indenta el JSON de la respuesta.
- `data` (los parámetros de una consulta) y `options` (por ejemplo `{ "stage": "default" }`) son objetos JSON; también se acepta
  texto JSON (`"data": "{\"id\": 10}"`).
- Un error responde un status y `{ "error", "code"?, "message" }` ([Errores](Security.md#errors)).
- Una consulta con un nombre que el esquema no tiene responde `400` con los nombres más cercanos, en el mensaje (`nam is
  neither a property nor a relation of Areas; did you mean name?`) y como datos: `"suggestions": [{ "name": "nam", "didYouMean": ["name"] }]`.
- Una ruta que no existe responde `404` en JSON, con las rutas más cercanas en el mensaje.

## Métodos del gateway {#gateway-methods}

| Método | Ruta | Responde | Credencial |
| --- | --- | --- | --- |
| `GET` | `/ping` | `{ "message": "pong", "time" }` | no |
| `GET` | `/health` | `200` mientras algún esquema esté `ready`, `503` si ninguno lo está | no |
| `GET` | `/metrics` | las métricas de todos los workers, en texto Prometheus | no |
| `GET` | `/version` | la versión del gateway | no |
| `GET` | `/schemas` | cada esquema con su estado | no |
| `GET` | `/whoami` | el nombre y los permisos de la credencial | sí |

```sh
curl http://localhost:8080/schemas
```

```json
[
  { "path": "iot/v1", "status": "ready", "since": "2026-11-18T13:35:56.407Z", "restarts": 0 },
  { "path": "iot/v2", "status": "error", "reason": "connect ECONNREFUSED 10.0.0.5:5432", "since": "…", "restarts": 3 }
]
```

Los estados son `starting`, `ready`, `error` y `restarting`.

## Estado de un esquema {#state-of-a-schema}

Bajo la ruta de cada esquema (`/iot/v1/…`), estos métodos responden solo sobre ese esquema:

| Método | Ruta | Responde |
| --- | --- | --- |
| `GET` | `/{schema}/ping` | `200` si el esquema está `ready`, `503` si no |
| `GET` | `/{schema}/health` | el estado del esquema; `503` si no está `ready` |
| `GET` | `/{schema}/metrics` | las métricas de ese esquema |
| `GET` | `/{schema}/version` | las versiones del gateway y del esquema |
| `GET` | `/{schema}/whoami` | el nombre y los permisos de la credencial con la autenticación de ese esquema, y si tiene los scripts habilitados |

```sh
curl http://localhost:8080/iot/v1/whoami -H "X-Api-Key: $KEY"
```

```json
{ "name": "reader", "permissions": ["read"], "schema": "iot/v1", "scripts": true }
```

El secreto de la credencial nunca se devuelve.

## Métodos de consulta {#query-methods}

### execute {#execute}

`POST /{schema}/execute` ejecuta una consulta. El cuerpo es `{ query, data?, options? }`.

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

- Un select responde las filas; `update` y `delete` responden el número de filas afectadas (`0` cuando ninguna coincidió);
  `insert` responde los datos insertados.
- Con solo el permiso `read`, una consulta que escribe (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`) se
  rechaza con `403` antes de llegar a la base de datos.

```sh
curl -X POST http://localhost:8080/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", "data": {"id": 10248, "freight": 40}}'
```

```json
1
```

### plan {#plan}

`POST /{schema}/plan` responde cómo se ejecuta la consulta: el dialecto, la fuente y la sentencia de cada parte, sin
ejecutarla. Cuerpo `{ query, options? }`.

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

`POST /{schema}/model` responde la forma del resultado: sus propiedades y sus tipos.

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

`POST /{schema}/parameters` responde las variables que usa la consulta, que van en `data`.

```json
[ { "name": "customerId", "type": "string" } ]
```

### constraints {#constraints}

`POST /{schema}/constraints` responde las restricciones que se aplican a las entidades de la consulta.

```json
{ "entity": "Orders", "constraints": [], "children": [ { "entity": "Orders.details", "constraints": [] } ] }
```

### metadata {#metadata}

`POST /{schema}/metadata` responde el árbol analizado de la consulta: cada sentencia con su acción (`select`, `insert`,
…), entidad, columnas, parámetros y restricciones.

```json
{ "classtype": "Sentence", "name": "select", "entity": "Orders", "columns": [ { "name": "id" } ], "parameters": [ { "name": "customerId", "type": "any" } ], "constraints": [] }
```

### script {#script}

`POST /{schema}/script` ejecuta un [script](../usage/Script.md): varias consultas y lógica en una sola transacción. Cuerpo
`{ script, data?, options? }`. Necesita `scripts.enabled` (si no, `403`) y el permiso `script`; se aplican los límites de
`scripts` (`maxLength`, `timeoutMs`, `maxIterations`).

```sh
curl -X POST http://localhost:8080/script -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{
  "script": "order = orm.execute(\"Orders.filter(p => p.id == id)\", { id: id }); if (order.length() == 0) { throw { status: 404, message: \"order not found\" }; } order[0]",
  "data": { "id": 10248 }
}'
```

Un script puede elegir el status de la respuesta con `throw { status, message }`.

### execute-queued {#execute-queued}

`POST /{schema}/execute-queued` ejecuta una consulta en segundo plano y envía su resultado a un topic de Kafka, en bloques.
Responde de inmediato `{ "queueId": "…" }`; los mensajes llevan las claves `<queueId>-<chunk>`. Cuerpo
`{ topic, query, data?, chunk?, options? }`. Necesita el permiso `queue` (y `write` si la consulta escribe) y una
`infrastructure.queue` en el `lambdaORM.yaml` del esquema.

```sh
curl -X POST http://localhost:8080/execute-queued -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Countries.map(p => [p.iso3, p.name])", "topic": "countries", "chunk": 1000}'
```

La cola de un esquema se configura en su `lambdaORM.yaml` (`config` es la configuración de [kafkajs](https://kafka.js.org/docs/configuration)),
donde también se pueden declarar consumidores:

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

A través de la [API WebSocket](WebSocket.md), `query.executeQueued` con `notify: true` además avisa a la conexión cuando la
ejecución termina.

## Métodos del esquema {#schema-methods}

El modelo del esquema. Necesitan `read`. Las conexiones de las fuentes nunca se devuelven.

| Método | Ruta | Responde |
| --- | --- | --- |
| `GET` | `/{schema}/schema` | la versión y el dominio del esquema |
| `GET` | `/{schema}/schema/version` | la versión del esquema |
| `GET` | `/{schema}/domain` | el dominio: entidades (propiedades, relaciones, claves, índices, restricciones) y enums |
| `GET` | `/{schema}/entities` | las entidades |
| `GET` | `/{schema}/entities/{entity}` | una entidad |
| `GET` | `/{schema}/enums` | los enums |
| `GET` | `/{schema}/enums/{enum}` | un enum |
| `GET` | `/{schema}/sources` | las fuentes, con su nombre y dialecto |
| `GET` | `/{schema}/sources/{source}` | una fuente |
| `GET` | `/{schema}/mappings` | los mappings (entidades a tablas y columnas) |
| `GET` | `/{schema}/mappings/{mapping}` | un mapping |
| `GET` | `/{schema}/mappings/{mapping}/{entity}` | el mapping de una entidad |
| `GET` | `/{schema}/views` | las vistas |
| `GET` | `/{schema}/stages` | los stages, con sus fuentes |
| `GET` | `/{schema}/stages/{stage}` | un stage |
| `GET` | `/{schema}/typings` | el dominio como declaraciones de TypeScript (`text/plain`), para el autocompletado de un editor |
| `GET` | `/{schema}/search?q={texto}` | las entidades, propiedades y relaciones cuyo nombre contiene el texto, compacto ([esquemas grandes](#large-schemas)) |
| `GET` | `/{schema}/describe?entities={A,B}` | algunas entidades en dos líneas cada una, y los nombres que no conoce con los más cercanos |

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

### Esquemas grandes {#large-schemas}

Con cientos de entidades, el dominio entero es demasiado para leer antes de escribir una consulta. `/search` encuentra
nombres por una parte de ellos (`Products.cat` busca solo en Products; sin coincidencias, los nombres más cercanos) y
`/describe` da algunas entidades en dos líneas cada una. MCP tiene lo mismo en [`schema_search` y `schema_describe`](Mcp.md#large-schemas).

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

## Métodos de stage {#stage-methods}

| Método | Ruta | Responde | Permiso |
| --- | --- | --- | --- |
| `GET` | `/{schema}/stages/{stage}/exists` | `{ "exists": true }` cuando el stage fue creado y existe su archivo de estado | `read` |
| `GET` | `/{schema}/stages/{stage}/export` | las filas de todas las entidades del stage | `read` |
| `POST` | `/{schema}/stages/{stage}/import` | importa filas (el cuerpo es una exportación) en las entidades del stage | `stageImport` |

```sh
curl http://localhost:8080/stages/default/export -H "X-Api-Key: $KEY" > data.json
curl -X POST http://localhost:8080/stages/default/import -H "X-Api-Key: $BACKEND_KEY" -H "Content-Type: application/json" -d @data.json
```

## Resumen {#summary}

| Operación | REST | [Herramienta MCP](Mcp.md#tools) | [Método WebSocket](WebSocket.md#methods) | Permiso |
| --- | --- | --- | --- | --- |
| execute | `POST /execute` | `orm_execute` | `query.execute` | `read` (selects) / `write` |
| script | `POST /script` | `orm_execute_script` | `query.script` | `script` |
| ejecución encolada | `POST /execute-queued` | `orm_execute_queued` | `query.executeQueued` | `queue` |
| plan | `POST /plan` | `orm_plan` | `query.plan` | `read` |
| metadata | `POST /metadata` | `orm_metadata` | `query.metadata` | `read` |
| model | `POST /model` | `orm_model` | `query.model` | `read` |
| parameters | `POST /parameters` | `orm_parameters` | `query.parameters` | `read` |
| constraints | `POST /constraints` | `orm_constraints` | `query.constraints` | `read` |
| esquema | `GET /schema` | `schema_get` | `schema.schema` | `read` |
| versión del esquema | `GET /schema/version` | `schema_version` | `schema.version` | `read` |
| dominio | `GET /domain` | `schema_domain` | `schema.domain` | `read` |
| entidades | `GET /entities[/{entity}]` | `schema_entities` | `schema.entities`, `schema.entity` | `read` |
| enums | `GET /enums[/{enum}]` | `schema_enums` | `schema.enums`, `schema.enum` | `read` |
| fuentes | `GET /sources[/{source}]` | `schema_sources` | `schema.sources`, `schema.source` | `read` |
| mappings | `GET /mappings[/{mapping}[/{entity}]]` | `schema_mappings` | `schema.mappings`, `schema.mapping`, `schema.entityMapping` | `read` |
| vistas | `GET /views` | `schema_views` | `schema.views` | `read` |
| stages | `GET /stages[/{stage}]` | `schema_stages` | `schema.stages`, `schema.stage` | `read` |
| typings | `GET /typings` | — | `schema.typings` | `read` |
| search | `GET /search?q=` | `schema_search` | `schema.search` | `read` |
| describe | `GET /describe?entities=` | `schema_describe` | `schema.describe` | `read` |
| existencia de stage | `GET /stages/{stage}/exists` | `stage_exists` | `stage.exists` | `read` |
| exportación de stage | `GET /stages/{stage}/export` | `stage_export` | `stage.export` | `read` |
| importación de stage | `POST /stages/{stage}/import` | `stage_import` | `stage.import` | `stageImport` |
| versión | `GET /version` | `gateway_version` | `general.version` | — |
| salud | `GET /health` | `gateway_health` | `general.health` | — |
| ping | `GET /ping` | — | `general.ping` | — |
