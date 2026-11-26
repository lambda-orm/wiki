# Datenänderungen

**Seit data-gateway 4.2.0.** Zwei Wege zu erfahren, dass sich die Daten geändert haben, ohne immer wieder zu fragen:

- **[Abonnements](#subscriptions):** Ein mit dem Gateway verbundener Client erfährt, solange er verbunden ist, von den
  Schreibvorgängen einer Entität, oder er bekommt das neue Ergebnis einer Abfrage, wenn sich etwas ändert, das sie
  liest.
- **[Die Outbox](#the-outbox):** Andere Systeme (ein Webhook, ein Kafka-Topic) erhalten jede Änderung bestimmter
  Entitäten, **auch wenn das Gateway ausfällt**: λORM schreibt das Ereignis in derselben Transaktion wie die Änderung,
  und das Gateway stellt es zu, wiederholt, was fehlschlägt, und hebt auf, was zu oft fehlschlägt, damit es geprüft
  wird.

Beide sehen die Schreibvorgänge, die über λORM laufen (das Gateway, oder eine Anwendung mit λORM auf derselben
Datenbank); eine Änderung, die eine andere Anwendung direkt in der Datenbank macht, wird nicht gesehen.

## Abonnements {#subscriptions}

### Über WebSocket {#over-websocket}

Auf einer [WebSocket](WebSocket.md)-Verbindung gibt es drei Methoden:

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "subscribe.entity", "params": { "entity": "Orders" } }
← { "jsonrpc": "2.0", "id": 1, "result": { "subscription": "s1" } }
← { "jsonrpc": "2.0", "method": "data.changed", "params": { "subscription": "s1", "entity": "Orders", "action": "insert", "keys": [{ "id": 11078 }], "count": 1 } }

→ { "jsonrpc": "2.0", "id": 2, "method": "subscribe.query", "params": { "query": "Orders.filter(p => p.customerId == c).map(p => p.id)", "data": { "c": "ALFKI" } } }
← { "jsonrpc": "2.0", "id": 2, "result": { "subscription": "s2", "result": [10643, 10692, 10702] } }
← { "jsonrpc": "2.0", "method": "query.changed", "params": { "subscription": "s2", "result": [10643, 10692, 10702, 11079] } }

→ { "jsonrpc": "2.0", "id": 3, "method": "unsubscribe", "params": { "subscription": "s1" } }
```

- **`subscribe.entity`:** ein `data.changed` für jeden Schreibvorgang der Entität: ihre `action`, die `keys` der
  Zeilen, wenn sie bekannt sind, und wie viele Zeilen (`count`). **Nie die Daten:** Der Client liest sie, mit seiner
  View.
- **`subscribe.query`:** Die Abfrage läuft sofort (ihr Ergebnis steht in der Antwort) und läuft erneut, wenn eine der
  Entitäten geschrieben wird, die sie liest (auch über ein `include` oder eine Relation); ein `query.changed` wird
  **nur gesendet, wenn sich das Ergebnis geändert hat**. Viele Schreibvorgänge zusammen lassen sie höchstens einmal
  alle 200 ms erneut laufen. Auch eine [benannte Abfrage](Rest.md#named-queries):
  `{ "name": "customersOf", "data": { "country": "Germany" } }`.
- Eine Abfrage, die nicht mehr laufen kann (das Schema hat sich unter ihr geändert), sendet `subscription.failed` mit
  dem `error` und seiner `message`, und das Abonnement endet.
- Ein Abonnement lebt so lange wie seine Verbindung: Alle enden, wenn sie geschlossen wird, und wenn ihr Token abläuft,
  wird die Verbindung geschlossen ([JWT](Security.md#jwt)). Bis zu 100 Abonnements pro Verbindung.

### Über SSE {#over-sse}

Für das Backend eines Browsers oder einen Prozess, der kein WebSocket will, hat der Transport [`http`](Rest.md)
`GET /{schema}/subscribe` als Server-Sent Events, ein Abonnement pro Stream:

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

Die Ereignisse sind die von WebSocket (`event: data.changed`, `query.changed`, `subscription.failed`); ein Kommentar
alle 25 Sekunden hält den Stream über Proxys offen.

### Aus Node {#from-node}

Mit einer `ws://`-Verbindung hat der [Client](Clients.md) `gateway.subscribe`:

```ts
const gateway = await connect('ws://gateway:8083/', { apiKey: process.env.KEY })
const orders = await gateway.subscribe({ entity: 'Orders' }, event => console.log(event.action, event.keys))
const mine = await gateway.subscribe({ query: 'Orders.filter(p => p.customerId == c).map(p => p.id)', data: { c: 'ALFKI' } },
	event => console.log(event.result))
console.log(mine.result)          // das erste Ergebnis
await orders.unsubscribe()
```

### Wer was sieht {#who-sees-what}

- **Berechtigung:** `read`. Die Abfrage von `subscribe.query` wird wie ein `execute` autorisiert: Eine Abfrage, die
  schreibt, wird nicht abonniert.
- **Die [View](Security.md#views) dessen, der abonniert:** Eine Entität, die seine View ausschließt, ist
  `403 ViewError`; eine Abfrage läuft jedes Mal in seiner View und mit seinem Kontext.
- **Eine Änderung, die er nicht sehen kann, erreicht ihn nicht:** Wenn seine View die Zeilen der Entität filtert (ein
  Mandant, ein Land), trägt ein `data.changed` nur die Schlüssel, die seine View sieht, und es wird keines gesendet,
  wenn er keinen davon sieht. Ein Benutzer der View für Deutschland erfährt von einem Schreibvorgang von `ALFKI`, nicht
  von einem von `BLONP`.
- Bei mehreren Replikas meldet jede die Schreibvorgänge, die über sie laufen; seit 4.3.0 mit
  [`cluster.valkey`](Configuration.md#cluster) die aller Replikas.

## Die Outbox {#the-outbox}

### Was geschrieben wird {#what-is-written}

Das Schema sagt in seiner `lambdaORM.yaml`, welche Entitäten ihre Änderungen in der Outbox hinterlassen
([λORM: Datenereignisse](../usage/DataEvents.md#outbox)): λORM schreibt ein Ereignis in die Entität `LambdaOrmOutbox`
**in derselben Transaktion** wie die Änderung, so geht eine Änderung nie verloren und wird nie gesendet, ohne passiert
zu sein.

```yaml
# lambdaORM.yaml
infrastructure:
  outbox: { entities: [Orders], maxAttempts: 10 }
```

### Wohin es geht {#where-it-goes}

Die [Konfiguration](Configuration.md#reference) des Gateways sagt, wohin diese Ereignisse gehen, global oder pro
Schema:

```yaml
# data-gateway.config.yaml
orm:
  schemas:
    - path: shop
      outbox:
        interval: 1s                          # wie oft nach ausstehenden Ereignissen gesucht wird
        batch: 100                            # wie viele pro Runde
        destinations:
          - type: webhook
            url: https://billing.example.com/hooks/orders
            secret: $BILLING_HOOK_SECRET      # signiert jede Anfrage
            timeout: 5s
            entities: [Orders]                # optional: nur diese
          - type: kafka
            topic: shop-changes               # mit den Brokern aus infrastructure.queue des Schemas
```

Ohne `infrastructure.outbox` im Schema, oder ohne Ziele, wird nichts zugestellt. Ein Ereignis ist:

```json
{ "id": "0b1e…", "entity": "Orders", "action": "update", "keys": [{ "id": 10248 }], "actor": "backend", "tx": "…", "time": "2026-11-26T10:15:02.000Z" }
```

**nie die Daten** der Zeile: Wer es empfängt, liest sie mit einer eigenen Berechtigung.

- **Webhook:** ein `POST` pro Ereignis, mit den Headern `X-Data-Gateway-Event` (seine `id`: der Schlüssel der
  Idempotenz), `X-Data-Gateway-Timestamp` (Sekunden seit 1970) und, mit einem `secret`, `X-Data-Gateway-Signature:
  sha256=<hex>`: der HMAC-SHA256 von `<timestamp>.<body>`. Ein `2xx` ist zugestellt; ein anderer Status, ein Timeout
  oder ein Netzwerkfehler ist ein Fehlschlag.
- **Kafka:** eine Nachricht pro Ereignis an das `topic`, mit dem Schlüssel `<entity>:<keys>`, so liegen die Ereignisse
  einer Zeile in ihrer Partition in Reihenfolge.
- **Mehrere Ziele:** Ein Ereignis ist zugestellt, wenn **alle**, die es nehmen, es angenommen haben; schlägt eines fehl,
  wird es für alle wiederholt. Ein Empfänger muss idempotent sein: Die `id` ermöglicht das.

Die Signatur eines Webhooks prüfen:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

const verify = (secret: string, headers: Record<string, string>, body: string): boolean => {
	const timestamp = headers['x-data-gateway-timestamp']
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false      // älter als 5 Minuten: abgelehnt
	const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
	const given = headers['x-data-gateway-signature'] ?? ''
	return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}
```

### Wiederholungen und tote Ereignisse {#retries-and-dead-events}

Was fehlschlägt, wiederholt λORM und wartet jedes Mal länger (1, 2, 4 … Sekunden, höchstens eine Stunde); nach
`maxAttempts` ist das Ereignis `dead`, mit seinem Fehler. Die [Administration](Admin.md) listet und wiederholt sie:

```sh
S="X-Data-Gateway-Session: $TOKEN"
curl "http://data-gateway:9090/admin/workspaces/shop/outbox?status=dead&limit=50" -H "$S"
curl -X POST http://data-gateway:9090/admin/workspaces/shop/outbox/0b1e…/retry -H "$S"     # zurück auf pending
```

Auflisten braucht `schemaRead`; Wiederholen `schemaRead` und `ddl`. `status` ist `pending`, `failed`, `dead` (der
Standard) oder `done`. `/metrics` hat `data_gateway_outbox_events{result="delivered|failed"}`.

### Eine Replika stellt zu {#one-replica-dispatches}

Seit 4.3.0 stellt mit [`cluster.valkey`](Configuration.md#cluster) die Replika zu, die einen Lease im Valkey hält
(alle 5 s erneuert); geht sie, übernimmt eine andere in höchstens 15 s. Ohne ihn:
λORM sperrt die Ereignisse nicht: Zwei zustellende Replikas würden manche doppelt zustellen. Nur eine soll es tun:
`outbox.dispatch: false` (oder `DATA_GATEWAY_OUTBOX_DISPATCH=false`) in den anderen. Mit einer Replika ist der
Standard (`true`) richtig.
