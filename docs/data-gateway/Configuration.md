# Configuration

Everything is configured in **one YAML file**, mounted in the container, never baked into the image:

- Path: `DATA_GATEWAY_CONFIG_PATH` (default `/config/data-gateway.config.yaml`). It is **mandatory**: without it the
  gateway logs the error and exits with code 1. An invalid key or value also stops the start, with the list of
  problems.
- `$VAR` and `${VAR}` are replaced by environment variables anywhere in the file, also inside a text
  (`"${HOST}:${PORT}"`). A variable that is not defined counts as **not set**: a transport whose `port: $VAR` is not
  defined is not exposed; a credential whose secret is not defined stops the start.
- The λORM schemas (`lambdaORM.yaml`, sources, mappings, stages, queue) stay in their workspaces. The gateway's file
  says where they are, how each one is reached and how it is exposed.

## Transports and ports

A transport is exposed **only when it has a port**. There are no default ports, neither in the code nor in the image:

| `transports.<name>` | Result |
| --- | --- |
| missing | not exposed |
| present without `port`, or `port: $VAR` with the variable not defined | not exposed (logged: `mcpHttp not exposed: no port configured`) |
| `port` that is not an integer 1–65535 | configuration error: the gateway doesn't start |
| two transports on the same `host:port` | configuration error |
| no transport exposed at all | configuration error |

So the same file can expose MCP only where `DATA_GATEWAY_MCP_PORT` is defined. The transports are described in
[Transports](Transports.md).

## Schemas

A **schema** is a λORM workspace (a folder with `lambdaORM.yaml`) served at a **route** (`iot/v1`). They are declared
in two ways, which can be combined.

**Discovered (`orm.workspacePath`).** The folder is walked at start: every folder with a `lambdaORM.yaml` is a schema
and its relative path is its route. Below a schema the walk stops (a workspace has folders of its own).

```
/workspace                          (orm.workspacePath)
├── iot/
│   ├── v1/lambdaORM.yaml    →  schema "iot/v1"       →  /iot/v1/...
│   └── v2/lambdaORM.yaml    →  schema "iot/v2"       →  /iot/v2/...
└── accounts/
    └── v1/lambdaORM.yaml    →  schema "accounts/v1"  →  /accounts/v1/...
```

**Declared (`orm.schemas[]` with `workspace`).** The route doesn't depend on where the folder is: one volume per
schema, or an instance that serves only some schemas.

```yaml
orm:
  workspacePath: /workspace
  schemas:
    - path: accounts/v1
      workspace: /mnt/accounts          # a folder with lambdaORM.yaml, or the file itself
```

**Adjusted.** An entry of `orm.schemas[]` without `workspace` adjusts a discovered schema (its `path` must match one).
What a schema can adjust:

| Key of a schema | Effect | If not set |
| --- | --- | --- |
| `transports` | the transports that expose it; on the others its routes don't exist (`404`) | every exposed transport |
| `authentication` | replaces the authentication (and its permissions) for this schema, on all its transports | the transport's, else the global one |
| `env` | variables its worker receives (below) | its `.env` and the base variables |
| `scripts` | `enabled` and the limits of scripts | `scripts` |
| `mcp.maxRows`, `mcp.tools` | row limit and tools of its MCP server | `mcp` |
| `server.timeout`, `server.maxConcurrent`, `server.maxResponseBytes` | timeout, simultaneous operations and response size | `server` |
| `runtime.mode`, `runtime.maxMemoryMb`, `runtime.checkConnections` | `thread` / `process`, memory of its worker, whether its connections are checked at start | `runtime` |

The most specific always wins and **replaces** the others: schema → transport → global.

**Rules:**

- At least one of `orm.workspacePath` or a `orm.schemas[]` with `workspace`, and at least one schema.
- Two schemas with the same route, or a route that is the prefix of another (`iot` and `iot/v1`), are an error.
- Each segment of a route: `[a-zA-Z0-9_.-]`, and none of the reserved names: `health`, `ping`, `metrics`, `version`,
  `schemas`, `mcp`, `sse`, `messages`, `status`, `doc`, `api-docs`, `swagger`, `asyncapi`, `ui`, `whoami`, `typings`, `admin`.
- **A schema at the root:** if `workspacePath` itself has a `lambdaORM.yaml` (or a declared schema uses `path: ""`),
  it is served at the root (`/execute`). Only when it is the only schema.
- **Hot reload** (`orm.watch`, on by default): a new folder with a `lambdaORM.yaml` is a new schema, a changed
  `lambdaORM.yaml` or `.env` reloads its schema blue-green (the last version that started keeps serving if the new one
  doesn't), a folder that goes takes its schema. See [Administration](Admin.md#workspaces-in-the-volume).
- Each schema uses the `infrastructure.queue` (Kafka) of its own `lambdaORM.yaml`, if it has one.

## Environment of each schema

λORM replaces the `$VAR` of a `lambdaORM.yaml` with the environment. So that a schema cannot read another one's
credentials nor the gateway's secrets, **each schema worker receives only its own variables**, from highest to
lowest priority:

| Source | Example |
| --- | --- |
| `schemas[].env` in the gateway's file (the values can use the gateway's variables) | `DB_CONNECTION: $IOT_V1_DB` |
| a `.env` file in the schema's workspace (optional) | `/workspace/iot/v1/.env` |
| the base variables: `PATH`, `HOME`, `TZ`, `LANG`, `NODE_*`, `LD_LIBRARY_PATH`, `ORACLE_*`, and `runtime.env.passthrough` | `TZ=UTC` |

Every `lambdaORM.yaml` can use the same names, and the gateway maps each one to its real secret:

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

A variable used in `schemas[].env` that is not defined stays undefined: that schema fails to connect and is shown in
`error` with the reason; the others start.

## Runtime

```yaml
runtime:
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

What each mode isolates:

| | `thread` | `process` | another instance |
| --- | --- | --- | --- |
| CPU and event loop | yes | yes | yes |
| JavaScript heap (`maxMemoryMb`) | yes | yes | yes |
| A hung worker (heartbeat) | yes | yes | yes |
| Environment variables | yes | yes | yes |
| libuv thread pool (DNS, `fs`, native drivers) | shared (`threadpoolSize`) | yes | yes |
| Native memory, container OOM | no | same container | yes |
| A crash of native code | no: the whole process | yes | yes |

`thread` suits development and small schemas; `runtime.mode: process` a critical schema in production (Oracle in thick
mode uses native code); a separate instance, schemas of different teams or customers.

## Complete example

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
    ui: { enabled: true }
  mcpHttp:
    port: $DATA_GATEWAY_MCP_HTTP_PORT
  mcpWebSocket:
    port: $DATA_GATEWAY_MCP_WS_PORT
  webSocket:
    port: $DATA_GATEWAY_WS_PORT
```

## Reference

| Key | Default | Notes |
| --- | --- | --- |
| `orm.workspacePath` | — | the folder where schemas are discovered |
| `orm.schemas[]` | `[]` | `path` (mandatory), `workspace` (defines a schema) and adjustments |
| `orm.watch` | `true` | hot reload of the workspaces; `false`, or `{ enabled, intervalMs, debounceMs }` |
| `orm.watch.intervalMs` / `debounceMs` | `5000` / `300` | the scan of the workspaces; how long changes are gathered |
| `admin.enabled` | `false` | the [administration](Admin.md) at `/admin` of the `http` transport |
| `admin.allowAnonymous` | `false` | with `authentication: none`, anyone administers (local development only) |
| `admin.commandTimeoutMs` / `maxFileBytes` | `600000` / `2MB` | how long a command may take; the largest file written |
| `runtime.schemas` | `thread` | `thread` / `process` |
| `runtime.maxMemoryMb` | `512` | per worker |
| `runtime.checkConnections` | `true` | a database down leaves the schema in `error`, retried, instead of failing in the first query |
| `runtime.threadpoolSize` | `auto` | `max(4, 2 × schemas in thread mode)`, at most 64 |
| `runtime.heartbeat.intervalMs` / `timeoutMs` | `5000` / `30000` | |
| `runtime.restart.initialDelayMs` / `maxDelayMs` | `1000` / `300000` | growing wait between restarts |
| `runtime.env.isolate` / `passthrough` | `true` / `[]` | |
| `server.timeout` | `120000` | per HTTP request, WebSocket message and MCP tool call |
| `server.maxConcurrent` | `64` | simultaneous operations per schema; above it `429`; `0` = no limit |
| `server.requestBodySize` | `14MB` | |
| `server.maxResponseBytes` | `256MB` | above it, `413`; `0` = no limit |
| `logger.adapter` / `logger.level` | `console` / `info` | `console` or `winston`; `error`, `warn`, `info`, `debug` |
| `metrics.enabled` | `true` | |
| `audit.enabled` | `true` | the audit of writes ([Security](Security.md#audit)) |
| `audit.includeData` | `false` | `true` adds the parameters (`data`), which can have personal data |
| `authentication` | `{ adapter: none }` | [Security](Security.md) |
| `transports.<t>.authentication` | `authentication` | replaces the global one for that transport |
| `rateLimit.windowMs` / `rateLimit.max` | `30000` / `30` | `http` only; `max: 0` turns it off |
| `scripts.enabled` | `false` | `POST /script` and its tool and method |
| `scripts.maxLength` / `timeoutMs` / `maxIterations` | `20000` / `30000` / `100000` | a request can ask for less, never more |
| `mcp.name` | `data-gateway` | the name of the MCP servers; each one adds its route |
| `mcp.tools.include` / `exclude` | `[]` / `[]` | names of [tools](Mcp.md#tools) |
| `mcp.pageSize` | `50` | page of `tools/list` and `resources/list` |
| `mcp.maxRows` | `500` | rows of `orm_execute` / `orm_execute_script`; `0` = no limit |
| `transports.<t>.port` | **none** | without a port, the transport is not exposed |
| `transports.<t>.host` | `0.0.0.0` | |
| `transports.<t>.basePath` | `''` | a prefix before the schema's route (`/data-gateway`), behind an ingress with a path |
| `transports.<t>.maxConnections` | `100` | `webSocket`, `mcpWebSocket` and the SSE of `mcpHttp` |
| `transports.http.swagger.enabled` | `true` | `/doc` and `/api-docs` |
| `transports.http.ui.enabled` | `false` | the [UI](Ui.md) at `/ui` |
| `transports.mcpHttp.legacySse` | `true` | besides Streamable HTTP, the older HTTP+SSE for older clients |
| `transports.mcpHttp.stateful` | `false` | stateless Streamable HTTP: any replica answers any request |
| `transports.<ws>.asyncapi.enabled` | `true` | `GET /asyncapi` and `/asyncapi.json` of `webSocket` and `mcpWebSocket` |
