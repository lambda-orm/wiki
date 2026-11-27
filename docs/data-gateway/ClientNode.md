# Node client {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) is the
Node client: one API over every data transport of the gateway, chosen by the scheme of the connection string
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` the older MCP HTTP+SSE, `mcp+ws://`
MCP over WebSocket), and the same error code on all of them. It passes the conformance suite of the gateway on each
one. It needs Node 22 or later.

## Before you start {#before-you-start}

These steps use the gateway of [Getting started](GettingStarted.md)
(Northwind, its steps 1 to 3: `docker compose up -d` and the data imported):

| Transport | Connection string | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | the default choice |
| WebSocket | `ws://localhost:8083/` | one connection for every operation; subscriptions and notifications |
| MCP | `mcp+http://localhost:8081/` | when only the port of MCP is open |

The path after the port is the **route of the schema**: `/` there, because that example serves a single schema at the
root; in a gateway with several, `http://gateway:8080/iot/v1`. The credentials are its keys `reader-demo-key` (reads)
and `backend-demo-key` (writes too).

## 1. Create the project {#node-in-a-project}

```sh
mkdir shop && cd shop
npm init -y
npm pkg set type=module
```

## 2. Install the client

```sh
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node        # only to write it in TypeScript
```

## 3. Say where the gateway is

The connection string and the credential stay out of the code, in the environment (or in a `.env` the application
reads); the client takes them from there:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. One connection for the application

`src/gateway.ts`: the connection is opened the first time it is needed and shared by the whole application:

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

## 5. The queries

`src/products.ts`: a query is the text of a λORM expression, with its variables apart; `execute<T>` gives its result
with a type:

```ts
import { GatewayError } from '@lambdaorm/data-gateway-client-node'
import { gateway } from './gateway.js'

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

## 6. Run it

`src/index.ts`, which says the code of an error and closes the connection at the end:

```ts
import { GatewayError } from '@lambdaorm/data-gateway-client-node'
import { closeGateway } from './gateway.js'
import { addCategory, expensiveProducts } from './products.js'

try {
	console.log(await expensiveProducts(50))
	console.log(await addCategory('Beverages'))
} catch (error) {
	if (!(error instanceof GatewayError)) throw error
	console.error(`${error.code}: ${error.message}`)
} finally {
	await closeGateway()
}
```

```sh
npx tsx src/index.ts
```

```text
[
  { name: 'Côte de Blaye', price: 263.5 },
  { name: 'Thüringer Rostbratwurst', price: 123.79 },
  { name: 'Mishi Kobe Niku', price: 97 }
]
forbidden: the credential "reader" does not have the "write" permission
```

The read works; the write is refused **before reaching the database**, with the code `forbidden`: `reader-demo-key`
only reads.

## 7. Write, and the errors

With the key that writes, run it again:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key npx tsx src/index.ts
```

Now `addCategory('Beverages')` answers `false` (the last line): the category exists, the database refuses it and the client gives the
code `unique`, whatever the database (Postgres `23505`, MySQL `ER_DUP_ENTRY`…). Branch on `error.code`; `errorName`,
`status`, `dbCode` and `suggestions` (the closest names, for a name that doesn't exist) say more.

## 8. Another transport

Only the connection string changes; the code and the results are the same:

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ npx tsx src/index.ts          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ npx tsx src/index.ts    # MCP
```

A server keeps the connection open while it runs and closes it on stopping (`process.on('SIGTERM', …)`). The imports
of the project's own files say `.js` (`./gateway.js`), as TypeScript wants in an ES module; in CommonJS the package is
imported with `require`, the same API.

## What else it does {#node-more}

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
