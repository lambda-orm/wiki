# Cambios de los datos

**Desde data-gateway 4.2.0.** Dos formas de enterarse de que los datos cambiaron, sin preguntar cada tanto:

- **[Suscripciones](#subscriptions):** a un cliente conectado a la gateway se le avisa, mientras está conectado, de las
  escrituras de una entidad, o recibe el resultado nuevo de una consulta cuando cambia algo que lee.
- **[El outbox](#the-outbox):** otros sistemas (un webhook, un topic de Kafka) reciben cada cambio de algunas
  entidades, **aunque la gateway se caiga**: λORM escribe el evento en la misma transacción que el cambio, y la gateway
  lo entrega, reintenta lo que falla y guarda lo que falla demasiado para revisarlo.

Las dos ven las escrituras que pasan por λORM (la gateway, o una aplicación con λORM sobre la misma base); un cambio
que otra aplicación hace directamente en la base no se ve.

## Suscripciones {#subscriptions}

### Por WebSocket {#over-websocket}

En una conexión [WebSocket](WebSocket.md), tres métodos:

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "subscribe.entity", "params": { "entity": "Orders" } }
← { "jsonrpc": "2.0", "id": 1, "result": { "subscription": "s1" } }
← { "jsonrpc": "2.0", "method": "data.changed", "params": { "subscription": "s1", "entity": "Orders", "action": "insert", "keys": [{ "id": 11078 }], "count": 1 } }

→ { "jsonrpc": "2.0", "id": 2, "method": "subscribe.query", "params": { "query": "Orders.filter(p => p.customerId == c).map(p => p.id)", "data": { "c": "ALFKI" } } }
← { "jsonrpc": "2.0", "id": 2, "result": { "subscription": "s2", "result": [10643, 10692, 10702] } }
← { "jsonrpc": "2.0", "method": "query.changed", "params": { "subscription": "s2", "result": [10643, 10692, 10702, 11079] } }

→ { "jsonrpc": "2.0", "id": 3, "method": "unsubscribe", "params": { "subscription": "s1" } }
```

- **`subscribe.entity`:** un `data.changed` por cada escritura de la entidad: su `action`, las `keys` de las filas
  cuando se conocen, y cuántas filas (`count`). **Nunca los datos:** los lee el cliente, con su vista.
- **`subscribe.query`:** la consulta corre en el momento (su resultado viene en la respuesta) y vuelve a correr cuando
  se escribe una de las entidades que lee (también por un `include` o una relación); un `query.changed` se manda
  **solo si el resultado cambió**. Muchas escrituras juntas la vuelven a correr a lo sumo una vez cada 200 ms. Una
  [consulta con nombre](Rest.md#named-queries) también: `{ "name": "customersOf", "data": { "country": "Germany" } }`.
- Una consulta que ya no puede correr (el schema cambió debajo de ella) manda `subscription.failed` con el `error` y
  su `message`, y la suscripción termina.
- Una suscripción vive lo que su conexión: se van todas cuando se cierra, y cuando vence su token la conexión se cierra
  ([JWT](Security.md#jwt)). Hasta 100 suscripciones por conexión.

### Por SSE {#over-sse}

Para el backend de un navegador o un proceso que no quiere WebSocket, el transporte [`http`](Rest.md) tiene
`GET /{schema}/subscribe` como Server-Sent Events, una suscripción por stream:

```sh
curl -N "http://localhost:8080/subscribe?entity=Orders" -H "X-Api-Key: $KEY"
# event: subscribed
# data: {"subscription":"s1"}
#
# event: data.changed
# data: {"subscription":"s1","entity":"Orders","action":"update","keys":[{"id":10248}],"count":1}

curl -N "http://localhost:8080/subscribe?query=Orders.filter(p%20%3D%3E%20p.customerId%20%3D%3D%20c).map(p%20%3D%3E%20p.id)&data=%7B%22c%22%3A%22ALFKI%22%7D" -H "X-Api-Key: $KEY"
curl -N "http://localhost:8080/subscribe?name=customersOf&data=%7B%22country%22%3A%22Germany%22%7D" -H "X-Api-Key: $KEY"
```

Los eventos son los de WebSocket (`event: data.changed`, `query.changed`, `subscription.failed`); un comentario cada 25
segundos mantiene abierto el stream a través de los proxies.

### Desde Node {#from-node}

Con una conexión `ws://`, el [cliente](Clients.md) tiene `gateway.subscribe`:

```ts
const gateway = await connect('ws://gateway:8083/', { apiKey: process.env.KEY })
const orders = await gateway.subscribe({ entity: 'Orders' }, event => console.log(event.action, event.keys))
const mine = await gateway.subscribe({ query: 'Orders.filter(p => p.customerId == c).map(p => p.id)', data: { c: 'ALFKI' } },
	event => console.log(event.result))
console.log(mine.result)          // el primer resultado
await orders.unsubscribe()
```

### Quién ve qué {#who-sees-what}

- **Permiso:** `read`. La consulta de `subscribe.query` se autoriza como un `execute`: una consulta que escribe no se
  suscribe.
- **La [vista](Security.md#views) de quien se suscribe:** una entidad que su vista excluye es `403 ViewError`; una
  consulta corre en su vista y con su contexto, cada vez.
- **Un cambio que no puede ver no le llega:** cuando su vista filtra las filas de la entidad (un tenant, un país), un
  `data.changed` lleva solo las claves que su vista ve, y no se manda ninguno si no ve ninguna. A un usuario de la vista
  de Alemania se le avisa de una escritura de `ALFKI`, no de una de `BLONP`.
- Con varias réplicas, cada una avisa de las escrituras hechas a través de ella (entre réplicas, con Redis, más
  adelante).

## El outbox {#the-outbox}

### Qué se escribe {#what-is-written}

El schema dice qué entidades dejan sus cambios en el outbox, en su `lambdaORM.yaml`
([λORM: eventos de datos](../usage/DataEvents.md#outbox)): λORM escribe un evento en la entidad `LambdaOrmOutbox`
**en la misma transacción** que el cambio, así un cambio nunca se pierde y nunca se manda sin haber ocurrido.

```yaml
# lambdaORM.yaml
infrastructure:
  outbox: { entities: [Orders], maxAttempts: 10 }
```

### A dónde va {#where-it-goes}

La [configuración](Configuration.md#reference) de la gateway dice a dónde van esos eventos, global o por schema:

```yaml
# data-gateway.config.yaml
orm:
  schemas:
    - path: shop
      outbox:
        interval: 1s                          # cada cuánto busca eventos pendientes
        batch: 100                            # cuántos por vuelta
        destinations:
          - type: webhook
            url: https://billing.example.com/hooks/orders
            secret: $BILLING_HOOK_SECRET      # firma cada request
            timeout: 5s
            entities: [Orders]                # opcional: solo estas
          - type: kafka
            topic: shop-changes               # con los brokers de infrastructure.queue del schema
```

Sin `infrastructure.outbox` en el schema, o sin destinos, no se despacha nada. Un evento es:

```json
{ "id": "0b1e…", "entity": "Orders", "action": "update", "keys": [{ "id": 10248 }], "actor": "backend", "tx": "…", "time": "2026-11-26T10:15:02.000Z" }
```

**nunca los datos** de la fila: quien lo recibe los lee, con una credencial propia.

- **Webhook:** un `POST` por evento, con los headers `X-Data-Gateway-Event` (su `id`: la clave de idempotencia),
  `X-Data-Gateway-Timestamp` (segundos desde 1970) y, con un `secret`, `X-Data-Gateway-Signature:
  sha256=<hex>`: el HMAC-SHA256 de `<timestamp>.<body>`. Un `2xx` es entregado; otro status, un timeout o un error de
  red es un fallo.
- **Kafka:** un mensaje por evento al `topic`, con la clave `<entity>:<keys>`, así los eventos de una fila quedan en
  orden en su partición.
- **Varios destinos:** un evento está entregado cuando lo aceptaron **todos** los que lo toman; si uno falla, se vuelve
  a intentar para todos. Un receptor debe ser idempotente: el `id` se lo permite.

Verificar la firma de un webhook:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

const verify = (secret: string, headers: Record<string, string>, body: string): boolean => {
	const timestamp = headers['x-data-gateway-timestamp']
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false      // de hace más de 5 minutos: rechazado
	const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
	const given = headers['x-data-gateway-signature'] ?? ''
	return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}
```

### Reintentos y eventos muertos {#retries-and-dead-events}

Lo que falla lo reintenta λORM, esperando más cada vez (1, 2, 4… segundos, una hora como mucho); después de
`maxAttempts` el evento queda `dead`, con su error. La [administración](Admin.md) los lista y los reintenta:

```sh
S="X-Data-Gateway-Session: $TOKEN"
curl "http://data-gateway:9090/admin/workspaces/shop/outbox?status=dead&limit=50" -H "$S"
curl -X POST http://data-gateway:9090/admin/workspaces/shop/outbox/0b1e…/retry -H "$S"     # de vuelta a pending
```

Listar necesita `schemaRead`; reintentar, `schemaRead` y `ddl`. `status` es `pending`, `failed`, `dead` (el valor por
defecto) o `done`. `/metrics` tiene `data_gateway_outbox_events{result="delivered|failed"}`.

### Una réplica despacha {#one-replica-dispatches}

λORM no bloquea los eventos: dos réplicas despachando entregarían algunos dos veces. Solo una debe hacerlo:
`outbox.dispatch: false` (o `DATA_GATEWAY_OUTBOX_DISPATCH=false`) en las otras. Con una réplica, el valor por defecto
(`true`) es el correcto.
