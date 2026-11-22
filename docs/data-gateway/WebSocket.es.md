# API WebSocket {#websocket-api}

El transporte `webSocket` ofrece las operaciones de la API REST sobre **una única conexión persistente JSON-RPC 2.0**, más
**notificaciones** que REST no puede dar: el fin de una ejecución encolada y los cambios de estado del esquema.

```yaml
transports:
  webSocket:
    port: 8083
```

La conexión se abre contra la ruta del esquema, `ws://localhost:8083/iot/v1` (`ws://localhost:8083/` para un único
esquema en la raíz), y se autentica en el upgrade con los mismos headers que REST. Una conexión a la raíz de un
gateway con varios esquemas solo tiene `general.*` y `gateway.schemas`.

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
| `query.executeQueued` | `topic`, `query`, `data?`, `chunk?`, `options?`, `notify?` | `POST /execute-queued` |
| `query.plan` | `query`, `options?` | `POST /plan` |
| `query.metadata` | `query` | `POST /metadata` |
| `query.model` | `query` | `POST /model` |
| `query.parameters` | `query` | `POST /parameters` |
| `query.constraints` | `query` | `POST /constraints` |
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

Los [permisos](Security.md#permissions) son los mismos que en REST.

## Notificaciones {#notifications}

Mensajes del servidor sin `id`:

| Notificación | Cuándo | Params |
| --- | --- | --- |
| `queue.completed` | terminó una ejecución encolada con `query.executeQueued` y `notify: true` en esta conexión | `queueId`, `ok: true`, `rows` (enviadas al topic) |
| `queue.failed` | esa ejecución falló | `queueId`, `ok: false`, `error` |
| `schema.statusChanged` | el esquema de la conexión pasó a `error` / `restarting`, o volvió a `ready` | `path`, `status`, `reason`, `pending` |
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
