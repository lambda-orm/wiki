# Mudanças dos dados

**Desde o data-gateway 4.2.0.** Duas formas de saber que os dados mudaram, sem perguntar de tempos em tempos:

- **[Assinaturas](#subscriptions):** um cliente conectado ao gateway é avisado, enquanto está conectado, das escritas
  de uma entidade, ou recebe o novo resultado de uma consulta quando muda algo que ela lê.
- **[O outbox](#the-outbox):** outros sistemas (um webhook, um tópico do Kafka) recebem cada mudança de algumas
  entidades, **mesmo que o gateway caia**: o λORM escreve o evento na mesma transação da mudança, e o gateway o
  entrega, tenta de novo o que falha e guarda o que falha demais para ser revisado.

As duas veem as escritas que passam pelo λORM (o gateway, ou uma aplicação com λORM sobre o mesmo banco); uma mudança
que outra aplicação faz diretamente no banco não é vista.

## Assinaturas {#subscriptions}

### Por WebSocket {#over-websocket}

Numa conexão [WebSocket](WebSocket.md), três métodos:

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "subscribe.entity", "params": { "entity": "Orders" } }
← { "jsonrpc": "2.0", "id": 1, "result": { "subscription": "s1" } }
← { "jsonrpc": "2.0", "method": "data.changed", "params": { "subscription": "s1", "entity": "Orders", "action": "insert", "keys": [{ "id": 11078 }], "count": 1 } }

→ { "jsonrpc": "2.0", "id": 2, "method": "subscribe.query", "params": { "query": "Orders.filter(p => p.customerId == c).map(p => p.id)", "data": { "c": "ALFKI" } } }
← { "jsonrpc": "2.0", "id": 2, "result": { "subscription": "s2", "result": [10643, 10692, 10702] } }
← { "jsonrpc": "2.0", "method": "query.changed", "params": { "subscription": "s2", "result": [10643, 10692, 10702, 11079] } }

→ { "jsonrpc": "2.0", "id": 3, "method": "unsubscribe", "params": { "subscription": "s1" } }
```

- **`subscribe.entity`:** um `data.changed` para cada escrita da entidade: sua `action`, as `keys` das linhas quando
  são conhecidas, e quantas linhas (`count`). **Nunca os dados:** o cliente os lê, com a sua view.
- **`subscribe.query`:** a consulta roda na hora (seu resultado vem na resposta) e roda de novo quando é escrita uma
  das entidades que ela lê (também por um `include` ou uma relação); um `query.changed` é enviado **só se o resultado
  mudou**. Muitas escritas juntas a rodam de novo no máximo uma vez a cada 200 ms. Uma
  [consulta com nome](Rest.md#named-queries) também: `{ "name": "customersOf", "data": { "country": "Germany" } }`.
- Uma consulta que não pode mais rodar (o schema mudou por baixo dela) envia `subscription.failed` com o `error` e
  sua `message`, e a assinatura termina.
- Uma assinatura vive enquanto vive a sua conexão: todas vão embora quando ela fecha, e quando o seu token vence a
  conexão é fechada ([JWT](Security.md#jwt)). Até 100 assinaturas por conexão.

### Por SSE {#over-sse}

Para o backend de um navegador ou um processo que não quer WebSocket, o transporte [`http`](Rest.md) tem
`GET /{schema}/subscribe` como Server-Sent Events, uma assinatura por stream:

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

Os eventos são os do WebSocket (`event: data.changed`, `query.changed`, `subscription.failed`); um comentário a cada 25
segundos mantém o stream aberto através dos proxies.

### Do Node {#from-node}

Com uma conexão `ws://`, o [cliente](Clients.md) tem `gateway.subscribe`:

```ts
const gateway = await connect('ws://gateway:8083/', { apiKey: process.env.KEY })
const orders = await gateway.subscribe({ entity: 'Orders' }, event => console.log(event.action, event.keys))
const mine = await gateway.subscribe({ query: 'Orders.filter(p => p.customerId == c).map(p => p.id)', data: { c: 'ALFKI' } },
	event => console.log(event.result))
console.log(mine.result)          // o primeiro resultado
await orders.unsubscribe()
```

### Quem vê o quê {#who-sees-what}

- **Permissão:** `read`. A consulta de `subscribe.query` é autorizada como um `execute`: uma consulta que escreve não é
  assinada.
- **A [view](Security.md#views) de quem assina:** uma entidade que a sua view exclui é `403 ViewError`; uma consulta
  roda na sua view e com o seu contexto, toda vez.
- **Uma mudança que não pode ver não chega:** quando a sua view filtra as linhas da entidade (um tenant, um país), um
  `data.changed` leva só as chaves que a sua view vê, e nenhum é enviado se não vê nenhuma. Um usuário da view da
  Alemanha é avisado de uma escrita de `ALFKI`, não de uma de `BLONP`.
- Com várias réplicas, cada uma avisa das escritas feitas por ela; desde a 4.3.0, com
  [`cluster.valkey`](Configuration.md#cluster), das escritas de todas.

## O outbox {#the-outbox}

### O que é escrito {#what-is-written}

O schema diz quais entidades deixam as suas mudanças no outbox, no seu `lambdaORM.yaml`
([λORM: eventos de dados](../usage/DataEvents.md#outbox)): o λORM escreve um evento na entidade `LambdaOrmOutbox`
**na mesma transação** da mudança, então uma mudança nunca se perde e nunca é enviada sem ter acontecido.

```yaml
# lambdaORM.yaml
infrastructure:
  outbox: { entities: [Orders], maxAttempts: 10 }
```

### Para onde vai {#where-it-goes}

A [configuração](Configuration.md#reference) do gateway diz para onde vão esses eventos, global ou por schema:

```yaml
# data-gateway.config.yaml
orm:
  schemas:
    - path: shop
      outbox:
        interval: 1s                          # de quanto em quanto tempo procura eventos pendentes
        batch: 100                            # quantos por rodada
        destinations:
          - type: webhook
            url: https://billing.example.com/hooks/orders
            secret: $BILLING_HOOK_SECRET      # assina cada request
            timeout: 5s
            entities: [Orders]                # opcional: só estas
          - type: kafka
            topic: shop-changes               # com os brokers de infrastructure.queue do schema
```

Sem `infrastructure.outbox` no schema, ou sem destinos, nada é despachado. Um evento é:

```json
{ "id": "0b1e…", "entity": "Orders", "action": "update", "keys": [{ "id": 10248 }], "actor": "backend", "tx": "…", "time": "2026-11-26T10:15:02.000Z" }
```

**nunca os dados** da linha: quem o recebe os lê, com uma credencial própria.

- **Webhook:** um `POST` por evento, com os headers `X-Data-Gateway-Event` (o seu `id`: a chave de idempotência),
  `X-Data-Gateway-Timestamp` (segundos desde 1970) e, com um `secret`, `X-Data-Gateway-Signature:
  sha256=<hex>`: o HMAC-SHA256 de `<timestamp>.<body>`. Um `2xx` é entregue; outro status, um timeout ou um erro de
  rede é uma falha.
- **Kafka:** uma mensagem por evento para o `topic`, com a chave `<entity>:<keys>`, assim os eventos de uma linha ficam
  em ordem na sua partição.
- **Vários destinos:** um evento está entregue quando **todos** os que o tomam o aceitaram; se um falha, é tentado de
  novo para todos. Um receptor deve ser idempotente: o `id` permite isso.

Verificar a assinatura de um webhook:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

const verify = (secret: string, headers: Record<string, string>, body: string): boolean => {
	const timestamp = headers['x-data-gateway-timestamp']
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false      // de mais de 5 minutos atrás: recusado
	const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
	const given = headers['x-data-gateway-signature'] ?? ''
	return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}
```

### Novas tentativas e eventos mortos {#retries-and-dead-events}

O que falha o λORM tenta de novo, esperando mais a cada vez (1, 2, 4… segundos, uma hora no máximo); depois de
`maxAttempts` o evento fica `dead`, com o seu erro. A [administração](Admin.md) os lista e tenta de novo:

```sh
S="X-Data-Gateway-Session: $TOKEN"
curl "http://data-gateway:9090/admin/workspaces/shop/outbox?status=dead&limit=50" -H "$S"
curl -X POST http://data-gateway:9090/admin/workspaces/shop/outbox/0b1e…/retry -H "$S"     # de volta a pending
```

Listar precisa de `schemaRead`; tentar de novo, de `schemaRead` e `ddl`. `status` é `pending`, `failed`, `dead` (o
padrão) ou `done`. O `/metrics` tem `data_gateway_outbox_events{result="delivered|failed"}`.

### Uma réplica despacha {#one-replica-dispatches}

Desde a 4.3.0, com [`cluster.valkey`](Configuration.md#cluster), despacha a réplica que tem um lease no Valkey
(renovado a cada 5 s); se ela sair, outra o toma em até 15 s. Sem ele:
O λORM não bloqueia os eventos: duas réplicas despachando entregariam alguns duas vezes. Só uma deve fazê-lo:
`outbox.dispatch: false` (ou `DATA_GATEWAY_OUTBOX_DISPATCH=false`) nas outras. Com uma réplica, o padrão (`true`) é o
certo.
