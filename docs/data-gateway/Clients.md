# Clients

## Node: @lambdaorm/data-gateway-client

[`@lambdaorm/data-gateway-client`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) (0.1.0) is the new
client: one API on the five transports of the gateway, chosen by the scheme of the connection string (`http://`,
`ws://`, `mcp+http://`, `mcp+sse://`, `mcp+ws://`), and the same error code on all of them. It passes the
conformance suite of the gateway on each one.

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

The credential goes in the options (`apiKey`, `token`) or in `DATA_GATEWAY_API_KEY` / `DATA_GATEWAY_TOKEN`, never in
the URL. Its [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) has the whole API and the codes.
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

The OpenAPI 3 document of the REST API is served by the gateway (`/doc`, `/api-docs`): a client for any language can
be generated from it with [OpenAPI Generator](https://openapi-generator.tech).

## AI agents

Through [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web

The [IDE](../ide/Guide.md) of the gateway, and [`@lambdaorm/ui`](../ide/Guide.md#in-your-own-application) to put it in an application of
your own. The gateway answers no CORS: a web application calls it from its backend.
