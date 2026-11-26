# Segurança {#security}

Quem pode usar o gateway e o que cada um pode fazer é decidido na sua configuração, uma única vez, para todos os
transportes: uma **credencial** (uma chave, um token ou um usuário) tem um nome e uma lista de **permissões**; o gateway
as verifica antes que qualquer coisa chegue a um banco de dados, **audita** cada escrita com o nome da credencial e
impõe **limites** ao que uma requisição pode consumir. Esta página explica cada parte.

## Autenticação {#authentication}

O bloco `authentication` tem três níveis: global, por transporte (`transports.<t>.authentication`) e por esquema
(`orm.schemas[].authentication`). O mais específico substitui os demais (esquema → transporte → global). Ele é aplicado
pelo edge worker antes que qualquer coisa chegue ao esquema.

| `adapter` | Uma credencial (todas as permissões) | Várias credenciais com permissões | O cliente envia |
| --- | --- | --- | --- |
| `none` (padrão) | — | — | nada: uma credencial anônima com todas as permissões |
| `local`, `type: bearer` | `token` | `tokens: [{ name, value, permissions }]` | `Authorization: Bearer <token>` |
| `local`, `type: apikey` | `value` (e `header`, padrão `X-Api-Key`) | `keys: [{ name, value, permissions }]` | `<header>: <key>` |
| `local`, `type: basic` | `username`, `password` | `users: [{ username, password, permissions }]` | `Authorization: Basic <base64(user:password)>` |
| `jwt` (4.1.0) | — | os usuários de um provedor de identidade, seus papéis mapeados para permissões ([abaixo](#jwt)) | `Authorization: Bearer <JWT>` |
| `methods` (4.1.0) | — | vários dos anteriores, em ordem: tokens para os usuários, chaves para os serviços ([abaixo](#jwt)) | o que cada um recebe |

```yaml
authentication:
  adapter: local
  type: bearer
  tokens:
    - { name: reports, value: $REPORTS_TOKEN, permissions: [ read ] }
    - { name: backend, value: $BACKEND_TOKEN, permissions: [ read, write, script, queue, stageImport ] }
```

- Uma credencial `local` sem seu segredo (ou cuja `$VAR` não está definida) impede a inicialização. O acesso aberto é apenas
  `adapter: none`, escrito de propósito.
- Os segredos são comparados em tempo constante. O segredo nunca viaja até os workers dos esquemas: apenas o nome e as
  permissões da credencial.
- Sem credencial (ou com uma incorreta) a resposta é `401` (`{ "error": "Unauthorized", "message": … }`); os
  upgrades de WebSocket são recusados.
- `/ping`, `/health`, `/metrics`, `/version` (também sob cada esquema), `/schemas`, `/transports` e a documentação
  (`/openapi.json`, `/doc`, `/api-docs`) não precisam de credencial.
- Uma credencial sem `permissions` recebe as dos dados (`read`, `write`, `script`, `queue`, `stageImport`), nunca as da
  administração.
- Em `management` (a IDE) a credencial vai apenas no login, e toda requisição leva o token de uma
  [sessão](Transports.md#sessions): as sessões são listadas, terminam por inatividade e podem ser revogadas na hora.
- Nenhum transporte responde CORS: um navegador de outra origem não pode chamar o gateway; um backend próprio pode.

## Tokens de um provedor de identidade (JWT / OIDC) {#jwt}

Desde o data-gateway 4.1.0 (testado contra o Keycloak desde a 4.3.0: seus papéis, uma view por um claim e a rotação
da sua chave, nos cinco transportes). Os usuários trazem o token que seu provedor de identidade lhes dá (Keycloak, Auth0, Entra
ID, Cognito, Google…) e o gateway o verifica sem chamar o provedor a cada requisição:

```yaml
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop          # iss; suas chaves são descobertas a partir dele (OIDC)
      audience: data-gateway                                # aud
      # jwksUri: https://…/certs                            # se a descoberta não estiver disponível
      # algorithms: [ RS256, ES256 ]                        # padrão RS256, ES256, PS256
      # clockTolerance: 30s
      principal:
        name: preferred_username                            # o claim do nome (padrão sub)
        permissions:
          claim: realm_access.roles                         # uma lista, ou um texto separado por espaços (como scope)
          roles:
            reader: [ read ]
            support: { permissions: [ read ], view: support }  # um papel com sua view (abaixo)
            admin: [ read, write, script ]
      context:                                              # claim → variável do contexto do λORM
        tenant: tenant_id
        region: address.region
    - adapter: local                                        # os serviços mantêm suas chaves
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, permissions: [ read, write ] }
```

- **A assinatura** é verificada com as chaves públicas do emissor (seu JWKS, em cache; um token assinado com uma chave
  nova faz relê-las), depois o emissor, a audiência e os tempos. `secret: $JWT_SECRET` (HS256) em vez das chaves é para
  desenvolvimento e testes.
- **Quem é:** seu nome (`principal.name`), as permissões de seus papéis (um papel deve listá-las: um papel não listado
  não dá nada) e seu **contexto**: o que os [filtros de linhas das views](#views), os valores padrão e as condições do
  esquema leem (`context.tenant`). Um claim pode ser um caminho (`address.region`) ou um nome com pontos ou uma URL, como
  o Auth0 os nomeia (`https://example.com/roles`).
- **`methods`:** o primeiro que reconhece a credencial decide. Um JWT que falha é recusado como token, uma chave
  incorreta como chave; nenhum é tentado pelo outro.
- **Um token recusado diz por quê:** `401` com `the token is not valid: expired` (ou `issuer`, `audience`, `signature`,
  `algorithm`, `unknown key`, `not yet valid`) e `WWW-Authenticate: Bearer error="invalid_token"`. Um emissor que não
  pode ser alcançado é `503`, não `401`. O token nunca é escrito nos logs, na auditoria ou nos traces.
- **Nada sobrevive ao token:** uma sessão de `management` termina no seu `exp`; uma conexão WebSocket ou MCP WebSocket
  é fechada com o código `4401`.
- O [cliente Node](Clients.md) recebe o token como uma função, para renová-lo; a [IDE](../ide/Connections.md) o recebe
  como um Bearer token.

## A view de cada chamador {#views}

Desde o data-gateway 4.1.0. Uma [view](../schema/Views.md) do esquema decide o que do domínio é visto: suas entidades,
suas propriedades (mascaradas, ocultas ou calculadas) e suas linhas (um filtro com o contexto). **O gateway escolhe a
view de cada requisição**, nunca o cliente:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: billing, value: $BILLING_KEY, permissions: [ read ], view: billing }   # a view de uma chave
# ou a view de um papel de um token: roles: { support: { permissions: [ read ], view: support } }
orm:
  schemas:
    - path: shop
      view: public            # a de um chamador sem view; sem ela, default (o domínio inteiro)
```

- **Tudo está nessa view:** as consultas (o que ela mascara vem mascarado, o que ela exclui não existe, suas linhas são
  filtradas com o contexto do token), seus `metadata`, `model`, `parameters` e `constraints`, o domínio (`/schema`,
  `/domain`, `/entities`, `/typings`, a busca), as entidades dos mappings, as views listadas, o que o MCP diz a um agente
  e `/whoami` (`view`).
- **Uma `view` ou um `context` enviado por um cliente em `options` é descartado**, por todos os transportes: um cliente
  não pode pular o que sua view oculta nem ler as linhas de outro tenant.
- **Escolhida entre as dos seus papéis** (desde a 4.4.0, [abaixo](#roles)): o cliente pode pedir uma delas em
  `options.view`; outra é `403`. Antes da 4.4.0 o cliente nunca escolhia, e um token cujos papéis davam duas views era
  `403`. Uma view que o esquema não tem é avisada quando o esquema carrega e seus pedidos são `403`. Uma entidade que a
  view exclui é `403 ViewError`.
- Os comandos de stage (`import`, `export`, `push`…) veem o esquema inteiro: uma credencial com uma view e `stageImport`
  ou `ddl` é avisada quando a configuração é lida.

## Papéis: onde trabalham e o que podem fazer {#roles}

**Desde data-gateway 4.4.0.** Um papel diz **onde** pode trabalhar, as views e os stages do λORM que pode usar, e **o
que** pode fazer ali, suas permissões e seus limites. Os tokens nomeiam seus papéis pela sua claim; as chaves, por
`roles`:

```yaml
authorization:
  roles:
    support:
      views: [support]                 # a primeira, a de quem não escolhe; sem elas, a do esquema
      permissions: [read]
    analyst:
      views: [analytics, support]
      stages: [default, reporting]     # sem eles, o do esquema
      permissions: [read]
      maxRows: 5000                    # options.maxRows: o cliente pode pedir menos, nunca mais
    backend:
      permissions: [read, write]
    operator:
      stages: [default, staging]
      permissions: [read, ddl, destructive]
    admin:
      permissions: [read, schemaRead, roles]
      locked: true                     # não é estendido pela administração
  # stages: open                       # pode-se escolher um stage que nenhum papel nomeia, como antes da 4.4.0 (por uma versão)
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop
      principal:
        permissions: { claim: realm_access.roles }    # os nomes da claim são os de authorization.roles
    - adapter: local
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, roles: [backend] }
orm:
  schemas:
    - path: shop
      view: public                     # a view do esquema
      stage: default                   # o stage do esquema
      roles:                           # neste esquema, o que os papéis somam
        support: { views: [support, public] }
```

- **O cliente escolhe só entre eles:** `options.view` e `options.stage` de qualquer pedido, por qualquer transporte; um
  que seus papéis não permitem é `403`. Sem escolher, o primeiro dos seus papéis; se seus papéis não coincidem, o do
  esquema quando o permitem, senão `403` pedindo que escolha. Um agente por MCP não escolhe: os padrões dos seus papéis.
- **As permissões dos papéis que permitem o escolhido,** não a soma de todos: com `support` (lê, na view `support`) e
  `backend` (escreve, na view do esquema), um pedido em `support` só lê. Os comandos de um stage (`push`, `migrate`,
  `seed`, `export`, `import`…) só nos stages do seu papel; as permissões da administração, seja qual for o escolhido.
  `scope: any` em um papel mantém suas permissões seja qual for o escolhido.
- **`options.maxRows`** só menor que o do papel; **`allowDestructive`** já não é uma opção do cliente: um push ou uma
  migração que perde dados precisa da permissão `destructive` além de `ddl`.
- **`GET /whoami`** diz a view e o stage de quem chama sem escolher, todos os que pode escolher e seus papéis.
- **Os papéis de um esquema** (`orm.schemas[].roles`) e os [guardados no estado do gateway](Admin.md#since-4-4-0)
  estendem os de `authorization.roles`: mais views, stages ou permissões, nunca menos. Um papel do estado que o YAML não
  tem é um novo.
- O de antes continua valendo: `roles` dentro de um método `jwt` e `view` (uma) em um papel ou uma chave são lidos como
  papéis; uma chave com suas próprias `permissions` e `view` é um papel próprio.

## Permissões {#permissions}

| Permissão | Permite |
| --- | --- |
| `read` | o esquema, o domínio, plan, metadata, model, parameters, constraints, existência e exportação de stages, e `execute` **apenas quando todas as sentenças são `select`** |
| `write` | `execute` que grava (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): um script pode fazer qualquer coisa internamente, por isso é uma permissão própria |
| `queue` | `execute-queued` (e `write` se a consulta grava) |
| `stageImport` | importar um stage |
| `schemaRead`, `schemaWrite`, `schemaAdmin`, `workbenchWrite`, `ddl`, `build` | a [administração](Admin.md#turning-it-on): nunca dadas por padrão |
| `approve` | (4.3.0) aprovar ou recusar as [escritas que aguardam](#approvals), nunca as próprias: nunca é dada por padrão |
| `destructive` | (4.4.0) com `ddl`, um push ou uma migração que perde dados (`allowDestructive`): nunca é dada por padrão |
| `roles` | (4.4.0) ver e mudar os [papéis do estado do gateway](Admin.md#since-4-4-0): nunca é dada por padrão |
| `sessionAdmin` | listar todas as [sessões](Transports.md#sessions) de `management` e revogar as de outras credenciais (sem ela, uma credencial vê e fecha apenas as suas): nunca dada por padrão |

- A autorização acontece no worker do esquema, antes de executar qualquer coisa, igual para REST, MCP e WebSocket.
- Para saber se uma consulta grava, o gateway a analisa (seu `metadata`): com apenas `read`, uma consulta com qualquer
  sentença que não seja `select`, inclusive dentro de um `include`, é recusada.
- Sem a permissão: `403` no REST, `status: 403` no WebSocket, `isError: true` no MCP, com a mensagem
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` responde o nome e as permissões da credencial (sua view, 4.1.0; seu stage, o que pode escolher e seus
  papéis, 4.4.0), nunca seu segredo.

## Escritas que aguardam uma pessoa {#approvals}

**Desde o data-gateway 4.3.0.** Um agente pode propor mudanças sem fazê-las sozinho: sua escrita aguarda até uma pessoa
aprová-la.

```yaml
mcp:
  approval: writes
  approvalExpires: 1h
authentication:
  keys:
    - { name: agent, value: $AGENT_KEY, permissions: [ read, write ], approval: writes }
    - { name: ops,   value: $OPS_KEY,   permissions: [ read, approve ] }
```

- A escrita responde na hora `{ "approval": "…", "status": "pending", "expiresAt" }` (REST: `202`); nada mudou ainda.
  Um script sempre aguarda (pode escrever); uma escrita enfileirada não pode aguardar (`403`).
- Quem pediu vê o estado com a ferramenta MCP `approval_status`, `GET /{schema}/approvals/{id}` ou
  `approvals.status`: `pending`, `done` (com o resultado), `failed`, `rejected` (com o motivo) ou `expired`.
- Quem tem `approve` as lista com as sentenças que cada uma rodaria e as aprova ou recusa, na
  [administração](Admin.md#since-4-3-0) ou na [IDE](../ide/Connections.md#approvals); **nunca a própria**. Aprovada,
  roda uma vez como quem pediu (sua view, seu contexto) e fica auditada com `approvedBy`.
- Ficam no SQLite do volume (`.data-gateway/state.sqlite`), compartilhado pelas réplicas que o montam.

## Auditoria {#audit}

Toda operação que altera dados, ou pode alterar, deixa um registro de auditoria: uma linha JSON com `"type": "audit"` na saída
padrão, para que o coletor de logs (Loki, ELK, CloudWatch, …) possa separá-la.

| Operação | Auditada |
| --- | --- |
| `execute` | quando alguma sentença não é `select` |
| `executeScript` | sempre |
| `executeQueued` | sempre (quando enfileirada) |
| `stageImport` | sempre, também o comando `import` da [administração](Admin.md#the-commands) |
| `stagePush`, `stageDrop` | os comandos `push` e `drop` da administração |
| `stageMigrate`, `stageSeed` | os comandos `migrate` e `seed` da administração (4.1.0) |
| `login`, `logout`, `sessionExpired`, `sessionRevoked`, `loginRejected` | as [sessões](Transports.md#sessions) de `management`, com o id da sessão (nunca seu token), o endereço e quem a revogou |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- É gravada após a execução, inclusive quando ela falha (`"result": "error"` com a mensagem).
- Uma [consulta nomeada](Rest.md#named-queries) é auditada com seu `name` (4.1.0).
- Contém o nome da credencial, nunca seu segredo. Os parâmetros (`data`) são adicionados apenas com
  `audit.includeData: true`, porque podem conter dados pessoais. `audit.enabled: false` a desativa.

## Limites {#limits}

| Limite | Chave | Quando é atingido |
| --- | --- | --- |
| Requisições por janela (apenas `http`) | `rateLimit.windowMs`, `rateLimit.max` (`0` = desativado) | `429` |
| Operações simultâneas por esquema | `server.maxConcurrent` | `429` com `Retry-After` (MCP: `isError`; WebSocket: `status: 429`) |
| Tempo de uma operação | `server.timeout` | `504 TimeoutError`, a operação é abandonada |
| Tamanho de um corpo | `server.requestBodySize` | `413` |
| Tamanho de uma resposta | `server.maxResponseBytes` | `413`: use `.page(1, n)` ou agregue na consulta |
| Scripts | `scripts.maxLength`, `timeoutMs`, `maxIterations` | `413 ScriptTooLongError` (tamanho) ou um erro do script |
| Linhas de um resultado para o MCP | `mcp.maxRows` | cortado, com uma dica ([MCP](Mcp.md#results-and-errors)) |
| Linhas e tempo de uma [consulta nomeada](Rest.md#named-queries) (4.1.0) | `orm.schemas[].queries.<name>.maxRows` / `timeout` | `422 TooManyRowsError` / `504` |

## Erros {#errors}

Uma requisição que falha responde com um status que um cliente pode mapear e um corpo JSON:

```json
{
  "error": "ExecutionError",
  "code": "23505",
  "message": "ERROR: duplicate key value violates unique constraint \"device_types_pkey\" …"
}
```

| Campo | Significado |
| --- | --- |
| `error` | o nome do erro: `ExecutionError`, `ValidationError`, `ForbiddenError`, `ScriptDisabledError`, … |
| `code` | o código de erro do banco de dados, quando existe (SQLSTATE do Postgres como `23505`, `ER_DUP_ENTRY` do MySQL) |
| `message` | a mensagem |
| `suggestions` | para um nome da consulta que não existe, os mais próximos: `[{ "name": "nme", "didYouMean": ["name"] }]` |
| `details` | na administração, o necessário para continuar: os problemas de um esquema inválido, o que há agora após um conflito |

| Status | Causa |
| --- | --- |
| `400` | uma consulta ou um modelo inválido (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), uma violação de not null ou de check, dados inválidos (Postgres `22xxx`); um valor do contexto de que um filtro precisa e que a identidade não traz (`ContextError`, `details.variable`) |
| `401` | nenhuma credencial, ou uma incorreta (um token diz por quê: `expired`, `audience`…); em `management`, nenhuma sessão ou uma expirada ou revogada |
| `403` | a credencial não tem a permissão; scripts desabilitados; uma entidade que sua view exclui, ou uma escrita fora do filtro da sua view (`ViewError`, `details.view`, `details.entity`); um token com duas views |
| `404` | um nome que o esquema não tem (uma entidade, enum, source, mapping, stage), um esquema não exposto nesse transporte, uma rota desconhecida |
| `409` | uma violação de chave única ou estrangeira (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`); na administração, um workspace ocupado, um comando em execução ou sem sua pré-visualização, um `push` que pode perder dados sem `allowDestructive` (`DestructiveChangeError`, `details.changes`) |
| `412`, `428` | administração: alguém o alterou desde que foi lido; uma escrita sem a versão que altera |
| `413` | um corpo, uma resposta ou um script grande demais |
| `422` | administração: o esquema não seria válido (`details.issues`, cada um em sua linha); uma consulta entre sources com mais linhas do que pode trazer para a memória (`CrossSourceError`); uma consulta nomeada acima do seu `maxRows` (`TooManyRowsError`) |
| `429` | limite de taxa, ou operações simultâneas demais no esquema |
| `503` | o esquema não está `ready` (`SchemaUnavailableError`: iniciando, em erro, reiniciando); uma source que o gateway não alcança, ou cuja variável de conexão não está definida (`ConnectionError`); o emissor dos tokens não pode ser alcançado |
| `504` | a operação demorou mais que `server.timeout` (`TimeoutError`) |
| *n* | um script executou `throw { status: n, message }` (400–599) |
| `500` | qualquer outra coisa |
