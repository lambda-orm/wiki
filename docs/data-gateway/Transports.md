# Transports

The gateway has five transports. Each one listens on its own port, only when the port is configured
([Configuration](Configuration.md#transports-and-ports)), and each one reaches every schema by its route.

| Transport | What it is | Routes of the schema `iot/v1` | Routes of the gateway |
| --- | --- | --- | --- |
| [`http`](Rest.md) | REST API, OpenAPI 3 | `POST /iot/v1/execute`, `GET /iot/v1/entities`, … | `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/transports`, `/doc`, `/api-docs` |
| [`mcpHttp`](Mcp.md) | MCP for AI agents | `POST/GET/DELETE /iot/v1/mcp` (Streamable HTTP); `GET /iot/v1/sse` + `POST /iot/v1/messages?sessionId=` (HTTP+SSE) | `GET /status` |
| [`mcpWebSocket`](Mcp.md#mcpwebsocket) | MCP over WebSocket | upgrade at `/iot/v1/mcp` | `GET /status`, `/asyncapi` |
| [`webSocket`](WebSocket.md) | JSON-RPC API with notifications | connection to `ws://host:port/iot/v1` | connection to the root: `general.*` and `gateway.schemas`; `/asyncapi` |
| [`management`](#management) | the API of the [IDE](../ide/Guide.md) | the same as `http`, for every schema | those of `http` (without Swagger) and `/admin/…` |

- `{basePath}` (`transports.<t>.basePath`) goes before every route: with `basePath: /data-gateway`,
  `/data-gateway/iot/v1/execute` and `/data-gateway/schemas`.
- With a single schema at the root, its routes have no prefix (`/execute`, `/mcp`, `ws://host:port/`).
- A schema that is not exposed on a transport (`schemas[].transports`) answers `404` there. A schema that is not
  `ready` answers `503` with the reason.
- Each transport authenticates every request (or the WebSocket upgrade) with the effective authentication of the
  schema ([Security](Security.md)).
- **No transport answers CORS** (since 4.0.0): a web application calls the gateway from its own backend, as the
  [IDE](../ide/Guide.md) does.

## http

The REST API: every operation of λORM on a schema (queries, scripts, the schema, stages), plus the routes of the
gateway. JSON in and out. Methods and examples in [REST API](Rest.md).

```yaml
transports:
  http:
    port: 8080
    basePath: /data-gateway   # optional
    swagger: { enabled: true }   # /doc and /api-docs (Swagger UI, OpenAPI 3)
```

- `GET /doc` (and `/api-docs`) serves Swagger UI with the OpenAPI document. Its **Authorize** button asks for the
  credential as the schemas are configured: an API key in its header, a bearer token or a user and password.
- `/ping`, `/health` and `/metrics` need no credential (Kubernetes probes, Prometheus).
- The rate limit (`rateLimit`) applies to this transport only.
- `GET /transports` says the transports of the gateway (their port, base path and document) and `GET /openapi.json`
  is the OpenAPI document: what a client, or the IDE, needs to find them.

## mcpHttp

[Model Context Protocol](https://modelcontextprotocol.io) for AI agents: a server per schema, with a tool per
operation. See [MCP](Mcp.md).

```yaml
transports:
  mcpHttp:
    port: 8081
    legacySse: true    # also the older HTTP+SSE transport, for older clients
    stateful: false    # stateless: any replica answers any request, no session affinity needed
```

| Route | Protocol | Clients |
| --- | --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP | Claude Code (`--transport http`), current clients |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (deprecated), with `legacySse: true` | older clients |
| `GET {basePath}/status` | the state, the schemas and the open SSE sessions | operations |

The credential goes in every request (Streamable HTTP) or in the `GET` and every `POST` (SSE). HTTP+SSE keeps a
session in memory: with several replicas it needs session affinity.

## mcpWebSocket

The same MCP servers over WebSocket. **It is not a standard MCP transport**: it is offered for clients and gateways
that support it on their own; most clients use `mcpHttp`.

```yaml
transports:
  mcpWebSocket:
    port: 8082
    maxConnections: 100
```

The connection is an upgrade at `{basePath}/{schema}/mcp`, authenticated in the handshake (without a credential it
answers `401` and closes). The messages are JSON-RPC 2.0 with the MCP methods (`initialize`, `ping`, `tools/list`,
`tools/call`, `resources/*`, …). `GET {basePath}/status` and `GET {basePath}/asyncapi` (the AsyncAPI document) are
plain HTTP.

## webSocket

A JSON-RPC 2.0 API over one persistent connection, with the same operations as REST, plus **notifications** that REST
cannot give: the end of a queued execution and the changes of state of the schema. See [WebSocket API](WebSocket.md).

```yaml
transports:
  webSocket:
    port: 8083
    maxConnections: 100
    asyncapi: { enabled: true }   # GET /asyncapi, /asyncapi.json
```

## management

The API of the [IDE](../ide/Guide.md) (since 4.0.0), on its own port so that a deployment can leave it out: a production gateway
whose schemas come in its volumes is deployed without it, with no administration and no IDE.

```yaml
transports:
  management:
    port: 9090
    basePath: ''          # optional
    # authentication: …   # as any transport; else the global one (what a login checks)
    trustedProxies: [ 172.30.0.0/16 ]   # the IDE: its X-Forwarded-For says the browser's address
    sessions:
      idleTimeout: 30m    # without requests, a session ends
      maxLifetime: 12h    # after the login, it ends
      maxPerCredential: 0 # 0 = no limit; over it, a login closes the oldest of that credential
```

- **The routes of `http` for every schema**, whatever `orm.schemas[].transports` says (queries, scripts, the schema,
  stages, `/whoami`, `/typings`, `/schemas`, `/transports`), with the same bodies and permissions, and the
  [administration](Admin.md) at `/admin/…`.
- **The same credentials and permissions** as the other transports, but through a **session**: the credential goes
  only in the login, and every other request carries the token of the session ([below](#sessions)). A credential sent
  directly answers `401 SessionRequiredError`. No Swagger and no rate limit.
- **Only on an internal network:** it writes the schemas and the variables of the connections and runs DDL. In a
  compose, without `ports:`; in Kubernetes, an internal `Service` without an ingress. The IDE reaches it, and the IDE
  is what is published.

### Sessions {#sessions}

Since 4.0.0, `management` works with sessions, so that who uses it is known and can be cut off:

| Method | Route | Does | Permission |
| --- | --- | --- | --- |
| `POST` | `/sessions` | the **login**: the credential in its usual headers → `201 { id, token, credential, permissions, expiresAt, idleTimeoutMs }` | any valid credential |
| `GET` / `DELETE` | `/sessions/current` | the session of the token / the **logout** | the session |
| `GET` | `/sessions` | the sessions of the same credential; with `?all=true`, every one | `all` needs `sessionAdmin` |
| `DELETE` | `/sessions/{id}` | revokes a session | one's own credential, or `sessionAdmin` |
| `DELETE` | `/sessions?credential={name}` | revokes every session of a credential (`&except=current`: close the others) | one's own credential, or `sessionAdmin` |

- The token goes in `X-Data-Gateway-Session`. Only its hash is kept, in `<orm.workspacePath>/.data-gateway/state.sqlite`,
  shared by the replicas on that volume (without a workspace path, in memory).
- A session ends after `idleTimeout` without requests or `maxLifetime` after the login: `401 SessionExpiredError`. A
  revoked one answers `401 SessionRevokedError`, with who revoked it and when.
- A listed session has its credential, the address and client (the IDE, its version, web or desktop), when it was
  last used and when it ends, whether it is **connected** now and what it is looking at. Never its token.
- **The WebSocket of events**, `ws://…/events`, with the session in the upgrade (`X-Data-Gateway-Session`, or the
  subprotocol `lambdaorm.session.<token>` from a browser): it pushes `session.revoked` (and closes with `4401`),
  `session.expiring` (2 minutes before the end of its lifetime), `schema.statusChanged` and `workspace.changed`. A
  session with its socket open is *connected*; revoking it, in any replica, closes its socket.
- Every login, logout, expiry and revocation leaves an [audit](Security.md#audit) line.
- The data transports don't change: they take the credential on every request.

