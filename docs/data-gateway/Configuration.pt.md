# Configuração {#configuration}

Tudo o que o gateway faz é decidido por **um único arquivo YAML**, montado no contêiner, nunca embutido na imagem:
quais esquemas ele serve e em quais rotas, quais transportes abre, quem pode usá-los e com quais limites. Esta página
explica cada parte e termina com a [referência](#reference) de todas as chaves; o
[Primeiros passos](GettingStarted.md) tem um arquivo completo e pequeno.

- Caminho: `DATA_GATEWAY_CONFIG_PATH` (padrão `/config/data-gateway.config.yaml`). Ele é **obrigatório**: sem ele o
  gateway registra o erro e encerra com o código 1. Um valor inválido (uma porta que não é um número, uma permissão ou
  ferramenta desconhecida) também impede a inicialização, com a lista de problemas; uma seção ou chave desconhecida gera
  um aviso e é ignorada.
- `$VAR` e `${VAR}` são substituídos por variáveis de ambiente em qualquer parte do arquivo, inclusive dentro de um texto
  (`"${HOST}:${PORT}"`). Uma variável não definida conta como **não configurada**: um transporte cujo `port: $VAR` não está
  definido não é exposto; uma credencial cujo segredo não está definido impede a inicialização.
- Os esquemas do λORM (`lambdaORM.yaml`, fontes, mapeamentos, stages, fila) permanecem em seus workspaces. O arquivo do gateway
  diz onde eles estão, como cada um é acessado e como é exposto.

## Transportes e portas {#transports-and-ports}

Um transporte é exposto **apenas quando tem uma porta**. Não há portas padrão, nem no código nem na imagem:

| `transports.<name>` | Resultado |
| --- | --- |
| ausente | não exposto |
| presente sem `port`, ou `port: $VAR` com a variável não definida | não exposto (registrado no log: `mcpHttp not exposed: no port configured`) |
| `port` que não é um inteiro de 1 a 65535 | erro de configuração: o gateway não inicia |
| dois transportes no mesmo `host:port` | erro de configuração |
| nenhum transporte exposto | erro de configuração |

Assim, o mesmo arquivo pode expor o MCP apenas onde `DATA_GATEWAY_MCP_PORT` estiver definida. Os transportes são descritos em
[Transportes](Transports.md).

## Esquemas {#schemas}

Um **esquema** é um workspace do λORM (uma pasta com `lambdaORM.yaml`) servido em uma **rota** (`iot/v1`). Eles são declarados
de duas formas, que podem ser combinadas.

**Descobertos (`orm.workspacePath`).** A pasta é percorrida na inicialização: toda pasta com um `lambdaORM.yaml` é um esquema
e seu caminho relativo é sua rota. Abaixo de um esquema o percurso para (um workspace tem pastas próprias).

```
/workspace                          (orm.workspacePath)
├── iot/
│   ├── v1/lambdaORM.yaml    →  schema "iot/v1"       →  /iot/v1/...
│   └── v2/lambdaORM.yaml    →  schema "iot/v2"       →  /iot/v2/...
└── accounts/
    └── v1/lambdaORM.yaml    →  schema "accounts/v1"  →  /accounts/v1/...
```

**Declarados (`orm.schemas[]` com `workspace`).** A rota não depende de onde a pasta está: um volume por
esquema, ou uma instância que serve apenas alguns esquemas.

```yaml
orm:
  workspacePath: /workspace
  schemas:
    - path: accounts/v1
      workspace: /mnt/accounts          # a folder with lambdaORM.yaml, or the file itself
```

**Ajustados.** Uma entrada de `orm.schemas[]` sem `workspace` ajusta um esquema descoberto (seu `path` deve corresponder a um deles).
O que um esquema pode ajustar:

| Chave de um esquema | Efeito | Se não for configurada |
| --- | --- | --- |
| `transports` | os transportes que o expõem; nos demais suas rotas não existem (`404`) | todos os transportes expostos |
| `authentication` | substitui a autenticação (e suas credenciais) para este esquema, em todos os seus transportes | a do transporte, senão a global |
| `env` | variáveis que seu worker recebe (abaixo) | seu `.env` e as variáveis base |
| `scripts` | `enabled` e os limites dos scripts | `scripts` |
| `mcp.maxRows`, `mcp.tools` | limite de linhas e ferramentas de seu servidor MCP | `mcp` |
| `server.timeout`, `server.maxConcurrent`, `server.maxResponseBytes` | timeout, operações simultâneas e tamanho da resposta | `server` |
| `cache`, `outbox` (4.2.0) | o [cache](#cache) das suas leituras; para onde vai o seu [outbox](Changes.md#the-outbox) | `cache`, `outbox` |
| `runtime.mode`, `runtime.maxMemoryMb`, `runtime.checkConnections` | `thread` / `process`, memória de seu worker, se suas conexões são verificadas na inicialização | `runtime` |

O mais específico sempre prevalece e **substitui** os demais: esquema → transporte → global.

**Regras:**

- Pelo menos um entre `orm.workspacePath` ou um `orm.schemas[]` com `workspace`. Com `orm.watch` (o padrão), um volume
  vazio inicia e espera pelo seu primeiro esquema, e um ajuste de um esquema que ainda não existe gera um aviso e é
  aplicado quando ele aparece; sem ele, é preciso encontrar pelo menos um esquema.
- Dois esquemas com a mesma rota, ou uma rota que é prefixo de outra (`iot` e `iot/v1`), são um erro.
- Cada segmento de uma rota: `[a-zA-Z0-9_.-]`, e nenhum dos nomes reservados: `health`, `ping`, `metrics`, `version`,
  `schemas`, `mcp`, `sse`, `messages`, `status`, `doc`, `api-docs`, `swagger`, `asyncapi`, `ui`, `whoami`, `typings`, `admin`.
- **Um esquema na raiz:** se o próprio `workspacePath` tem um `lambdaORM.yaml` (ou um esquema declarado usa `path: ""`),
  ele é servido na raiz (`/execute`). Somente quando é o único esquema.
- **Recarga a quente** (`orm.watch`, ativo por padrão): uma pasta nova com um `lambdaORM.yaml` é um esquema novo, um
  `lambdaORM.yaml` ou `.env` alterado recarrega seu esquema blue-green (continua a última versão que iniciou se a nova
  não inicia), uma pasta que sai leva seu esquema. Ver [Administração](Admin.md#workspaces-in-the-volume).
- Cada esquema usa a `infrastructure.queue` (Kafka) de seu próprio `lambdaORM.yaml`, se tiver uma.

## Ambiente de cada esquema {#environment-of-each-schema}

O λORM substitui as `$VAR` de um `lambdaORM.yaml` pelo ambiente. Para que um esquema não possa ler as credenciais de outro
nem os segredos do gateway, **cada worker de esquema recebe apenas suas próprias variáveis**, da maior para a
menor prioridade:

| Fonte | Exemplo |
| --- | --- |
| `schemas[].env` no arquivo do gateway (os valores podem usar as variáveis do gateway) | `DB_CONNECTION: $IOT_V1_DB` |
| um arquivo `.env` no workspace do esquema (opcional) | `/workspace/iot/v1/.env` |
| as variáveis base: `PATH`, `HOME`, `TZ`, `LANG`, `NODE_*`, `LD_LIBRARY_PATH`, `ORACLE_*` e `runtime.env.passthrough` | `TZ=UTC` |

Todos os `lambdaORM.yaml` podem usar os mesmos nomes, e o gateway mapeia cada um para seu segredo real:

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

Uma variável usada em `schemas[].env` que não está definida fica indefinida: esse esquema não consegue se conectar e é exibido em
`error` com o motivo; os demais iniciam.

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

O que cada modo isola:

| | `thread` | `process` | outra instância |
| --- | --- | --- | --- |
| CPU e event loop | sim | sim | sim |
| Heap de JavaScript (`maxMemoryMb`) | sim | sim | sim |
| Um worker travado (heartbeat) | sim | sim | sim |
| Variáveis de ambiente | sim | sim | sim |
| Thread pool do libuv (DNS, `fs`, drivers nativos) | compartilhado (`threadpoolSize`) | sim | sim |
| Memória nativa, OOM do contêiner | não | mesmo contêiner | sim |
| Uma falha de código nativo | não: o processo inteiro | sim | sim |

`thread` é adequado para desenvolvimento e esquemas pequenos; `runtime.mode: process`, para um esquema crítico em produção (o Oracle em modo thick
usa código nativo); uma instância separada, para esquemas de equipes ou clientes diferentes.

## Exemplo completo {#complete-example}

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
          - { name: accounts-backend, value: $ACCOUNTS_KEY, roles: [ backend ] }

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

authorization:                     # what each role may do, and where (since 5.0.0 the only way)
  roles:
    agent:   { permissions: [ read ], schemas: [ iot/v1, iot/v2 ] }
    backend: { permissions: [ read, write, script, queue, stageImport ] }

authentication:                    # for every schema and transport that doesn't set its own
  adapter: local
  type: apikey
  header: X-Api-Key
  keys:
    - { name: agent,   value: $AGENT_KEY,   roles: [ agent ] }
    - { name: backend, value: $BACKEND_KEY, roles: [ backend ], context: { username: backend } }

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
  management:                      # the API of the IDE; without the variable, not exposed (production)
    port: $DATA_GATEWAY_MANAGEMENT_PORT
    trustedProxies: [ 10.0.0.0/8 ] # the network of the IDE: its X-Forwarded-For gives the browser's address
    sessions: { idleTimeout: 30m, maxLifetime: 12h }
```

## Observabilidade (OpenTelemetry) {#observability}

**Desde o data-gateway 4.1.0.** A seção `observability` tem a forma de
`infrastructure.observability` de um `lambdaORM.yaml` ([Observabilidade](../schema/Observability.md)), e as variáveis
padrão `OTEL_*` a substituem. O gateway inicia o SDK do OpenTelemetry em cada worker antes do λORM, de modo que uma
requisição, seu worker e as sentenças do λORM formam um único trace.

```yaml
observability:
  serviceName: data-gateway                              # o padrão; OTEL_SERVICE_NAME o substitui
  exporter: { type: otlp, endpoint: http://alloy:4318 }  # http/protobuf (ou http/json); sem gRPC
  traces:
    enabled: true
    sampler: { ratio: 1, parentBased: true }
  metrics: { enabled: true }                             # também por OTLP; /metrics as tem de qualquer forma
  logs:
    adapters: [ { type: opentelemetry } ]                # a auditoria e o histórico dos esquemas
```

Os headers do exportador carregam tokens: vão apenas em `OTEL_EXPORTER_OTLP_HEADERS` (`exporter.headers` no arquivo
impede a inicialização). O que ela oferece está em [Operações](Operations.md#opentelemetry).

**Onde é visto** (`explore`, desde a 5.0.0): o Grafana da instalação, para que o IDE abra ali os traces de uma
entidade, suas métricas e seus logs. `management` o diz em `GET /observability` (sem credencial); não chega ao SDK do
λORM.

```yaml
observability:
  explore:
    grafana: https://grafana.example.com   # the URL of Grafana
    tempo: tempo                           # the uids of its datasources (these by default)
    prometheus: prometheus
    loki: loki
    orgId: 1
```

Desde a 5.0.0 a observabilidade também pode ser mudada a partir da [administração](Admin.md#observability) (permissão
`observability`): o que é salvo ali fica no estado, sobre esta seção, e é aplicado na hora.

## O cache das leituras {#cache}

**Desde o data-gateway 4.2.0.** Uma leitura repetida enquanto nada do que ela lê mudou não volta ao banco. Fica
desligado até `cache.enabled: true` (global ou por schema): um cliente pode ver um resultado com até `ttl` de idade
quando outra aplicação escreve no banco.

```yaml
cache:                      # também orm.schemas[].cache
  enabled: true
  ttl: 60s                  # quanto tempo vive um resultado
  maxEntries: 10000         # em memória; os menos usados saem primeiro
  maxRowBytes: 1MB          # um resultado maior não é guardado
  entities:
    Prices: { ttl: 5s }               # outro ttl para o que a lê
    AuditLogs: { enabled: false }     # o que a lê nunca é guardado
```

- **O que é guardado:** o resultado de um `execute` que só lê e de uma [consulta com nome](Rest.md#named-queries) que
  só lê; nunca uma escrita, um script ou um `execute-queued`.
- **De quem:** um resultado é da sua consulta, dos seus `data`, do seu stage, e **da view e do contexto de quem
  perguntou**: duas identidades com outra view ou outro tenant nunca compartilham um.
- **Até quando:** uma escrita que passa pelo λORM apaga na hora todos os resultados que leem a sua entidade (também por
  um `include` ou uma relação); o que outra aplicação escreve é visto depois de `ttl`, no máximo.
- Com várias réplicas, cada uma tem o seu cache; desde a 4.3.0, com [`cluster.valkey`](#cluster) uma escrita em
  qualquer réplica apaga os resultados de todas; sem ele, cada uma vê as próprias escritas: use um `ttl` curto.
- O `/metrics` tem `data_gateway_cache_requests{result="hit|miss"}`, `data_gateway_cache_invalidations` e
  `data_gateway_cache_entries`; o REST responde [`ETag` e `304`](Rest.md#execute).

## Réplicas juntas (Valkey) {#cluster}

**Desde o data-gateway 4.3.0.** Com um Valkey (ou um Redis: o mesmo protocolo) compartilhado, cada réplica avisa as
outras das escritas feitas por ela: o [cache](#cache) de todas apaga o que elas mudam, as
[assinaturas](Changes.md#subscriptions) de todas ficam sabendo, e o [outbox](Changes.md#the-outbox) é despachado por
uma réplica só, a que tem um lease (outra o toma se ela sair).

```yaml
cluster:
  valkey:
    url: $VALKEY_URL           # valkey://[user:password@]host:6379[/db], valkeys:// (TLS); redis://, rediss://
    prefix: data-gateway
```

Só viajam a entidade, a ação, as chaves e quantas linhas, nunca os dados. Se o Valkey cair, cada réplica segue com as
próprias escritas (dito no log e em `data_gateway_cluster_connected`) e ninguém despacha o outbox até ele voltar.

## O estado do gateway {#state}

**Desde data-gateway 4.4.0.** O que o gateway guarda de si mesmo (as sessões do `management`, o estado da UI de cada
credencial, as [escritas que aguardam](Security.md#approvals), os [papéis](Security.md#roles) mudados pela
administração) vive em um só lugar:

```yaml
state:
  source:
    dialect: SQLite                       # uma instância: um arquivo
    connection: /data/.data-gateway/state.sqlite
  # várias réplicas: um banco de dados
  # source:
  #   dialect: PostgreSQL                 # também MySQL, MariaDB, SqlServer, Oracle
  #   connection: $DATA_GATEWAY_STATE_URL # postgres://usuario:senha@host:5432/gateway
  refresh: 30s                            # a cada quanto uma réplica olha se os papéis mudaram
  required: false                         # true: sem seu banco o gateway não inicia
```

- **Sem `state`,** um SQLite do volume (`<orm.workspacePath>/.data-gateway/state.sqlite`), como antes da 4.4.0; sem
  `orm.workspacePath`, memória.
- **Um banco de dados** é usado através do λORM: suas tabelas (`dg_sessions`, `dg_approvals`, `dg_roles`…) são criadas
  quando o gateway inicia, e uma versão nova adiciona o que precisa (nunca apaga).
- **Várias réplicas** (`cluster.valkey`) com o estado em SQLite são um erro: perderiam dados.
- **Sem seu banco ao iniciar,** o gateway inicia só com os papéis da configuração (nunca uma permissão a mais) e tenta
  de novo; com `required: true`, não inicia.
- **`state.mapping`** (5.0.0) diz as tabelas e colunas do esquema de sistema num banco, por entidade
  (`{ Roles: { table: gw_roles, columns: { name: role_name } } }`); sem ele, `dg_` e seus nomes.
- **A partir da administração** (5.0.0, permissão `persist`): [outro banco ou outro mapping](Admin.md#persist), com o
  estado copiado ali; guardado em `.data-gateway/persist.yaml`, sobre `state.source` e `state.mapping`.

## Arquivos de propriedades {#files}

**Desde o data-gateway 4.3.0.** Uma propriedade pode guardar a chave de um arquivo num armazenamento (S3 — AWS ou outro
com seu `endpoint` — ou Azure Blob): o gateway assina URLs de vida curta para enviá-lo e lê-lo, e os bytes vão direto
entre o cliente e o armazenamento, nunca pelo gateway. Global ou por schema:

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

As rotas estão na [API REST](Rest.md#files). Uma URL de leitura só é assinada para uma chave que uma linha da
[view](Security.md#views) de quem pede guarda. O S3 assina o tipo e o tamanho de um envio; o Azure não pode, então o
gateway os confere ao assinar. O armazenamento deve permitir a origem da IDE (CORS) para que a
[IDE](../ide/Entities.md#data) envie e leia.

## Referência {#reference}

| Chave | Padrão | Notas |
| --- | --- | --- |
| `orm.workspacePath` | — | a pasta onde os esquemas são descobertos |
| `orm.schemas[]` | `[]` | `path` (obrigatório), `workspace` (define um esquema) e ajustes |
| `orm.watch` | `true` | recarga a quente dos workspaces; `false`, ou `{ enabled, intervalMs, debounceMs }` |
| `orm.watch.intervalMs` / `debounceMs` | `5000` / `300` | a varredura dos workspaces; quanto as mudanças são agrupadas |
| `admin.enabled` | — | **removida na 4.0.0** (avisada e ignorada): a [administração](Admin.md) fica ligada quando `transports.management` tem uma porta |
| `admin.allowAnonymous` | `false` | com `authentication: none`, qualquer um administra (só desenvolvimento local) |
| `admin.commandTimeoutMs` / `maxFileBytes` | `600000` / `2MB` | quanto um comando pode demorar; o maior arquivo gravado |
| `runtime.transports` | `shared` | todos os transportes em um único edge worker; `thread` e `process` geram um aviso e rodam como `shared` |
| `runtime.schemas` | `thread` | `thread` / `process` |
| `runtime.maxMemoryMb` | `512` | por worker |
| `runtime.checkConnections` | `true` | um banco de dados fora do ar deixa o esquema em `error`, tentado novamente, em vez de falhar na primeira consulta |
| `runtime.threadpoolSize` | `auto` | `max(4, 2 × schemas in thread mode)`, no máximo 64 |
| `runtime.heartbeat.intervalMs` / `timeoutMs` | `5000` / `30000` | |
| `runtime.restart.initialDelayMs` / `maxDelayMs` | `1000` / `300000` | espera crescente entre reinícios |
| `runtime.env.isolate` / `passthrough` | `true` / `[]` | |
| `server.timeout` | `120000` | por requisição HTTP, mensagem WebSocket e chamada de ferramenta MCP; acima dele, `504` |
| `server.maxConcurrent` | `64` | operações simultâneas por esquema; acima disso, `429`; `0` = sem limite |
| `server.requestBodySize` | `14MB` | |
| `server.maxResponseBytes` | `256MB` | acima disso, `413`; `0` = sem limite |
| `logger.adapter` / `logger.level` | `console` / `info` | `console` ou `winston`; `error`, `warn`, `info`, `debug` |
| `metrics.enabled` | `true` | |
| `audit.enabled` | `true` | a auditoria das escritas ([Segurança](Security.md#audit)) |
| `audit.includeData` | `false` | `true` adiciona os parâmetros (`data`), que podem conter dados pessoais |
| `authentication` | `{ adapter: none }` | [Segurança](Security.md) |
| `authentication.header` | `X-Api-Key` | o header de `type: apikey` |
| `authentication.adapter: jwt` | — | (4.1.0) os tokens de um provedor de identidade: `issuer`, `audience`, `jwksUri`, `secret`, `algorithms`, `clockTolerance`, `principal.name`, `principal.permissions.claim`, `context` ([Segurança](Security.md#jwt)); desde a 5.0.0 seus papéis são os de `authorization.roles` |
| `keys[]`, `tokens[]`, `users[]` | — | `name`, o segredo (`value` / `password`), `roles` (obrigatório desde a 5.0.0) e `context` (5.0.0: variável → um texto, um número ou um booleano, [o contexto de uma chave](Security.md#context)) |
| `authentication.methods` | — | (4.1.0) várias autenticações em ordem: `jwt` e `local` ([Segurança](Security.md#jwt)) |
| `authorization.roles.<nome>` | — | (4.4.0) `permissions`, `schemas` (5.0.0: uma lista de caminhos, ou `{ <caminho>: { views, view, stages, stage } }`), `views`, `stages`, `maxRows`, `approval`, `scope: any`, `locked` — [papéis](Security.md#roles) |
| `orm.schemas[].view` | `default` | (4.1.0) a view de quem chama sem uma |
| `orm.schemas[].queries.<name>` | — | (4.1.0) `maxRows`, `timeout` de uma [consulta nomeada](Rest.md#named-queries) |
| `cluster.valkey.url` / `prefix` | — / `data-gateway` | (4.3.0) o Valkey das [réplicas](#cluster) |
| `files.storages.<nome>` | — | (4.3.0) `type: s3` (`bucket`, `region`, `endpoint`, `accessKeyId`, `secretAccessKey`) ou `type: azureBlob` (`account`, `container`, `accountKey`, `endpoint`); `prefix`, `maxBytes` (10MB), `types`, `expires` (5m) — [arquivos](#files) |
| `files.properties.<Entidade.propriedade>` | — | (4.3.0) o armazenamento dos seus arquivos |
| `authorization.roles.<nome>` | — | (4.4.0) `permissions`, `views`, `stages`, `maxRows`, `approval`, `scope: any`, `locked` — [papéis](Security.md#roles) |
| `authorization.stages` | `restricted` | (4.4.0) `open`: pode-se escolher um stage que nenhum papel nomeia, como antes da 4.4.0 |
| `orm.schemas[].stage` | — | (4.4.0) o stage de quem não escolhe (`orm.schemas[].roles` não existe mais desde a 5.0.0: o papel diz seus `schemas`) |
| `state.source` | o SQLite do volume | (4.4.0) `dialect` (`SQLite`, `PostgreSQL`, `MySQL`, `MariaDB`, `SqlServer`, `Oracle`) e `connection` — [o estado](#state) |
| `state.refresh` / `required` | `30s` / `false` | (4.4.0) a cada quanto os papéis são lidos de novo; se o gateway inicia sem seu banco |
| `state.mapping.<Entity>` | `dg_…` | (5.0.0) `table`, `columns`: as tabelas do esquema de sistema num banco |
| `observability.explore` | — | (5.0.0) `grafana`, `tempo`, `prometheus`, `loki`, `orgId`: [onde é visto](#observability) |
| `mcp.approval` / `mcp.approvalExpires` | `none` / `1h` | (4.3.0) `writes`: toda escrita por MCP [aguarda uma pessoa](Security.md#approvals); também por schema |
| `authorization.roles.<papel>.approval` | — | (4.3.0) `writes`: as escritas desse papel aguardam, em todo transporte (desde a 5.0.0 só num papel) |
| `cache.enabled` | `false` | (4.2.0) o [cache das leituras](#cache); também por schema |
| `cache.ttl` / `maxEntries` / `maxRowBytes` | `60s` / `10000` / `1MB` | (4.2.0) |
| `cache.entities.<entity>` | — | (4.2.0) `{ ttl }` ou `{ enabled: false }` para o que a lê |
| `outbox.destinations[]` | `[]` | (4.2.0) para onde vai o [outbox](Changes.md#the-outbox): `type: webhook` (`url`, `secret`, `timeout`, `entities`) ou `type: kafka` (`topic`, `entities`); também por schema |
| `outbox.interval` / `batch` | `1s` / `100` | (4.2.0) de quanto em quanto tempo procura eventos pendentes; quantos por rodada |
| `outbox.dispatch` | `true` | (4.2.0) esta réplica despacha; `false` (ou `DATA_GATEWAY_OUTBOX_DISPATCH=false`) em todas as réplicas menos uma |
| `transports.<t>.authentication` | `authentication` | substitui a global para esse transporte |
| `rateLimit.windowMs` / `rateLimit.max` | `30000` / `30` | apenas `http`; `max: 0` o desativa |
| `scripts.enabled` | `false` | `POST /script` e sua ferramenta e seu método |
| `scripts.maxLength` / `timeoutMs` / `maxIterations` | `20000` / `30000` / `100000` | uma requisição pode pedir menos, nunca mais |
| `mcp.name` | `data-gateway` | o nome dos servidores MCP; cada um adiciona sua rota |
| `mcp.tools.include` / `exclude` | `[]` / `[]` | nomes de [ferramentas](Mcp.md#tools) |
| `mcp.pageSize` | `50` | página de `tools/list` e `resources/list` |
| `mcp.maxRows` | `500` | linhas de `orm_execute` / `orm_execute_script`; `0` = sem limite |
| `mcp.freeQueries` | `true` | (4.1.0) `false`: um agente só com as [consultas nomeadas](Mcp.md#named-queries); também por esquema |
| `transports.<t>.port` | **nenhum** | sem porta, o transporte não é exposto |
| `transports.<t>.host` | `0.0.0.0` | |
| `transports.<t>.basePath` | `''` | um prefixo antes da rota do esquema (`/data-gateway`), atrás de um ingress com um caminho |
| `transports.<t>.maxConnections` | `100` | `webSocket`, `mcpWebSocket`, e os streams SSE e as sessões stateful de `mcpHttp` |
| `transports.http.swagger.enabled` | `true` | `/doc` e `/api-docs` |
| `transports.http.ui` | — | **removida na 4.0.0** (avisada e ignorada): a [UI](../ide/index.md) é o data-gateway-ide |
| `transports.management.port` | **nenhum** | a API da [IDE](../ide/index.md) e a [administração](Admin.md) ([Transportes](Transports.md#management)) |
| `transports.management.sessions.idleTimeout` / `maxLifetime` | `30m` / `12h` | quando uma [sessão](Transports.md#sessions) termina: sem requisições, e depois do login; `30s`, `30m`, `12h`, `7d` ou milissegundos |
| `transports.management.sessions.maxPerCredential` | `0` | sessões simultâneas por credencial; `0` = sem limite; acima dele, um login fecha a mais antiga |
| `transports.management.sessions.store` | `auto` | `auto`: `<orm.workspacePath>/.data-gateway/state.sqlite` (compartilhado pelas réplicas); `memory`: apenas esta réplica |
| `transports.management.trustedProxies` | `[]` | endereços ou redes (CIDR) cujo `X-Forwarded-For` é aceito: a IDE, para que se veja o endereço do navegador |
| `transports.mcpHttp.legacySse` | `true` | além do Streamable HTTP, o antigo HTTP+SSE para clientes antigos |
| `transports.mcpHttp.stateful` | `false` | Streamable HTTP sem estado: qualquer réplica responde a qualquer requisição |
| `transports.<ws>.asyncapi.enabled` | `true` | `GET /asyncapi` e `/asyncapi.json` de `webSocket` e `mcpWebSocket` |
| `observability` | — | OpenTelemetry, [acima](#observability); desde a 4.1.0 |
