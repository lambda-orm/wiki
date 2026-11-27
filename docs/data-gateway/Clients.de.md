# Clients {#clients}

Ein Data Gateway ist schlichtes HTTP, WebSocket und MCP: Jede Sprache kann es aufrufen. Diese Seite listet die dafür
gemachten Clients auf: die Node- und Go-Clients, die CLI, einen aus seinem OpenAPI-Dokument generierten Client und einen
KI-Agenten über MCP.

## Schritt für Schritt {#step-by-step}

Beide Clients, Node und Go, werden gleich benutzt: eine **Verbindungszeichenfolge** sagt, wo das Gateway ist und über
welchen Transport, **Zugangsdaten** sagen, wer aufruft, und jede Operation antwortet, was das Gateway antwortet, oder
mit einem Fehler mit einem `code`, der auf jedem Transport gleich ist. Diese Schritte nutzen das Gateway aus
[Erste Schritte](GettingStarted.md) (Northwind, seine Schritte 1 bis 3: `docker compose up -d` und die Daten
importiert):

| Transport | Verbindungszeichenfolge | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | die Standardwahl |
| WebSocket | `ws://localhost:8083/` | eine Verbindung für alle Operationen; Abonnements und Benachrichtigungen |
| MCP | `mcp+http://localhost:8081/` | wenn nur der Port des MCP offen ist |

Der Pfad nach dem Port ist die **Route des Schemas**: dort `/`, weil das Beispiel ein einziges Schema an der Wurzel
bereitstellt; in einem Gateway mit mehreren `http://gateway:8080/iot/v1`. Die Zugangsdaten sind seine Schlüssel
`reader-demo-key` (liest) und `backend-demo-key` (schreibt auch).

Jeder Schritt für Schritt auf seiner eigenen Seite: [Node](ClientNode.md) und [Go](ClientGo.md).

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) ist der
Node-Client: eine API über jeden Datentransport des Gateways, gewählt über das Schema der Verbindungszeichenfolge
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` das ältere MCP HTTP+SSE,
`mcp+ws://` MCP über WebSocket), und derselbe Fehlercode auf allen. Er besteht die Konformitätssuite des Gateways auf
jedem davon. Er braucht Node 22 oder neuer.

Schritt für Schritt: [der Node-Client](ClientNode.md).

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(Paket `gateway`) ist derselbe Client in Go: dieselben Verbindungszeichenfolgen, dieselben fünf Transporte, dieselben
Operationen und dieselben Fehlercodes, und er besteht dieselbe Konformitätssuite. Er braucht Go 1.22 oder neuer; seine
einzige Abhängigkeit ist [`github.com/coder/websocket`](https://github.com/coder/websocket).

Schritt für Schritt: [der Go-Client](ClientGo.md).

## Node und Go nebeneinander {#side-by-side}

| | Node | Go |
| --- | --- | --- |
| Verbinden | `const gw = await connect(url, { apiKey })` | `gw, err := gateway.Connect(ctx, url, gateway.WithAPIKey(key))` |
| Eine Abfrage | `await gw.execute<Product[]>(query, data)` | `gateway.ExecuteInto[[]Product](ctx, gw, query, data, nil)` |
| Ein Skript | `await gw.executeScript(script, data)` | `gw.ExecuteScript(ctx, script, data, nil)` |
| Eine benannte Abfrage | `await gw.query(name, data)` | `gw.Query(ctx, name, data, nil)` |
| Das Schema | `await gw.schema.search(text)` | `gw.Schema.Search(ctx, text)` |
| Ein Fehler | `error instanceof GatewayError && error.code === 'unique'` | `gateway.IsCode(err, gateway.CodeUnique)` |
| Datenänderungen (`ws://`) | `await gw.subscribe({ entity }, listener)` | `gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: …}, listener)` |
| Schließen | `await gw.close()` | `gw.Close()` |

## Node: @lambdaorm/client {#node-lambdaormclient}

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) hat dieselbe Schnittstelle wie die Bibliothek
(`orm.execute`, `orm.plan`, `orm.executeScript`, …) und führt sie auf einem Data Gateway aus. Die URL enthält die Route
des Schemas; `http(s)://` verwendet die REST API und `ws(s)://` die [WebSocket API](WebSocket.md).

```sh
npm install @lambdaorm/client
```

```ts
import { orm } from '@lambdaorm/client'

// REST, an API key
await orm.init('http://gateway:8080/iot/v1', { headers: { 'X-Api-Key': process.env.IOT_KEY } })
const devices = await orm.execute('Devices.filter(p => p.status == status)', { status: 'active' })

// a bearer token: sent as Authorization: Bearer <token>
await orm.init('http://gateway:8080/iot/v1', { token: process.env.IOT_TOKEN })
```

Über WebSocket verwenden alle Operationen eine einzige dauerhafte Verbindung, und `orm.on` empfängt die
[Benachrichtigungen](WebSocket.md#notifications) (`queue.completed`, `queue.failed`, `schema.statusChanged`):

```ts
await orm.init('ws://gateway:8083/iot/v1', { headers: { 'X-Api-Key': process.env.IOT_KEY } })
const stop = orm.on('schema.statusChanged', state => console.log(state.path, state.status, state.reason))
const products = await orm.execute('Products.filter(p => p.price > minPrice)', { minPrice: 50 })
// …
stop()
await orm.end()     // closes the connection
```

Mit einem einzigen Schema an der Wurzel ist die URL die des Gateways: `http://gateway:8080`.

## CLI {#cli}

Die [CLI](../cli/index.md) führt ihre Befehle lokal mit einem Workspace (`-w`) oder auf einem Data Gateway mit `-u` und
der URL des Schemas aus. Bei Bearer-Authentifizierung wird das Token aus der Umgebungsvariablen `SERVICE_TOKEN`
gelesen:

```sh
export SERVICE_TOKEN=…
lambdaorm execute -q "Devices.filter(p => p.status == 'active')" -u http://gateway:8080/iot/v1
lambdaorm script -x "orm.execute(\"Devices.map(p => count(1))\")" -u http://gateway:8080/iot/v1
```

## Andere Sprachen {#other-languages}

Das OpenAPI-3-Dokument der REST API wird vom Gateway unter `/openapi.json` bereitgestellt (Swagger UI unter `/doc`):
Daraus lässt sich mit [OpenAPI Generator](https://openapi-generator.tech) ein Client für jede Sprache generieren, oder
die API wird mit einer beliebigen HTTP-Bibliothek aufgerufen:

```python
import requests

rows = requests.post("http://gateway:8080/iot/v1/execute", headers={"X-Api-Key": key}, json={
    "query": "Devices.filter(p => p.status == status)",
    "data": {"status": "active"},
}).json()
```

## KI-Agenten {#ai-agents}

Über [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web {#web}

Die [IDE](../ide/index.md) des Gateways sowie [`@lambdaorm/ui`](../ide/Embedding.md), um sie in eine eigene Anwendung
einzubauen. Das Gateway beantwortet kein CORS: Eine Webanwendung ruft es aus ihrem Backend auf.
