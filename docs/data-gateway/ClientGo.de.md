# Go-Client {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(Paket `gateway`) ist derselbe Client in Go: dieselben Verbindungszeichenfolgen, dieselben fünf Transporte, dieselben
Operationen und dieselben Fehlercodes, und er besteht dieselbe Konformitätssuite. Er braucht Go 1.22 oder neuer; seine
einzige Abhängigkeit ist [`github.com/coder/websocket`](https://github.com/coder/websocket).

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

## 1. Das Modul anlegen {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
```

## 2. Den Client hinzufügen

```sh
go get github.com/lambda-orm/data-gateway-client-go
```

## 3. Sagen, wo das Gateway ist

Dieselben Variablen wie in Node:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. Verbinden, abfragen, die Fehler behandeln

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

	// "" nimmt DATA_GATEWAY_URL; den Schlüssel DATA_GATEWAY_API_KEY (oder gateway.WithAPIKey)
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

## 5. Ausführen

```sh
go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
forbidden: the credential "reader" does not have the "write" permission
```

und mit dem Schlüssel, der schreibt, lehnt die Datenbank die wiederholte Kategorie ab, mit demselben Code auf jeder
Datenbank:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
it already exists
```

`ExecuteInto[T]` dekodiert das Ergebnis in einen Typ (ein Struct über seine `json`-Tags, ein Slice davon); `Execute`
liefert es als `any`. Jede Operation nimmt einen `context.Context`, der sie vor dem Timeout der Verbindung beenden kann.

## 6. Ein anderer Transport

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ go run .          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ go run .    # MCP
```

## 7. In einem Server

Ein `*gateway.Client` bedient die ganze Anwendung (er ist nebenläufig nutzbar), und jede Anfrage gibt ihren eigenen
Kontext mit:

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

## Was er noch kann {#go-more}

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
