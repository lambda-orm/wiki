# Operaciones {#operations}

## Docker {#docker}

La imagen es [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, la CLI `lambdaorm`
y Oracle Instant Client. Ejecuta `node index.js` como el usuario 1000, lee la configuración de
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) y los workspaces desde donde indique la configuración
(`/workspace` por convención). No tiene `EXPOSE`: los puertos solo están en la configuración.

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:3.1.0
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

Las versiones `3.0.0-rc.*` son prereleases: no mueven `latest`.

## Kubernetes {#kubernetes}

- **Probes:** `livenessProbe` en `GET /ping` (el gateway está levantado), `readinessProbe` en `GET /health` (`200` mientras algún
  esquema esté `ready`). Un probe por esquema: `GET /{schema}/health`.
- **Configuración** en un `ConfigMap` montado en `/config`, y los secretos como variables de entorno desde un `Secret`
  (`value: $READER_KEY` en el archivo).
- **Réplicas:** REST, WebSocket y MCP sin estado (`stateful: false`) no necesitan afinidad de sesión; el antiguo HTTP+SSE de
  MCP sí.
- **Detrás de un ingress con una ruta:** `transports.<t>.basePath: /data-gateway`.
- **Apagado:** `SIGTERM` deja de aceptar conexiones, espera a las operaciones en curso (hasta `server.timeout`),
  cierra las colas y los pools, y termina. Hay que dar a `terminationGracePeriodSeconds` al menos ese tiempo.

## Salud {#health}

| Ruta | Responde |
| --- | --- |
| `GET /ping` | `{ "message": "pong", "time" }`: el gateway responde |
| `GET /health` | `200` mientras algún esquema esté `ready`, `503` si ninguno lo está |
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
| `data_gateway_connections` | `transport` |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_event_loop_lag_seconds` | `worker` |

y las métricas habituales de Node (memoria, CPU, event loop). `metrics.enabled: false` las desactiva.

## Logs {#logs}

Cada worker registra con su etiqueta (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): el arranque, los transportes expuestos o
no, la configuración efectiva sin secretos, los estados de los esquemas, caídas y reinicios, heartbeats perdidos,
y cada operación con el nombre de su credencial (nunca su secreto). `logger.level`: `error`, `warn`, `info`,
`debug`; `logger.adapter`: `console` o `winston`.

La [auditoría](Security.md#audit) de escrituras va a la salida estándar como líneas JSON con `"type": "audit"`, para que el
recolector de logs pueda separarlas.
