# WebSocket API

The `webSocket` transport offers the operations of the REST API over **one persistent JSON-RPC 2.0 connection**, plus
**notifications** that REST cannot give: the end of a queued execution and the changes of state of the schema.

```yaml
transports:
  webSocket:
    port: 8083
```

The connection is opened against the schema's route, `ws://localhost:8083/iot/v1` (`ws://localhost:8083/` for a single
schema at the root), and is authenticated in the upgrade with the same headers as REST. A connection to the root of a
gateway with several schemas has only `general.*` and `gateway.schemas`.

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "query.execute", "params": { "query": "Products.filter(p => p.price > minPrice)", "data": { "minPrice": 50 } } }
← { "jsonrpc": "2.0", "id": 1, "result": [ { "id": 29, "name": "Thüringer Rostbratwurst", "price": 123.79 } ] }

→ { "jsonrpc": "2.0", "id": 2, "method": "query.script", "params": { "script": "1 + 1" } }
← { "jsonrpc": "2.0", "id": 2, "error": { "code": -32000, "message": "the credential \"reader\" does not have the \"script\" permission", "data": { "name": "ForbiddenError", "status": 403 } } }
```

The `params` are the body (or the route parameters) of the equivalent REST method. An error carries in `data` the
`name` and the HTTP `status` that REST would have answered. For a name of the query that doesn't exist, `data.suggestions` has the closest ones.

## Methods

| Method | Params | REST equivalent |
| --- | --- | --- |
| `general.version` | — | `GET /version` |
| `general.health` | — | `GET /health` |
| `general.ping` | — | `GET /ping` |
| `gateway.schemas` | — (only at the root) | `GET /schemas` |
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

The [permissions](Security.md#permissions) are the same as in REST.

## Notifications

Messages from the server without an `id`:

| Notification | When | Params |
| --- | --- | --- |
| `queue.completed` | an execution queued with `query.executeQueued` and `notify: true` on this connection ended | `queueId`, `ok: true`, `rows` (sent to the topic) |
| `queue.failed` | that execution failed | `queueId`, `ok: false`, `error` |
| `schema.statusChanged` | the schema of the connection went to `error` / `restarting`, or back to `ready` | `path`, `status`, `reason` |

```json
→ { "jsonrpc": "2.0", "id": 7, "method": "query.executeQueued", "params": { "topic": "countries", "query": "Countries.map(p => [p.iso3, p.name])", "chunk": 1000, "notify": true } }
← { "jsonrpc": "2.0", "id": 7, "result": { "queueId": "q-123" } }
← { "jsonrpc": "2.0", "method": "queue.completed", "params": { "queueId": "q-123", "ok": true, "rows": 250 } }
```

If the schema stops being `ready`, the requests answer an error with `status: 503`; the connection stays open and works
again when the schema recovers.

The AsyncAPI document of the transport is at `GET /asyncapi` (and `/asyncapi.json`). From Node, the
[client](Clients.md) uses this transport with a `ws://` URL.
