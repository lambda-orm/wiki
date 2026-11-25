# Operações {#operations}

Como executar o gateway em produção: sua imagem, Kubernetes, sua saúde, suas métricas e seus logs.

## Docker {#docker}

A imagem é [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway): Node 24, a CLI `lambdaorm`
(`@lambdaorm/cli`) e o Oracle Instant Client. Ela executa `node index.js` como o usuário 1000, lê a configuração de
`/config/data-gateway.config.yaml` (`DATA_GATEWAY_CONFIG_PATH`) e os workspaces de onde a configuração indicar
(`/workspace` por convenção). Ela não tem `EXPOSE`: as portas ficam apenas na configuração.

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

O workspace é montado somente leitura: sem `management`, o gateway não escreve nele. Com `management` (a IDE, a
administração) ele precisa ser gravável pelo usuário 1000 (ou pelo indicado em `user:`): o gateway guarda ali as
sessões e o estado da IDE (`.data-gateway/`) e os arquivos que edita.

As versões `3.0.0-rc.*` são pré-lançamentos: elas não movem a tag `latest`.

### Com a IDE {#with-the-ide}

A [IDE](../ide/index.md) é outra imagem, `flaviorita/data-gateway-ide`, ao lado do gateway: o navegador fala com
ela, e ela alcança a porta `management`, que não é publicada para mais ninguém.

```yaml
services:
  data-gateway:
    image: flaviorita/data-gateway:4.1.0
    # … como acima, com transports.management.port: 9090 na sua configuração, e sem publicar a porta 9090
  ide:
    image: flaviorita/data-gateway-ide:1.1.0
    environment:
      DATA_GATEWAY_IDE_TARGETS: "http://data-gateway:9090,http://data-gateway:8080,http://data-gateway:8081"
    ports: [ "127.0.0.1:8090:8080" ]
```

`DATA_GATEWAY_IDE_TARGETS` lista o que a IDE pode alcançar (`*`: qualquer coisa, apenas para uma IDE na sua máquina).

## Kubernetes {#kubernetes}

- **Probes:** `livenessProbe` em `GET /ping` (o gateway responde). `GET /health` responde `200` enquanto o gateway
  responde, com `DEGRADED` quando algum esquema não está `ready`; para manter um pod fora do serviço até que um esquema
  esteja pronto, a `readinessProbe` vai em `GET /{schema}/health` (`503` enquanto ele não está `ready`). Com um único
  esquema na raiz, `GET /health` é o desse esquema.
- **`management`:** um `Service` interno sem ingress, alcançado apenas pela IDE; ou deixado de fora.
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
| `GET /health` | `200`, `{ "message": "OK" }` quando todos os esquemas estão `ready`, `"DEGRADED"` caso contrário, com o estado de cada um |
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
| `data_gateway_connections` | `transport` (conexões WebSocket abertas, streams SSE, sessões MCP stateful) |
| `data_gateway_schema_status` | `schema`, `status` |
| `data_gateway_schema_restarts` | `schema` |
| `data_gateway_management_sessions` | `state` (as sessões de `management`, e as com a IDE conectada) |
| `http_request_duration_seconds` | `method`, `route`, `code`, `credential` (as requisições HTTP) |

e as métricas habituais do Node com o prefixo `node_` (memória, CPU, coleta de lixo, o atraso do event loop:
`node_nodejs_eventloop_lag_seconds`). `metrics.enabled: false` as desativa.

## Logs {#logs}

Cada worker registra logs com seu rótulo (`[supervisor]`, `[edge]`, `[schema:iot/v1]`): a inicialização, os transportes expostos ou
não, a configuração efetiva sem segredos, os estados dos esquemas, quedas e reinícios, heartbeats perdidos
e cada operação com o nome de sua credencial (nunca seu segredo). `logger.level`: `error`, `warn`, `info`,
`debug`; `logger.adapter`: `console` ou `winston`.

A [auditoria](Security.md#audit) das escritas vai para a saída padrão como linhas JSON com `"type": "audit"`, para serem separadas
pelo coletor de logs.

## OpenTelemetry {#opentelemetry}

**Desde o data-gateway 4.1.0.** Com a seção [`observability`](Configuration.md#observability)
(ou as variáveis `OTEL_*`):

- **Traces:** um span `SERVER` por requisição HTTP (nomeado pelo template de sua rota, `POST /{schema}/execute`),
  mensagem WebSocket e chamada MCP, filho do `traceparent` de quem chama; o trace continua no worker do esquema e nos
  spans do λORM (`lambdaorm.execute`, suas sentenças).
- **O ator:** a credencial (e em `management` a sessão, a IDE e o endereço) chega ao λORM, para suas regras e seus
  eventos; um `options.actor` enviado por um cliente é substituído.
- **As métricas do λORM em `/metrics`**, com os nomes da compatibilidade OpenTelemetry → Prometheus
  (`db_client_operation_duration_seconds`, `lambdaorm_query_duration_seconds`, …), e
  `http_server_request_duration_seconds` (`http_request_method`, `http_route`, `http_response_status_code`); os mesmos
  nomes por OTLP.
- **A auditoria** também sai como um log record do OpenTelemetry, ligado ao trace de sua requisição, e cada alteração
  da administração como um evento `schema.change` (o [histórico](Admin.md#since-4-1-0)).
