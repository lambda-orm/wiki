# Betrieb {#operations}

## Docker {#docker}

Das Image ist [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, die `lambdaorm`-CLI
und der Oracle Instant Client. Es führt `node index.js` als Benutzer 1000 aus, liest die Konfiguration aus
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) und die Workspaces von dort, wo die Konfiguration es
angibt (per Konvention `/workspace`). Es hat kein `EXPOSE`: Die Ports stehen nur in der Konfiguration.

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:3.0.2
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

Die Versionen `3.0.0-rc.*` sind Vorabversionen: Sie verschieben `latest` nicht.

## Kubernetes {#kubernetes}

- **Probes:** `livenessProbe` auf `GET /ping` (das Gateway läuft), `readinessProbe` auf `GET /health` (`200`, solange
  irgendein Schema `ready` ist). Eine Probe pro Schema: `GET /{schema}/health`.
- **Konfiguration** in einer `ConfigMap`, die unter `/config` eingebunden wird, Secrets als Umgebungsvariablen aus einem
  `Secret` (`value: $READER_KEY` in der Datei).
- **Replikas:** REST, WebSocket und zustandsloses MCP (`stateful: false`) benötigen keine Session-Affinität; das ältere
  HTTP+SSE von MCP schon.
- **Hinter einem Ingress mit Pfad:** `transports.<t>.basePath: /data-gateway`.
- **Herunterfahren:** `SIGTERM` nimmt keine Verbindungen mehr an, wartet auf laufende Operationen (bis zu
  `server.timeout`), schließt die Warteschlangen und die Pools und beendet sich. Setzen Sie
  `terminationGracePeriodSeconds` auf mindestens diese Zeit.

## Health {#health}

| Route | Antwortet |
| --- | --- |
| `GET /ping` | `{ "message": "pong", "time" }`: das Gateway antwortet |
| `GET /health` | `200`, solange irgendein Schema `ready` ist, `503`, wenn keines |
| `GET /schemas` | jedes Schema mit `status` (`starting`, `ready`, `error`, `restarting`), `reason`, `since` und `restarts` |
| `GET /{schema}/health` | `200`, wenn dieses Schema `ready` ist, sonst `503` |
| `GET /status` | in `mcpHttp` und `mcpWebSocket`: der Zustand des Transports |

Ein Schema im Zustand `error` wird mit wachsender Wartezeit erneut versucht (`runtime.restart`) und kehrt zu `ready`
zurück, sobald seine Datenbank wieder verfügbar ist, ohne dass etwas anderes neu gestartet wird.

## Metriken {#metrics}

`GET /metrics` liefert die Metriken aller Worker im Prometheus-Format (`GET /{schema}/metrics` die eines Schemas), jeweils
mit dem Label `worker` (`edge`, `schema:iot/v1`):

| Metrik | Labels |
| --- | --- |
| `data_gateway_requests_total` | `transport`, `schema`, `method`, `status`, `credential` |
| `data_gateway_request_duration_seconds` | `transport`, `schema`, `method` |
| `data_gateway_forbidden_total` | `credential`, `permission` |
| `data_gateway_throttled_total` | `schema`, `transport` (Antworten `429` durch `maxConcurrent`) |
| `data_gateway_connections` | `transport` |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_event_loop_lag_seconds` | `worker` |

sowie die üblichen Metriken von Node (Speicher, CPU, Event Loop). `metrics.enabled: false` deaktiviert sie.

## Logs {#logs}

Jeder Worker protokolliert mit seinem Label (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): den Start, die
bereitgestellten oder nicht bereitgestellten Transporte, die effektive Konfiguration ohne Secrets, die Zustände der
Schemas, Ausfälle und Neustarts, verpasste Heartbeats und jede Operation mit dem Namen ihrer Zugangsdaten (nie deren
Secret). `logger.level`: `error`, `warn`, `info`, `debug`; `logger.adapter`: `console` oder `winston`.

Das [Audit](Security.md#audit) von Schreibvorgängen geht als JSON-Zeilen mit `"type": "audit"` an die Standardausgabe,
damit der Log-Collector es getrennt ablegen kann.
