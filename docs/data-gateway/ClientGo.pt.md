# Cliente Go {#go}

[`github.com/lambda-orm/data-gateway-client-go`](https://pkg.go.dev/github.com/lambda-orm/data-gateway-client-go)
(pacote `gateway`) é o mesmo cliente em Go: as mesmas strings de conexão, os mesmos cinco transportes, as mesmas
operações e os mesmos códigos de erro, e passa a mesma suíte de conformidade. Precisa do Go 1.22 ou posterior; sua
única dependência é [`github.com/coder/websocket`](https://github.com/coder/websocket).

## Antes de começar {#before-you-start}

Estes passos usam o gateway de [Primeiros passos](GettingStarted.md)
(Northwind, seus passos 1 a 3: `docker compose up -d` e os dados importados):

| Transporte | String de conexão | |
| --- | --- | --- |
| REST | `http://localhost:8080/` | a escolha padrão |
| WebSocket | `ws://localhost:8083/` | uma conexão para todas as operações; assinaturas e notificações |
| MCP | `mcp+http://localhost:8081/` | quando só a porta do MCP está aberta |

O caminho depois da porta é a **rota do esquema**: `/` ali, porque esse exemplo serve um só esquema na raiz; num gateway
com vários, `http://gateway:8080/iot/v1`. As credenciais são suas chaves `reader-demo-key` (lê) e `backend-demo-key`
(também grava).

## 1. Criar o módulo {#go-in-a-project}

```sh
mkdir shop && cd shop
go mod init example.com/shop
```

## 2. Adicionar o cliente

```sh
go get github.com/lambda-orm/data-gateway-client-go
```

## 3. Dizer onde está o gateway

As mesmas variáveis que em Node:

```sh
export DATA_GATEWAY_URL=http://localhost:8080/
export DATA_GATEWAY_API_KEY=reader-demo-key
```

## 4. Conectar, consultar, tratar os erros

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

	// "" usa DATA_GATEWAY_URL; a chave, DATA_GATEWAY_API_KEY (ou gateway.WithAPIKey)
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

## 5. Executar

```sh
go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
forbidden: the credential "reader" does not have the "write" permission
```

e com a chave que grava, o banco recusa a categoria repetida, com o mesmo código em todos os bancos:

```sh
DATA_GATEWAY_API_KEY=backend-demo-key go run .
```

```text
Côte de Blaye 263.50
Thüringer Rostbratwurst 123.79
Mishi Kobe Niku 97.00
it already exists
```

`ExecuteInto[T]` decodifica o resultado num tipo (um struct pelas suas tags `json`, um slice deles); `Execute` o dá como
`any`. Toda operação recebe um `context.Context`, que pode encerrá-la antes do timeout da conexão.

## 6. Outro transporte

```sh
DATA_GATEWAY_URL=ws://localhost:8083/ go run .          # WebSocket
DATA_GATEWAY_URL=mcp+http://localhost:8081/ go run .    # MCP
```

## 7. Num servidor

Um `*gateway.Client` atende toda a aplicação (pode ser usado de forma concorrente), e cada requisição passa seu próprio
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

## O que mais faz {#go-more}

As opções de `Connect`: `WithAPIKey`, `WithAPIKeyHeader`, `WithToken`, `WithTokenFunc` (o token de um provedor de
identidade, pedido em cada requisição), `WithHeader`, `WithTimeout` (30 s por padrão), `WithStage` e
`WithTruncatedRows` (MCP: as linhas cortadas em `mcp.maxRows` em vez do erro `truncated`). O resto da API é o do Node
com os nomes do Go: `ExecuteScript`, `ExecuteQueued`, `Plan`, `Metadata`, `Queries`, `Query`, `Approval`, `Whoami`,
`gw.Schema.Search`, `gw.Stage.Export`, `gw.General.Health`, … Com uma conexão `ws://`, `Subscribe` fica sabendo das
[mudanças dos dados](Changes.md) e `On` recebe as [notificações](WebSocket.md#notifications):

```go
sub, err := gw.Subscribe(ctx, gateway.SubscribeTarget{Entity: "Orders"}, func(e gateway.Event) {
	log.Println(e.Type, e.Params["action"]) // na goroutine que lê o socket: não bloqueá-la
})
if err != nil {
	log.Fatal(err)
}
defer sub.Unsubscribe(ctx)
```
