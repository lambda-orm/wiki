# Data changes

**Since data-gateway 4.2.0.** Two ways to learn that the data changed, without asking every so often:

- **[Subscriptions](#subscriptions):** a client connected to the gateway is told, while it is connected, of the writes
  of an entity, or gets the new result of a query when something it reads changes.
- **[The outbox](#the-outbox):** other systems (a webhook, a Kafka topic) receive every change of some entities,
  **even if the gateway falls**: λORM writes the event in the same transaction as the change, and the gateway delivers
  it, retries what fails and keeps what fails too often to be looked at.

Both see the writes that go through λORM (the gateway, or an application with λORM on the same database); a change
made by another application directly in the database is not seen.

## Subscriptions {#subscriptions}

### Over WebSocket

On a [WebSocket](WebSocket.md) connection, three methods:

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "subscribe.entity", "params": { "entity": "Orders" } }
← { "jsonrpc": "2.0", "id": 1, "result": { "subscription": "s1" } }
← { "jsonrpc": "2.0", "method": "data.changed", "params": { "subscription": "s1", "entity": "Orders", "action": "insert", "keys": [{ "id": 11078 }], "count": 1 } }

→ { "jsonrpc": "2.0", "id": 2, "method": "subscribe.query", "params": { "query": "Orders.filter(p => p.customerId == c).map(p => p.id)", "data": { "c": "ALFKI" } } }
← { "jsonrpc": "2.0", "id": 2, "result": { "subscription": "s2", "result": [10643, 10692, 10702] } }
← { "jsonrpc": "2.0", "method": "query.changed", "params": { "subscription": "s2", "result": [10643, 10692, 10702, 11079] } }

→ { "jsonrpc": "2.0", "id": 3, "method": "unsubscribe", "params": { "subscription": "s1" } }
```

- **`subscribe.entity`:** a `data.changed` for each write of the entity: its `action`, the `keys` of the rows when
  they are known, and how many rows (`count`). **Never the data:** the client reads them, with its view.
- **`subscribe.query`:** the query runs at once (its result is in the answer) and runs again when one of the entities
  it reads is written (also through an `include` or a relation); a `query.changed` is sent **only if the result
  changed**. Many writes together run it again at most once every 200 ms. A [named query](Rest.md#named-queries) too:
  `{ "name": "customersOf", "data": { "country": "Germany" } }`.
- A query that can no longer run (the schema changed under it) sends `subscription.failed` with the `error` and its
  `message`, and the subscription ends.
- A subscription lives as long as its connection: they all go when it closes, and when its token expires the
  connection is closed ([JWT](Security.md#jwt)). Up to 100 subscriptions per connection.

### Over SSE

For a browser's backend or a process that doesn't want WebSocket, the [`http`](Rest.md) transport has
`GET /{schema}/subscribe` as Server-Sent Events, one subscription per stream:

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

The events are those of WebSocket (`event: data.changed`, `query.changed`, `subscription.failed`); a comment every 25
seconds keeps the stream open through proxies.

### From Node

With a `ws://` connection, the [client](Clients.md) has `gateway.subscribe`:

```ts
const gateway = await connect('ws://gateway:8083/', { apiKey: process.env.KEY })
const orders = await gateway.subscribe({ entity: 'Orders' }, event => console.log(event.action, event.keys))
const mine = await gateway.subscribe({ query: 'Orders.filter(p => p.customerId == c).map(p => p.id)', data: { c: 'ALFKI' } },
	event => console.log(event.result))
console.log(mine.result)          // the first result
await orders.unsubscribe()
```

### Who sees what

- **Permission:** `read`. The query of `subscribe.query` is authorized as an `execute`: a query that writes is not
  subscribed.
- **The [view](Security.md#views) of who subscribes:** an entity its view excludes is `403 ViewError`; a query runs in
  its view and with its context, every time.
- **A change it can't see doesn't reach it:** when its view filters the rows of the entity (a tenant, a country), a
  `data.changed` carries only the keys its view sees, and none is sent if it sees none of them. A user of the view of
  Germany is told of a write of `ALFKI`, not of one of `BLONP`.
- With several replicas, each one tells of the writes made through it; since 4.3.0, with
  [`cluster.valkey`](Configuration.md#cluster), of the writes of every replica.

## The outbox {#the-outbox}

### What is written

The schema says which entities leave their changes in the outbox, in its `lambdaORM.yaml`
([λORM: data events](../usage/DataEvents.md#outbox)): λORM writes an event in the entity `LambdaOrmOutbox` **in the same
transaction** as the change, so a change is never lost and never sent without having happened.

```yaml
# lambdaORM.yaml
infrastructure:
  outbox: { entities: [Orders], maxAttempts: 10 }
```

### Where it goes

The gateway's [configuration](Configuration.md#reference) says where those events go, globally or per schema:

```yaml
# data-gateway.config.yaml
orm:
  schemas:
    - path: shop
      outbox:
        interval: 1s                          # how often it looks for pending events
        batch: 100                            # how many per round
        destinations:
          - type: webhook
            url: https://billing.example.com/hooks/orders
            secret: $BILLING_HOOK_SECRET      # signs each request
            timeout: 5s
            entities: [Orders]                # optional: only these
          - type: kafka
            topic: shop-changes               # with the brokers of infrastructure.queue of the schema
```

Without `infrastructure.outbox` in the schema, or without destinations, nothing is dispatched. An event is:

```json
{ "id": "0b1e…", "entity": "Orders", "action": "update", "keys": [{ "id": 10248 }], "actor": "backend", "tx": "…", "time": "2026-11-26T10:15:02.000Z" }
```

**never the data** of the row: who receives it reads them, with a credential of its own.

- **Webhook:** a `POST` per event, with the headers `X-Data-Gateway-Event` (its `id`: the key of idempotency),
  `X-Data-Gateway-Timestamp` (seconds since 1970) and, with a `secret`, `X-Data-Gateway-Signature:
  sha256=<hex>`: the HMAC-SHA256 of `<timestamp>.<body>`. A `2xx` is delivered; another status, a timeout or a network
  error is a failure.
- **Kafka:** a message per event to the `topic`, with the key `<entity>:<keys>`, so the events of a row are in order in
  their partition.
- **Several destinations:** an event is delivered when **all** that take it accepted it; if one fails, it is tried
  again for all of them. A receiver must be idempotent: the `id` lets it.

Checking the signature of a webhook:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

const verify = (secret: string, headers: Record<string, string>, body: string): boolean => {
	const timestamp = headers['x-data-gateway-timestamp']
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false      // older than 5 minutes: refused
	const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
	const given = headers['x-data-gateway-signature'] ?? ''
	return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}
```

### Retries and dead events

What fails is retried by λORM, waiting more each time (1, 2, 4… seconds, an hour at most); after `maxAttempts` the
event is `dead`, with its error. The [administration](Admin.md) lists and retries them:

```sh
S="X-Data-Gateway-Session: $TOKEN"
curl "http://data-gateway:9090/admin/workspaces/shop/outbox?status=dead&limit=50" -H "$S"
curl -X POST http://data-gateway:9090/admin/workspaces/shop/outbox/0b1e…/retry -H "$S"     # back to pending
```

Listing needs `schemaRead`; retrying, `schemaRead` and `ddl`. `status` is `pending`, `failed`, `dead` (the default)
or `done`. `/metrics` has `data_gateway_outbox_events{result="delivered|failed"}`.

### One replica dispatches

Since 4.3.0, with [`cluster.valkey`](Configuration.md#cluster), the replica that holds a lease in the Valkey
dispatches (renewed every 5 s); when it goes, another takes it in 15 s at most. Without it:
λORM doesn't lock the events: two replicas dispatching would deliver some twice. Only one should:
`outbox.dispatch: false` (or `DATA_GATEWAY_OUTBOX_DISPATCH=false`) in the others. With one replica, the default
(`true`) is right.
