# Clientes {#clients}

Um Data Gateway é HTTP, WebSocket e MCP comuns: qualquer linguagem pode chamá-lo. Esta página lista os clientes feitos
para ele: os clientes Node e Go, a CLI, um cliente gerado a partir do seu documento OpenAPI e um agente de IA por MCP.

## Passo a passo {#step-by-step}

Os dois clientes, Node e Go, são usados do mesmo jeito: uma **string de conexão** diz onde está o gateway e por qual
transporte, uma **credencial** diz quem chama, e cada operação responde o que o gateway responde ou um erro com um
`code` que é o mesmo em todos os transportes. Estes passos usam o gateway de [Primeiros passos](GettingStarted.md)
(Northwind, seus passos 1 a 3: `docker compose up -d` e os dados importados):

| Transporte | String de conexão | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | a escolha padrão |
| WebSocket | `ws://localhost:8083/` | uma conexão para todas as operações; assinaturas e notificações |
| MCP | `mcp+http://localhost:8081/` | quando só a porta do MCP está aberta |

O caminho depois da porta é a **rota do esquema**: `/` ali, porque esse exemplo serve um só esquema na raiz; num gateway
com vários, `http://gateway:8080/iot/v1`. As credenciais são suas chaves `reader-demo-key` (lê) e `backend-demo-key`
(também grava).

Cada um passo a passo, na sua própria página: [Node](ClientNode.md) e [Go](ClientGo.md).

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) é o
cliente Node: uma API sobre todos os transportes de dados do gateway, escolhido pelo esquema da string de conexão
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` o MCP HTTP+SSE antigo, `mcp+ws://`
MCP sobre WebSocket), e o mesmo código de erro em todos. Passa a suíte de conformidade do gateway em cada um. Precisa
do Node 22 ou posterior.

Passo a passo: [o cliente Node](ClientNode.md).

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(pacote `gateway`) é o mesmo cliente em Go: as mesmas strings de conexão, os mesmos cinco transportes, as mesmas
operações e os mesmos códigos de erro, e passa a mesma suíte de conformidade. Precisa do Go 1.22 ou posterior; sua
única dependência é [`github.com/coder/websocket`](https://github.com/coder/websocket).

Passo a passo: [o cliente Go](ClientGo.md).

## Node e Go, lado a lado {#side-by-side}

| | Node | Go |
| --- | --- | --- |
| Conectar | `const gw = await connect(url, { apiKey })` | `gw, err := gateway.Connect(ctx, url, gateway.WithAPIKey(key))` |
| Uma consulta | `await gw.execute<Product[]>(query, data)` | `gateway.ExecuteInto[[]Product](ctx, gw, query, data, nil)` |
| Um script | `await gw.executeScript(script, data)` | `gw.ExecuteScript(ctx, script, data, nil)` |
| Uma consulta nomeada | `await gw.query(name, data)` | `gw.Query(ctx, name, data, nil)` |
| O esquema | `await gw.schema.search(text)` | `gw.Schema.Search(ctx, text)` |
| Um erro | `error instanceof GatewayError && error.code === 'unique'` | `gateway.IsCode(err, gateway.CodeUnique)` |
| Mudanças dos dados (`ws://`) | `await gw.subscribe({ entity }, listener)` | `gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: …}, listener)` |
| Fechar | `await gw.close()` | `gw.Close()` |

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
