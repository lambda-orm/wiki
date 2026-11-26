# Konfiguration {#configuration}

Alles, was das Gateway tut, entscheidet **eine YAML-Datei**, die in den Container eingebunden und nie in das Image
eingebaut wird: welche Schemas es unter welchen Routen bereitstellt, welche Transporte es öffnet, wer sie nutzen darf
und mit welchen Limits. Diese Seite erklärt jeden Teil und endet mit der [Referenz](#reference) aller Schlüssel; der
[Erste Schritte](GettingStarted.md) enthalten eine vollständige kleine Datei.

- Pfad: `DATA_GATEWAY_CONFIG_PATH` (Standard `/config/data-gateway.config.yaml`). Sie ist **obligatorisch**: Ohne sie
  protokolliert das Gateway den Fehler und beendet sich mit Code 1. Ein ungültiger Wert (ein Port, der keine Zahl ist,
  eine unbekannte Berechtigung oder ein unbekanntes Tool) verhindert ebenfalls den Start, mit der Liste der Probleme;
  ein unbekannter Abschnitt oder Schlüssel wird gemeldet und ignoriert.
- `$VAR` und `${VAR}` werden an jeder Stelle der Datei durch Umgebungsvariablen ersetzt, auch innerhalb eines Textes
  (`"${HOST}:${PORT}"`). Eine nicht definierte Variable gilt als **nicht gesetzt**: Ein Transport, dessen `port: $VAR`
  nicht definiert ist, wird nicht bereitgestellt; Zugangsdaten, deren Secret nicht definiert ist, verhindern den Start.
- Die λORM-Schemas (`lambdaORM.yaml`, Quellen, Mappings, Stages, Warteschlange) bleiben in ihren Workspaces. Die Datei
  des Gateways gibt an, wo sie sich befinden, wie jedes erreicht wird und wie es bereitgestellt wird.

## Transporte und Ports {#transports-and-ports}

Ein Transport wird **nur bereitgestellt, wenn er einen Port hat**. Es gibt keine Standardports, weder im Code noch im
Image:

| `transports.<name>` | Ergebnis |
| --- | --- |
| fehlt | nicht bereitgestellt |
| vorhanden ohne `port`, oder `port: $VAR` mit nicht definierter Variable | nicht bereitgestellt (protokolliert: `mcpHttp not exposed: no port configured`) |
| `port`, der keine Ganzzahl 1–65535 ist | Konfigurationsfehler: Das Gateway startet nicht |
| zwei Transporte auf demselben `host:port` | Konfigurationsfehler |
| überhaupt kein Transport bereitgestellt | Konfigurationsfehler |

So kann dieselbe Datei MCP nur dort bereitstellen, wo `DATA_GATEWAY_MCP_PORT` definiert ist. Die Transporte werden unter
[Transporte](Transports.md) beschrieben.

## Schemas {#schemas}

Ein **Schema** ist ein λORM-Workspace (ein Ordner mit `lambdaORM.yaml`), der unter einer **Route** (`iot/v1`)
bereitgestellt wird. Schemas werden auf zwei Arten deklariert, die kombiniert werden können.

**Erkannt (`orm.workspacePath`).** Der Ordner wird beim Start durchlaufen: Jeder Ordner mit einer `lambdaORM.yaml` ist ein
Schema, und sein relativer Pfad ist seine Route. Unterhalb eines Schemas endet der Durchlauf (ein Workspace hat eigene
Ordner).

```
/workspace                          (orm.workspacePath)
├── iot/
│   ├── v1/lambdaORM.yaml    →  schema "iot/v1"       →  /iot/v1/...
│   └── v2/lambdaORM.yaml    →  schema "iot/v2"       →  /iot/v2/...
└── accounts/
    └── v1/lambdaORM.yaml    →  schema "accounts/v1"  →  /accounts/v1/...
```

**Deklariert (`orm.schemas[]` mit `workspace`).** Die Route hängt nicht davon ab, wo der Ordner liegt: ein Volume pro
Schema oder eine Instanz, die nur einige Schemas bereitstellt.

```yaml
orm:
  workspacePath: /workspace
  schemas:
    - path: accounts/v1
      workspace: /mnt/accounts          # a folder with lambdaORM.yaml, or the file itself
```

**Angepasst.** Ein Eintrag in `orm.schemas[]` ohne `workspace` passt ein erkanntes Schema an (sein `path` muss mit einem
übereinstimmen). Was ein Schema anpassen kann:

| Schlüssel eines Schemas | Wirkung | Wenn nicht gesetzt |
| --- | --- | --- |
| `transports` | die Transporte, die es bereitstellen; auf den anderen existieren seine Routen nicht (`404`) | alle bereitgestellten Transporte |
| `authentication` | ersetzt die Authentifizierung (und ihre Berechtigungen) für dieses Schema, auf allen seinen Transporten | die des Transports, sonst die globale |
| `env` | Variablen, die sein Worker erhält (siehe unten) | seine `.env` und die Basisvariablen |
| `scripts` | `enabled` und die Limits für Skripte | `scripts` |
| `mcp.maxRows`, `mcp.tools` | Zeilenlimit und Tools seines MCP-Servers | `mcp` |
| `server.timeout`, `server.maxConcurrent`, `server.maxResponseBytes` | Timeout, gleichzeitige Operationen und Antwortgröße | `server` |
| `cache`, `outbox` (4.2.0) | der [Cache](#cache) seiner Lesevorgänge; wohin seine [Outbox](Changes.md#the-outbox) geht | `cache`, `outbox` |
| `runtime.mode`, `runtime.maxMemoryMb`, `runtime.checkConnections` | `thread` / `process`, Speicher seines Workers, ob seine Verbindungen beim Start geprüft werden | `runtime` |

Die spezifischste Angabe gewinnt immer und **ersetzt** die anderen: Schema → Transport → global.

**Regeln:**

- Mindestens eines von `orm.workspacePath` oder ein `orm.schemas[]` mit `workspace`. Mit `orm.watch` (dem Standard)
  startet ein leeres Volume und wartet auf sein erstes Schema, und eine Anpassung eines Schemas, das noch nicht da ist,
  wird gemeldet und angewendet, sobald es erscheint; ohne `orm.watch` muss mindestens ein Schema gefunden werden.
- Zwei Schemas mit derselben Route oder eine Route, die Präfix einer anderen ist (`iot` und `iot/v1`), sind ein Fehler.
- Jedes Segment einer Route: `[a-zA-Z0-9_.-]`, und keiner der reservierten Namen: `health`, `ping`, `metrics`, `version`,
  `schemas`, `mcp`, `sse`, `messages`, `status`, `doc`, `api-docs`, `swagger`, `asyncapi`, `ui`, `whoami`, `typings`, `admin`.
- **Ein Schema an der Wurzel:** Wenn `workspacePath` selbst eine `lambdaORM.yaml` enthält (oder ein deklariertes Schema
  `path: ""` verwendet), wird es an der Wurzel bereitgestellt (`/execute`). Nur wenn es das einzige Schema ist.
- **Hot Reload** (`orm.watch`, standardmäßig an): ein neuer Ordner mit einer `lambdaORM.yaml` ist ein neues Schema,
  eine geänderte `lambdaORM.yaml` oder `.env` lädt ihr Schema blue-green neu (die zuletzt gestartete Version antwortet
  weiter, wenn die neue nicht startet), ein verschwundener Ordner nimmt sein Schema mit. Siehe [Administration](Admin.md#workspaces-in-the-volume).
- Jedes Schema verwendet die `infrastructure.queue` (Kafka) seiner eigenen `lambdaORM.yaml`, falls vorhanden.

## Umgebung jedes Schemas {#environment-of-each-schema}

λORM ersetzt die `$VAR` einer `lambdaORM.yaml` durch die Umgebung. Damit ein Schema weder die Zugangsdaten eines anderen
noch die Secrets des Gateways lesen kann, **erhält jeder Schema-Worker nur seine eigenen Variablen**, von höchster zu
niedrigster Priorität:

| Quelle | Beispiel |
| --- | --- |
| `schemas[].env` in der Datei des Gateways (die Werte können die Variablen des Gateways verwenden) | `DB_CONNECTION: $IOT_V1_DB` |
| eine `.env`-Datei im Workspace des Schemas (optional) | `/workspace/iot/v1/.env` |
| die Basisvariablen: `PATH`, `HOME`, `TZ`, `LANG`, `NODE_*`, `LD_LIBRARY_PATH`, `ORACLE_*` und `runtime.env.passthrough` | `TZ=UTC` |

Jede `lambdaORM.yaml` kann dieselben Namen verwenden, und das Gateway ordnet jeden davon seinem tatsächlichen Secret zu:

```yaml
orm:
  workspacePath: /workspace
  schemas:
    - path: iot/v1
      env: { DB_CONNECTION: $IOT_V1_DB }
    - path: iot/v2
      env: { DB_CONNECTION: $IOT_V2_DB }      # iot/v2 can be an exact copy of iot/v1
runtime:
  env:
    isolate: true                           # false: every schema gets the whole environment (local development)
    passthrough: [ KAFKA_BROKER ]           # variables every schema receives
```

Eine in `schemas[].env` verwendete Variable, die nicht definiert ist, bleibt undefiniert: Dieses Schema kann sich nicht
verbinden und wird mit dem Grund als `error` angezeigt; die anderen starten.

## Laufzeit {#runtime}

```yaml
runtime:
  transports: shared        # every transport in one edge worker (thread and process: not in this version)
  schemas: thread           # thread | process: one worker per schema (runtime.mode adjusts one schema)
  maxMemoryMb: 512          # JavaScript heap of each worker; above it, only that worker is restarted
  checkConnections: true    # at start each schema opens a connection of each source: a database down → error, retried
  threadpoolSize: auto      # UV_THREADPOOL_SIZE; auto = max(4, 2 × schemas in thread mode), at most 64
  heartbeat:
    intervalMs: 5000
    timeoutMs: 30000        # a worker that doesn't answer is ended and restarted
  restart:
    initialDelayMs: 1000    # first wait before retrying a fallen worker or a schema that didn't start
    maxDelayMs: 300000      # the wait grows up to this
  env: { isolate: true, passthrough: [] }
```

Was jeder Modus isoliert:

| | `thread` | `process` | eine weitere Instanz |
| --- | --- | --- | --- |
| CPU und Event Loop | ja | ja | ja |
| JavaScript-Heap (`maxMemoryMb`) | ja | ja | ja |
| Ein hängender Worker (Heartbeat) | ja | ja | ja |
| Umgebungsvariablen | ja | ja | ja |
| libuv-Threadpool (DNS, `fs`, native Treiber) | geteilt (`threadpoolSize`) | ja | ja |
| Nativer Speicher, OOM des Containers | nein | derselbe Container | ja |
| Ein Absturz von nativem Code | nein: der gesamte Prozess | ja | ja |

`thread` eignet sich für die Entwicklung und kleine Schemas; `runtime.mode: process` für ein kritisches Schema in
Produktion (Oracle im Thick-Modus verwendet nativen Code); eine separate Instanz für Schemas verschiedener Teams oder
Kunden.

## Vollständiges Beispiel {#complete-example}

```yaml
# data-gateway.config.yaml
orm:
  workspacePath: /workspace
  schemas:
    - path: iot/v1                      # discovered: only adjustments
      transports: [ http ]              # not exposed by MCP
      env: { DB_CONNECTION: $IOT_V1_DB }
      scripts: { enabled: false }
    - path: iot/v2
      env: { DB_CONNECTION: $IOT_V2_DB }
      mcp: { maxRows: 100 }
      runtime: { maxMemoryMb: 1024 }
    - path: accounts/v1                 # declared: defines and adjusts
      workspace: /mnt/accounts
      env: { DB_CONNECTION: $ACCOUNTS_DB }
      runtime: { mode: process }
      authentication:
        adapter: local
        type: apikey
        keys:
          - { name: accounts-backend, value: $ACCOUNTS_KEY, permissions: [ read, write ] }

runtime:
  schemas: thread
  maxMemoryMb: 512

server:
  timeout: 120000                  # ms per request, message or tool call
  maxConcurrent: 64                # simultaneous operations per schema; above it, 429
  requestBodySize: 14MB
  maxResponseBytes: 256MB          # 0 = no limit

logger: { adapter: console, level: info }
metrics: { enabled: true }
audit: { enabled: true, includeData: false }

authentication:                    # for every schema and transport that doesn't set its own
  adapter: local
  type: apikey
  header: X-Api-Key
  keys:
    - { name: agent,   value: $AGENT_KEY,   permissions: [ read ] }
    - { name: backend, value: $BACKEND_KEY, permissions: [ read, write, script, queue, stageImport ] }

rateLimit: { windowMs: 30000, max: 0 }   # http only; max: 0 = no rate limit

scripts: { enabled: true, maxLength: 20000, timeoutMs: 30000, maxIterations: 100000 }

mcp:
  name: data-gateway
  tools: { include: [], exclude: [] }
  pageSize: 50
  maxRows: 500

transports:
  http:
    port: $DATA_GATEWAY_HTTP_PORT
  mcpHttp:
    port: $DATA_GATEWAY_MCP_HTTP_PORT
  mcpWebSocket:
    port: $DATA_GATEWAY_MCP_WS_PORT
  webSocket:
    port: $DATA_GATEWAY_WS_PORT
  management:                      # die API der IDE; ohne die Variable nicht bereitgestellt (Produktion)
    port: $DATA_GATEWAY_MANAGEMENT_PORT
    trustedProxies: [ 10.0.0.0/8 ] # das Netz der IDE: ihr X-Forwarded-For liefert die Adresse des Browsers
    sessions: { idleTimeout: 30m, maxLifetime: 12h }
```

## Beobachtbarkeit (OpenTelemetry) {#observability}

**Seit data-gateway 4.1.0.** Der Abschnitt `observability` hat die Form von
`infrastructure.observability` einer `lambdaORM.yaml` ([Beobachtbarkeit](../schema/Observability.md)), und die
Standardvariablen `OTEL_*` haben Vorrang. Das Gateway startet das OpenTelemetry-SDK in jedem Worker vor λORM, sodass eine
Anfrage, ihr Worker und die Sätze von λORM eine einzige Trace bilden.

```yaml
observability:
  serviceName: data-gateway                              # der Standard; OTEL_SERVICE_NAME hat Vorrang
  exporter: { type: otlp, endpoint: http://alloy:4318 }  # http/protobuf (oder http/json); kein gRPC
  traces:
    enabled: true
    sampler: { ratio: 1, parentBased: true }
  metrics: { enabled: true }                             # auch per OTLP; /metrics enthält sie ohnehin
  logs:
    adapters: [ { type: opentelemetry } ]                # das Audit und die Historie der Schemas
```

Die Header des Exporters enthalten Tokens: Sie gehören nur in `OTEL_EXPORTER_OTLP_HEADERS` (`exporter.headers` in der
Datei verhindert den Start). Was sie liefert, steht in [Betrieb](Operations.md#opentelemetry).

## Der Cache der Lesevorgänge {#cache}

**Seit data-gateway 4.2.0.** Ein Lesevorgang, der wiederholt wird, solange sich nichts geändert hat, was er liest, geht
nicht zurück zur Datenbank. Er ist aus, bis `cache.enabled: true` (global oder pro Schema): Ein Client kann ein
Ergebnis sehen, das bis zu `ttl` alt ist, wenn eine andere Anwendung in die Datenbank schreibt.

```yaml
cache:                      # auch orm.schemas[].cache
  enabled: true
  ttl: 60s                  # wie lange ein Ergebnis lebt
  maxEntries: 10000         # im Speicher; die am wenigsten genutzten gehen zuerst
  maxRowBytes: 1MB          # ein größeres Ergebnis wird nicht behalten
  entities:
    Prices: { ttl: 5s }               # ein anderes ttl für das, was sie liest
    AuditLogs: { enabled: false }     # was sie liest, wird nie behalten
```

- **Was behalten wird:** das Ergebnis eines `execute`, das nur liest, und einer
  [benannten Abfrage](Rest.md#named-queries), die nur liest; nie ein Schreibvorgang, ein Skript oder ein
  `execute-queued`.
- **Wessen:** Ein Ergebnis gehört zu seiner Abfrage, seinen `data`, seiner Stage und **der View und dem Kontext dessen,
  der gefragt hat**: Zwei Identitäten mit einer anderen View oder einem anderen Mandanten teilen nie eines.
- **Bis wann:** Ein Schreibvorgang über λORM entfernt sofort alle Ergebnisse, die seine Entität lesen (auch über ein
  `include` oder eine Relation); was eine andere Anwendung schreibt, wird höchstens nach `ttl` gesehen.
- Bei mehreren Replikas hat jede ihren eigenen Cache und sieht ihre eigenen Schreibvorgänge (geteilt mit Redis,
  später); verwenden Sie dort ein kurzes `ttl`.
- `/metrics` hat `data_gateway_cache_requests{result="hit|miss"}`, `data_gateway_cache_invalidations` und
  `data_gateway_cache_entries`; REST antwortet mit [`ETag` und `304`](Rest.md#execute).

## Referenz {#reference}

| Schlüssel | Standard | Hinweise |
| --- | --- | --- |
| `orm.workspacePath` | — | der Ordner, in dem Schemas erkannt werden |
| `orm.schemas[]` | `[]` | `path` (obligatorisch), `workspace` (definiert ein Schema) und Anpassungen |
| `orm.watch` | `true` | Hot Reload der Workspaces; `false`, oder `{ enabled, intervalMs, debounceMs }` |
| `orm.watch.intervalMs` / `debounceMs` | `5000` / `300` | der Durchlauf der Workspaces; wie lange Änderungen gesammelt werden |
| `admin.enabled` | — | **in 4.0.0 entfernt** (mit Warnung ignoriert): die [Administration](Admin.md) ist aktiv, wenn `transports.management` einen Port hat |
| `admin.allowAnonymous` | `false` | mit `authentication: none` administriert jeder (nur lokale Entwicklung) |
| `admin.commandTimeoutMs` / `maxFileBytes` | `600000` / `2MB` | wie lange ein Befehl dauern darf; die größte geschriebene Datei |
| `runtime.transports` | `shared` | alle Transporte in einem Edge-Worker; `thread` und `process` werden gemeldet und laufen als `shared` |
| `runtime.schemas` | `thread` | `thread` / `process` |
| `runtime.maxMemoryMb` | `512` | pro Worker |
| `runtime.checkConnections` | `true` | eine nicht erreichbare Datenbank lässt das Schema in `error` (mit erneuten Versuchen), statt bei der ersten Abfrage fehlzuschlagen |
| `runtime.threadpoolSize` | `auto` | `max(4, 2 × schemas in thread mode)`, höchstens 64 |
| `runtime.heartbeat.intervalMs` / `timeoutMs` | `5000` / `30000` | |
| `runtime.restart.initialDelayMs` / `maxDelayMs` | `1000` / `300000` | wachsende Wartezeit zwischen Neustarts |
| `runtime.env.isolate` / `passthrough` | `true` / `[]` | |
| `server.timeout` | `120000` | pro HTTP-Anfrage, WebSocket-Nachricht und MCP-Tool-Aufruf; darüber `504` |
| `server.maxConcurrent` | `64` | gleichzeitige Operationen pro Schema; darüber `429`; `0` = kein Limit |
| `server.requestBodySize` | `14MB` | |
| `server.maxResponseBytes` | `256MB` | darüber `413`; `0` = kein Limit |
| `logger.adapter` / `logger.level` | `console` / `info` | `console` oder `winston`; `error`, `warn`, `info`, `debug` |
| `metrics.enabled` | `true` | |
| `audit.enabled` | `true` | das Audit von Schreibvorgängen ([Sicherheit](Security.md#audit)) |
| `audit.includeData` | `false` | `true` fügt die Parameter (`data`) hinzu, die personenbezogene Daten enthalten können |
| `authentication` | `{ adapter: none }` | [Sicherheit](Security.md) |
| `authentication.header` | `X-Api-Key` | der Header von `type: apikey` |
| `authentication.adapter: jwt` | — | (4.1.0) die Tokens eines Identitätsanbieters: `issuer`, `audience`, `jwksUri`, `secret`, `algorithms`, `clockTolerance`, `principal.name`, `principal.permissions.claim` / `roles`, `context` ([Sicherheit](Security.md#jwt)) |
| `authentication.methods` | — | (4.1.0) mehrere Authentifizierungen der Reihe nach: `jwt` und `local` ([Sicherheit](Security.md#jwt)) |
| `keys[].view`, `roles.<role>.view` | — | (4.1.0) die [View](Security.md#views) der Anfragen eines Schlüssels oder einer Rolle |
| `orm.schemas[].view` | `default` | (4.1.0) die View eines Aufrufers ohne eigene |
| `orm.schemas[].queries.<name>` | — | (4.1.0) `maxRows`, `timeout` einer [benannten Abfrage](Rest.md#named-queries) |
| `cache.enabled` | `false` | (4.2.0) der [Cache der Lesevorgänge](#cache); auch pro Schema |
| `cache.ttl` / `maxEntries` / `maxRowBytes` | `60s` / `10000` / `1MB` | (4.2.0) |
| `cache.entities.<entity>` | — | (4.2.0) `{ ttl }` oder `{ enabled: false }` für das, was sie liest |
| `outbox.destinations[]` | `[]` | (4.2.0) wohin die [Outbox](Changes.md#the-outbox) geht: `type: webhook` (`url`, `secret`, `timeout`, `entities`) oder `type: kafka` (`topic`, `entities`); auch pro Schema |
| `outbox.interval` / `batch` | `1s` / `100` | (4.2.0) wie oft nach ausstehenden Ereignissen gesucht wird; wie viele pro Runde |
| `outbox.dispatch` | `true` | (4.2.0) diese Replika stellt zu; `false` (oder `DATA_GATEWAY_OUTBOX_DISPATCH=false`) in allen Replikas außer einer |
| `transports.<t>.authentication` | `authentication` | ersetzt die globale für diesen Transport |
| `rateLimit.windowMs` / `rateLimit.max` | `30000` / `30` | nur `http`; `max: 0` deaktiviert es |
| `scripts.enabled` | `false` | `POST /script` sowie das zugehörige Tool und die Methode |
| `scripts.maxLength` / `timeoutMs` / `maxIterations` | `20000` / `30000` / `100000` | eine Anfrage kann weniger anfordern, nie mehr |
| `mcp.name` | `data-gateway` | der Name der MCP-Server; jeder fügt seine Route hinzu |
| `mcp.tools.include` / `exclude` | `[]` / `[]` | Namen von [Tools](Mcp.md#tools) |
| `mcp.pageSize` | `50` | Seitengröße von `tools/list` und `resources/list` |
| `mcp.maxRows` | `500` | Zeilen von `orm_execute` / `orm_execute_script`; `0` = kein Limit |
| `mcp.freeQueries` | `true` | (4.1.0) `false`: ein Agent nur mit den [benannten Abfragen](Mcp.md#named-queries); auch pro Schema |
| `transports.<t>.port` | **keiner** | ohne Port wird der Transport nicht bereitgestellt |
| `transports.<t>.host` | `0.0.0.0` | |
| `transports.<t>.basePath` | `''` | ein Präfix vor der Route des Schemas (`/data-gateway`), hinter einem Ingress mit Pfad |
| `transports.<t>.maxConnections` | `100` | `webSocket`, `mcpWebSocket` sowie die SSE-Streams und zustandsbehafteten Sitzungen von `mcpHttp` |
| `transports.http.swagger.enabled` | `true` | `/doc` und `/api-docs` |
| `transports.http.ui` | — | **in 4.0.0 entfernt** (mit Warnung ignoriert): die [UI](../ide/index.md) ist die data-gateway-ide |
| `transports.management.port` | **keiner** | die API der [IDE](../ide/index.md) und die [Administration](Admin.md) ([Transporte](Transports.md#management)) |
| `transports.management.sessions.idleTimeout` / `maxLifetime` | `30m` / `12h` | wann eine [Sitzung](Transports.md#sessions) endet: ohne Anfragen bzw. nach der Anmeldung; `30s`, `30m`, `12h`, `7d` oder Millisekunden |
| `transports.management.sessions.maxPerCredential` | `0` | gleichzeitige Sitzungen pro Zugangsdaten; `0` = kein Limit; darüber schließt eine Anmeldung die älteste |
| `transports.management.sessions.store` | `auto` | `auto`: `<orm.workspacePath>/.data-gateway/state.sqlite` (von den Replikas geteilt); `memory`: nur diese Replika |
| `transports.management.trustedProxies` | `[]` | Adressen oder Netzwerke (CIDR), deren `X-Forwarded-For` geglaubt wird: die IDE, damit die Adresse des Browsers sichtbar ist |
| `transports.mcpHttp.legacySse` | `true` | zusätzlich zu Streamable HTTP das ältere HTTP+SSE für ältere Clients |
| `transports.mcpHttp.stateful` | `false` | zustandsloses Streamable HTTP: Jede Replika beantwortet jede Anfrage |
| `transports.<ws>.asyncapi.enabled` | `true` | `GET /asyncapi` und `/asyncapi.json` von `webSocket` und `mcpWebSocket` |
| `observability` | — | OpenTelemetry, [oben](#observability); seit 4.1.0 |
