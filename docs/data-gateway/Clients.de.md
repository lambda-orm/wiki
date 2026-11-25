# Clients {#clients}

Ein Data Gateway ist schlichtes HTTP, WebSocket und MCP: Jede Sprache kann es aufrufen. Diese Seite listet die dafür
gemachten Clients auf: die Node-Clients, die CLI, einen aus seinem OpenAPI-Dokument generierten Client und einen
KI-Agenten über MCP.

## Node: @lambdaorm/data-gateway-client

[`@lambdaorm/data-gateway-client`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) ist der neue Client:
eine API über jeden Datentransport des Gateways, gewählt über das Schema der Verbindungszeichenfolge (`http://` REST,
`ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` das ältere MCP HTTP+SSE, `mcp+ws://` MCP über
WebSocket), und derselbe Fehlercode auf allen. Er besteht die
Konformitätssuite des Gateways auf jedem davon.

```sh
npm install @lambdaorm/data-gateway-client
```

```ts
import { connect, GatewayError } from '@lambdaorm/data-gateway-client'

const gateway = await connect('http://gateway:8080/iot/v1', { apiKey: process.env.IOT_KEY })
const devices = await gateway.execute('Devices.filter(p => p.status == status)', { status: 'active' })
const found = await gateway.schema.search('Devices.area')     // ein großes Schema, über einen Teil eines Namens
try {
	await gateway.execute('Devic.map(p => p.id)')
} catch (error) {
	if (error instanceof GatewayError && error.code === 'invalid') console.log(error.suggestions) // [{ name: 'Devic', didYouMean: ['Devices'] }]
}
await gateway.close()
```

Die Anmeldedaten stehen in den Optionen (`apiKey`, `token` oder beliebige `headers`) oder in `DATA_GATEWAY_API_KEY` /
`DATA_GATEWAY_TOKEN`, nie in der URL (Anmeldedaten darin sind ein Fehler); `DATA_GATEWAY_URL` ist die
Verbindungszeichenfolge, wenn `connect()` keine erhält, und die URL kann `?timeout=<ms>` und `?stage=<stage>` tragen.
Die Fehler haben einen `code`, der auf jedem Transport gleich ist: `invalid`, `unauthorized`, `forbidden`, `not_found`,
`unique`, `foreign_key`, `timeout`, `unavailable`, `truncated` (MCP, eine bei `mcp.maxRows` abgeschnittene Liste), … Sein [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) enthält die ganze API und
die Codes. `@lambdaorm/client` weiter unten funktioniert weiter; die CLI wechselt zum neuen Client.

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
