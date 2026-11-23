# Transportes {#transports}

O gateway tem cinco transportes. Cada um escuta em sua própria porta, apenas quando a porta está configurada
([Configuração](Configuration.md#transports-and-ports)), e cada um alcança todos os esquemas pela sua rota.

| Transporte | O que é | Rotas do esquema `iot/v1` | Rotas do gateway |
| --- | --- | --- | --- |
| [`http`](Rest.md) | API REST, OpenAPI 3 | `POST /iot/v1/execute`, `GET /iot/v1/entities`, … | `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/transports`, `/doc`, `/api-docs` |
| [`mcpHttp`](Mcp.md) | MCP para agentes de IA | `POST/GET/DELETE /iot/v1/mcp` (Streamable HTTP); `GET /iot/v1/sse` + `POST /iot/v1/messages?sessionId=` (HTTP+SSE) | `GET /status` |
| [`mcpWebSocket`](Mcp.md#mcpwebsocket) | MCP sobre WebSocket | upgrade em `/iot/v1/mcp` | `GET /status`, `/asyncapi` |
| [`webSocket`](WebSocket.md) | API JSON-RPC com notificações | conexão a `ws://host:port/iot/v1` | conexão à raiz: `general.*` e `gateway.schemas`; `/asyncapi` |
| [`management`](#management) | a API da [IDE](Ui.md) | as mesmas do `http`, para todos os esquemas | as do `http` (sem Swagger) e `/admin/…` |

- `{basePath}` (`transports.<t>.basePath`) vai antes de todas as rotas: com `basePath: /data-gateway`,
  `/data-gateway/iot/v1/execute` e `/data-gateway/schemas`.
- Com um único esquema na raiz, suas rotas não têm prefixo (`/execute`, `/mcp`, `ws://host:port/`).
- Um esquema que não está exposto em um transporte (`schemas[].transports`) responde `404` nele. Um esquema que não está
  `ready` responde `503` com o motivo.
- Cada transporte autentica todas as requisições (ou o upgrade do WebSocket) com a autenticação efetiva do
  esquema ([Segurança](Security.md)).
- **Nenhum transporte responde CORS** (desde a 4.0.0): uma aplicação web chama o gateway pelo seu próprio backend, como
  faz a [IDE](Ui.md).

## http {#http}

A API REST: todas as operações do λORM sobre um esquema (consultas, scripts, o esquema, stages), além das rotas do
gateway. JSON na entrada e na saída. Métodos e exemplos em [API REST](Rest.md).

```yaml
transports:
  http:
    port: 8080
    basePath: /data-gateway   # optional
    swagger: { enabled: true }   # /doc and /api-docs (Swagger UI, OpenAPI 3)
```

- `GET /doc` (e `/api-docs`) serve o Swagger UI com o documento OpenAPI. Seu botão **Authorize** pede a
  credencial conforme os esquemas estão configurados: uma API key em seu header, um bearer token ou um usuário e senha.
- `/ping`, `/health` e `/metrics` não precisam de credencial (probes do Kubernetes, Prometheus).
- O limite de taxa (`rateLimit`) se aplica apenas a este transporte.
- `GET /transports` informa os transportes do gateway (sua porta, base path e documento) e `GET /openapi.json` é o
  documento OpenAPI: o que um cliente, ou a IDE, precisa para encontrá-los.

## mcpHttp {#mcphttp}

[Model Context Protocol](https://modelcontextprotocol.io) para agentes de IA: um servidor por esquema, com uma ferramenta por
operação. Veja [MCP](Mcp.md).

```yaml
transports:
  mcpHttp:
    port: 8081
    legacySse: true    # also the older HTTP+SSE transport, for older clients
    stateful: false    # stateless: any replica answers any request, no session affinity needed
```

| Rota | Protocolo | Clientes |
| --- | --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP | Claude Code (`--transport http`), clientes atuais |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (obsoleto), com `legacySse: true` | clientes antigos |
| `GET {basePath}/status` | o estado, os esquemas e as sessões SSE abertas | operações |

A credencial vai em cada requisição (Streamable HTTP) ou no `GET` e em cada `POST` (SSE). O HTTP+SSE mantém uma
sessão em memória: com várias réplicas, ele precisa de afinidade de sessão.

## mcpWebSocket {#mcpwebsocket}

Os mesmos servidores MCP sobre WebSocket. **Não é um transporte MCP padrão**: é oferecido para clientes e gateways
que o suportam por conta própria; a maioria dos clientes usa `mcpHttp`.

```yaml
transports:
  mcpWebSocket:
    port: 8082
    maxConnections: 100
```

A conexão é um upgrade em `{basePath}/{schema}/mcp`, autenticado no handshake (sem credencial, ela
responde `401` e fecha). As mensagens são JSON-RPC 2.0 com os métodos do MCP (`initialize`, `ping`, `tools/list`,
`tools/call`, `resources/*`, …). `GET {basePath}/status` e `GET {basePath}/asyncapi` (o documento AsyncAPI) são
HTTP simples.

## webSocket {#websocket}

Uma API JSON-RPC 2.0 sobre uma única conexão persistente, com as mesmas operações do REST, além de **notificações** que o REST
não pode oferecer: o fim de uma execução enfileirada e as mudanças de estado do esquema. Veja [API WebSocket](WebSocket.md).

```yaml
transports:
  webSocket:
    port: 8083
    maxConnections: 100
    asyncapi: { enabled: true }   # GET /asyncapi, /asyncapi.json
```

## management {#management}

A API da [IDE](Ui.md) (desde a 4.0.0), em sua própria porta para que uma implantação possa deixá-la de fora: um gateway
de produção cujos esquemas vêm em seus volumes é implantado sem ela, sem administração e sem IDE.

```yaml
transports:
  management:
    port: 9090
    basePath: ''          # opcional
    # authentication: …   # como qualquer transporte; senão a global
```

- **As rotas do `http` para todos os esquemas**, diga o que disser `orm.schemas[].transports` (consultas, scripts, o
  esquema, stages, `/whoami`, `/typings`, `/schemas`, `/transports`), com os mesmos corpos e permissões, e a
  [administração](Admin.md) em `/admin/…`.
- **As mesmas credenciais e permissões** dos outros transportes; sem Swagger e sem limite de taxa.
- **Apenas em uma rede interna:** ele grava os esquemas e as variáveis das conexões e roda DDL. Em um compose, sem
  `ports:`; no Kubernetes, um `Service` interno sem ingress. A IDE o alcança, e o que se publica é a IDE.
