# WebSocket API {#websocket-api}

Der Transport `webSocket` bietet die Operationen der REST API über **eine einzige dauerhafte JSON-RPC-2.0-Verbindung**,
dazu **Benachrichtigungen**, die REST nicht bieten kann: das Ende einer Ausführung in der Warteschlange und die
Änderungen des Zustands des Schemas und seines Workspaces, und (4.2.0) die [Datenänderungen](Changes.md#subscriptions), die er abonniert hat. Verwenden Sie ihn für einen Prozess, der viele Abfragen
sendet oder wissen möchte, wann sich etwas ändert.

```yaml
transports:
  webSocket:
    port: 8083
```

Die Verbindung wird zur Route des Schemas geöffnet, `ws://localhost:8083/iot/v1` (`ws://localhost:8083/` für ein
einzelnes Schema an der Wurzel), und im Upgrade mit denselben Headern wie bei REST authentifiziert (ein Browser, der
keine Header senden kann, sendet sie in den Subprotokollen: [Transporte](Transports.md#websocket)). Eine Verbindung zur
Wurzel eines Gateways mit mehreren Schemas bietet nur `general.*` und `gateway.schemas`. Wird ihr Schema entfernt, wird
eine Verbindung mit dem Code `4404` geschlossen.

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

Die `params` entsprechen dem Body (oder den Routenparametern) der entsprechenden REST-Methode. Ein Fehler enthält in
`data` den `name` und den HTTP-`status`, den REST geliefert hätte. Für einen Namen der Abfrage, den es nicht gibt, enthält `data.suggestions` die nächstliegenden.

## Methoden {#methods}

| Methode | Parameter | REST-Entsprechung |
| --- | --- | --- |
| `general.version` | — | `GET /version` |
| `general.health` | — | `GET /health` |
| `general.ping` | — | `GET /ping` |
| `gateway.schemas` | — (nur an der Wurzel) | `GET /schemas` |
| `query.execute` | `query`, `data?`, `options?` | `POST /execute` |
| `query.script` | `script`, `data?`, `options?` | `POST /script` |
| `queries.list` (4.1.0) | — | `GET /queries` |
| `queries.execute` (4.1.0) | `name`, `data?`, `options?` | `POST /queries/{name}` |
| `approvals.status` (4.3.0) | `id` | `GET /approvals/{id}` ([wartende Schreibvorgänge](Security.md#approvals)) |
| `files.list` / `files.upload` / `files.url` (4.3.0) | — / `entity`, `property`, `name`, `type`, `size` / `entity`, `property`, `key` | `GET /files…` ([Dateien](Rest.md#files)) |
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
| `subscribe.entity` (4.2.0) | `entity` | `GET /subscribe?entity=` ([Datenänderungen](Changes.md#subscriptions)) |
| `subscribe.query` (4.2.0) | `query` oder `name`, `data?` | `GET /subscribe?query=` / `?name=` |
| `unsubscribe` (4.2.0) | `subscription` | — |

Die [Berechtigungen](Security.md#permissions) sind dieselben wie bei REST.

## Benachrichtigungen {#notifications}

Nachrichten des Servers ohne `id`:

| Benachrichtigung | Wann | Parameter |
| --- | --- | --- |
| `queue.completed` | eine mit `query.executeQueued` und `notify: true` auf dieser Verbindung eingereihte Ausführung ist beendet | `queueId`, `ok: true`, `rows` (an das Topic gesendet) |
| `queue.failed` | diese Ausführung ist fehlgeschlagen | `queueId`, `ok: false`, `error` |
| `schema.statusChanged` | das Schema der Verbindung ist in den Zustand `error` / `restarting` oder zurück zu `ready` gewechselt | `path`, `status`, `reason`, `pending` |
| `data.changed` (4.2.0) | ein Schreibvorgang einer Entität eines `subscribe.entity` | `subscription`, `entity`, `action`, `keys?`, `count?` |
| `query.changed` (4.2.0) | das Ergebnis eines `subscribe.query` hat sich geändert | `subscription`, `result` |
| `subscription.failed` (4.2.0) | die Abfrage eines Abonnements kann nicht mehr laufen | `subscription`, `error`, `message` |
| `workspace.changed` | im Workspace des Schemas hat sich etwas geändert (eine Verbindung zur Wurzel: in jedem): `added`, `removed`, `schema`, `env` oder `files` | `path`, `kind`, `files`, `at` |

```json
→ { "jsonrpc": "2.0", "id": 7, "method": "query.executeQueued", "params": { "topic": "countries", "query": "Countries.map(p => [p.iso3, p.name])", "chunk": 1000, "notify": true } }
← { "jsonrpc": "2.0", "id": 7, "result": { "queueId": "q-123" } }
← { "jsonrpc": "2.0", "method": "queue.completed", "params": { "queueId": "q-123", "ok": true, "rows": 250 } }
```

Ist das Schema nicht mehr `ready`, beantworten die Anfragen dies mit einem Fehler mit `status: 503`; die Verbindung
bleibt offen und funktioniert wieder, sobald sich das Schema erholt.

Das AsyncAPI-Dokument des Transports befindet sich unter `GET /asyncapi` (und `/asyncapi.json`). Aus Node verwendet der
[Client](Clients.md) diesen Transport mit einer `ws://`-URL.
