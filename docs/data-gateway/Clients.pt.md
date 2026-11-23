# Clientes {#clients}

## Node: @lambdaorm/data-gateway-client

[`@lambdaorm/data-gateway-client`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client) (0.1.0) é o
cliente novo: uma API sobre os cinco transportes do gateway, escolhido pelo esquema da string de conexão
(`http://`, `ws://`, `mcp+http://`, `mcp+sse://`, `mcp+ws://`), e o mesmo código de erro em todos. Passa a suíte
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

A credencial vai nas opções (`apiKey`, `token`) ou em `DATA_GATEWAY_API_KEY` / `DATA_GATEWAY_TOKEN`, nunca na URL.
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

O documento OpenAPI 3 da API REST é servido pelo gateway (`/doc`, `/api-docs`): a partir dele é possível gerar um
cliente para qualquer linguagem com o [OpenAPI Generator](https://openapi-generator.tech).

## Agentes de IA {#ai-agents}

Por meio do [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web {#web}

A [IDE](../ide/index.md) do gateway e o [`@lambdaorm/ui`](../ide/Embedding.md) para colocá-la em uma aplicação
própria. O gateway não responde CORS: uma aplicação web o chama pelo seu backend.
