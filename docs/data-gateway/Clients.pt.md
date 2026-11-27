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

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) é o
cliente Node: uma API sobre todos os transportes de dados do gateway, escolhido pelo esquema da string de conexão
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` o MCP HTTP+SSE antigo, `mcp+ws://`
MCP sobre WebSocket), e o mesmo código de erro em todos. Passa a suíte de conformidade do gateway em cada um. Precisa
do Node 22 ou posterior.

### 1. Criar o projeto {#node-in-a-project}

```sh
mkdir shop && cd shop
npm init -y
npm pkg set type=module
```

### 2. Instalar o cliente

```sh
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node        # só para escrevê-lo em TypeScript
```

### 3. Dizer onde está o gateway

A string de conexão e a credencial ficam fora do código, no ambiente (ou num `.env` que a aplicação lê); o cliente as
pega dali:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

### 4. Uma conexão para a aplicação

`src/gateway.ts`: a conexão é aberta na primeira vez que for necessária e compartilhada por toda a aplicação:

```ts
import { connect, DataGatewayClient } from '@lambdaorm/data-gateway-client-node'

let client: Promise<DataGatewayClient> | undefined

/** a conexão da aplicação (DATA_GATEWAY_URL, DATA_GATEWAY_API_KEY): aberta uma vez e compartilhada */
export const gateway = (): Promise<DataGatewayClient> =>
	(client ??= connect().catch(error => { client = undefined; throw error }))

export const closeGateway = async (): Promise<void> => {
	if (client) await (await client).close()
}
```

### 5. As consultas

`src/products.ts`: uma consulta é o texto de uma expressão do λORM, com suas variáveis à parte; `execute<T>` dá seu
resultado com um tipo:

```ts
import { GatewayError } from '@lambdaorm/data-gateway-client-node'
import { gateway } from './gateway.js'

export interface Product { name: string, price: number }

export const expensiveProducts = async (minPrice: number): Promise<Product[]> =>
	(await gateway()).execute<Product[]>(
		'Products.filter(p => p.price > minPrice).map(p => ({ name: p.name, price: p.price })).sort(p => desc(p.price)).page(1, 3)',
		{ minPrice })

/** false quando a categoria já existe */
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

### 6. Executar

`src/index.ts`, que diz o código de um erro e fecha a conexão ao terminar:

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

A leitura funciona; a escrita é recusada **antes de chegar ao banco de dados**, com o código `forbidden`:
`reader-demo-key` só lê.

### 7. Gravar, e os erros

Com a chave que grava, de novo:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key npx tsx src/index.ts
```

Agora `addCategory('Beverages')` responde `false` (a última linha): a categoria existe, o banco a recusa e o cliente dá
o código `unique`, seja qual for o banco (Postgres `23505`, MySQL `ER_DUP_ENTRY`…). Decide-se por `error.code`;
`errorName`, `status`, `dbCode` e `suggestions` (os nomes mais próximos, para um nome que não existe) dizem mais.

### 8. Outro transporte

Só muda a string de conexão; o código e os resultados são os mesmos:

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ npx tsx src/index.ts          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ npx tsx src/index.ts    # MCP
```

Um servidor mantém a conexão aberta enquanto roda e a fecha ao parar (`process.on('SIGTERM', …)`). Os imports dos
arquivos do projeto dizem `.js` (`./gateway.js`), como o TypeScript pede num módulo ES; em CommonJS o pacote é
importado com `require`, a mesma API.

### O que mais faz {#node-more}

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
Seu [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) tem toda a API e os códigos.
`@lambdaorm/client`, abaixo, continua funcionando; a CLI passará para o cliente novo.

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(pacote `gateway`) é o mesmo cliente em Go: as mesmas strings de conexão, os mesmos cinco transportes, as mesmas
operações e os mesmos códigos de erro, e passa a mesma suíte de conformidade. Precisa do Go 1.22 ou posterior; sua
única dependência é [`github.com/coder/websocket`](https://github.com/coder/websocket).

### 1. Criar o módulo {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
```

### 2. Adicionar o cliente

```sh
go get github.com/lambda-orm/data-gateway-client-go
```

### 3. Dizer onde está o gateway

As mesmas variáveis que em Node:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

### 4. Conectar, consultar, tratar os erros

`main.go`:

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

	// "" usa DATA_GATEWAY_URL; a chave, DATA_GATEWAY_API_KEY (ou gateway.WithAPIKey)
	gw, err := gateway.Connect(ctx, "")
	if err != nil {
		log.Fatal(err)
	}
	defer gw.Close()

	products, err := gateway.ExecuteInto[[]Product](ctx, gw,
		"Products.filter(p => p.price > minPrice).map(p => ({ name: p.name, price: p.price })).sort(p => desc(p.price)).page(1, 3)",
		map[string]any{"minPrice": 50}, nil)
	if err != nil {
		log.Fatal(err)
	}
	for _, p := range products {
		fmt.Printf("%s %.2f\n", p.Name, p.Price)
	}

	_, err = gw.Execute(ctx, "Categories.insert()", map[string]any{"name": "Beverages"}, nil)
	var e *gateway.Error
	switch {
	case err == nil:
		fmt.Println("added")
	case gateway.IsCode(err, gateway.CodeUnique):
		fmt.Println("it already exists")
	case errors.As(err, &e):
		fmt.Printf("%s: %s\n", e.Code, e.Message)
	default:
		log.Fatal(err)
	}
}
```

### 5. Executar

```sh
go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
forbidden: the credential "reader" does not have the "write" permission
```

e com a chave que grava, o banco recusa a categoria repetida, com o mesmo código em todos os bancos:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
it already exists
```

`ExecuteInto[T]` decodifica o resultado num tipo (um struct pelas suas tags `json`, um slice deles); `Execute` o dá como
`any`. Toda operação recebe um `context.Context`, que pode encerrá-la antes do timeout da conexão.

### 6. Outro transporte

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ go run .          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ go run .    # MCP
```

### 7. Num servidor

Um `*gateway.Client` atende toda a aplicação (pode ser usado de forma concorrente), e cada requisição passa seu próprio
contexto:

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

### O que mais faz {#go-more}

As opções de `Connect`: `WithAPIKey`, `WithAPIKeyHeader`, `WithToken`, `WithTokenFunc` (o token de um provedor de
identidade, pedido em cada requisição), `WithHeader`, `WithTimeout` (30 s por padrão), `WithStage` e
`WithTruncatedRows` (MCP: as linhas cortadas em `mcp.maxRows` em vez do erro `truncated`). O resto da API é o do Node
com os nomes do Go: `ExecuteScript`, `ExecuteQueued`, `Plan`, `Metadata`, `Queries`, `Query`, `Approval`, `Whoami`,
`gw.Schema.Search`, `gw.Stage.Export`, `gw.General.Health`, … Com uma conexão `ws://`, `Subscribe` fica sabendo das
[mudanças dos dados](Changes.md) e `On` recebe as [notificações](WebSocket.md#notifications):

```go
sub, err := gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: "Orders"}, func(e gateway.Event) {
	log.Println(e.Type, e.Params["action"]) // na goroutine que lê o socket: não bloqueá-la
})
if err != nil {
	log.Fatal(err)
}
defer sub.Unsubscribe(ctx)
```

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
