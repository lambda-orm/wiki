# Go client {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(package `gateway`) is the same client in Go: the same connection strings, the same five transports, the same
operations and the same error codes, and it passes the same conformance suite. It needs Go 1.22 or later; its only
dependency is [`github.com/coder/websocket`](https://github.com/coder/websocket).

## Before you start {#before-you-start}

These steps use the gateway of [Getting started](GettingStarted.md)
(Northwind, its steps 1 to 3: `docker compose up -d` and the data imported):

| Transport | Connection string | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | the default choice |
| WebSocket | `ws://localhost:8083/` | one connection for every operation; subscriptions and notifications |
| MCP | `mcp+http://localhost:8081/` | when only the port of MCP is open |

The path after the port is the **route of the schema**: `/` there, because that example serves a single schema at the
root; in a gateway with several, `http://gateway:8080/iot/v1`. The credentials are its keys `reader-demo-key` (reads)
and `backend-demo-key` (writes too).

## 1. Create the module {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
```

## 2. Add the client

```sh
go get github.com/lambda-orm/data-gateway-client-go
```

## 3. Say where the gateway is

The same variables as in Node:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. Connect, query, handle the errors

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

	// "" takes DATA_GATEWAY_URL; the key, DATA_GATEWAY_API_KEY (or gateway.WithAPIKey)
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

## 5. Run it

```sh
go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
forbidden: the credential "reader" does not have the "write" permission
```

and with the key that writes, the database refuses the repeated category, with the same code on every database:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
it already exists
```

`ExecuteInto[T]` decodes the result into a type (a struct by its `json` tags, a slice of them); `Execute` gives it as
`any`. Every operation takes a `context.Context`, which can end it before the timeout of the connection.

## 6. Another transport

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ go run .          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ go run .    # MCP
```

## 7. In a server

One `*gateway.Client` serves the whole application (it is safe for concurrent use), and each request passes its own
context:

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

## What else it does {#go-more}

The options of `Connect`: `WithAPIKey`, `WithAPIKeyHeader`, `WithToken`, `WithTokenFunc` (the token of an identity
provider, asked for on every request), `WithHeader`, `WithTimeout` (30 s by default), `WithStage` and
`WithTruncatedRows` (MCP: the rows cut at `mcp.maxRows` instead of the error `truncated`). The rest of the API is the
one of Node with the names of Go: `ExecuteScript`, `ExecuteQueued`, `Plan`, `Metadata`, `Queries`, `Query`,
`Approval`, `Whoami`, `gw.Schema.Search`, `gw.Stage.Export`, `gw.General.Health`, … Over a `ws://` connection,
`Subscribe` is told of the [changes of the data](Changes.md) and `On` receives the [notifications](WebSocket.md#notifications):

```go
sub, err := gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: "Orders"}, func(e gateway.Event) {
	log.Println(e.Type, e.Params["action"]) // on the goroutine that reads the socket: don't block it
})
if err != nil {
	log.Fatal(err)
}
defer sub.Unsubscribe(ctx)
```
