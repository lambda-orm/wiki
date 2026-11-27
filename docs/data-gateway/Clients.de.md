# Clients {#clients}

Ein Data Gateway ist schlichtes HTTP, WebSocket und MCP: Jede Sprache kann es aufrufen. Diese Seite listet die dafür
gemachten Clients auf: die Node- und Go-Clients, die CLI, einen aus seinem OpenAPI-Dokument generierten Client und einen
KI-Agenten über MCP.

## Node: @lambdaorm/data-gateway-client-node {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) ist der
Node-Client: eine API über jeden Datentransport des Gateways, gewählt über das Schema der Verbindungszeichenfolge
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` das ältere MCP HTTP+SSE,
`mcp+ws://` MCP über WebSocket), und derselbe Fehlercode auf allen. Er besteht die Konformitätssuite des Gateways auf
jedem davon. Er braucht Node 22 oder neuer.

### In einem Projekt {#node-in-a-project}

Das Projekt anlegen und den Client hinzufügen (TypeScript und `tsx` nur, um es in TypeScript zu schreiben):

```sh
mkdir shop && cd shop
npm init -y
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node
```

Verbindungszeichenfolge und Anmeldedaten bleiben außerhalb des Codes, in der Umgebung:

```sh
export DATA_GATEWAY_URL=http://gateway:8080/northwind
export DATA_GATEWAY_API_KEY=…
```

Eine Verbindung für die ganze Anwendung, beim ersten Bedarf geöffnet, in `src/gateway.ts`:

```ts
import { connect, DataGatewayClient } from '@lambdaorm/data-gateway-client-node'

let client: Promise<DataGatewayClient> | undefined

/** die Verbindung der Anwendung (DATA_GATEWAY_URL, DATA_GATEWAY_API_KEY): einmal geöffnet, dann geteilt */
export const gateway = (): Promise<DataGatewayClient> =>
	(client ??= connect().catch(error => { client = undefined; throw error }))

export const closeGateway = async (): Promise<void> => {
	if (client) await (await client).close()
}
```

Die Abfragen, mit dem Typ ihres Ergebnisses, in `src/products.ts`:

```ts
import { GatewayError } from '@lambdaorm/data-gateway-client-node'
import { gateway } from './gateway'

export interface Product { name: string, price: number }

export const expensiveProducts = async (minPrice: number): Promise<Product[]> =>
	(await gateway()).execute<Product[]>(
		'Products.filter(p => p.price > minPrice).map(p => ({ name: p.name, price: p.price })).sort(p => desc(p.price)).page(1, 3)',
		{ minPrice })

/** false, wenn die Kategorie schon existiert */
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

Und `src/index.ts`, das die Verbindung am Ende schließt:

```ts
import { closeGateway } from './gateway'
import { expensiveProducts } from './products'

const main = async () => {
	console.log(await expensiveProducts(50))
}

main().finally(closeGateway)
```

```sh
npx tsx src/index.ts
```

Ein Server hält die Verbindung offen, solange er läuft, und schließt sie beim Beenden (`process.on('SIGTERM', …)`). In
JavaScript wird das Paket genauso importiert, mit `import` oder mit `require`.

### Was er noch kann {#node-more}

Seit 4.1.0 kann `token` eine Funktion sein, die ihn liefert (`token: () => idp.accessToken()`), abgefragt bei jeder
Anfrage über REST und MCP und beim Öffnen eines WebSocket: das [JWT](Security.md#jwt) eines Identitätsanbieters,
erneuert. Und `gateway.queries()` listet die [benannten Abfragen](Rest.md#named-queries), die die Anmeldedaten nutzen
dürfen, `gateway.query(name, data)` führt eine aus, auf jedem Transport. Seit 4.2.0 erfährt über eine `ws://`-Verbindung
`gateway.subscribe({ entity } | { query, data } | { name, data }, listener)` von den
[Datenänderungen](Changes.md#from-node). Seit 4.3.0 sagt `isApprovalPending(result)`, ob ein Schreibvorgang
[auf eine Person wartet](Security.md#approvals), und `gateway.approval(id)` seinen Zustand, auf jedem Transport.

Die Anmeldedaten stehen in den Optionen (`apiKey`, `token` oder beliebige `headers`) oder in `DATA_GATEWAY_API_KEY` /
`DATA_GATEWAY_TOKEN`, nie in der URL (Anmeldedaten darin sind ein Fehler); `DATA_GATEWAY_URL` ist die
Verbindungszeichenfolge, wenn `connect()` keine erhält, und die URL kann `?timeout=<ms>` und `?stage=<stage>` tragen.
Die Fehler haben einen `code`, der auf jedem Transport gleich ist: `invalid`, `unauthorized`, `forbidden`, `not_found`,
`unique`, `foreign_key`, `timeout`, `unavailable`, `truncated` (MCP, eine bei `mcp.maxRows` abgeschnittene Liste), … Sein [README](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) enthält die ganze API und
die Codes. `@lambdaorm/client` weiter unten funktioniert weiter; die CLI wechselt zum neuen Client.

## Go: github.com/lambda-orm/data-gateway-client-go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(Paket `gateway`) ist derselbe Client in Go: dieselben Verbindungszeichenfolgen, dieselben fünf Transporte, dieselben
Operationen und dieselben Fehlercodes, und er besteht dieselbe Konformitätssuite. Er braucht Go 1.22 oder neuer; seine
einzige Abhängigkeit ist [`github.com/coder/websocket`](https://github.com/coder/websocket).

### In einem Projekt {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
go get github.com/lambda-orm/data-gateway-client-go
```

Mit denselben `DATA_GATEWAY_URL` und `DATA_GATEWAY_API_KEY` in der Umgebung, `main.go`:

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

	// "" nimmt DATA_GATEWAY_URL; den Schlüssel DATA_GATEWAY_API_KEY (oder gateway.WithAPIKey)
	gw, err := gateway.Connect(ctx, "")
	if err != nil {
		log.Fatal(err)
	}
	defer gw.Close()

	products, err := gateway.ExecuteInto[[]Product](ctx, gw,
		"Products.filter(p => p.price > minPrice).map(p => ({ name: p.name, price: p.price })).sort(p => desc(p.price)).page(1, 3)",
		map[string]any{"minPrice": 50}, nil)
	var e *gateway.Error
	if errors.As(err, &e) {
		log.Fatalf("%s (%s): %s", e.Code, e.Name, e.Message)
	}
	for _, p := range products {
		fmt.Printf("%s %.2f\n", p.Name, p.Price)
	}
}
```

```sh
go run .
```

`ExecuteInto[T]` dekodiert das Ergebnis in einen Typ (ein Struct über seine `json`-Tags, ein Slice davon); `Execute`
liefert es als `any`. Jede Operation nimmt einen `context.Context`, der sie vor dem Timeout der Verbindung beenden
kann.

In einem Server bedient ein `*gateway.Client` die ganze Anwendung (er ist nebenläufig nutzbar), und jede Anfrage gibt
ihren eigenen Kontext mit:

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

### Was er noch kann {#go-more}

Die Optionen von `Connect`: `WithAPIKey`, `WithAPIKeyHeader`, `WithToken`, `WithTokenFunc` (das Token eines
Identitätsanbieters, bei jeder Anfrage abgefragt), `WithHeader`, `WithTimeout` (standardmäßig 30 s), `WithStage` und
`WithTruncatedRows` (MCP: die bei `mcp.maxRows` abgeschnittenen Zeilen statt des Fehlers `truncated`). Der Rest der API
ist der von Node mit den Namen von Go: `ExecuteScript`, `ExecuteQueued`, `Plan`, `Metadata`, `Queries`, `Query`,
`Approval`, `Whoami`, `gw.Schema.Search`, `gw.Stage.Export`, `gw.General.Health`, … Über eine `ws://`-Verbindung
erfährt `Subscribe` von den [Datenänderungen](Changes.md), und `On` empfängt die [Benachrichtigungen](WebSocket.md#notifications):

```go
sub, err := gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: "Orders"}, func(e gateway.Event) {
	log.Println(e.Type, e.Params["action"]) // in der Goroutine, die den Socket liest: nicht blockieren
})
if err != nil {
	log.Fatal(err)
}
defer sub.Unsubscribe(ctx)
```

## Node und Go nebeneinander {#side-by-side}

| | Node | Go |
| --- | --- | --- |
| Verbinden | `const gw = await connect(url, { apiKey })` | `gw, err := gateway.Connect(ctx, url, gateway.WithAPIKey(key))` |
| Eine Abfrage | `await gw.execute<Product[]>(query, data)` | `gateway.ExecuteInto[[]Product](ctx, gw, query, data, nil)` |
| Ein Skript | `await gw.executeScript(script, data)` | `gw.ExecuteScript(ctx, script, data, nil)` |
| Eine benannte Abfrage | `await gw.query(name, data)` | `gw.Query(ctx, name, data, nil)` |
| Das Schema | `await gw.schema.search(text)` | `gw.Schema.Search(ctx, text)` |
| Ein Fehler | `error instanceof GatewayError && error.code === 'unique'` | `gateway.IsCode(err, gateway.CodeUnique)` |
| Datenänderungen (`ws://`) | `await gw.subscribe({ entity }, listener)` | `gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: …}, listener)` |
| Schließen | `await gw.close()` | `gw.Close()` |

## Node: @lambdaorm/client {#node-lambdaormclient}

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) hat dieselbe Schnittstelle wie die Bibliothek
(`orm.execute`, `orm.plan`, `orm.executeScript`, …) und führt sie auf einem Data Gateway aus. Die URL enthält die Route
des Schemas; `http(s)://` verwendet die REST API und `ws(s)://` die [WebSocket API](WebSocket.md).

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

Über WebSocket verwenden alle Operationen eine einzige dauerhafte Verbindung, und `orm.on` empfängt die
[Benachrichtigungen](WebSocket.md#notifications) (`queue.completed`, `queue.failed`, `schema.statusChanged`):

```ts
await orm.init('ws://gateway:8083/iot/v1', { headers: { 'X-Api-Key': process.env.IOT_KEY } })
const stop = orm.on('schema.statusChanged', state => console.log(state.path, state.status, state.reason))
const products = await orm.execute('Products.filter(p => p.price > minPrice)', { minPrice: 50 })
// …
stop()
await orm.end()     // closes the connection
```

Mit einem einzigen Schema an der Wurzel ist die URL die des Gateways: `http://gateway:8080`.

## CLI {#cli}

Die [CLI](../cli/index.md) führt ihre Befehle lokal mit einem Workspace (`-w`) oder auf einem Data Gateway mit `-u` und
der URL des Schemas aus. Bei Bearer-Authentifizierung wird das Token aus der Umgebungsvariablen `SERVICE_TOKEN`
gelesen:

```sh
export SERVICE_TOKEN=…
lambdaorm execute -q "Devices.filter(p => p.status == 'active')" -u http://gateway:8080/iot/v1
lambdaorm script -x "orm.execute(\"Devices.map(p => count(1))\")" -u http://gateway:8080/iot/v1
```

## Andere Sprachen {#other-languages}

Das OpenAPI-3-Dokument der REST API wird vom Gateway unter `/openapi.json` bereitgestellt (Swagger UI unter `/doc`):
Daraus lässt sich mit [OpenAPI Generator](https://openapi-generator.tech) ein Client für jede Sprache generieren, oder
die API wird mit einer beliebigen HTTP-Bibliothek aufgerufen:

```python
import requests

rows = requests.post("http://gateway:8080/iot/v1/execute", headers={"X-Api-Key": key}, json={
    "query": "Devices.filter(p => p.status == status)",
    "data": {"status": "active"},
}).json()
```

## KI-Agenten {#ai-agents}

Über [MCP](Mcp.md):

```sh
claude mcp add --transport http iot-v1 http://gateway:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

## Web {#web}

Die [IDE](../ide/index.md) des Gateways sowie [`@lambdaorm/ui`](../ide/Embedding.md), um sie in eine eigene Anwendung
einzubauen. Das Gateway beantwortet kein CORS: Eine Webanwendung ruft es aus ihrem Backend auf.
