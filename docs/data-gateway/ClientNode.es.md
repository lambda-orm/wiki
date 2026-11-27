# Cliente de Node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) es el
cliente de Node: una API sobre todos los transportes de datos del gateway, elegido por el esquema de la cadena de
conexión (`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` el MCP HTTP+SSE anterior,
`mcp+ws://` MCP sobre WebSocket), y el mismo código de error en todos. Pasa la suite de conformidad del gateway en cada
uno. Necesita Node 22 o posterior.

## Antes de empezar {#before-you-start}

Estos pasos usan el gateway de [Primeros pasos](GettingStarted.md) (Northwind,
sus pasos 1 a 3: `docker compose up -d` y los datos importados):

| Transporte | Cadena de conexión | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | la opción por defecto |
| WebSocket | `ws://localhost:8083/` | una conexión para todas las operaciones; suscripciones y notificaciones |
| MCP | `mcp+http://localhost:8081/` | cuando solo está abierto el puerto del MCP |

El camino después del puerto es la **ruta del esquema**: `/` ahí, porque ese ejemplo sirve un solo esquema en la raíz;
en un gateway con varios, `http://gateway:8080/iot/v1`. Las credenciales son sus claves `reader-demo-key` (lee) y
`backend-demo-key` (también escribe).

## 1. Crear el proyecto {#node-in-a-project}

```sh
mkdir shop && cd shop
npm init -y
npm pkg set type=module
```

## 2. Instalar el cliente

```sh
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node        # solo para escribirlo en TypeScript
```

## 3. Decir dónde está el gateway

La cadena de conexión y la credencial quedan fuera del código, en el entorno (o en un `.env` que lea la aplicación); el
cliente las toma de ahí:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. Una conexión para la aplicación

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

## 5. Las consultas

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

## 6. Ejecutarlo

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

## 7. Escribir, y los errores

Con la clave que escribe, de nuevo:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key npx tsx src/index.ts
```

Ahora `addCategory('Beverages')` responde `false` (la última línea): la categoría existe, la base de datos la rechaza y
el cliente da el código `unique`, sea cual sea la base (Postgres `23505`, MySQL `ER_DUP_ENTRY`…). Se decide por
`error.code`; `errorName`, `status`, `dbCode` y `suggestions` (los nombres más cercanos, para un nombre que no existe)
dicen más.

## 8. Otro transporte

Solo cambia la cadena de conexión; el código y los resultados son los mismos:

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ npx tsx src/index.ts          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ npx tsx src/index.ts    # MCP
```

Un servidor mantiene la conexión abierta mientras corre y la cierra al detenerse (`process.on('SIGTERM', …)`). Los
imports de los archivos del proyecto dicen `.js` (`./gateway.js`), como lo pide TypeScript en un módulo ES; en CommonJS
el paquete se importa con `require`, la misma API.

## Qué más hace {#node-more}

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
