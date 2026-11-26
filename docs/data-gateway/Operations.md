# Operations

How to run the gateway in production: its image, Kubernetes, its health, its metrics and its logs.

## Docker

The image is [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, the `lambdaorm`
CLI (`@lambdaorm/cli`) and the Oracle Instant Client. It runs `node index.js` as the user 1000, reads the configuration from
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) and the workspaces from where the configuration says
(`/workspace` by convention). It has no `EXPOSE`: the ports are only in the configuration.

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

The workspace is mounted read only: without `management`, the gateway doesn't write in it. With `management` (the
IDE, the administration) it must be writable by the user 1000 (or the one given in `user:`): it keeps there the
sessions and the state of the IDE (`.data-gateway/`) and the files it edits.

The versions `3.0.0-rc.*` are prereleases: they don't move `latest`.

### With the IDE

The [IDE](../ide/index.md) is another image, `flaviorita/data-gateway-ide`, next to the gateway: the browser talks to
it, and it reaches the `management` port, which is published to nobody else.

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

`DATA_GATEWAY_IDE_TARGETS` lists what the IDE may reach (`*`: anything, only for an IDE on your machine).

## Kubernetes

- **Probes:** `livenessProbe` on `GET /ping` (the gateway answers). `GET /health` answers `200` while the gateway
  answers, with `DEGRADED` when some schema is not `ready`; to keep a pod out of the service until a schema is ready,
  the `readinessProbe` goes on `GET /{schema}/health` (`503` while it is not `ready`). With a single schema at the root,
  `GET /health` is that schema's.
- **`management`:** an internal `Service` without an ingress, reached only by the IDE; or left out.
- **Configuration** in a `ConfigMap` mounted at `/config`, secrets as environment variables from a `Secret`
  (`value: $READER_KEY` in the file).
- **Replicas:** REST, WebSocket and stateless MCP (`stateful: false`) need no session affinity; the older HTTP+SSE of
  MCP does. Since 4.2.0, the [cache](Configuration.md#cache) and the [subscriptions](Changes.md#subscriptions) of a
  replica see the writes made through it, and only one replica should dispatch the
  [outbox](Changes.md#one-replica-dispatches); since 4.3.0, with [`cluster.valkey`](Configuration.md#cluster), every
  replica sees the writes of the others and the outbox has a lease (no flag).
- **Behind an ingress with a path:** `transports.<t>.basePath: /data-gateway`.
- **Shutdown:** `SIGTERM` stops accepting connections, waits for the operations in progress (up to `server.timeout`),
  closes the queues and the pools, and exits. Give `terminationGracePeriodSeconds` at least that time.

## Health

| Route | Answers |
| --- | --- |
| `GET /ping` | `{ "message": "pong", "time" }`: the gateway answers |
| `GET /health` | `200`, `{ "message": "OK" }` when every schema is `ready`, `"DEGRADED"` if not, with the state of each one |
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
| `data_gateway_connections` | `transport` (open WebSocket connections, SSE streams, stateful MCP sessions) |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_management_sessions` | `state` (the sessions of `management`, and those with the IDE connected) |
| `data_gateway_cache_requests` | `schema`, `result` (`hit`, `miss`: the [cache](Configuration.md#cache), 4.2.0) |
| `data_gateway_cache_invalidations` / `data_gateway_cache_entries` | `schema` |
| `data_gateway_outbox_events` | `schema`, `result` (`delivered`, `failed`: the [outbox](Changes.md#the-outbox), 4.2.0) |
| `data_gateway_cluster_connected` | `schema` (1: it reaches the [Valkey](Configuration.md#cluster) of the replicas, 4.3.0) |
| `data_gateway_outbox_leader` | `schema` (1: this replica dispatches the outbox, 4.3.0) |
| `http_request_duration_seconds` | `method`, `route`, `code`, `credential` (the HTTP requests) |

and the usual metrics of Node with the prefix `node_` (memory, CPU, garbage collection, the lag of the event loop:
`node_nodejs_eventloop_lag_seconds`). `metrics.enabled: false` turns them off.

## Logs

Each worker logs with its label (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): the start, the transports exposed or
not, the effective configuration without secrets, the states of the schemas, falls and restarts, heartbeats missed,
and every operation with the name of its credential (never its secret). `logger.level`: `error`, `warn`, `info`,
`debug`; `logger.adapter`: `console` or `winston`.

The [audit](Security.md#audit) of writes goes to the standard output as JSON lines with `"type": "audit"`, to be kept
apart by the log collector.

## OpenTelemetry {#opentelemetry}

**Since data-gateway 4.1.0.** With the section [`observability`](Configuration.md#observability)
(or the `OTEL_*` variables):

- **Traces:** a `SERVER` span per HTTP request (named by its route template, `POST /{schema}/execute`), WebSocket
  message and MCP call, child of the caller's `traceparent`; the trace goes on in the worker of the schema and in the
  spans of λORM (`lambdaorm.execute`, its sentences).
- **The actor:** the credential (and on `management` the session, the IDE and the address) reaches λORM, for its
  rules and its events; an `options.actor` sent by a client is replaced.
- **λORM's metrics in `/metrics`**, with the names of the OpenTelemetry → Prometheus compatibility
  (`db_client_operation_duration_seconds`, `lambdaorm_query_duration_seconds`, …), and
  `http_server_request_duration_seconds` (`http_request_method`, `http_route`, `http_response_status_code`); the same
  names by OTLP.
- **The audit** also goes as an OpenTelemetry log record, linked to the trace of its request, and every change of the
  administration as a `schema.change` event (the [history](Admin.md#since-4-1-0)).
