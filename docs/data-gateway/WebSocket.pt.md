# API WebSocket {#websocket-api}

O transporte `webSocket` oferece as operações da API REST sobre **uma única conexão JSON-RPC 2.0 persistente**, além de
**notificações** que o REST não pode oferecer: o fim de uma execução enfileirada e as mudanças de estado do esquema.

```yaml
transports:
  webSocket:
    port: 8083
```

A conexão é aberta na rota do esquema, `ws://localhost:8083/iot/v1` (`ws://localhost:8083/` para um único
esquema na raiz), e é autenticada no upgrade com os mesmos headers do REST. Uma conexão à raiz de um
gateway com vários esquemas tem apenas `general.*` e `gateway.schemas`.

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "query.execute", "params": { "query": "Products.filter(p => p.price > minPrice)", "data": { "minPrice": 50 } } }
← { "jsonrpc": "2.0", "id": 1, "result": [ { "id": 29, "name": "Thüringer Rostbratwurst", "price": 123.79 } ] }

→ { "jsonrpc": "2.0", "id": 2, "method": "query.script", "params": { "script": "1 + 1" } }
← { "jsonrpc": "2.0", "id": 2, "error": { "code": -32000, "message": "the credential \"reader\" does not have the \"script\" permission", "data": { "name": "ForbiddenError", "status": 403 } } }
```

Os `params` são o corpo (ou os parâmetros de rota) do método REST equivalente. Um erro traz em `data` o
`name` e o `status` HTTP que o REST teria respondido.

## Métodos {#methods}

| Método | Params | Equivalente REST |
| --- | --- | --- |
| `general.version` | — | `GET /version` |
| `general.health` | — | `GET /health` |
| `general.ping` | — | `GET /ping` |
| `gateway.schemas` | — (apenas na raiz) | `GET /schemas` |
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
| `stage.exists` | `stage` | `GET /stages/{stage}/exists` |
| `stage.export` | `stage` | `GET /stages/{stage}/export` |
| `stage.import` | `stage`, `data` | `POST /stages/{stage}/import` |

As [permissões](Security.md#permissions) são as mesmas do REST.

## Notificações {#notifications}

Mensagens do servidor sem `id`:

| Notificação | Quando | Params |
| --- | --- | --- |
| `queue.completed` | uma execução enfileirada com `query.executeQueued` e `notify: true` nesta conexão terminou | `queueId`, `ok: true`, `rows` (enviadas ao tópico) |
| `queue.failed` | essa execução falhou | `queueId`, `ok: false`, `error` |
| `schema.statusChanged` | o esquema da conexão passou para `error` / `restarting`, ou voltou para `ready` | `path`, `status`, `reason` |

```json
→ { "jsonrpc": "2.0", "id": 7, "method": "query.executeQueued", "params": { "topic": "countries", "query": "Countries.map(p => [p.iso3, p.name])", "chunk": 1000, "notify": true } }
← { "jsonrpc": "2.0", "id": 7, "result": { "queueId": "q-123" } }
← { "jsonrpc": "2.0", "method": "queue.completed", "params": { "queueId": "q-123", "ok": true, "rows": 250 } }
```

Se o esquema deixar de estar `ready`, as requisições respondem com um erro com `status: 503`; a conexão permanece aberta e volta a
funcionar quando o esquema se recupera.

O documento AsyncAPI do transporte está em `GET /asyncapi` (e `/asyncapi.json`). A partir do Node, o
[cliente](Clients.md) usa este transporte com uma URL `ws://`.
