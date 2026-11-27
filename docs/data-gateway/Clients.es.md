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

Cada uno paso a paso, en su propia página: [Node](ClientNode.md) y [Go](ClientGo.md).

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) es el
cliente de Node: una API sobre todos los transportes de datos del gateway, elegido por el esquema de la cadena de
conexión (`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` el MCP HTTP+SSE anterior,
`mcp+ws://` MCP sobre WebSocket), y el mismo código de error en todos. Pasa la suite de conformidad del gateway en cada
uno. Necesita Node 22 o posterior.

Paso a paso: [el cliente de Node](ClientNode.md).

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(paquete `gateway`) es el mismo cliente en Go: las mismas cadenas de conexión, los mismos cinco transportes, las mismas
operaciones y los mismos códigos de error, y pasa la misma suite de conformidad. Necesita Go 1.22 o posterior; su única
dependencia es [`github.com/coder/websocket`](https://github.com/coder/websocket).

Paso a paso: [el cliente de Go](ClientGo.md).

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
