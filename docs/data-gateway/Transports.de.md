# Transporte {#transports}

Das Gateway hat fünf Transporte. Jeder lauscht auf einem eigenen Port, nur wenn der Port konfiguriert ist
([Konfiguration](Configuration.md#transports-and-ports)), und jeder erreicht jedes Schema über dessen Route.

| Transport | Was er ist | Routen des Schemas `iot/v1` | Routen des Gateways |
| --- | --- | --- | --- |
| [`http`](Rest.md) | REST API, OpenAPI 3 | `POST /iot/v1/execute`, `GET /iot/v1/entities`, … | `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/transports`, `/doc`, `/api-docs` |
| [`mcpHttp`](Mcp.md) | MCP für KI-Agenten | `POST/GET/DELETE /iot/v1/mcp` (Streamable HTTP); `GET /iot/v1/sse` + `POST /iot/v1/messages?sessionId=` (HTTP+SSE) | `GET /status` |
| [`mcpWebSocket`](Mcp.md#mcpwebsocket) | MCP über WebSocket | Upgrade unter `/iot/v1/mcp` | `GET /status`, `/asyncapi` |
| [`webSocket`](WebSocket.md) | JSON-RPC-API mit Benachrichtigungen | Verbindung zu `ws://host:port/iot/v1` | Verbindung zur Wurzel: `general.*` und `gateway.schemas`; `/asyncapi` |
| [`management`](#management) | die API der [IDE](../ide/index.md) | dieselben wie `http`, für jedes Schema | die von `http` (ohne Swagger) und `/admin/…` |

- `{basePath}` (`transports.<t>.basePath`) steht vor jeder Route: mit `basePath: /data-gateway`
  `/data-gateway/iot/v1/execute` und `/data-gateway/schemas`.
- Mit einem einzigen Schema an der Wurzel haben seine Routen kein Präfix (`/execute`, `/mcp`, `ws://host:port/`).
- Ein Schema, das auf einem Transport nicht bereitgestellt wird (`schemas[].transports`), antwortet dort mit `404`. Ein
  Schema, das nicht `ready` ist, antwortet mit `503` und dem Grund.
- Jeder Transport authentifiziert jede Anfrage (bzw. das WebSocket-Upgrade) mit der effektiven Authentifizierung des
  Schemas ([Sicherheit](Security.md)).
- **Kein Transport beantwortet CORS** (seit 4.0.0): Eine Webanwendung ruft das Gateway aus ihrem eigenen Backend auf, wie
  es die [IDE](../ide/index.md) tut.

## http {#http}

Die REST API: alle Operationen von λORM auf einem Schema (Abfragen, Skripte, das Schema, Stages) sowie die Routen des
Gateways. JSON als Ein- und Ausgabe. Methoden und Beispiele unter [REST API](Rest.md).

```yaml
transports:
  http:
    port: 8080
    basePath: /data-gateway   # optional
    swagger: { enabled: true }   # /doc and /api-docs (Swagger UI, OpenAPI 3)
```

- `GET /doc` (und `/api-docs`) stellt Swagger UI mit dem OpenAPI-Dokument bereit. Die Schaltfläche **Authorize** fragt
  die Zugangsdaten so ab, wie die Schemas konfiguriert sind: einen API-Key in seinem Header, ein Bearer-Token oder
  Benutzer und Passwort.
- `/ping`, `/health` und `/metrics` benötigen keine Zugangsdaten (Kubernetes-Probes, Prometheus).
- Das Rate Limit (`rateLimit`) gilt nur für diesen Transport.
- `GET /transports` nennt die Transporte des Gateways (ihren Port, ihren Base-Path und ihr Dokument), und
  `GET /openapi.json` ist das OpenAPI-Dokument: was ein Client, oder die IDE, braucht, um sie zu finden.

## mcpHttp {#mcphttp}

[Model Context Protocol](https://modelcontextprotocol.io) für KI-Agenten: ein Server pro Schema, mit einem Tool pro
Operation. Siehe [MCP](Mcp.md).

```yaml
transports:
  mcpHttp:
    port: 8081
    legacySse: true    # also the older HTTP+SSE transport, for older clients
    stateful: false    # stateless: any replica answers any request, no session affinity needed
```

| Route | Protokoll | Clients |
| --- | --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP | Claude Code (`--transport http`), aktuelle Clients |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (veraltet), mit `legacySse: true` | ältere Clients |
| `GET {basePath}/status` | der Zustand, die Schemas und die offenen SSE-Sitzungen | Betrieb |

Die Zugangsdaten werden mit jeder Anfrage gesendet (Streamable HTTP) bzw. im `GET` und in jedem `POST` (SSE). HTTP+SSE
hält eine Sitzung im Speicher: Bei mehreren Replikas ist Session-Affinität erforderlich.

## mcpWebSocket {#mcpwebsocket}

Dieselben MCP-Server über WebSocket. **Es ist kein Standard-MCP-Transport**: Er wird für Clients und Gateways angeboten,
die ihn von sich aus unterstützen; die meisten Clients verwenden `mcpHttp`.

```yaml
transports:
  mcpWebSocket:
    port: 8082
    maxConnections: 100
```

Die Verbindung ist ein Upgrade unter `{basePath}/{schema}/mcp`, authentifiziert im Handshake (ohne Zugangsdaten
antwortet er mit `401` und schließt). Die Nachrichten sind JSON-RPC 2.0 mit den MCP-Methoden (`initialize`, `ping`,
`tools/list`, `tools/call`, `resources/*`, …). `GET {basePath}/status` und `GET {basePath}/asyncapi` (das
AsyncAPI-Dokument) sind reines HTTP.

## webSocket {#websocket}

Eine JSON-RPC-2.0-API über eine einzige dauerhafte Verbindung, mit denselben Operationen wie REST, dazu
**Benachrichtigungen**, die REST nicht bieten kann: das Ende einer Ausführung in der Warteschlange und die
Zustandsänderungen des Schemas. Siehe [WebSocket API](WebSocket.md).

```yaml
transports:
  webSocket:
    port: 8083
    maxConnections: 100
    asyncapi: { enabled: true }   # GET /asyncapi, /asyncapi.json
```

## management {#management}

Die API der [IDE](../ide/index.md) (seit 4.0.0), auf einem eigenen Port, damit eine Bereitstellung ihn weglassen kann: Ein
Produktions-Gateway, dessen Schemas in seinen Volumes mitkommen, wird ohne ihn bereitgestellt, ohne Administration und
ohne IDE.

```yaml
transports:
  management:
    port: 9090
    basePath: ''          # optional
    # authentication: …   # wie bei jedem Transport; sonst die globale (was eine Anmeldung prüft)
    trustedProxies: [ 172.30.0.0/16 ]   # die IDE: ihr X-Forwarded-For nennt die Adresse des Browsers
    sessions:
      idleTimeout: 30m    # ohne Anfragen endet eine Sitzung
      maxLifetime: 12h    # nach der Anmeldung endet sie
      maxPerCredential: 0 # 0 = kein Limit; darüber schließt eine Anmeldung die älteste dieser Zugangsdaten
```

- **Die Routen von `http` für jedes Schema**, unabhängig davon, was `orm.schemas[].transports` sagt (Abfragen, Skripte,
  das Schema, Stages, `/whoami`, `/typings`, `/schemas`, `/transports`), mit denselben Bodys und Berechtigungen, sowie
  die [Administration](Admin.md) unter `/admin/…`.
- **Dieselben Zugangsdaten und Berechtigungen** wie die anderen Transporte, aber über eine **Sitzung**: Die
  Zugangsdaten gehen nur in die Anmeldung, und jede andere Anfrage trägt das Token der Sitzung ([unten](#sessions)).
  Direkt gesendete Zugangsdaten werden mit `401 SessionRequiredError` beantwortet. Kein Swagger und kein Rate Limit.
- **Nur in einem internen Netzwerk:** Er schreibt die Schemas und die Variablen der Verbindungen und führt DDL aus. In
  einem Compose ohne `ports:`; in Kubernetes ein interner `Service` ohne Ingress. Die IDE erreicht ihn, und
  veröffentlicht wird die IDE.

### Sitzungen {#sessions}

Seit 4.0.0 arbeitet `management` mit Sitzungen, damit bekannt ist, wer es nutzt, und der Zugang entzogen werden kann:

| Methode | Route | Tut | Berechtigung |
| --- | --- | --- | --- |
| `POST` | `/sessions` | die **Anmeldung**: die Zugangsdaten in ihren üblichen Headern → `201 { id, token, credential, permissions, expiresAt, idleTimeoutMs }` | beliebige gültige Zugangsdaten |
| `GET` / `DELETE` | `/sessions/current` | die Sitzung des Tokens / die **Abmeldung** | die Sitzung |
| `GET` | `/sessions` | die Sitzungen derselben Zugangsdaten; mit `?all=true` alle | `all` erfordert `sessionAdmin` |
| `DELETE` | `/sessions/{id}` | widerruft eine Sitzung | die eigenen Zugangsdaten oder `sessionAdmin` |
| `DELETE` | `/sessions?credential={name}` | widerruft alle Sitzungen von Zugangsdaten (`&except=current`: die anderen schließen) | die eigenen Zugangsdaten oder `sessionAdmin` |

- Das Token geht in `X-Data-Gateway-Session`. Nur sein Hash wird gespeichert, in
  `<orm.workspacePath>/.data-gateway/state.sqlite`, geteilt von den Replikas auf diesem Volume (ohne Workspace-Pfad im
  Speicher).
- Eine Sitzung endet nach `idleTimeout` ohne Anfragen oder `maxLifetime` nach der Anmeldung: `401 SessionExpiredError`.
  Eine widerrufene antwortet mit `401 SessionRevokedError` und nennt, wer sie wann widerrufen hat.
- Eine aufgelistete Sitzung hat ihre Zugangsdaten, die Adresse und den Client (die IDE, ihre Version, Web oder
  Desktop), wann sie zuletzt genutzt wurde und wann sie endet, ob sie gerade **verbunden** ist und was sie sich ansieht.
  Nie ihr Token.
- **Der WebSocket der Ereignisse**, `ws://…/events`, mit der Sitzung im Upgrade (`X-Data-Gateway-Session` oder, aus
  einem Browser, das Subprotokoll `lambdaorm.session.<token>`): Er sendet `session.revoked` (und schließt mit `4401`),
  `session.expiring` (2 Minuten vor dem Ende ihrer Lebensdauer), `schema.statusChanged` und `workspace.changed`. Eine
  Sitzung mit offenem Socket ist *verbunden*; sie zu widerrufen, in welcher Replika auch immer, schließt ihren Socket.
- Jede Anmeldung, Abmeldung, jeder Ablauf und jeder Widerruf hinterlässt eine [Audit](Security.md#audit)-Zeile.
- Die Daten-Transporte ändern sich nicht: Sie nehmen die Zugangsdaten bei jeder Anfrage entgegen.
