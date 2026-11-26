# API WebSocket {#websocket-api}

El transporte `webSocket` ofrece las operaciones de la API REST sobre **una única conexión persistente JSON-RPC 2.0**, más
**notificaciones** que REST no puede dar: el fin de una ejecución encolada, los cambios de estado del esquema y de su
workspace, y (4.2.0) los [cambios de los datos](Changes.md#subscriptions) a los que se suscribió. Úsalo para un proceso que envía muchas consultas, o que quiere saber cuándo cambia algo.

```yaml
transports:
  webSocket:
    port: 8083
```

La conexión se abre contra la ruta del esquema, `ws://localhost:8083/iot/v1` (`ws://localhost:8083/` para un único
esquema en la raíz), y se autentica en el upgrade con los mismos headers que REST (un navegador, que no puede enviar
headers, los envía en los subprotocolos: [Transportes](Transports.md#websocket)). Una conexión a la raíz de un gateway
con varios esquemas solo tiene `general.*` y `gateway.schemas`. Cuando se elimina su esquema, una conexión se cierra con
el código `4404`.

```ts
import WebSocket from 'ws'

const ws = new WebSocket('ws://localhost:8083/', { headers: { 'X-Api-Key': process.env.KEY } })
ws.on('open', () => ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'query.execute', params: { query: 'Categories.map(p => p.name)' } })))
ws.on('message', message => console.log(JSON.parse(message.toString())))
```

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "query.execute", "params": { "query": "Products.filter(p => p.price > minPrice)", "data": { "minPrice": 50 } } }
← { "jsonrpc": "2.0", "id": 1, "result": [ { "id": 29, "name": "Thüringer Rostbratwurst", "price": 123.79 } ] }

→ { "jsonrpc": "2.0", "id": 2, "method": "query.script", "params": { "script": "1 + 1" } }
← { "jsonrpc": "2.0", "id": 2, "error": { "code": -32000, "message": "the credential \"reader\" does not have the \"script\" permission", "data": { "name": "ForbiddenError", "status": 403 } } }
```

Los `params` son el cuerpo (o los parámetros de ruta) del método REST equivalente. Un error lleva en `data` el
`name` y el `status` HTTP que habría respondido REST. Para un nombre de la consulta que no existe, `data.suggestions` tiene los más cercanos.

## Métodos {#methods}

| Método | Params | Equivalente REST |
| --- | --- | --- |
| `general.version` | — | `GET /version` |
| `general.health` | — | `GET /health` |
| `general.ping` | — | `GET /ping` |
| `gateway.schemas` | — (solo en la raíz) | `GET /schemas` |
| `query.execute` | `query`, `data?`, `options?` | `POST /execute` |
| `query.script` | `script`, `data?`, `options?` | `POST /script` |
| `queries.list` (4.1.0) | — | `GET /queries` |
| `queries.execute` (4.1.0) | `name`, `data?`, `options?` | `POST /queries/{name}` |
| `approvals.status` (4.3.0) | `id` | `GET /approvals/{id}` ([escrituras que esperan](Security.md#approvals)) |
| `files.list` / `files.upload` / `files.url` (4.3.0) | — / `entity`, `property`, `name`, `type`, `size` / `entity`, `property`, `key` | `GET /files…` ([archivos](Rest.md#files)) |
| `query.executeQueued` | `topic`, `query`, `data?`, `chunk?`, `options?`, `notify?` | `POST /execute-queued` |
| `query.plan` | `query`, `options?` | `POST /plan` |
| `query.metadata` | `query`, `options?` | `POST /metadata` |
| `query.model` | `query`, `options?` | `POST /model` |
| `query.parameters` | `query`, `options?` | `POST /parameters` |
| `query.constraints` | `query`, `options?` | `POST /constraints` |
| `schema.schema` | — | `GET /schema` |
| `schema.version` | — | `GET /schema/version` |
| `schema.domain` | — | `GET /domain` |
| `schema.entities` / `schema.entity` | — / `entity` | `GET /entities[/{entity}]` |
| `schema.enums` / `schema.enum` | — / `enum` | `GET /enums[/{enum}]` |
| `schema.sources` / `schema.source` | — / `source` | `GET /sources[/{source}]` |
| `schema.mappings` / `schema.mapping` / `schema.entityMapping` | — / `mapping` / `mapping`, `entity` | `GET /mappings…` |
| `schema.views` | — | `GET /views` |
| `schema.stages` / `schema.stage` | — / `stage` | `GET /stages[/{stage}]` |
| `schema.typings` | — | `GET /typings` |
| `schema.search` / `schema.describe` | `text` / `entities` | `GET /search`, `GET /describe` |
| `stage.exists` | `stage` | `GET /stages/{stage}/exists` |
| `stage.export` | `stage` | `GET /stages/{stage}/export` |
| `stage.import` | `stage`, `data` | `POST /stages/{stage}/import` |
| `subscribe.entity` (4.2.0) | `entity` | `GET /subscribe?entity=` ([Cambios de los datos](Changes.md#subscriptions)) |
| `subscribe.query` (4.2.0) | `query` o `name`, `data?` | `GET /subscribe?query=` / `?name=` |
| `unsubscribe` (4.2.0) | `subscription` | — |

Los [permisos](Security.md#permissions) son los mismos que en REST.

## Notificaciones {#notifications}

Mensajes del servidor sin `id`:

| Notificación | Cuándo | Params |
| --- | --- | --- |
| `queue.completed` | terminó una ejecución encolada con `query.executeQueued` y `notify: true` en esta conexión | `queueId`, `ok: true`, `rows` (enviadas al topic) |
| `queue.failed` | esa ejecución falló | `queueId`, `ok: false`, `error` |
| `schema.statusChanged` | el esquema de la conexión pasó a `error` / `restarting`, o volvió a `ready` | `path`, `status`, `reason`, `pending` |
| `data.changed` (4.2.0) | una escritura de una entidad de un `subscribe.entity` | `subscription`, `entity`, `action`, `keys?`, `count?` |
| `query.changed` (4.2.0) | cambió el resultado de un `subscribe.query` | `subscription`, `result` |
| `subscription.failed` (4.2.0) | la consulta de una suscripción ya no puede correr | `subscription`, `error`, `message` |
| `workspace.changed` | cambió algo en el workspace del esquema (una conexión a la raíz: en cualquiera): `added`, `removed`, `schema`, `env` o `files` | `path`, `kind`, `files`, `at` |

```json
→ { "jsonrpc": "2.0", "id": 7, "method": "query.executeQueued", "params": { "topic": "countries", "query": "Countries.map(p => [p.iso3, p.name])", "chunk": 1000, "notify": true } }
← { "jsonrpc": "2.0", "id": 7, "result": { "queueId": "q-123" } }
← { "jsonrpc": "2.0", "method": "queue.completed", "params": { "queueId": "q-123", "ok": true, "rows": 250 } }
```

Si el esquema deja de estar `ready`, las peticiones responden un error con `status: 503`; la conexión sigue abierta y vuelve a
funcionar cuando el esquema se recupera.

El documento AsyncAPI del transporte está en `GET /asyncapi` (y `/asyncapi.json`). Desde Node, el
[cliente](Clients.md) usa este transporte con una URL `ws://`.
