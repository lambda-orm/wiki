# Operations

## Docker

The image is [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, the `lambdaorm`
CLI and the Oracle Instant Client. It runs `node index.js` as the user 1000, reads the configuration from
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) and the workspaces from where the configuration says
(`/workspace` by convention). It has no `EXPOSE`: the ports are only in the configuration.

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:3.0.1
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

The versions `3.0.0-rc.*` are prereleases: they don't move `latest`.

## Kubernetes

- **Probes:** `livenessProbe` on `GET /ping` (the gateway is up), `readinessProbe` on `GET /health` (`200` while some
  schema is `ready`). A probe per schema: `GET /{schema}/health`.
- **Configuration** in a `ConfigMap` mounted at `/config`, secrets as environment variables from a `Secret`
  (`value: $READER_KEY` in the file).
- **Replicas:** REST, WebSocket and stateless MCP (`stateful: false`) need no session affinity; the older HTTP+SSE of
  MCP does.
- **Behind an ingress with a path:** `transports.<t>.basePath: /data-gateway`.
- **Shutdown:** `SIGTERM` stops accepting connections, waits for the operations in progress (up to `server.timeout`),
  closes the queues and the pools, and exits. Give `terminationGracePeriodSeconds` at least that time.

## Health

| Route | Answers |
| --- | --- |
| `GET /ping` | `{ "message": "pong", "time" }`: the gateway answers |
| `GET /health` | `200` while some schema is `ready`, `503` if none |
| `GET /schemas` | each schema with `status` (`starting`, `ready`, `error`, `restarting`), `reason`, `since` and `restarts` |
| `GET /{schema}/health` | `200` when that schema is `ready`, `503` if not |
| `GET /status` | in `mcpHttp` and `mcpWebSocket`: the state of the transport |

A schema in `error` is retried with a growing wait (`runtime.restart`) and goes back to `ready` when its database
does, without restarting anything else.

## Metrics

`GET /metrics` answers the metrics of every worker in Prometheus format (`GET /{schema}/metrics`, those of one schema),
each with the label `worker` (`edge`, `schema:iot/v1`):

| Metric | Labels |
| --- | --- |
| `data_gateway_requests_total` | `transport`, `schema`, `method`, `status`, `credential` |
| `data_gateway_request_duration_seconds` | `transport`, `schema`, `method` |
| `data_gateway_forbidden_total` | `credential`, `permission` |
| `data_gateway_throttled_total` | `schema`, `transport` (answers `429` by `maxConcurrent`) |
| `data_gateway_connections` | `transport` |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_event_loop_lag_seconds` | `worker` |

and the usual metrics of Node (memory, CPU, event loop). `metrics.enabled: false` turns them off.

## Logs

Each worker logs with its label (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): the start, the transports exposed or
not, the effective configuration without secrets, the states of the schemas, falls and restarts, heartbeats missed,
and every operation with the name of its credential (never its secret). `logger.level`: `error`, `warn`, `info`,
`debug`; `logger.adapter`: `console` or `winston`.

The [audit](Security.md#audit) of writes goes to the standard output as JSON lines with `"type": "audit"`, to be kept
apart by the log collector.
