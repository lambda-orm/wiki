# Clientes {#clients}

Un Data Gateway es HTTP, WebSocket y MCP simples: cualquier lenguaje puede llamarlo. Esta página lista los clientes
hechos para él: los clientes de Node y Go, la CLI, un cliente generado a partir de su documento OpenAPI y un agente de IA por
MCP.

## Paso a paso {#step-by-step}

Los dos clientes, Node y Go, se usan igual: una **cadena de conexión** dice dónde está el gateway y por qué transporte,
una **credencial** dice quién llama, y cada operación responde lo que responde el gateway o un error con un `code` que
es el mismo en todos los transportes. Estos pasos usan el gateway de [Primeros pasos](GettingStarted.md) (Northwind,
sus pasos 1 a 3: `docker compose up -d` y los datos importados):

| Transporte | Cadena de conexión | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | la opción por defecto |
| WebSocket | `ws://localhost:8083/` | una conexión para todas las operaciones; suscripciones y notificaciones |
| MCP | `mcp+http://localhost:8081/` | cuando solo está abierto el puerto del MCP |

El camino después del puerto es la **ruta del esquema**: `/` ahí, porque ese ejemplo sirve un solo esquema en la raíz;
en un gateway con varios, `http://gateway:8080/iot/v1`. Las credenciales son sus claves `reader-demo-key` (lee) y
`backend-demo-key` (también escribe).

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) es el
cliente de Node: una API sobre todos los transportes de datos del gateway, elegido por el esquema de la cadena de
conexión (`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` el MCP HTTP+SSE anterior,
`mcp+ws://` MCP sobre WebSocket), y el mismo código de error en todos. Pasa la suite de conformidad del gateway en cada
uno. Necesita Node 22 o posterior.

### 1. Crear el proyecto {#node-in-a-project}

```sh
mkdir shop && cd shop
npm init -y
npm pkg set type=module
```

### 2. Instalar el cliente

```sh
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node        # solo para escribirlo en TypeScript
```

### 3. Decir dónde está el gateway

La cadena de conexión y la credencial quedan fuera del código, en el entorno (o en un `.env` que lea la aplicación); el
cliente las toma de ahí:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

### 4. Una conexión para la aplicación

`src/gateway.ts`: la conexión se abre la primera vez que hace falta y la comparte toda la aplicación:

```ts
import { connect, DataGatewayClient } from '@lambdaorm/data-gateway-client-node'

let client: Promise<DataGatewayClient> | undefined

/** la conexión de la aplicación (DATA_GATEWAY_URL, DATA_GATEWAY_API_KEY): se abre una vez y se comparte */
export const gateway = (): Promise<DataGatewayClient> =>
	(client ??= connect().catch(error => { client = undefined; throw error }))

export const closeGateway = async (): Promise<void> => {
	if (client) await (await client).close()
}
```

### 5. Las consultas

`src/products.ts`: una consulta es el texto de una expresión de λORM, con sus variables aparte; `execute<T>` da su
resultado con un tipo:

```ts
import { GatewayError } from '@lambdaorm/data-gateway-client-node'
import { gateway } from './gateway.js'

export interface Product { name: string, price: number }

export const expensiveProducts = async (minPrice: number): Promise<Product[]> =>
	(await gateway()).execute<Product[]>(
		'Products.filter(p => p.price > minPrice).map(p => ({ name: p.name, price: p.price })).sort(p => desc(p.price)).page(1, 3)',
		{ minPrice })

/** false cuando la categoría ya existe */
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

### 6. Ejecutarlo

`src/index.ts`, que dice el código de un error y cierra la conexión al terminar:

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

La lectura funciona; la escritura se rechaza **antes de llegar a la base de datos**, con el código `forbidden`:
`reader-demo-key` solo lee.

### 7. Escribir, y los errores

Con la clave que escribe, de nuevo:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key npx tsx src/index.ts
```

Ahora `addCategory('Beverages')` responde `false` (la última línea): la categoría existe, la base de datos la rechaza y
el cliente da el código `unique`, sea cual sea la base (Postgres `23505`, MySQL `ER_DUP_ENTRY`…). Se decide por
`error.code`; `errorName`, `status`, `dbCode` y `suggestions` (los nombres más cercanos, para un nombre que no existe)
dicen más.

### 8. Otro transporte

Solo cambia la cadena de conexión; el código y los resultados son los mismos:

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ npx tsx src/index.ts          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ npx tsx src/index.ts    # MCP
```

Un servidor mantiene la conexión abierta mientras corre y la cierra al detenerse (`process.on('SIGTERM', …)`). Los
imports de los archivos del proyecto dicen `.js` (`./gateway.js`), como lo pide TypeScript en un módulo ES; en CommonJS
el paquete se importa con `require`, la misma API.

### Qué más hace {#node-more}

Desde 4.1.0, `token` puede ser una función que lo da (`token: () => idp.accessToken()`), que se pide en cada petición
de REST y MCP y al abrir un WebSocket: el [JWT](Security.md#jwt) de un proveedor de identidad, renovado. Y
`gateway.queries()` lista las [consultas con nombre](Rest.md#named-queries) que la credencial puede usar, y
`gateway.query(name, data)` ejecuta una, en todos los transportes. Desde 4.2.0, con una conexión `ws://`,
`gateway.subscribe({ entity } | { query, data } | { name, data }, listener)` se entera de los
[cambios de los datos](Changes.md#from-node). Desde 4.3.0, `isApprovalPending(result)` dice si una escritura
[espera a una persona](Security.md#approvals) y `gateway.approval(id)` dice su estado, en todo transporte.

La credencial va en las opciones (`apiKey`, `token`, o cualquier `headers`) o en `DATA_GATEWAY_API_KEY` /
`DATA_GATEWAY_TOKEN`, nunca en la URL (una credencial en ella es un error); `DATA_GATEWAY_URL` es la cadena de conexión
cuando `connect()` no recibe ninguna, y la URL puede llevar `?timeout=<ms>` y `?stage=<stage>`. Los errores tienen un
`code` que es el mismo en todos los transportes: `invalid`, `unauthorized`, `forbidden`, `not_found`, `unique`,
`foreign_key`, `timeout`, `unavailable`, `truncated` (MCP, una lista cortada en `mcp.maxRows`), … Su [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) tiene toda la API y los códigos.
`@lambdaorm/client`, abajo, sigue funcionando; el CLI pasará al cliente nuevo.

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(paquete `gateway`) es el mismo cliente en Go: las mismas cadenas de conexión, los mismos cinco transportes, las mismas
operaciones y los mismos códigos de error, y pasa la misma suite de conformidad. Necesita Go 1.22 o posterior; su única
dependencia es [`github.com/coder/websocket`](https://github.com/coder/websocket).

### 1. Crear el módulo {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
```

### 2. Agregar el cliente

```sh
go get github.com/lambda-orm/data-gateway-client-go
```

### 3. Decir dónde está el gateway

Las mismas variables que en Node:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

### 4. Conectar, consultar, manejar los errores

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

	// "" toma DATA_GATEWAY_URL; la clave, DATA_GATEWAY_API_KEY (o gateway.WithAPIKey)
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

### 5. Ejecutarlo

```sh
go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
forbidden: the credential "reader" does not have the "write" permission
```

y con la clave que escribe, la base rechaza la categoría repetida, con el mismo código en todas las bases:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
it already exists
```

`ExecuteInto[T]` decodifica el resultado en un tipo (un struct por sus tags `json`, un slice de ellos); `Execute` lo da
como `any`. Toda operación recibe un `context.Context`, que puede terminarla antes del timeout de la conexión.

### 6. Otro transporte

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ go run .          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ go run .    # MCP
```

### 7. En un servidor

Un `*gateway.Client` sirve a toda la aplicación (se puede usar de forma concurrente), y cada petición pasa su propio
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

### Qué más hace {#go-more}

Las opciones de `Connect`: `WithAPIKey`, `WithAPIKeyHeader`, `WithToken`, `WithTokenFunc` (el token de un proveedor de
identidad, pedido en cada petición), `WithHeader`, `WithTimeout` (30 s por defecto), `WithStage` y `WithTruncatedRows`
(MCP: las filas cortadas en `mcp.maxRows` en lugar del error `truncated`). El resto de la API es la de Node con los
nombres de Go: `ExecuteScript`, `ExecuteQueued`, `Plan`, `Metadata`, `Queries`, `Query`, `Approval`, `Whoami`,
`gw.Schema.Search`, `gw.Stage.Export`, `gw.General.Health`, … Con una conexión `ws://`, `Subscribe` se entera de los
[cambios de los datos](Changes.md) y `On` recibe las [notificaciones](WebSocket.md#notifications):

```go
sub, err := gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: "Orders"}, func(e gateway.Event) {
	log.Println(e.Type, e.Params["action"]) // en la goroutine que lee el socket: no bloquearla
})
if err != nil {
	log.Fatal(err)
}
defer sub.Unsubscribe(ctx)
```

## Node y Go, lado a lado {#side-by-side}

| | Node | Go |
| --- | --- | --- |
| Conectar | `const gw = await connect(url, { apiKey })` | `gw, err := gateway.Connect(ctx, url, gateway.WithAPIKey(key))` |
| Una consulta | `await gw.execute<Product[]>(query, data)` | `gateway.ExecuteInto[[]Product](ctx, gw, query, data, nil)` |
| Un script | `await gw.executeScript(script, data)` | `gw.ExecuteScript(ctx, script, data, nil)` |
| Una consulta con nombre | `await gw.query(name, data)` | `gw.Query(ctx, name, data, nil)` |
| El esquema | `await gw.schema.search(text)` | `gw.Schema.Search(ctx, text)` |
| Un error | `error instanceof GatewayError && error.code === 'unique'` | `gateway.IsCode(err, gateway.CodeUnique)` |
| Cambios de los datos (`ws://`) | `await gw.subscribe({ entity }, listener)` | `gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: …}, listener)` |
| Cerrar | `await gw.close()` | `gw.Close()` |

## Node: @lambdaorm/client {#node-lambdaormclient}

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) tiene la misma interfaz que la librería
(`orm.execute`, `orm.plan`, `orm.executeScript`, …) y la ejecuta en un Data Gateway. La URL incluye la ruta del
esquema; `http(s)://` usa la API REST y `ws(s)://` la [API WebSocket](WebSocket.md).

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

Sobre WebSocket, todas las operaciones usan una única conexión persistente, y `orm.on` recibe las [notificaciones](WebSocket.md#notifications)
(`queue.completed`, `queue.failed`, `schema.statusChanged`):

```ts
await orm.init('ws://gateway:8083/iot/v1', { headers: { 'X-Api-Key': process.env.IOT_KEY } })
const stop = orm.on('schema.statusChanged', state => console.log(state.path, state.status, state.reason))
const products = await orm.execute('Products.filter(p => p.price > minPrice)', { minPrice: 50 })
// …
stop()
await orm.end()     // closes the connection
```

Con un único esquema en la raíz, la URL es la del gateway: `http://gateway:8080`.

## CLI {#cli}

La [CLI](../cli/index.md) ejecuta sus comandos localmente con un workspace (`-w`) o en un Data Gateway con `-u` y la
URL del esquema. Con autenticación bearer, el token se toma de la variable de entorno `SERVICE_TOKEN`:

```sh
export SERVICE_TOKEN=…
lambdaorm execute -q "Devices.filter(p => p.status == 'active')" -u http://gateway:8080/iot/v1
lambdaorm script -x "orm.execute(\"Devices.map(p => count(1))\")" -u http://gateway:8080/iot/v1
```

## Otros lenguajes {#other-languages}

El gateway sirve el documento OpenAPI 3 de la API REST en `/openapi.json` (Swagger UI en `/doc`): a partir de él se
puede generar un cliente para cualquier lenguaje con [OpenAPI Generator](https://openapi-generator.tech), o llamar a la
API con cualquier librería HTTP:

```python
import requests

rows = requests.post("http://gateway:8080/iot/v1/execute", headers={"X-Api-Key": key}, json={
    "query": "Devices.filter(p => p.status == status)",
    "data": {"status": "active"},
}).json()
```

## Agentes de IA {#ai-agents}

A través de [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web {#web}

El [IDE](../ide/index.md) del gateway, y [`@lambdaorm/ui`](../ide/Embedding.md) para incluir la UI en una
aplicación propia. El gateway no responde CORS: una aplicación web lo llama desde su backend.
