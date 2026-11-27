# Cliente Node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) é o
cliente Node: uma API sobre todos os transportes de dados do gateway, escolhido pelo esquema da string de conexão
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` o MCP HTTP+SSE antigo, `mcp+ws://`
MCP sobre WebSocket), e o mesmo código de erro em todos. Passa a suíte de conformidade do gateway em cada um. Precisa
do Node 22 ou posterior.

## Antes de começar {#before-you-start}

Estes passos usam o gateway de [Primeiros passos](GettingStarted.md)
(Northwind, seus passos 1 a 3: `docker compose up -d` e os dados importados):

| Transporte | String de conexão | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | a escolha padrão |
| WebSocket | `ws://localhost:8083/` | uma conexão para todas as operações; assinaturas e notificações |
| MCP | `mcp+http://localhost:8081/` | quando só a porta do MCP está aberta |

O caminho depois da porta é a **rota do esquema**: `/` ali, porque esse exemplo serve um só esquema na raiz; num gateway
com vários, `http://gateway:8080/iot/v1`. As credenciais são suas chaves `reader-demo-key` (lê) e `backend-demo-key`
(também grava).

## 1. Criar o projeto {#node-in-a-project}

```sh
mkdir shop && cd shop
npm init -y
npm pkg set type=module
```

## 2. Instalar o cliente

```sh
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node        # só para escrevê-lo em TypeScript
```

## 3. Dizer onde está o gateway

A string de conexão e a credencial ficam fora do código, no ambiente (ou num `.env` que a aplicação lê); o cliente as
pega dali:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. Uma conexão para a aplicação

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

## 5. As consultas

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

## 6. Executar

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

## 7. Gravar, e os erros

Com a chave que grava, de novo:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key npx tsx src/index.ts
```

Agora `addCategory('Beverages')` responde `false` (a última linha): a categoria existe, o banco a recusa e o cliente dá
o código `unique`, seja qual for o banco (Postgres `23505`, MySQL `ER_DUP_ENTRY`…). Decide-se por `error.code`;
`errorName`, `status`, `dbCode` e `suggestions` (os nomes mais próximos, para um nome que não existe) dizem mais.

## 8. Outro transporte

Só muda a string de conexão; o código e os resultados são os mesmos:

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ npx tsx src/index.ts          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ npx tsx src/index.ts    # MCP
```

Um servidor mantém a conexão aberta enquanto roda e a fecha ao parar (`process.on('SIGTERM', …)`). Os imports dos
arquivos do projeto dizem `.js` (`./gateway.js`), como o TypeScript pede num módulo ES; em CommonJS o pacote é
importado com `require`, a mesma API.

## O que mais faz {#node-more}

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
