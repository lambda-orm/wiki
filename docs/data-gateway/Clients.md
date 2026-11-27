# Clients

A Data Gateway is plain HTTP, WebSocket and MCP: any language can call it. This page lists the clients made for it:
the Node and Go clients, the CLI, a generated client from its OpenAPI document, and an AI agent through MCP.

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) is the
Node client: one API over every data transport of the gateway, chosen by the scheme of the connection string
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` the older MCP HTTP+SSE, `mcp+ws://`
MCP over WebSocket), and the same error code on all of them. It passes the conformance suite of the gateway on each
one. It needs Node 22 or later.

### In a project {#node-in-a-project}

Create the project and add the client (TypeScript and `tsx` only to write it in TypeScript):

```sh
mkdir shop && cd shop
npm init -y
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node
```

The connection string and the credential stay out of the code, in the environment:

```sh
export DATA_GATEWAY_URL=http://gateway:8080/northwind
export DATA_GATEWAY_API_KEY=…
```

One connection for the whole application, opened the first time it is needed, in `src/gateway.ts`:

```ts
import { connect, DataGatewayClient } from '@lambdaorm/data-gateway-client-node'

let client: Promise<DataGatewayClient> | undefined

/** the connection of the application (DATA_GATEWAY_URL, DATA_GATEWAY_API_KEY): opened once, then shared */
export const gateway = (): Promise<DataGatewayClient> =>
	(client ??= connect().catch(error => { client = undefined; throw error }))

export const closeGateway = async (): Promise<void> => {
	if (client) await (await client).close()
}
```

The queries, with the type of their result, in `src/products.ts`:

```ts
import { GatewayError } from '@lambdaorm/data-gateway-client-node'
import { gateway } from './gateway'

export interface Product { name: string, price: number }

export const expensiveProducts = async (minPrice: number): Promise<Product[]> =>
	(await gateway()).execute<Product[]>(
		'Products.filter(p => p.price > minPrice).map(p => ({ name: p.name, price: p.price })).sort(p => desc(p.price)).page(1, 3)',
		{ minPrice })

/** false when the category already exists */
export const addCategory = async (name: string): Promise<boolean> => {
	try {
		await (await gateway()).execute('Categories.insert()', { name })
		return true
	} catch (error) {
		if (error instanceof GatewayError && error.code === 'unique') return false
		throw error
	}
}
```

And `src/index.ts`, which closes the connection at the end:

```ts
import { closeGateway } from './gateway'
import { expensiveProducts } from './products'

const main = async () => {
	console.log(await expensiveProducts(50))
}

main().finally(closeGateway)
```

```sh
npx tsx src/index.ts
```

A server keeps the connection open while it runs and closes it on stopping (`process.on('SIGTERM', …)`). In
JavaScript the package is imported the same way, with `import` or with `require`.

### What else it does {#node-more}

Since 4.1.0, `token` can be a function that gives it (`token: () => idp.accessToken()`), asked for on every request of
REST and MCP and on opening a WebSocket: the [JWT](Security.md#jwt) of an identity provider, refreshed. And
`gateway.queries()` lists the [named queries](Rest.md#named-queries) the credential can use, `gateway.query(name, data)`
runs one, on every transport. Since 4.2.0, over a `ws://` connection, `gateway.subscribe({ entity } | { query, data } |
{ name, data }, listener)` is told of the [changes of the data](Changes.md#from-node). Since 4.3.0, `isApprovalPending(result)` says whether a
write [waits for a person](Security.md#approvals) and `gateway.approval(id)` tells its state, on every transport.

The credential goes in the options (`apiKey`, `token`, or any `headers`) or in `DATA_GATEWAY_API_KEY` /
`DATA_GATEWAY_TOKEN`, never in the URL (a credential in it is an error); `DATA_GATEWAY_URL` is the connection string
when `connect()` gets none, and the URL can carry `?timeout=<ms>` and `?stage=<stage>`. The errors have a `code` that
is the same on every transport: `invalid`, `unauthorized`, `forbidden`, `not_found`, `unique`, `foreign_key`,
`timeout`, `unavailable`, `truncated` (MCP, a list cut at `mcp.maxRows`), … Its [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) has the whole API and the codes.
`@lambdaorm/client`, below, keeps working; the CLI will move to the new client.

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(package `gateway`) is the same client in Go: the same connection strings, the same five transports, the same
operations and the same error codes, and it passes the same conformance suite. It needs Go 1.22 or later; its only
dependency is [`github.com/coder/websocket`](https://github.com/coder/websocket).

### In a project {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
go get github.com/lambda-orm/data-gateway-client-go
```

With the same `DATA_GATEWAY_URL` and `DATA_GATEWAY_API_KEY` in the environment, `main.go`:

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	gateway "github.com/lambda-orm/data-gateway-client-go"
)

type Product struct {
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// "" takes DATA_GATEWAY_URL; the key, DATA_GATEWAY_API_KEY (or gateway.WithAPIKey)
	gw, err := gateway.Connect(ctx, "")
	if err != nil {
		log.Fatal(err)
	}
	defer gw.Close()

	products, err := gateway.ExecuteInto[[]Product](ctx, gw,
		"Products.filter(p => p.price > minPrice).map(p => ({ name: p.name, price: p.price })).sort(p => desc(p.price)).page(1, 3)",
		map[string]any{"minPrice": 50}, nil)
	var e *gateway.Error
	if errors.As(err, &e) {
		log.Fatalf("%s (%s): %s", e.Code, e.Name, e.Message)
	}
	for _, p := range products {
		fmt.Printf("%s %.2f\n", p.Name, p.Price)
	}
}
```

```sh
go run .
```

`ExecuteInto[T]` decodes the result into a type (a struct by its `json` tags, a slice of them); `Execute` gives it as
`any`. Every operation takes a `context.Context`, which can end it before the timeout of the connection.

In a server, one `*gateway.Client` serves the whole application (it is safe for concurrent use), and each request
passes its own context:

```go
func products(gw *gateway.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := gateway.ExecuteInto[[]Product](r.Context(), gw, "Products.map(p => ({ name: p.name, price: p.price })).page(1, 20)", nil, nil)
		switch {
		case gateway.IsCode(err, gateway.CodeForbidden):
			http.Error(w, "forbidden", http.StatusForbidden)
		case err != nil:
			http.Error(w, err.Error(), http.StatusBadGateway)
		default:
			_ = json.NewEncoder(w).Encode(rows)
		}
	}
}
```

### What else it does {#go-more}

The options of `Connect`: `WithAPIKey`, `WithAPIKeyHeader`, `WithToken`, `WithTokenFunc` (the token of an identity
provider, asked for on every request), `WithHeader`, `WithTimeout` (30 s by default), `WithStage` and
`WithTruncatedRows` (MCP: the rows cut at `mcp.maxRows` instead of the error `truncated`). The rest of the API is the
one of Node with the names of Go: `ExecuteScript`, `ExecuteQueued`, `Plan`, `Metadata`, `Queries`, `Query`,
`Approval`, `Whoami`, `gw.Schema.Search`, `gw.Stage.Export`, `gw.General.Health`, … Over a `ws://` connection,
`Subscribe` is told of the [changes of the data](Changes.md) and `On` receives the [notifications](WebSocket.md#notifications):

```go
sub, err := gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: "Orders"}, func(e gateway.Event) {
	log.Println(e.Type, e.Params["action"]) // on the goroutine that reads the socket: don't block it
})
if err != nil {
	log.Fatal(err)
}
defer sub.Unsubscribe(ctx)
```

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
