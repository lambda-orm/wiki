# Operaciones {#operations}

Cómo correr el gateway en producción: su imagen, Kubernetes, su salud, sus métricas y sus logs.

## Docker {#docker}

La imagen es [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, la CLI `lambdaorm`
(`@lambdaorm/cli`) y Oracle Instant Client. Ejecuta `node index.js` como el usuario 1000, lee la configuración de
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) y los workspaces desde donde indique la configuración
(`/workspace` por convención). No tiene `EXPOSE`: los puertos solo están en la configuración.

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:4.2.0
    environment:
      DATA_GATEWAY_HTTP_PORT: "8080"
      DATA_GATEWAY_MCP_PORT: "8081"
      READER_KEY: ${READER_KEY}
      BACKEND_KEY: ${BACKEND_KEY}
      NORTHWIND_DB: ${NORTHWIND_DB}
    volumes:
      - ./data-gateway.config.yaml:/config/data-gateway.config.yaml:ro
      - ./workspace:/workspace:ro
    ports: [ "8080:8080", "8081:8081" ]
    healthcheck:
      test: [ "CMD", "node", "-e", "fetch('http://127.0.0.1:8080/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))" ]
      interval: 10s
      retries: 6
```

El workspace se monta de solo lectura: sin `management`, el gateway no escribe en él. Con `management` (el IDE, la
administración) tiene que poder escribirlo el usuario 1000 (o el indicado en `user:`): ahí guarda las sesiones y el
estado del IDE (`.data-gateway/`) y los archivos que edita.

Las versiones `3.0.0-rc.*` son prereleases: no mueven `latest`.

### Con el IDE {#with-the-ide}

El [IDE](../ide/index.md) es otra imagen, `flaviorita/data-gateway-ide`, junto al gateway: el navegador habla con él, y
él llega al puerto `management`, que no se publica a nadie más.

```yaml
services:
  data-gateway:
    image: flaviorita/data-gateway:4.2.0
    # … as above, with transports.management.port: 9090 in its configuration, and no port 9090 published
  ide:
    image: flaviorita/data-gateway-ide:1.2.0
    environment:
      DATA_GATEWAY_IDE_TARGETS: "http://data-gateway:9090,http://data-gateway:8080,http://data-gateway:8081"
    ports: [ "127.0.0.1:8090:8080" ]
```

`DATA_GATEWAY_IDE_TARGETS` lista a qué puede llegar el IDE (`*`: a cualquier cosa, solo para un IDE en tu máquina).

## Kubernetes {#kubernetes}

- **Probes:** `livenessProbe` en `GET /ping` (el gateway responde). `GET /health` responde `200` mientras el gateway
  responde, con `DEGRADED` cuando algún esquema no está `ready`; para dejar un pod fuera del servicio hasta que un
  esquema esté listo, el `readinessProbe` va en `GET /{schema}/health` (`503` mientras no esté `ready`). Con un único
  esquema en la raíz, `GET /health` es el de ese esquema.
- **`management`:** un `Service` interno sin ingress, al que solo llega el IDE; o se deja fuera.
- **Configuración** en un `ConfigMap` montado en `/config`, y los secretos como variables de entorno desde un `Secret`
  (`value: $READER_KEY` en el archivo).
- **Réplicas:** REST, WebSocket y MCP sin estado (`stateful: false`) no necesitan afinidad de sesión; el antiguo HTTP+SSE de
  MCP sí. Desde 4.2.0, el [caché](Configuration.md#cache) y las [suscripciones](Changes.md#subscriptions) de una
  réplica ven las escrituras hechas a través de ella, y solo una réplica debe despachar el
  [outbox](Changes.md#one-replica-dispatches); desde 4.3.0, con [`cluster.valkey`](Configuration.md#cluster), cada
  réplica ve las escrituras de las otras y el outbox tiene un lease (sin flag).
- **Detrás de un ingress con una ruta:** `transports.<t>.basePath: /data-gateway`.
- **Apagado:** `SIGTERM` deja de aceptar conexiones, espera a las operaciones en curso (hasta `server.timeout`),
  cierra las colas y los pools, y termina. Hay que dar a `terminationGracePeriodSeconds` al menos ese tiempo.

## Salud {#health}

| Ruta | Responde |
| --- | --- |
| `GET /ping` | `{ "message": "pong", "time" }`: el gateway responde |
| `GET /health` | `200`, `{ "message": "OK" }` cuando todos los esquemas están `ready`, `"DEGRADED"` si no, con el estado de cada uno |
| `GET /schemas` | cada esquema con `status` (`starting`, `ready`, `error`, `restarting`), `reason`, `since` y `restarts` |
| `GET /{schema}/health` | `200` cuando ese esquema está `ready`, `503` si no |
| `GET /status` | en `mcpHttp` y `mcpWebSocket`: el estado del transporte |

Un esquema en `error` se reintenta con una espera creciente (`runtime.restart`) y vuelve a `ready` cuando su base de datos
lo hace, sin reiniciar nada más.

## Métricas {#metrics}

`GET /metrics` responde las métricas de todos los workers en formato Prometheus (`GET /{schema}/metrics`, las de un esquema),
cada una con la etiqueta `worker` (`edge`, `schema:iot/v1`):

| Métrica | Etiquetas |
| --- | --- |
| `data_gateway_requests_total` | `transport`, `schema`, `method`, `status`, `credential` |
| `data_gateway_request_duration_seconds` | `transport`, `schema`, `method` |
| `data_gateway_forbidden_total` | `credential`, `permission` |
| `data_gateway_throttled_total` | `schema`, `transport` (respuestas `429` por `maxConcurrent`) |
| `data_gateway_connections` | `transport` (conexiones WebSocket abiertas, streams SSE, sesiones MCP con estado) |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_management_sessions` | `state` (las sesiones de `management`, y las que tienen el IDE conectado) |
| `data_gateway_cache_requests` | `schema`, `result` (`hit`, `miss`: el [caché](Configuration.md#cache), 4.2.0) |
| `data_gateway_cache_invalidations` / `data_gateway_cache_entries` | `schema` |
| `data_gateway_outbox_events` | `schema`, `result` (`delivered`, `failed`: el [outbox](Changes.md#the-outbox), 4.2.0) |
| `data_gateway_cluster_connected` | `schema` (1: llega al [Valkey](Configuration.md#cluster) de las réplicas, 4.3.0) |
| `data_gateway_outbox_leader` | `schema` (1: esta réplica despacha el outbox, 4.3.0) |
| `http_request_duration_seconds` | `method`, `route`, `code`, `credential` (las peticiones HTTP) |

y las métricas habituales de Node con el prefijo `node_` (memoria, CPU, recolección de basura, el retraso del event
loop: `node_nodejs_eventloop_lag_seconds`). `metrics.enabled: false` las desactiva.

## Logs {#logs}

Cada worker registra con su etiqueta (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): el arranque, los transportes expuestos o
no, la configuración efectiva sin secretos, los estados de los esquemas, caídas y reinicios, heartbeats perdidos,
y cada operación con el nombre de su credencial (nunca su secreto). `logger.level`: `error`, `warn`, `info`,
`debug`; `logger.adapter`: `console` o `winston`.

La [auditoría](Security.md#audit) de escrituras va a la salida estándar como líneas JSON con `"type": "audit"`, para que el
recolector de logs pueda separarlas.

## OpenTelemetry {#opentelemetry}

**Desde data-gateway 4.1.0.** Con la sección
[`observability`](Configuration.md#observability) (o las variables `OTEL_*`):

- **Trazas:** un span `SERVER` por petición HTTP (nombrado por la plantilla de su ruta, `POST /{schema}/execute`),
  mensaje WebSocket y llamada MCP, hijo del `traceparent` de quien llama; la traza sigue en el worker del esquema y en
  los spans de λORM (`lambdaorm.execute`, sus sentencias).
- **El actor:** la credencial (y en `management` la sesión, el IDE y la dirección) llega a λORM, para sus reglas y sus
  eventos; un `options.actor` enviado por un cliente se reemplaza.
- **Las métricas de λORM en `/metrics`**, con los nombres de la compatibilidad OpenTelemetry → Prometheus
  (`db_client_operation_duration_seconds`, `lambdaorm_query_duration_seconds`, …), y
  `http_server_request_duration_seconds` (`http_request_method`, `http_route`, `http_response_status_code`); los
  mismos nombres por OTLP.
- **La auditoría** también sale como un log record de OpenTelemetry, enlazado a la traza de su petición, y cada cambio
  de la administración como un evento `schema.change` (el [historial](Admin.md#since-4-1-0)).
