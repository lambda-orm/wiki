# Clientes {#clients}

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

El gateway sirve el documento OpenAPI 3 de la API REST (`/doc`, `/api-docs`): a partir de él se puede generar un
cliente para cualquier lenguaje con [OpenAPI Generator](https://openapi-generator.tech).

## Agentes de IA {#ai-agents}

A través de [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web {#web}

La [UI](Ui.md) del gateway, y [`@lambdaorm/ui`](Ui.md#in-your-own-application) para incluirla en una aplicación
propia.
