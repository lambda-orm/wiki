# Clients

A Data Gateway is plain HTTP, WebSocket and MCP: any language can call it. This page lists the clients made for it:
the Node clients, the CLI, a generated client from its OpenAPI document, and an AI agent through MCP.

## Node: @lambdaorm/data-gateway-client

[`@lambdaorm/data-gateway-client`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) is the new
client: one API over every data transport of the gateway, chosen by the scheme of the connection string (`http://`
REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` the older MCP HTTP+SSE, `mcp+ws://` MCP over
WebSocket), and the same error code on all of them. It passes the conformance suite of the gateway on each one.

```sh
npm install @lambdaorm/data-gateway-client
```

```ts
import { connect, GatewayError } from '@lambdaorm/data-gateway-client'

const gateway = await connect('http://gateway:8080/iot/v1', { apiKey: process.env.IOT_KEY })
const devices = await gateway.execute('Devices.filter(p => p.status == status)', { status: 'active' })
const found = await gateway.schema.search('Devices.area')     // a large schema, by part of a name
try {
	await gateway.execute('Devic.map(p => p.id)')
} catch (error) {
	if (error instanceof GatewayError && error.code === 'invalid') console.log(error.suggestions) // [{ name: 'Devic', didYouMean: ['Devices'] }]
}
await gateway.close()
```

Since 4.1.0, `token` can be a function that gives it (`token: () => idp.accessToken()`), asked for on every request of
REST and MCP and on opening a WebSocket: the [JWT](Security.md#jwt) of an identity provider, refreshed. And
`gateway.queries()` lists the [named queries](Rest.md#named-queries) the credential can use, `gateway.query(name, data)`
runs one, on every transport.

The credential goes in the options (`apiKey`, `token`, or any `headers`) or in `DATA_GATEWAY_API_KEY` /
`DATA_GATEWAY_TOKEN`, never in the URL (a credential in it is an error); `DATA_GATEWAY_URL` is the connection string
when `connect()` gets none, and the URL can carry `?timeout=<ms>` and `?stage=<stage>`. The errors have a `code` that
is the same on every transport: `invalid`, `unauthorized`, `forbidden`, `not_found`, `unique`, `foreign_key`,
`timeout`, `unavailable`, `truncated` (MCP, a list cut at `mcp.maxRows`), … Its [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) has the whole API and the codes.
`@lambdaorm/client`, below, keeps working; the CLI will move to the new client.

## Node: @lambdaorm/client

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) has the same interface as the library
(`orm.execute`, `orm.plan`, `orm.executeScript`, …) and runs it on a Data Gateway. The URL includes the schema's
route; `http(s)://` uses the REST API and `ws(s)://` the [WebSocket API](WebSocket.md).

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

Over WebSocket, every operation uses one persistent connection, and `orm.on` receives the [notifications](WebSocket.md#notifications)
(`queue.completed`, `queue.failed`, `schema.statusChanged`):

```ts
await orm.init('ws://gateway:8083/iot/v1', { headers: { 'X-Api-Key': process.env.IOT_KEY } })
const stop = orm.on('schema.statusChanged', state => console.log(state.path, state.status, state.reason))
const products = await orm.execute('Products.filter(p => p.price > minPrice)', { minPrice: 50 })
// …
stop()
await orm.end()     // closes the connection
```

With a single schema at the root, the URL is the gateway's: `http://gateway:8080`.

## CLI

The [CLI](../cli/index.md) runs its commands locally with a workspace (`-w`) or on a Data Gateway with `-u` and the
schema's URL. With bearer authentication, the token is taken from the `SERVICE_TOKEN` environment variable:

```sh
export SERVICE_TOKEN=…
lambdaorm execute -q "Devices.filter(p => p.status == 'active')" -u http://gateway:8080/iot/v1
lambdaorm script -x "orm.execute(\"Devices.map(p => count(1))\")" -u http://gateway:8080/iot/v1
```

## Other languages

The OpenAPI 3 document of the REST API is served by the gateway at `/openapi.json` (Swagger UI at `/doc`): a client
for any language can be generated from it with [OpenAPI Generator](https://openapi-generator.tech), or the API called
with any HTTP library:

```python
import requests

rows = requests.post("http://gateway:8080/iot/v1/execute", headers={"X-Api-Key": key}, json={
    "query": "Devices.filter(p => p.status == status)",
    "data": {"status": "active"},
}).json()
```

## AI agents

Through [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web

The [IDE](../ide/index.md) of the gateway, and [`@lambdaorm/ui`](../ide/Embedding.md) to put it in an application of
your own. The gateway answers no CORS: a web application calls it from its backend.
