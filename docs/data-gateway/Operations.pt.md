# Operações {#operations}

## Docker {#docker}

A imagem é [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, a CLI `lambdaorm`
e o Oracle Instant Client. Ela executa `node index.js` como o usuário 1000, lê a configuração de
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) e os workspaces de onde a configuração indicar
(`/workspace` por convenção). Ela não tem `EXPOSE`: as portas ficam apenas na configuração.

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:3.0.0-rc.4
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

As versões `3.0.0-rc.*` são pré-lançamentos: elas não movem a tag `latest`.

## Kubernetes {#kubernetes}

- **Probes:** `livenessProbe` em `GET /ping` (o gateway está no ar), `readinessProbe` em `GET /health` (`200` enquanto algum
  esquema estiver `ready`). Uma probe por esquema: `GET /{schema}/health`.
- **Configuração** em um `ConfigMap` montado em `/config`, segredos como variáveis de ambiente a partir de um `Secret`
  (`value: $READER_KEY` no arquivo).
- **Réplicas:** REST, WebSocket e MCP sem estado (`stateful: false`) não precisam de afinidade de sessão; o antigo HTTP+SSE do
  MCP precisa.
- **Atrás de um ingress com um caminho:** `transports.<t>.basePath: /data-gateway`.
- **Encerramento:** `SIGTERM` deixa de aceitar conexões, aguarda as operações em andamento (até `server.timeout`),
  fecha as filas e os pools, e encerra. Defina `terminationGracePeriodSeconds` com pelo menos esse tempo.

## Saúde {#health}

| Rota | Responde |
| --- | --- |
| `GET /ping` | `{ "message": "pong", "time" }`: o gateway responde |
| `GET /health` | `200` enquanto algum esquema estiver `ready`, `503` se nenhum estiver |
| `GET /schemas` | cada esquema com `status` (`starting`, `ready`, `error`, `restarting`), `reason`, `since` e `restarts` |
| `GET /{schema}/health` | `200` quando esse esquema está `ready`, `503` caso contrário |
| `GET /status` | em `mcpHttp` e `mcpWebSocket`: o estado do transporte |

Um esquema em `error` é tentado novamente com uma espera crescente (`runtime.restart`) e volta a `ready` quando seu banco de dados
volta, sem reiniciar mais nada.

## Métricas {#metrics}

`GET /metrics` responde as métricas de todos os workers no formato do Prometheus (`GET /{schema}/metrics`, as de um esquema),
cada uma com o rótulo `worker` (`edge`, `schema:iot/v1`):

| Métrica | Rótulos |
| --- | --- |
| `data_gateway_requests_total` | `transport`, `schema`, `method`, `status`, `credential` |
| `data_gateway_request_duration_seconds` | `transport`, `schema`, `method` |
| `data_gateway_forbidden_total` | `credential`, `permission` |
| `data_gateway_throttled_total` | `schema`, `transport` (respostas `429` por `maxConcurrent`) |
| `data_gateway_connections` | `transport` |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_event_loop_lag_seconds` | `worker` |

e as métricas habituais do Node (memória, CPU, event loop). `metrics.enabled: false` as desativa.

## Logs {#logs}

Cada worker registra logs com seu rótulo (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): a inicialização, os transportes expostos ou
não, a configuração efetiva sem segredos, os estados dos esquemas, quedas e reinícios, heartbeats perdidos
e cada operação com o nome de sua credencial (nunca seu segredo). `logger.level`: `error`, `warn`, `info`,
`debug`; `logger.adapter`: `console` ou `winston`.

A [auditoria](Security.md#audit) das escritas vai para a saída padrão como linhas JSON com `"type": "audit"`, para serem separadas
pelo coletor de logs.
