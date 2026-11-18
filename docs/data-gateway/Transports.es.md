# Transportes {#transports}

El gateway tiene cuatro transportes. Cada uno escucha en su propio puerto, solo cuando el puerto está configurado
([Configuración](Configuration.md#transports-and-ports)), y cada uno llega a todos los esquemas por su ruta.

| Transporte | Qué es | Rutas del esquema `iot/v1` | Rutas del gateway |
| --- | --- | --- | --- |
| [`http`](Rest.md) | API REST, OpenAPI 3 | `POST /iot/v1/execute`, `GET /iot/v1/entities`, … | `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/doc`, `/api-docs`, `/ui` |
| [`mcpHttp`](Mcp.md) | MCP para agentes de IA | `POST/GET/DELETE /iot/v1/mcp` (Streamable HTTP); `GET /iot/v1/sse` + `POST /iot/v1/messages?sessionId=` (HTTP+SSE) | `GET /status` |
| [`mcpWebSocket`](Mcp.md#mcpwebsocket) | MCP sobre WebSocket | upgrade en `/iot/v1/mcp` | `GET /status`, `/asyncapi` |
| [`webSocket`](WebSocket.md) | API JSON-RPC con notificaciones | conexión a `ws://host:port/iot/v1` | conexión a la raíz: `general.*` y `gateway.schemas`; `/asyncapi` |

- `{basePath}` (`transports.<t>.basePath`) va antes de cada ruta: con `basePath: /data-gateway`,
  `/data-gateway/iot/v1/execute` y `/data-gateway/ui/`.
- Con un único esquema en la raíz, sus rutas no tienen prefijo (`/execute`, `/mcp`, `ws://host:port/`).
- Un esquema que no está expuesto en un transporte (`schemas[].transports`) responde `404` en él. Un esquema que no está
  `ready` responde `503` con el motivo.
- Cada transporte autentica cada petición (o el upgrade de WebSocket) con la autenticación efectiva del
  esquema ([Seguridad](Security.md)).

## http {#http}

La API REST: todas las operaciones de λORM sobre un esquema (consultas, scripts, el esquema, stages), más las rutas del
gateway. JSON de entrada y de salida. Métodos y ejemplos en [API REST](Rest.md).

```yaml
transports:
  http:
    port: 8080
    basePath: /data-gateway   # optional
    swagger: { enabled: true }   # /doc and /api-docs (Swagger UI, OpenAPI 3)
    ui: { enabled: true }        # the web UI at /ui
```

- `GET /doc` (y `/api-docs`) sirve Swagger UI con el documento OpenAPI. Su botón **Authorize** pide la
  credencial según cómo estén configurados los esquemas: una API key en su header, un bearer token o un usuario y una contraseña.
- `/ping`, `/health` y `/metrics` no necesitan credencial (probes de Kubernetes, Prometheus).
- El límite de tasa (`rateLimit`) se aplica solo a este transporte.

## mcpHttp {#mcphttp}

[Model Context Protocol](https://modelcontextprotocol.io) para agentes de IA: un servidor por esquema, con una herramienta por
operación. Véase [MCP](Mcp.md).

```yaml
transports:
  mcpHttp:
    port: 8081
    legacySse: true    # also the older HTTP+SSE transport, for older clients
    stateful: false    # stateless: any replica answers any request, no session affinity needed
```

| Ruta | Protocolo | Clientes |
| --- | --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP | Claude Code (`--transport http`), clientes actuales |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (obsoleto), con `legacySse: true` | clientes antiguos |
| `GET {basePath}/status` | el estado, los esquemas y las sesiones SSE abiertas | operaciones |

La credencial va en cada petición (Streamable HTTP) o en el `GET` y en cada `POST` (SSE). HTTP+SSE mantiene una
sesión en memoria: con varias réplicas necesita afinidad de sesión.

## mcpWebSocket {#mcpwebsocket}

Los mismos servidores MCP sobre WebSocket. **No es un transporte MCP estándar**: se ofrece para clientes y gateways
que lo soportan por su cuenta; la mayoría de los clientes usan `mcpHttp`.

```yaml
transports:
  mcpWebSocket:
    port: 8082
    maxConnections: 100
```

La conexión es un upgrade en `{basePath}/{schema}/mcp`, autenticado en el handshake (sin credencial
responde `401` y cierra). Los mensajes son JSON-RPC 2.0 con los métodos de MCP (`initialize`, `ping`, `tools/list`,
`tools/call`, `resources/*`, …). `GET {basePath}/status` y `GET {basePath}/asyncapi` (el documento AsyncAPI) son
HTTP simple.

## webSocket {#websocket}

Una API JSON-RPC 2.0 sobre una única conexión persistente, con las mismas operaciones que REST, más **notificaciones** que REST
no puede dar: el fin de una ejecución encolada y los cambios de estado del esquema. Véase [API WebSocket](WebSocket.md).

```yaml
transports:
  webSocket:
    port: 8083
    maxConnections: 100
    asyncapi: { enabled: true }   # GET /asyncapi, /asyncapi.json
```
