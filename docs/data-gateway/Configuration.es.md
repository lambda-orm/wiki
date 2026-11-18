# Configuración {#configuration}

Todo se configura en **un único archivo YAML**, montado en el contenedor y nunca incluido en la imagen:

- Ruta: `DATA_GATEWAY_CONFIG_PATH` (por defecto `/config/data-gateway.config.yaml`). Es **obligatorio**: sin él el
  gateway registra el error y termina con código 1. Una clave o un valor inválidos también detienen el arranque, con la lista de
  problemas.
- `$VAR` y `${VAR}` se reemplazan por variables de entorno en cualquier parte del archivo, también dentro de un texto
  (`"${HOST}:${PORT}"`). Una variable que no está definida cuenta como **no establecida**: un transporte cuyo `port: $VAR` no está
  definido no se expone; una credencial cuyo secreto no está definido detiene el arranque.
- Los esquemas de λORM (`lambdaORM.yaml`, fuentes, mappings, stages, cola) permanecen en sus workspaces. El archivo del gateway
  indica dónde están, cómo se accede a cada uno y cómo se expone.

## Transportes y puertos {#transports-and-ports}

Un transporte se expone **solo cuando tiene un puerto**. No hay puertos por defecto, ni en el código ni en la imagen:

| `transports.<name>` | Resultado |
| --- | --- |
| ausente | no se expone |
| presente sin `port`, o `port: $VAR` con la variable no definida | no se expone (se registra: `mcpHttp not exposed: no port configured`) |
| `port` que no es un entero entre 1 y 65535 | error de configuración: el gateway no arranca |
| dos transportes en el mismo `host:port` | error de configuración |
| ningún transporte expuesto | error de configuración |

Así, el mismo archivo puede exponer MCP solo donde `DATA_GATEWAY_MCP_PORT` está definida. Los transportes se describen en
[Transportes](Transports.md).

## Esquemas {#schemas}

Un **esquema** es un workspace de λORM (una carpeta con `lambdaORM.yaml`) servido en una **ruta** (`iot/v1`). Se declaran
de dos formas, que se pueden combinar.

**Descubiertos (`orm.workspacePath`).** La carpeta se recorre al arrancar: cada carpeta con un `lambdaORM.yaml` es un esquema
y su ruta relativa es su ruta. Por debajo de un esquema el recorrido se detiene (un workspace tiene sus propias carpetas).

```
/workspace                          (orm.workspacePath)
├── iot/
│   ├── v1/lambdaORM.yaml    →  schema "iot/v1"       →  /iot/v1/...
│   └── v2/lambdaORM.yaml    →  schema "iot/v2"       →  /iot/v2/...
└── accounts/
    └── v1/lambdaORM.yaml    →  schema "accounts/v1"  →  /accounts/v1/...
```

**Declarados (`orm.schemas[]` con `workspace`).** La ruta no depende de dónde está la carpeta: un volumen por
esquema, o una instancia que sirve solo algunos esquemas.

```yaml
orm:
  workspacePath: /workspace
  schemas:
    - path: accounts/v1
      workspace: /mnt/accounts          # a folder with lambdaORM.yaml, or the file itself
```

**Ajustados.** Una entrada de `orm.schemas[]` sin `workspace` ajusta un esquema descubierto (su `path` debe coincidir con uno).
Lo que un esquema puede ajustar:

| Clave de un esquema | Efecto | Si no se establece |
| --- | --- | --- |
| `transports` | los transportes que lo exponen; en los demás sus rutas no existen (`404`) | todos los transportes expuestos |
| `authentication` | reemplaza la autenticación (y sus permisos) para este esquema, en todos sus transportes | la del transporte, si no la global |
| `env` | las variables que recibe su worker (véase abajo) | su `.env` y las variables base |
| `scripts` | `enabled` y los límites de los scripts | `scripts` |
| `mcp.maxRows`, `mcp.tools` | límite de filas y herramientas de su servidor MCP | `mcp` |
| `server.timeout`, `server.maxConcurrent`, `server.maxResponseBytes` | timeout, operaciones simultáneas y tamaño de respuesta | `server` |
| `runtime.mode`, `runtime.maxMemoryMb`, `runtime.checkConnections` | `thread` / `process`, memoria de su worker, si sus conexiones se comprueban al arrancar | `runtime` |

Siempre gana el más específico, que **reemplaza** a los demás: esquema → transporte → global.

**Reglas:**

- Al menos uno de `orm.workspacePath` o un `orm.schemas[]` con `workspace`, y al menos un esquema.
- Dos esquemas con la misma ruta, o una ruta que es prefijo de otra (`iot` e `iot/v1`), son un error.
- Cada segmento de una ruta: `[a-zA-Z0-9_.-]`, y ninguno de los nombres reservados: `health`, `ping`, `metrics`, `version`,
  `schemas`, `mcp`, `sse`, `messages`, `status`, `doc`, `api-docs`, `swagger`, `asyncapi`, `ui`, `whoami`, `typings`.
- **Un esquema en la raíz:** si el propio `workspacePath` tiene un `lambdaORM.yaml` (o un esquema declarado usa `path: ""`),
  se sirve en la raíz (`/execute`). Solo cuando es el único esquema.
- No hay recarga en caliente: un esquema nuevo se toma cuando se reinicia el gateway.
- Cada esquema usa la `infrastructure.queue` (Kafka) de su propio `lambdaORM.yaml`, si la tiene.

## Entorno de cada esquema {#environment-of-each-schema}

λORM reemplaza las `$VAR` de un `lambdaORM.yaml` con el entorno. Para que un esquema no pueda leer las
credenciales de otro ni los secretos del gateway, **cada worker de esquema recibe solo sus propias variables**, de mayor a
menor prioridad:

| Origen | Ejemplo |
| --- | --- |
| `schemas[].env` en el archivo del gateway (los valores pueden usar las variables del gateway) | `DB_CONNECTION: $IOT_V1_DB` |
| un archivo `.env` en el workspace del esquema (opcional) | `/workspace/iot/v1/.env` |
| las variables base: `PATH`, `HOME`, `TZ`, `LANG`, `NODE_*`, `LD_LIBRARY_PATH`, `ORACLE_*`, y `runtime.env.passthrough` | `TZ=UTC` |

Todos los `lambdaORM.yaml` pueden usar los mismos nombres, y el gateway asigna a cada uno su secreto real:

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

Una variable usada en `schemas[].env` que no está definida queda sin definir: ese esquema no logra conectarse y se muestra en
`error` con el motivo; los demás arrancan.

## Runtime {#runtime}

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

Lo que aísla cada modo:

| | `thread` | `process` | otra instancia |
| --- | --- | --- | --- |
| CPU y event loop | sí | sí | sí |
| Heap de JavaScript (`maxMemoryMb`) | sí | sí | sí |
| Un worker colgado (heartbeat) | sí | sí | sí |
| Variables de entorno | sí | sí | sí |
| Pool de hilos de libuv (DNS, `fs`, drivers nativos) | compartido (`threadpoolSize`) | sí | sí |
| Memoria nativa, OOM del contenedor | no | mismo contenedor | sí |
| Un fallo de código nativo | no: todo el proceso | sí | sí |

`thread` es adecuado para desarrollo y esquemas pequeños; `runtime.mode: process`, para un esquema crítico en producción (Oracle en modo thick
usa código nativo); una instancia separada, para esquemas de distintos equipos o clientes.

## Ejemplo completo {#complete-example}

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

## Referencia {#reference}

| Clave | Por defecto | Notas |
| --- | --- | --- |
| `orm.workspacePath` | — | la carpeta donde se descubren los esquemas |
| `orm.schemas[]` | `[]` | `path` (obligatorio), `workspace` (define un esquema) y ajustes |
| `runtime.schemas` | `thread` | `thread` / `process` |
| `runtime.maxMemoryMb` | `512` | por worker |
| `runtime.checkConnections` | `true` | una base de datos caída deja el esquema en `error`, con reintentos, en lugar de fallar en la primera consulta |
| `runtime.threadpoolSize` | `auto` | `max(4, 2 × schemas in thread mode)`, como máximo 64 |
| `runtime.heartbeat.intervalMs` / `timeoutMs` | `5000` / `30000` | |
| `runtime.restart.initialDelayMs` / `maxDelayMs` | `1000` / `300000` | espera creciente entre reinicios |
| `runtime.env.isolate` / `passthrough` | `true` / `[]` | |
| `server.timeout` | `120000` | por petición HTTP, mensaje WebSocket y llamada a herramienta MCP |
| `server.maxConcurrent` | `64` | operaciones simultáneas por esquema; por encima, `429`; `0` = sin límite |
| `server.requestBodySize` | `14MB` | |
| `server.maxResponseBytes` | `256MB` | por encima, `413`; `0` = sin límite |
| `logger.adapter` / `logger.level` | `console` / `info` | `console` o `winston`; `error`, `warn`, `info`, `debug` |
| `metrics.enabled` | `true` | |
| `audit.enabled` | `true` | la auditoría de escrituras ([Seguridad](Security.md#audit)) |
| `audit.includeData` | `false` | `true` añade los parámetros (`data`), que pueden contener datos personales |
| `authentication` | `{ adapter: none }` | [Seguridad](Security.md) |
| `transports.<t>.authentication` | `authentication` | reemplaza la global para ese transporte |
| `rateLimit.windowMs` / `rateLimit.max` | `30000` / `30` | solo `http`; `max: 0` lo desactiva |
| `scripts.enabled` | `false` | `POST /script` y su herramienta y su método |
| `scripts.maxLength` / `timeoutMs` / `maxIterations` | `20000` / `30000` / `100000` | una petición puede pedir menos, nunca más |
| `mcp.name` | `data-gateway` | el nombre de los servidores MCP; cada uno añade su ruta |
| `mcp.tools.include` / `exclude` | `[]` / `[]` | nombres de [herramientas](Mcp.md#tools) |
| `mcp.pageSize` | `50` | página de `tools/list` y `resources/list` |
| `mcp.maxRows` | `500` | filas de `orm_execute` / `orm_execute_script`; `0` = sin límite |
| `transports.<t>.port` | **ninguno** | sin un puerto, el transporte no se expone |
| `transports.<t>.host` | `0.0.0.0` | |
| `transports.<t>.basePath` | `''` | un prefijo antes de la ruta del esquema (`/data-gateway`), detrás de un ingress con una ruta |
| `transports.<t>.maxConnections` | `100` | `webSocket`, `mcpWebSocket` y el SSE de `mcpHttp` |
| `transports.http.swagger.enabled` | `true` | `/doc` y `/api-docs` |
| `transports.http.ui.enabled` | `false` | la [UI](Ui.md) en `/ui` |
| `transports.mcpHttp.legacySse` | `true` | además de Streamable HTTP, el antiguo HTTP+SSE para clientes antiguos |
| `transports.mcpHttp.stateful` | `false` | Streamable HTTP sin estado: cualquier réplica responde cualquier petición |
| `transports.<ws>.asyncapi.enabled` | `true` | `GET /asyncapi` y `/asyncapi.json` de `webSocket` y `mcpWebSocket` |
