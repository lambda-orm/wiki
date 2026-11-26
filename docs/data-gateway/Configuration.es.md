# Configuración {#configuration}

Todo lo que hace el gateway lo decide **un único archivo YAML**, montado en el contenedor y nunca incluido en la imagen:
qué esquemas sirve y en qué rutas, qué transportes abre, quién puede usarlos y con qué límites. Esta página explica cada
parte y termina con la [referencia](#reference) de cada clave; la guía [Primeros pasos](GettingStarted.md) tiene un archivo
pequeño completo.

- Ruta: `DATA_GATEWAY_CONFIG_PATH` (por defecto `/config/data-gateway.config.yaml`). Es **obligatorio**: sin él el
  gateway registra el error y termina con código 1. Un valor inválido (un puerto que no es un número, un permiso o una
  herramienta desconocidos) también detiene el arranque, con la lista de problemas; una sección o clave desconocida se
  avisa y se ignora.
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
| `cache`, `outbox` (4.2.0) | el [caché](#cache) de sus lecturas; a dónde va su [outbox](Changes.md#the-outbox) | `cache`, `outbox` |
| `runtime.mode`, `runtime.maxMemoryMb`, `runtime.checkConnections` | `thread` / `process`, memoria de su worker, si sus conexiones se comprueban al arrancar | `runtime` |

Siempre gana el más específico, que **reemplaza** a los demás: esquema → transporte → global.

**Reglas:**

- Al menos uno de `orm.workspacePath` o un `orm.schemas[]` con `workspace`. Con `orm.watch` (por defecto) un volumen
  vacío arranca y espera su primer esquema, y un ajuste de un esquema que todavía no está se avisa y se aplica cuando
  aparece; sin él, tiene que encontrarse al menos un esquema.
- Dos esquemas con la misma ruta, o una ruta que es prefijo de otra (`iot` e `iot/v1`), son un error.
- Cada segmento de una ruta: `[a-zA-Z0-9_.-]`, y ninguno de los nombres reservados: `health`, `ping`, `metrics`, `version`,
  `schemas`, `mcp`, `sse`, `messages`, `status`, `doc`, `api-docs`, `swagger`, `asyncapi`, `ui`, `whoami`, `typings`, `admin`.
- **Un esquema en la raíz:** si el propio `workspacePath` tiene un `lambdaORM.yaml` (o un esquema declarado usa `path: ""`),
  se sirve en la raíz (`/execute`). Solo cuando es el único esquema.
- **Recarga en caliente** (`orm.watch`, activo por defecto): una carpeta nueva con un `lambdaORM.yaml` es un esquema
  nuevo, un `lambdaORM.yaml` o `.env` cambiado recarga su esquema blue-green (sigue la última versión que arrancó si la
  nueva no arranca), una carpeta que se va se lleva su esquema. Ver [Administración](Admin.md#workspaces-in-the-volume).
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
  mcpHttp:
    port: $DATA_GATEWAY_MCP_HTTP_PORT
  mcpWebSocket:
    port: $DATA_GATEWAY_MCP_WS_PORT
  webSocket:
    port: $DATA_GATEWAY_WS_PORT
  management:                      # la API del IDE; sin la variable, no se expone (producción)
    port: $DATA_GATEWAY_MANAGEMENT_PORT
    trustedProxies: [ 10.0.0.0/8 ] # la red del IDE: su X-Forwarded-For da la dirección del navegador
    sessions: { idleTimeout: 30m, maxLifetime: 12h }
```

## Observabilidad (OpenTelemetry) {#observability}

**Desde data-gateway 4.1.0.** La sección `observability` tiene la forma de
`infrastructure.observability` de un `lambdaORM.yaml` ([Observabilidad](../schema/Observability.md)), y las variables
estándar `OTEL_*` mandan sobre ella. El gateway inicia el SDK de OpenTelemetry en cada worker antes que λORM, así que una
petición, su worker y las sentencias de λORM son una sola traza.

```yaml
observability:
  serviceName: data-gateway                              # the default; OTEL_SERVICE_NAME overrides it
  exporter: { type: otlp, endpoint: http://alloy:4318 }  # http/protobuf (or http/json); no gRPC
  traces:
    enabled: true
    sampler: { ratio: 1, parentBased: true }
  metrics: { enabled: true }                             # also by OTLP; /metrics has them anyway
  logs:
    adapters: [ { type: opentelemetry } ]                # the audit and the history of the schemas
```

Las cabeceras del exportador llevan tokens: van solo en `OTEL_EXPORTER_OTLP_HEADERS` (`exporter.headers` en el archivo
detiene el arranque). Lo que da está en [Operación](Operations.md#opentelemetry).

## El caché de las lecturas {#cache}

**Desde data-gateway 4.2.0.** Una lectura repetida mientras no cambió nada de lo que lee no vuelve a la base. Está
apagado hasta `cache.enabled: true` (global o por schema): un cliente puede ver un resultado de hasta `ttl` de
antigüedad cuando otra aplicación escribe en la base.

```yaml
cache:                      # también orm.schemas[].cache
  enabled: true
  ttl: 60s                  # cuánto vive un resultado
  maxEntries: 10000         # en memoria; los menos usados se van primero
  maxRowBytes: 1MB          # un resultado más grande no se guarda
  entities:
    Prices: { ttl: 5s }               # otro ttl para lo que la lee
    AuditLogs: { enabled: false }     # lo que la lee nunca se guarda
```

- **Qué se guarda:** el resultado de un `execute` que solo lee y de una [consulta con nombre](Rest.md#named-queries)
  que solo lee; nunca una escritura, un script ni un `execute-queued`.
- **De quién:** un resultado es de su consulta, sus `data`, su stage, y **la vista y el contexto de quien preguntó**: dos
  identidades con otra vista u otro tenant nunca comparten uno.
- **Hasta cuándo:** una escritura que pasa por λORM borra al instante todos los resultados que leen su entidad (también
  por un `include` o una relación); lo que escribe otra aplicación se ve después de `ttl`, como mucho.
- Con varias réplicas, cada una tiene su caché; desde 4.3.0, con [`cluster.valkey`](#cluster) una escritura en
  cualquier réplica borra los resultados de todas; sin él, cada una ve sus escrituras: usa un `ttl` corto ahí.
- `/metrics` tiene `data_gateway_cache_requests{result="hit|miss"}`, `data_gateway_cache_invalidations` y
  `data_gateway_cache_entries`; REST responde [`ETag` y `304`](Rest.md#execute).

## Réplicas juntas (Valkey) {#cluster}

**Desde data-gateway 4.3.0.** Con un Valkey (o un Redis: el mismo protocolo) compartido, cada réplica avisa a las otras
de las escrituras hechas a través de ella: el [caché](#cache) de todas borra lo que cambian, las
[suscripciones](Changes.md#subscriptions) de todas se enteran, y el [outbox](Changes.md#the-outbox) lo despacha una
sola réplica, la que tiene un lease (otra lo toma si se va).

```yaml
cluster:
  valkey:
    url: $VALKEY_URL           # valkey://[user:password@]host:6379[/db], valkeys:// (TLS); redis://, rediss://
    prefix: data-gateway
```

Solo viajan la entidad, la acción, las claves y cuántas filas, nunca los datos. Si el Valkey se cae, cada réplica sigue
con sus escrituras (dicho en el log y en `data_gateway_cluster_connected`) y nadie despacha el outbox hasta que vuelve.

## Archivos de propiedades {#files}

**Desde data-gateway 4.3.0.** Una propiedad puede guardar la clave de un archivo en un almacenamiento (S3 — AWS u otro
con su `endpoint` — o Azure Blob): la gateway firma URLs de vida corta para subirlo y para leerlo, y los bytes van
directo entre el cliente y el almacenamiento, nunca por la gateway. Global o por schema:

```yaml
files:
  storages:
    images:
      type: s3
      bucket: shop-images
      region: eu-west-1
      # endpoint: https://minio.example.com
      accessKeyId: $S3_KEY
      secretAccessKey: $S3_SECRET
      prefix: products/
      maxBytes: 10MB
      types: [ image/png, image/jpeg ]
      expires: 5m
    invoices:
      type: azureBlob
      account: shopfiles
      container: invoices
      accountKey: $AZURE_KEY
  properties:
    Products.photo: images
    Orders.invoice: invoices
```

Las rutas están en la [API REST](Rest.md#files). Una URL para leer se firma solo para una clave que guarda una fila de
la [vista](Security.md#views) de quien pide. S3 firma el tipo y el tamaño de una subida; Azure no puede, así que la
gateway los controla al firmar. El almacenamiento debe permitir el origen del IDE (CORS) para que el
[IDE](../ide/Entities.md#data) suba y lea.

## Referencia {#reference}

| Clave | Por defecto | Notas |
| --- | --- | --- |
| `orm.workspacePath` | — | la carpeta donde se descubren los esquemas |
| `orm.schemas[]` | `[]` | `path` (obligatorio), `workspace` (define un esquema) y ajustes |
| `orm.watch` | `true` | recarga en caliente de los workspaces; `false`, o `{ enabled, intervalMs, debounceMs }` |
| `orm.watch.intervalMs` / `debounceMs` | `5000` / `300` | el recorrido de los workspaces; cuánto se juntan los cambios |
| `admin.enabled` | — | **eliminada en 4.0.0** (se avisa y se ignora): la [administración](Admin.md) está activa cuando `transports.management` tiene un puerto |
| `admin.allowAnonymous` | `false` | con `authentication: none`, cualquiera administra (solo desarrollo local) |
| `admin.commandTimeoutMs` / `maxFileBytes` | `600000` / `2MB` | cuánto puede tardar un comando; el archivo más grande que se escribe |
| `runtime.transports` | `shared` | todos los transportes en un worker edge; `thread` y `process` se avisan y corren como `shared` |
| `runtime.schemas` | `thread` | `thread` / `process` |
| `runtime.maxMemoryMb` | `512` | por worker |
| `runtime.checkConnections` | `true` | una base de datos caída deja el esquema en `error`, con reintentos, en lugar de fallar en la primera consulta |
| `runtime.threadpoolSize` | `auto` | `max(4, 2 × schemas in thread mode)`, como máximo 64 |
| `runtime.heartbeat.intervalMs` / `timeoutMs` | `5000` / `30000` | |
| `runtime.restart.initialDelayMs` / `maxDelayMs` | `1000` / `300000` | espera creciente entre reinicios |
| `runtime.env.isolate` / `passthrough` | `true` / `[]` | |
| `server.timeout` | `120000` | por petición HTTP, mensaje WebSocket y llamada a herramienta MCP; por encima, `504` |
| `server.maxConcurrent` | `64` | operaciones simultáneas por esquema; por encima, `429`; `0` = sin límite |
| `server.requestBodySize` | `14MB` | |
| `server.maxResponseBytes` | `256MB` | por encima, `413`; `0` = sin límite |
| `logger.adapter` / `logger.level` | `console` / `info` | `console` o `winston`; `error`, `warn`, `info`, `debug` |
| `metrics.enabled` | `true` | |
| `audit.enabled` | `true` | la auditoría de escrituras ([Seguridad](Security.md#audit)) |
| `audit.includeData` | `false` | `true` añade los parámetros (`data`), que pueden contener datos personales |
| `authentication` | `{ adapter: none }` | [Seguridad](Security.md) |
| `authentication.header` | `X-Api-Key` | el header de `type: apikey` |
| `authentication.adapter: jwt` | — | (4.1.0) los tokens de un proveedor de identidad: `issuer`, `audience`, `jwksUri`, `secret`, `algorithms`, `clockTolerance`, `principal.name`, `principal.permissions.claim` / `roles`, `context` ([Seguridad](Security.md#jwt)) |
| `authentication.methods` | — | (4.1.0) varias autenticaciones en orden: `jwt` y `local` ([Seguridad](Security.md#jwt)) |
| `keys[].view`, `roles.<role>.view` | — | (4.1.0) la [vista](Security.md#views) de las peticiones de una clave o un rol |
| `orm.schemas[].view` | `default` | (4.1.0) la vista de quien llama sin una |
| `orm.schemas[].queries.<name>` | — | (4.1.0) `maxRows`, `timeout` de una [consulta con nombre](Rest.md#named-queries) |
| `cluster.valkey.url` / `prefix` | — / `data-gateway` | (4.3.0) el Valkey de las [réplicas](#cluster) |
| `files.storages.<nombre>` | — | (4.3.0) `type: s3` (`bucket`, `region`, `endpoint`, `accessKeyId`, `secretAccessKey`) o `type: azureBlob` (`account`, `container`, `accountKey`, `endpoint`); `prefix`, `maxBytes` (10MB), `types`, `expires` (5m) — [archivos](#files) |
| `files.properties.<Entidad.propiedad>` | — | (4.3.0) el almacenamiento de sus archivos |
| `mcp.approval` / `mcp.approvalExpires` | `none` / `1h` | (4.3.0) `writes`: toda escritura por MCP [espera a una persona](Security.md#approvals); también por schema |
| `keys[].approval`, `roles.<rol>.approval` | — | (4.3.0) `writes`: las escrituras de esa credencial o rol esperan, en todo transporte |
| `cache.enabled` | `false` | (4.2.0) el [caché de las lecturas](#cache); también por schema |
| `cache.ttl` / `maxEntries` / `maxRowBytes` | `60s` / `10000` / `1MB` | (4.2.0) |
| `cache.entities.<entity>` | — | (4.2.0) `{ ttl }` o `{ enabled: false }` para lo que la lee |
| `outbox.destinations[]` | `[]` | (4.2.0) a dónde va el [outbox](Changes.md#the-outbox): `type: webhook` (`url`, `secret`, `timeout`, `entities`) o `type: kafka` (`topic`, `entities`); también por schema |
| `outbox.interval` / `batch` | `1s` / `100` | (4.2.0) cada cuánto busca eventos pendientes; cuántos por vuelta |
| `outbox.dispatch` | `true` | (4.2.0) esta réplica despacha; `false` (o `DATA_GATEWAY_OUTBOX_DISPATCH=false`) en todas las réplicas menos una |
| `transports.<t>.authentication` | `authentication` | reemplaza la global para ese transporte |
| `rateLimit.windowMs` / `rateLimit.max` | `30000` / `30` | solo `http`; `max: 0` lo desactiva |
| `scripts.enabled` | `false` | `POST /script` y su herramienta y su método |
| `scripts.maxLength` / `timeoutMs` / `maxIterations` | `20000` / `30000` / `100000` | una petición puede pedir menos, nunca más |
| `mcp.name` | `data-gateway` | el nombre de los servidores MCP; cada uno añade su ruta |
| `mcp.tools.include` / `exclude` | `[]` / `[]` | nombres de [herramientas](Mcp.md#tools) |
| `mcp.pageSize` | `50` | página de `tools/list` y `resources/list` |
| `mcp.maxRows` | `500` | filas de `orm_execute` / `orm_execute_script`; `0` = sin límite |
| `mcp.freeQueries` | `true` | (4.1.0) `false`: un agente solo con las [consultas con nombre](Mcp.md#named-queries); también por esquema |
| `transports.<t>.port` | **ninguno** | sin un puerto, el transporte no se expone |
| `transports.<t>.host` | `0.0.0.0` | |
| `transports.<t>.basePath` | `''` | un prefijo antes de la ruta del esquema (`/data-gateway`), detrás de un ingress con una ruta |
| `transports.<t>.maxConnections` | `100` | `webSocket`, `mcpWebSocket`, y los streams SSE y las sesiones con estado de `mcpHttp` |
| `transports.http.swagger.enabled` | `true` | `/doc` y `/api-docs` |
| `transports.http.ui` | — | **eliminada en 4.0.0** (se avisa y se ignora): la [UI](../ide/index.md) es el data-gateway-ide |
| `transports.management.port` | **ninguno** | la API del [IDE](../ide/index.md) y la [administración](Admin.md) ([Transportes](Transports.md#management)) |
| `transports.management.sessions.idleTimeout` / `maxLifetime` | `30m` / `12h` | cuándo termina una [sesión](Transports.md#sessions): sin peticiones, y tras el login; `30s`, `30m`, `12h`, `7d` o milisegundos |
| `transports.management.sessions.maxPerCredential` | `0` | sesiones a la vez por credencial; `0` = sin límite; por encima, un login cierra la más antigua |
| `transports.management.sessions.store` | `auto` | `auto`: `<orm.workspacePath>/.data-gateway/state.sqlite` (compartido por las réplicas); `memory`: solo esta réplica |
| `transports.management.trustedProxies` | `[]` | direcciones o redes (CIDR) cuyo `X-Forwarded-For` se cree: el IDE, para que se vea la dirección del navegador |
| `transports.mcpHttp.legacySse` | `true` | además de Streamable HTTP, el antiguo HTTP+SSE para clientes antiguos |
| `transports.mcpHttp.stateful` | `false` | Streamable HTTP sin estado: cualquier réplica responde cualquier petición |
| `transports.<ws>.asyncapi.enabled` | `true` | `GET /asyncapi` y `/asyncapi.json` de `webSocket` y `mcpWebSocket` |
| `observability` | — | OpenTelemetry, [arriba](#observability); desde 4.1.0 |
