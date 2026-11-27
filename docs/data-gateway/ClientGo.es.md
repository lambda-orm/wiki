# Cliente de Go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(paquete `gateway`) es el mismo cliente en Go: las mismas cadenas de conexión, los mismos cinco transportes, las mismas
operaciones y los mismos códigos de error, y pasa la misma suite de conformidad. Necesita Go 1.22 o posterior; su única
dependencia es [`github.com/coder/websocket`](https://github.com/coder/websocket).

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

## 1. Crear el módulo {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
```

## 2. Agregar el cliente

```sh
go get github.com/lambda-orm/data-gateway-client-go
```

## 3. Decir dónde está el gateway

Las mismas variables que en Node:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. Conectar, consultar, manejar los errores

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

	// "" toma DATA_GATEWAY_URL; la clave, DATA_GATEWAY_API_KEY (o gateway.WithAPIKey)
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

## 5. Ejecutarlo

```sh
go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
forbidden: the credential "reader" does not have the "write" permission
```

y con la clave que escribe, la base rechaza la categoría repetida, con el mismo código en todas las bases:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
it already exists
```

`ExecuteInto[T]` decodifica el resultado en un tipo (un struct por sus tags `json`, un slice de ellos); `Execute` lo da
como `any`. Toda operación recibe un `context.Context`, que puede terminarla antes del timeout de la conexión.

## 6. Otro transporte

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ go run .          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ go run .    # MCP
```

## 7. En un servidor

Un `*gateway.Client` sirve a toda la aplicación (se puede usar de forma concurrente), y cada petición pasa su propio
contexto:

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

## Qué más hace {#go-more}

Las opciones de `Connect`: `WithAPIKey`, `WithAPIKeyHeader`, `WithToken`, `WithTokenFunc` (el token de un proveedor de
identidad, pedido en cada petición), `WithHeader`, `WithTimeout` (30 s por defecto), `WithStage` y `WithTruncatedRows`
(MCP: las filas cortadas en `mcp.maxRows` en lugar del error `truncated`). El resto de la API es la de Node con los
nombres de Go: `ExecuteScript`, `ExecuteQueued`, `Plan`, `Metadata`, `Queries`, `Query`, `Approval`, `Whoami`,
`gw.Schema.Search`, `gw.Stage.Export`, `gw.General.Health`, … Con una conexión `ws://`, `Subscribe` se entera de los
[cambios de los datos](Changes.md) y `On` recibe las [notificaciones](WebSocket.md#notifications):

```go
sub, err := gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: "Orders"}, func(e gateway.Event) {
	log.Println(e.Type, e.Params["action"]) // en la goroutine que lee el socket: no bloquearla
})
if err != nil {
	log.Fatal(err)
}
defer sub.Unsubscribe(ctx)
```
