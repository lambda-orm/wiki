# Clientes {#clients}

Um Data Gateway é HTTP, WebSocket e MCP comuns: qualquer linguagem pode chamá-lo. Esta página lista os clientes feitos
para ele: os clientes Node, a CLI, um cliente gerado a partir do seu documento OpenAPI e um agente de IA por MCP.

## Node: @lambdaorm/data-gateway-client

[`@lambdaorm/data-gateway-client`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) é o cliente novo:
uma API sobre todos os transportes de dados do gateway, escolhido pelo esquema da string de conexão (`http://` REST,
`ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` o MCP HTTP+SSE antigo, `mcp+ws://` MCP sobre
WebSocket), e o mesmo código de erro em todos. Passa a suíte
de conformidade do gateway em cada um.

```sh
npm install @lambdaorm/data-gateway-client
```

```ts
import { connect, GatewayError } from '@lambdaorm/data-gateway-client'

const gateway = await connect('http://gateway:8080/iot/v1', { apiKey: process.env.IOT_KEY })
const devices = await gateway.execute('Devices.filter(p => p.status == status)', { status: 'active' })
const found = await gateway.schema.search('Devices.area')     // um esquema grande, por parte de um nome
try {
	await gateway.execute('Devic.map(p => p.id)')
} catch (error) {
	if (error instanceof GatewayError && error.code === 'invalid') console.log(error.suggestions) // [{ name: 'Devic', didYouMean: ['Devices'] }]
}
await gateway.close()
```

Desde a 4.1.0, `token` pode ser uma função que o fornece (`token: () => idp.accessToken()`), chamada em cada requisição
REST e MCP e ao abrir um WebSocket: o [JWT](Security.md#jwt) de um provedor de identidade, renovado. E
`gateway.queries()` lista as [consultas nomeadas](Rest.md#named-queries) que a credencial pode usar, e
`gateway.query(name, data)` executa uma, em todos os transportes. Desde a 4.2.0, com uma conexão `ws://`,
`gateway.subscribe({ entity } | { query, data } | { name, data }, listener)` fica sabendo das
[mudanças dos dados](Changes.md#from-node). Desde a 4.3.0, `isApprovalPending(result)` diz se uma escrita
[aguarda uma pessoa](Security.md#approvals) e `gateway.approval(id)` diz o estado, em todo transporte.

A credencial vai nas opções (`apiKey`, `token`, ou quaisquer `headers`) ou em `DATA_GATEWAY_API_KEY` /
`DATA_GATEWAY_TOKEN`, nunca na URL (uma credencial nela é um erro); `DATA_GATEWAY_URL` é a string de conexão quando
`connect()` não recebe nenhuma, e a URL pode levar `?timeout=<ms>` e `?stage=<stage>`. Os erros têm um `code` que é o
mesmo em todos os transportes: `invalid`, `unauthorized`, `forbidden`, `not_found`, `unique`, `foreign_key`,
`timeout`, `unavailable`, `truncated` (MCP, uma lista cortada em `mcp.maxRows`), …
Seu [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) tem toda a API e os códigos.
`@lambdaorm/client`, abaixo, continua funcionando; a CLI passará para o cliente novo.

## Node: @lambdaorm/client {#node-lambdaormclient}

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) tem a mesma interface da biblioteca
(`orm.execute`, `orm.plan`, `orm.executeScript`, …) e a executa em um Data Gateway. A URL inclui a rota do
esquema; `http(s)://` usa a API REST e `ws(s)://` a [API WebSocket](WebSocket.md).

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

Por WebSocket, todas as operações usam uma única conexão persistente, e `orm.on` recebe as [notificações](WebSocket.md#notifications)
(`queue.completed`, `queue.failed`, `schema.statusChanged`):

```ts
await orm.init('ws://gateway:8083/iot/v1', { headers: { 'X-Api-Key': process.env.IOT_KEY } })
const stop = orm.on('schema.statusChanged', state => console.log(state.path, state.status, state.reason))
const products = await orm.execute('Products.filter(p => p.price > minPrice)', { minPrice: 50 })
// …
stop()
await orm.end()     // closes the connection
```

Com um único esquema na raiz, a URL é a do gateway: `http://gateway:8080`.

## CLI {#cli}

A [CLI](../cli/index.md) executa seus comandos localmente com um workspace (`-w`) ou em um Data Gateway com `-u` e a
URL do esquema. Com autenticação bearer, o token é obtido da variável de ambiente `SERVICE_TOKEN`:

```sh
export SERVICE_TOKEN=…
lambdaorm execute -q "Devices.filter(p => p.status == 'active')" -u http://gateway:8080/iot/v1
lambdaorm script -x "orm.execute(\"Devices.map(p => count(1))\")" -u http://gateway:8080/iot/v1
```

## Outras linguagens {#other-languages}

O documento OpenAPI 3 da API REST é servido pelo gateway em `/openapi.json` (Swagger UI em `/doc`): a partir dele é
possível gerar um cliente para qualquer linguagem com o [OpenAPI Generator](https://openapi-generator.tech), ou chamar a
API com qualquer biblioteca HTTP:

```python
import requests

rows = requests.post("http://gateway:8080/iot/v1/execute", headers={"X-Api-Key": key}, json={
    "query": "Devices.filter(p => p.status == status)",
    "data": {"status": "active"},
}).json()
```

## Agentes de IA {#ai-agents}

Por meio do [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web {#web}

A [IDE](../ide/index.md) do gateway e o [`@lambdaorm/ui`](../ide/Embedding.md) para colocá-la em uma aplicação
própria. O gateway não responde CORS: uma aplicação web o chama pelo seu backend.
