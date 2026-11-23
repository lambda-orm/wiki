# Transportes {#transports}

El gateway tiene cinco transportes. Cada uno escucha en su propio puerto, solo cuando el puerto está configurado
([Configuración](Configuration.md#transports-and-ports)), y cada uno llega a todos los esquemas por su ruta.

| Transporte | Qué es | Rutas del esquema `iot/v1` | Rutas del gateway |
| --- | --- | --- | --- |
| [`http`](Rest.md) | API REST, OpenAPI 3 | `POST /iot/v1/execute`, `GET /iot/v1/entities`, … | `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/transports`, `/doc`, `/api-docs` |
| [`mcpHttp`](Mcp.md) | MCP para agentes de IA | `POST/GET/DELETE /iot/v1/mcp` (Streamable HTTP); `GET /iot/v1/sse` + `POST /iot/v1/messages?sessionId=` (HTTP+SSE) | `GET /status` |
| [`mcpWebSocket`](Mcp.md#mcpwebsocket) | MCP sobre WebSocket | upgrade en `/iot/v1/mcp` | `GET /status`, `/asyncapi` |
| [`webSocket`](WebSocket.md) | API JSON-RPC con notificaciones | conexión a `ws://host:port/iot/v1` | conexión a la raíz: `general.*` y `gateway.schemas`; `/asyncapi` |
| [`management`](#management) | la API del [IDE](../ide/Guide.md) | las mismas que `http`, para todos los esquemas | las de `http` (sin Swagger) y `/admin/…` |

- `{basePath}` (`transports.<t>.basePath`) va antes de cada ruta: con `basePath: /data-gateway`,
  `/data-gateway/iot/v1/execute` y `/data-gateway/schemas`.
- Con un único esquema en la raíz, sus rutas no tienen prefijo (`/execute`, `/mcp`, `ws://host:port/`).
- Un esquema que no está expuesto en un transporte (`schemas[].transports`) responde `404` en él. Un esquema que no está
  `ready` responde `503` con el motivo.
- Cada transporte autentica cada petición (o el upgrade de WebSocket) con la autenticación efectiva del
  esquema ([Seguridad](Security.md)).
- **Ningún transporte responde CORS** (desde 4.0.0): una aplicación web llama al gateway desde su propio backend, como
  hace el [IDE](../ide/Guide.md).

## http {#http}

La API REST: todas las operaciones de λORM sobre un esquema (consultas, scripts, el esquema, stages), más las rutas del
gateway. JSON de entrada y de salida. Métodos y ejemplos en [API REST](Rest.md).

```yaml
transports:
  http:
    port: 8080
    basePath: /data-gateway   # optional
    swagger: { enabled: true }   # /doc and /api-docs (Swagger UI, OpenAPI 3)
```

- `GET /doc` (y `/api-docs`) sirve Swagger UI con el documento OpenAPI. Su botón **Authorize** pide la
  credencial según cómo estén configurados los esquemas: una API key en su header, un bearer token o un usuario y una contraseña.
- `/ping`, `/health` y `/metrics` no necesitan credencial (probes de Kubernetes, Prometheus).
- El límite de tasa (`rateLimit`) se aplica solo a este transporte.
- `GET /transports` dice los transportes del gateway (su puerto, su base path y su documento) y `GET /openapi.json`
  es el documento OpenAPI: lo que un cliente, o el IDE, necesita para encontrarlos.

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

## management {#management}

La API del [IDE](../ide/Guide.md) (desde 4.0.0), en su propio puerto para que un despliegue pueda dejarla fuera: un gateway de
producción cuyos esquemas vienen en sus volúmenes se despliega sin ella, sin administración y sin IDE.

```yaml
transports:
  management:
    port: 9090
    basePath: ''          # opcional
    # authentication: …   # como cualquier transporte; si no, la global (la que comprueba un login)
    trustedProxies: [ 172.30.0.0/16 ]   # el IDE: su X-Forwarded-For indica la dirección del navegador
    sessions:
      idleTimeout: 30m    # sin peticiones, una sesión termina
      maxLifetime: 12h    # tras el login, termina
      maxPerCredential: 0 # 0 = sin límite; por encima, un login cierra la más antigua de esa credencial
```

- **Las rutas de `http` para todos los esquemas**, diga lo que diga `orm.schemas[].transports` (consultas, scripts, el
  esquema, stages, `/whoami`, `/typings`, `/schemas`, `/transports`), con los mismos cuerpos y permisos, y la
  [administración](Admin.md) en `/admin/…`.
- **Las mismas credenciales y permisos** que los otros transportes, pero a través de una **sesión**: la credencial va
  solo en el login, y cada una de las demás peticiones lleva el token de la sesión ([abajo](#sessions)). Una
  credencial enviada directamente responde `401 SessionRequiredError`. Sin Swagger y sin límite de tasa.
- **Solo en una red interna:** escribe los esquemas y las variables de las conexiones y corre DDL. En un compose, sin
  `ports:`; en Kubernetes, un `Service` interno sin ingress. El IDE llega a él, y lo que se publica es el IDE.

### Sesiones {#sessions}

Desde 4.0.0, `management` funciona con sesiones, para que se sepa quién lo usa y se le pueda cortar el acceso:

| Método | Ruta | Hace | Permiso |
| --- | --- | --- | --- |
| `POST` | `/sessions` | el **login**: la credencial en sus headers habituales → `201 { id, token, credential, permissions, expiresAt, idleTimeoutMs }` | cualquier credencial válida |
| `GET` / `DELETE` | `/sessions/current` | la sesión del token / el **logout** | la sesión |
| `GET` | `/sessions` | las sesiones de la misma credencial; con `?all=true`, todas | `all` necesita `sessionAdmin` |
| `DELETE` | `/sessions/{id}` | revoca una sesión | la propia credencial, o `sessionAdmin` |
| `DELETE` | `/sessions?credential={name}` | revoca todas las sesiones de una credencial (`&except=current`: cerrar las otras) | la propia credencial, o `sessionAdmin` |

- El token va en `X-Data-Gateway-Session`. Solo se guarda su hash, en `<orm.workspacePath>/.data-gateway/state.sqlite`,
  compartido por las réplicas sobre ese volumen (sin ruta de workspace, en memoria).
- Una sesión termina tras `idleTimeout` sin peticiones o `maxLifetime` después del login: `401 SessionExpiredError`.
  Una revocada responde `401 SessionRevokedError`, con quién la revocó y cuándo.
- Una sesión listada tiene su credencial, la dirección y el cliente (el IDE, su versión, web o escritorio), cuándo se
  usó por última vez y cuándo termina, si está **conectada** ahora y qué está mirando. Nunca su token.
- **El WebSocket de eventos**, `ws://…/events`, con la sesión en el upgrade (`X-Data-Gateway-Session`, o el
  subprotocolo `lambdaorm.session.<token>` desde un navegador): envía `session.revoked` (y cierra con `4401`),
  `session.expiring` (2 minutos antes del fin de su vida), `schema.statusChanged` y `workspace.changed`. Una sesión con
  su socket abierto está *conectada*; revocarla, en cualquier réplica, cierra su socket.
- Cada login, logout, expiración y revocación deja una línea de [auditoría](Security.md#audit).
- Los transportes de datos no cambian: reciben la credencial en cada petición.
