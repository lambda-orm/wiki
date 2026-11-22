# API REST {#rest-api}

O transporte `http` ([Transportes](Transports.md#http)) expõe todas as operações do λORM sobre um esquema como REST, com JSON
na entrada e na saída. O documento OpenAPI 3 é servido pelo gateway em `/doc` (Swagger UI) e `/api-docs`.

## Rotas {#routes}

Os exemplos usam um gateway em `http://localhost:8080` com uma API key. Os métodos de cada esquema ficam sob sua rota:

| Gateway | Esquema `iot/v1` | Esquema único na raiz |
| --- | --- | --- |
| `http://localhost:8080` | `http://localhost:8080/iot/v1/execute` | `http://localhost:8080/execute` |

Com `transports.http.basePath: /data-gateway`, todas as rotas ficam sob ele: `/data-gateway/iot/v1/execute`.

- Toda requisição precisa da credencial, exceto `/ping`, `/health` e `/metrics` (na raiz e sob cada esquema),
  `/schemas`, `/version`, `/doc` e a UI. A forma de enviá-la depende da [autenticação](Security.md):
  `X-Api-Key: <key>`, `Authorization: Bearer <token>` ou `Authorization: Basic <base64>`.
- `?format=beautiful` indenta o JSON da resposta.
- `data` (os parâmetros de uma consulta) e `options` (por exemplo `{ "stage": "default" }`) são objetos JSON; texto JSON
  (`"data": "{\"id\": 10}"`) também é aceito.
- Um erro responde com um status e `{ "error", "code"?, "message" }` ([Erros](Security.md#errors)).
- Uma consulta com um nome que o esquema não tem responde `400` com os nomes mais próximos, na mensagem (`nam is
  neither a property nor a relation of Areas; did you mean name?`) e como dados: `"suggestions": [{ "name": "nam", "didYouMean": ["name"] }]`.
- Uma rota que não existe responde `404` em JSON, com as rotas mais próximas na mensagem.

## Métodos do gateway {#gateway-methods}

| Método | Rota | Responde | Credencial |
| --- | --- | --- | --- |
| `GET` | `/ping` | `{ "message": "pong", "time" }` | não |
| `GET` | `/health` | `200` enquanto algum esquema estiver `ready`, `503` se nenhum estiver | não |
| `GET` | `/metrics` | as métricas de todos os workers, em texto do Prometheus | não |
| `GET` | `/version` | a versão do gateway | não |
| `GET` | `/schemas` | cada esquema com seu estado | não |
| `GET` | `/whoami` | o nome e as permissões da credencial | sim |

```sh
curl http://localhost:8080/schemas
```

```json
[
  { "path": "iot/v1", "status": "ready", "since": "2026-11-18T13:35:56.407Z", "restarts": 0 },
  { "path": "iot/v2", "status": "error", "reason": "connect ECONNREFUSED 10.0.0.5:5432", "since": "…", "restarts": 3 }
]
```

Os estados são `starting`, `ready`, `error` e `restarting`.

## Estado de um esquema {#state-of-a-schema}

Sob a rota de cada esquema (`/iot/v1/…`), estes respondem apenas sobre aquele esquema:

| Método | Rota | Responde |
| --- | --- | --- |
| `GET` | `/{schema}/ping` | `200` se o esquema está `ready`, `503` caso contrário |
| `GET` | `/{schema}/health` | o estado do esquema; `503` se ele não está `ready` |
| `GET` | `/{schema}/metrics` | as métricas desse esquema |
| `GET` | `/{schema}/version` | as versões do gateway e do esquema |
| `GET` | `/{schema}/whoami` | o nome e as permissões da credencial com a autenticação desse esquema, e se ele tem scripts habilitados |

```sh
curl http://localhost:8080/iot/v1/whoami -H "X-Api-Key: $KEY"
```

```json
{ "name": "reader", "permissions": ["read"], "schema": "iot/v1", "scripts": true }
```

O segredo da credencial nunca é retornado.

## Métodos de consulta {#query-methods}

### execute {#execute}

`POST /{schema}/execute` executa uma consulta. O corpo é `{ query, data?, options? }`.

```sh
curl -X POST "http://localhost:8080/execute?format=beautiful" -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.filter(p => p.customerId == customerId).include(p => p.details)", "data": {"customerId": "CENTC"}}'
```

```json
[
  {
    "id": 12,
    "customerId": "CENTC",
    "orderDate": "1996-07-18T00:00:00.000Z",
    "details": [
      { "orderId": 12, "productId": 21, "unitPrice": 8, "quantity": 10 },
      { "orderId": 12, "productId": 37, "unitPrice": 20.8, "quantity": 1 }
    ]
  }
]
```

- Um select responde as linhas; `update` e `delete` respondem o número de linhas afetadas (`0` quando nada corresponde);
  `insert` responde os dados inseridos.
- Com apenas a permissão `read`, uma consulta que grava (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`) é
  recusada com `403` antes de chegar ao banco de dados.

```sh
curl -X POST http://localhost:8080/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", "data": {"id": 10248, "freight": 40}}'
```

```json
1
```

### plan {#plan}

`POST /{schema}/plan` responde como a consulta é executada: o dialeto, a fonte e a sentença de cada parte, sem
executá-la. Corpo `{ query, options? }`.

```sh
curl -X POST http://localhost:8080/plan -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Orders.filter(p => p.customerId == customerId).include(p => p.details)"}'
```

```json
{
  "entity": "Orders",
  "dialect": "PostgreSQL",
  "source": "default",
  "sentence": "SELECT o.OrderID AS \"id\", o.CustomerID AS \"customerId\", o.OrderDate AS \"orderDate\", o.OrderID AS \"__id\" FROM Orders o  WHERE o.CustomerID = $1 ",
  "children": [
    {
      "entity": "Orders.details",
      "dialect": "PostgreSQL",
      "source": "default",
      "sentence": "SELECT o1.OrderID AS \"orderId\", o1.ProductID AS \"productId\", o1.UnitPrice AS \"unitPrice\", o1.Quantity AS \"quantity\", o1.OrderID AS \"LambdaOrmParentId\" FROM \"Order Details\" o1  WHERE  o1.OrderID IN ($1) "
    }
  ]
}
```

### model {#model}

`POST /{schema}/model` responde o formato do resultado: suas propriedades e seus tipos.

```json
[
  { "name": "id", "type": "integer" },
  { "name": "customerId", "type": "string" },
  { "name": "orderDate", "type": "dateTime" },
  { "name": "details", "type": "Orders.details[]", "children": [
    { "name": "orderId", "type": "integer" },
    { "name": "productId", "type": "integer" },
    { "name": "unitPrice", "type": "decimal" },
    { "name": "quantity", "type": "decimal" }
  ] }
]
```

### parameters {#parameters}

`POST /{schema}/parameters` responde as variáveis que a consulta usa, que vão em `data`.

```json
[ { "name": "customerId", "type": "string" } ]
```

### constraints {#constraints}

`POST /{schema}/constraints` responde as restrições que se aplicam às entidades da consulta.

```json
{ "entity": "Orders", "constraints": [], "children": [ { "entity": "Orders.details", "constraints": [] } ] }
```

### metadata {#metadata}

`POST /{schema}/metadata` responde a árvore analisada da consulta: cada sentença com sua ação (`select`, `insert`,
…), entidade, colunas, parâmetros e restrições.

```json
{ "classtype": "Sentence", "name": "select", "entity": "Orders", "columns": [ { "name": "id" } ], "parameters": [ { "name": "customerId", "type": "any" } ], "constraints": [] }
```

### script {#script}

`POST /{schema}/script` executa um [script](../usage/Script.md): várias consultas e lógica em uma só transação. Corpo
`{ script, data?, options? }`. Ele precisa de `scripts.enabled` (caso contrário, `403`) e da permissão `script`; os limites de
`scripts` se aplicam (`maxLength`, `timeoutMs`, `maxIterations`).

```sh
curl -X POST http://localhost:8080/script -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{
  "script": "order = orm.execute(\"Orders.filter(p => p.id == id)\", { id: id }); if (order.length() == 0) { throw { status: 404, message: \"order not found\" }; } order[0]",
  "data": { "id": 10248 }
}'
```

Um script pode escolher o status da resposta com `throw { status, message }`.

### execute-queued {#execute-queued}

`POST /{schema}/execute-queued` executa uma consulta em segundo plano e envia seu resultado a um tópico do Kafka, em lotes. Ele
responde imediatamente `{ "queueId": "…" }`; as mensagens levam as chaves `<queueId>-<chunk>`. Corpo
`{ topic, query, data?, chunk?, options? }`. Ele precisa da permissão `queue` (e de `write` se a consulta grava) e de uma
`infrastructure.queue` no `lambdaORM.yaml` do esquema.

```sh
curl -X POST http://localhost:8080/execute-queued -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Countries.map(p => [p.iso3, p.name])", "topic": "countries", "chunk": 1000}'
```

A fila de um esquema é configurada em seu `lambdaORM.yaml` (`config` é a configuração do [kafkajs](https://kafka.js.org/docs/configuration)),
onde também podem ser declarados consumidores:

```yaml
infrastructure:
  queue:
    config: $QUEUE_CONFIG
    consumers:
      - name: syncInsights
        config: { groupId: group1 }
        subscribe: { topic: insights-sync, fromBeginning: true }
        execute: orm.execute(message.query, message.data, { stage: "insights" })
```

Pela [API WebSocket](WebSocket.md), `query.executeQueued` com `notify: true` também avisa a conexão quando a
execução termina.

## Métodos do esquema {#schema-methods}

O modelo do esquema. Eles precisam de `read`. As conexões das fontes nunca são retornadas.

| Método | Rota | Responde |
| --- | --- | --- |
| `GET` | `/{schema}/schema` | a versão e o domínio do esquema |
| `GET` | `/{schema}/schema/version` | a versão do esquema |
| `GET` | `/{schema}/domain` | o domínio: entidades (propriedades, relações, chaves, índices, restrições) e enums |
| `GET` | `/{schema}/entities` | as entidades |
| `GET` | `/{schema}/entities/{entity}` | uma entidade |
| `GET` | `/{schema}/enums` | os enums |
| `GET` | `/{schema}/enums/{enum}` | um enum |
| `GET` | `/{schema}/sources` | as fontes, com seu nome e dialeto |
| `GET` | `/{schema}/sources/{source}` | uma fonte |
| `GET` | `/{schema}/mappings` | os mapeamentos (entidades para tabelas e colunas) |
| `GET` | `/{schema}/mappings/{mapping}` | um mapeamento |
| `GET` | `/{schema}/mappings/{mapping}/{entity}` | o mapeamento de uma entidade |
| `GET` | `/{schema}/views` | as views |
| `GET` | `/{schema}/stages` | os stages, com suas fontes |
| `GET` | `/{schema}/stages/{stage}` | um stage |
| `GET` | `/{schema}/typings` | o domínio como declarações TypeScript (`text/plain`), para o autocompletar de um editor |
| `GET` | `/{schema}/search?q={texto}` | as entidades, propriedades e relações cujo nome contém o texto, compacto ([esquemas grandes](#large-schemas)) |
| `GET` | `/{schema}/describe?entities={A,B}` | algumas entidades em duas linhas cada uma, e os nomes que não conhece com os mais próximos |

```sh
curl http://localhost:8080/sources -H "X-Api-Key: $KEY"
```

```json
[ { "name": "catalog", "dialect": "PostgreSQL" }, { "name": "accounts", "dialect": "PostgreSQL" } ]
```

```sh
curl http://localhost:8080/entities/Categories -H "X-Api-Key: $KEY"
```

```json
{
  "name": "Categories",
  "primaryKey": ["id"],
  "uniqueKey": ["name"],
  "properties": [
    { "name": "id", "type": "integer", "required": true, "autoIncrement": true },
    { "name": "name", "type": "string", "length": 80, "required": true },
    { "name": "description", "type": "string", "length": 1000 }
  ],
  "relations": []
}
```

### Esquemas grandes {#large-schemas}

Com centenas de entidades, o domínio inteiro é demais para ler antes de escrever uma consulta. `/search` encontra
nomes por uma parte deles (`Products.cat` busca só em Products; sem correspondências, os nomes mais próximos) e
`/describe` dá algumas entidades em duas linhas cada uma. O MCP tem o mesmo em [`schema_search` e `schema_describe`](Mcp.md#large-schemas).

```sh
curl "http://localhost:8080/search?q=Products.cat" -H "X-Api-Key: $KEY"
```

```json
{ "matches": [ "Products.categoryId: integer", "Products.category → Categories" ] }
```

```sh
curl "http://localhost:8080/describe?entities=Categories,Categorie" -H "X-Api-Key: $KEY"
```

```json
{
  "entities": [ "- Categories: id: integer (pk, auto); name: string (required)\n  relations: products → Products[]" ],
  "notFound": [ { "name": "Categorie", "didYouMean": [ "Categories" ] } ]
}
```

## Métodos de stage {#stage-methods}

| Método | Rota | Responde | Permissão |
| --- | --- | --- | --- |
| `GET` | `/{schema}/stages/{stage}/exists` | `{ "exists": true }` quando o stage foi criado e seu arquivo de estado existe | `read` |
| `GET` | `/{schema}/stages/{stage}/export` | as linhas de todas as entidades do stage | `read` |
| `POST` | `/{schema}/stages/{stage}/import` | importa linhas (o corpo é uma exportação) para as entidades do stage | `stageImport` |

```sh
curl http://localhost:8080/stages/default/export -H "X-Api-Key: $KEY" > data.json
curl -X POST http://localhost:8080/stages/default/import -H "X-Api-Key: $BACKEND_KEY" -H "Content-Type: application/json" -d @data.json
```

## Resumo {#summary}

| Operação | REST | [Ferramenta MCP](Mcp.md#tools) | [Método WebSocket](WebSocket.md#methods) | Permissão |
| --- | --- | --- | --- | --- |
| execute | `POST /execute` | `orm_execute` | `query.execute` | `read` (selects) / `write` |
| script | `POST /script` | `orm_execute_script` | `query.script` | `script` |
| execução enfileirada | `POST /execute-queued` | `orm_execute_queued` | `query.executeQueued` | `queue` |
| plan | `POST /plan` | `orm_plan` | `query.plan` | `read` |
| metadata | `POST /metadata` | `orm_metadata` | `query.metadata` | `read` |
| model | `POST /model` | `orm_model` | `query.model` | `read` |
| parameters | `POST /parameters` | `orm_parameters` | `query.parameters` | `read` |
| constraints | `POST /constraints` | `orm_constraints` | `query.constraints` | `read` |
| esquema | `GET /schema` | `schema_get` | `schema.schema` | `read` |
| versão do esquema | `GET /schema/version` | `schema_version` | `schema.version` | `read` |
| domínio | `GET /domain` | `schema_domain` | `schema.domain` | `read` |
| entidades | `GET /entities[/{entity}]` | `schema_entities` | `schema.entities`, `schema.entity` | `read` |
| enums | `GET /enums[/{enum}]` | `schema_enums` | `schema.enums`, `schema.enum` | `read` |
| fontes | `GET /sources[/{source}]` | `schema_sources` | `schema.sources`, `schema.source` | `read` |
| mapeamentos | `GET /mappings[/{mapping}[/{entity}]]` | `schema_mappings` | `schema.mappings`, `schema.mapping`, `schema.entityMapping` | `read` |
| views | `GET /views` | `schema_views` | `schema.views` | `read` |
| stages | `GET /stages[/{stage}]` | `schema_stages` | `schema.stages`, `schema.stage` | `read` |
| typings | `GET /typings` | — | `schema.typings` | `read` |
| search | `GET /search?q=` | `schema_search` | `schema.search` | `read` |
| describe | `GET /describe?entities=` | `schema_describe` | `schema.describe` | `read` |
| existência de stage | `GET /stages/{stage}/exists` | `stage_exists` | `stage.exists` | `read` |
| exportação de stage | `GET /stages/{stage}/export` | `stage_export` | `stage.export` | `read` |
| importação de stage | `POST /stages/{stage}/import` | `stage_import` | `stage.import` | `stageImport` |
| versão | `GET /version` | `gateway_version` | `general.version` | — |
| saúde | `GET /health` | `gateway_health` | `general.health` | — |
| ping | `GET /ping` | — | `general.ping` | — |

## Administração {#administration}

Com `admin.enabled` ([Administração](Admin.md)), sob `/admin` deste transporte. Um workspace é nomeado pela sua rota em um segmento (`iot%2Fv1`; `~` a raiz). Cada leitura devolve sua versão (`ETag`); cada escrita diz qual altera (`If-Match`, ou o elemento como foi lido): outra versão é um `412` com o que há agora.

| Method | Route | | Permission |
| --- | --- | --- | --- |
| `GET` | `/admin` | `{ enabled, can }` | — |
| `GET` / `POST` | `/admin/workspaces` | the workspaces / a new one (`{ path, copyOf? }`) | `schemaRead` / `schemaAdmin` |
| `DELETE` | `/admin/workspaces/{route}?confirm={route}` | to `.trash` | `schemaAdmin` |
| `GET` / `PUT` / `PATCH` | `/admin/workspaces/{route}/schema` | the `lambdaORM.yaml`; replaced; one element changed (`{ op, at, value?, to?, expected? }`) | `schemaRead` / `schemaWrite` |
| `POST` | `/admin/workspaces/{route}/references` | who uses an element | `schemaRead` |
| `POST` | `/admin/validate` | `{ text }` → `{ valid, issues }` | `schemaRead` |
| `GET` / `PUT` | `/admin/workspaces/{route}/variables` | the variables of the connections (never their value) / set or removed | `schemaRead` / `schemaAdmin` |
| `GET` / `PUT` / `POST` | `/admin/workbench`, `/admin/workbench/remove` | what is saved / saved / removed | `read` / `workbenchWrite` |
| `GET` | `/admin/workspaces/{route}/commands` | the stages and what may be run | `read` |
| `POST` | `/admin/workspaces/{route}/commands/{command}/preview` | what it will do | the command's |
| `POST` | `/admin/workspaces/{route}/commands/{command}` | runs it (`{ stage?, previewId?, force?, save? }`) → a job | the command's |
| `GET` | `/admin/workspaces/{route}/jobs[/{id}]` | the last jobs / one with its result | `read` |
| `POST` / `GET` | `/admin/workspaces/{route}/build`, `…/build.zip` | the code of the domain in `src/` / as a zip | `build` |
