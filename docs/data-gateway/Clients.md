# Clients

A Data Gateway is plain HTTP, WebSocket and MCP: any language can call it. This page lists the clients made for it:
the Node and Go clients, the CLI, a generated client from its OpenAPI document, and an AI agent through MCP.

## Step by step {#step-by-step}

Both clients, Node and Go, are used the same way: a **connection string** says where the gateway is and by which
transport, a **credential** says who calls, and every operation answers what the gateway answers or an error with a
`code` that is the same on every transport. These steps use the gateway of [Getting started](GettingStarted.md)
(Northwind, its steps 1 to 3: `docker compose up -d` and the data imported):

| Transport | Connection string | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | the default choice |
| WebSocket | `ws://localhost:8083/` | one connection for every operation; subscriptions and notifications |
| MCP | `mcp+http://localhost:8081/` | when only the port of MCP is open |

The path after the port is the **route of the schema**: `/` there, because that example serves a single schema at the
root; in a gateway with several, `http://gateway:8080/iot/v1`. The credentials are its keys `reader-demo-key` (reads)
and `backend-demo-key` (writes too).

Each one step by step, in its own page: [Node](ClientNode.md) and [Go](ClientGo.md).

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) is the
Node client: one API over every data transport of the gateway, chosen by the scheme of the connection string
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` the older MCP HTTP+SSE, `mcp+ws://`
MCP over WebSocket), and the same error code on all of them. It passes the conformance suite of the gateway on each
one. It needs Node 22 or later.

Step by step: [the Node client](ClientNode.md).

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(package `gateway`) is the same client in Go: the same connection strings, the same five transports, the same
operations and the same error codes, and it passes the same conformance suite. It needs Go 1.22 or later; its only
dependency is [`github.com/coder/websocket`](https://github.com/coder/websocket).

Step by step: [the Go client](ClientGo.md).

## Node and Go side by side {#side-by-side}

| | Node | Go |
| --- | --- | --- |
| Connect | `const gw = await connect(url, { apiKey })` | `gw, err := gateway.Connect(ctx, url, gateway.WithAPIKey(key))` |
| A query | `await gw.execute<Product[]>(query, data)` | `gateway.ExecuteInto[[]Product](ctx, gw, query, data, nil)` |
| A script | `await gw.executeScript(script, data)` | `gw.ExecuteScript(ctx, script, data, nil)` |
| A named query | `await gw.query(name, data)` | `gw.Query(ctx, name, data, nil)` |
| The schema | `await gw.schema.search(text)` | `gw.Schema.Search(ctx, text)` |
| An error | `error instanceof GatewayError && error.code === 'unique'` | `gateway.IsCode(err, gateway.CodeUnique)` |
| Changes of the data (`ws://`) | `await gw.subscribe({ entity }, listener)` | `gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: …}, listener)` |
| Close | `await gw.close()` | `gw.Close()` |

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
