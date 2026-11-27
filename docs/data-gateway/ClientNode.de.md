# Node-Client {#node}

[`@lambdaorm/data-gateway-client-node`](https://www.npmjs.com/package/@lambdaorm/data-gateway-client-node) ist der
Node-Client: eine API über jeden Datentransport des Gateways, gewählt über das Schema der Verbindungszeichenfolge
(`http://` REST, `ws://` WebSocket, `mcp+http://` MCP Streamable HTTP, `mcp+sse://` das ältere MCP HTTP+SSE,
`mcp+ws://` MCP über WebSocket), und derselbe Fehlercode auf allen. Er besteht die Konformitätssuite des Gateways auf
jedem davon. Er braucht Node 22 oder neuer.

## Vorbereitung {#before-you-start}

Diese Schritte nutzen das Gateway aus
[Erste Schritte](GettingStarted.md) (Northwind, seine Schritte 1 bis 3: `docker compose up -d` und die Daten
importiert):

| Transport | Verbindungszeichenfolge | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | die Standardwahl |
| WebSocket | `ws://localhost:8083/` | eine Verbindung für alle Operationen; Abonnements und Benachrichtigungen |
| MCP | `mcp+http://localhost:8081/` | wenn nur der Port des MCP offen ist |

Der Pfad nach dem Port ist die **Route des Schemas**: dort `/`, weil das Beispiel ein einziges Schema an der Wurzel
bereitstellt; in einem Gateway mit mehreren `http://gateway:8080/iot/v1`. Die Zugangsdaten sind seine Schlüssel
`reader-demo-key` (liest) und `backend-demo-key` (schreibt auch).

## 1. Das Projekt anlegen {#node-in-a-project}

```sh
mkdir shop && cd shop
npm init -y
npm pkg set type=module
```

## 2. Den Client installieren

```sh
npm install @lambdaorm/data-gateway-client-node
npm install -D typescript tsx @types/node        # nur, um es in TypeScript zu schreiben
```

## 3. Sagen, wo das Gateway ist

Verbindungszeichenfolge und Zugangsdaten bleiben außerhalb des Codes, in der Umgebung (oder in einer `.env`, die die
Anwendung liest); der Client nimmt sie von dort:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. Eine Verbindung für die Anwendung

`src/gateway.ts`: die Verbindung wird beim ersten Bedarf geöffnet und von der ganzen Anwendung geteilt:

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

## 5. Die Abfragen

`src/products.ts`: eine Abfrage ist der Text eines λORM-Ausdrucks, mit ihren Variablen getrennt; `execute<T>` liefert ihr
Ergebnis mit einem Typ:

```ts
import { GatewayError } from '@lambdaorm/data-gateway-client-node'
import { gateway } from './gateway.js'

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

## 6. Ausführen

`src/index.ts`, das den Code eines Fehlers ausgibt und die Verbindung am Ende schließt:

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

Das Lesen funktioniert; das Schreiben wird abgelehnt, **bevor es die Datenbank erreicht**, mit dem Code `forbidden`:
`reader-demo-key` liest nur.

## 7. Schreiben, und die Fehler

Mit dem Schlüssel, der schreibt, noch einmal:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key npx tsx src/index.ts
```

Jetzt antwortet `addCategory('Beverages')` `false` (die letzte Zeile): die Kategorie existiert, die Datenbank lehnt sie
ab, und der Client liefert den Code `unique`, welche Datenbank auch immer (Postgres `23505`, MySQL `ER_DUP_ENTRY`…).
Entschieden wird nach `error.code`; `errorName`, `status`, `dbCode` und `suggestions` (die nächsten Namen, für einen
Namen, den es nicht gibt) sagen mehr.

## 8. Ein anderer Transport

Nur die Verbindungszeichenfolge ändert sich; Code und Ergebnisse bleiben gleich:

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ npx tsx src/index.ts          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ npx tsx src/index.ts    # MCP
```

Ein Server hält die Verbindung offen, solange er läuft, und schließt sie beim Beenden (`process.on('SIGTERM', …)`). Die
Imports der eigenen Dateien des Projekts nennen `.js` (`./gateway.js`), wie TypeScript es in einem ES-Modul verlangt;
in CommonJS wird das Paket mit `require` importiert, dieselbe API.

## Was er noch kann {#node-more}

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
