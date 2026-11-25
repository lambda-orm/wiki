# Betrieb {#operations}

Wie das Gateway in der Produktion betrieben wird: sein Image, Kubernetes, seine Gesundheit, seine Metriken und seine
Logs.

## Docker {#docker}

Das Image ist [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, die `lambdaorm`-CLI
(`@lambdaorm/cli`) und der Oracle Instant Client. Es führt `node index.js` als Benutzer 1000 aus, liest die Konfiguration aus
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) und die Workspaces von dort, wo die Konfiguration es
angibt (per Konvention `/workspace`). Es hat kein `EXPOSE`: Die Ports stehen nur in der Konfiguration.

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:4.1.0
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

Der Workspace wird schreibgeschützt eingebunden: Ohne `management` schreibt das Gateway nicht hinein. Mit `management`
(die IDE, die Administration) muss er für den Benutzer 1000 (oder den in `user:` angegebenen) beschreibbar sein: Das
Gateway legt dort die Sitzungen und den Zustand der IDE (`.data-gateway/`) und die Dateien ab, die es bearbeitet.

Die Versionen `3.0.0-rc.*` sind Vorabversionen: Sie verschieben `latest` nicht.

### Mit der IDE {#with-the-ide}

Die [IDE](../ide/index.md) ist ein anderes Image, `flaviorita/data-gateway-ide`, neben dem Gateway: Der Browser spricht
mit ihr, und sie erreicht den `management`-Port, der für niemanden sonst veröffentlicht wird.

```yaml
services:
  data-gateway:
    image: flaviorita/data-gateway:4.1.0
    # … wie oben, mit transports.management.port: 9090 in seiner Konfiguration und ohne veröffentlichten Port 9090
  ide:
    image: flaviorita/data-gateway-ide:1.1.0
    environment:
      DATA_GATEWAY_IDE_TARGETS: "http://data-gateway:9090,http://data-gateway:8080,http://data-gateway:8081"
    ports: [ "127.0.0.1:8090:8080" ]
```

`DATA_GATEWAY_IDE_TARGETS` listet auf, was die IDE erreichen darf (`*`: alles, nur für eine IDE auf Ihrem Rechner).

## Kubernetes {#kubernetes}

- **Probes:** `livenessProbe` auf `GET /ping` (das Gateway antwortet). `GET /health` antwortet mit `200`, solange das
  Gateway antwortet, mit `DEGRADED`, wenn irgendein Schema nicht `ready` ist; um einen Pod aus dem Service zu halten,
  bis ein Schema bereit ist, geht die `readinessProbe` auf `GET /{schema}/health` (`503`, solange es nicht `ready` ist).
  Mit einem einzigen Schema an der Wurzel ist `GET /health` das dieses Schemas.
- **`management`:** ein interner `Service` ohne Ingress, nur von der IDE erreicht; oder weggelassen.
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
| `GET /health` | `200`, `{ "message": "OK" }`, wenn jedes Schema `ready` ist, sonst `"DEGRADED"`, mit dem Zustand jedes einzelnen |
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
| `data_gateway_connections` | `transport` (offene WebSocket-Verbindungen, SSE-Streams, zustandsbehaftete MCP-Sitzungen) |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_management_sessions` | `state` (die Sitzungen von `management` und die mit verbundener IDE) |
| `http_request_duration_seconds` | `method`, `route`, `code`, `credential` (die HTTP-Anfragen) |

sowie die üblichen Metriken von Node mit dem Präfix `node_` (Speicher, CPU, Garbage Collection, die Verzögerung des
Event Loops: `node_nodejs_eventloop_lag_seconds`). `metrics.enabled: false` deaktiviert sie.

## Logs {#logs}

Jeder Worker protokolliert mit seinem Label (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): den Start, die
bereitgestellten oder nicht bereitgestellten Transporte, die effektive Konfiguration ohne Secrets, die Zustände der
Schemas, Ausfälle und Neustarts, verpasste Heartbeats und jede Operation mit dem Namen ihrer Zugangsdaten (nie deren
Secret). `logger.level`: `error`, `warn`, `info`, `debug`; `logger.adapter`: `console` oder `winston`.

Das [Audit](Security.md#audit) von Schreibvorgängen geht als JSON-Zeilen mit `"type": "audit"` an die Standardausgabe,
damit der Log-Collector es getrennt ablegen kann.

## OpenTelemetry {#opentelemetry}

**Seit data-gateway 4.1.0.** Mit dem Abschnitt [`observability`](Configuration.md#observability)
(oder den Variablen `OTEL_*`):

- **Traces:** ein `SERVER`-Span pro HTTP-Anfrage (benannt nach ihrer Routenvorlage, `POST /{schema}/execute`),
  WebSocket-Nachricht und MCP-Aufruf, Kind des `traceparent` des Aufrufers; die Trace setzt sich im Worker des Schemas
  und in den Spans von λORM fort (`lambdaorm.execute`, seine Sätze).
- **Der Akteur:** die Zugangsdaten (und bei `management` die Sitzung, die IDE und die Adresse) erreichen λORM, für
  seine Regeln und Ereignisse; ein von einem Client gesendetes `options.actor` wird ersetzt.
- **Die Metriken von λORM in `/metrics`**, mit den Namen der Kompatibilität OpenTelemetry → Prometheus
  (`db_client_operation_duration_seconds`, `lambdaorm_query_duration_seconds`, …), und
  `http_server_request_duration_seconds` (`http_request_method`, `http_route`, `http_response_status_code`); dieselben
  Namen per OTLP.
- **Das Audit** geht auch als OpenTelemetry-Log-Record, verknüpft mit der Trace seiner Anfrage, und jede Änderung der
  Administration als Ereignis `schema.change` (die [Historie](Admin.md#since-4-1-0)).
