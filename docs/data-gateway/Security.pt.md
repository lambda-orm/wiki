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

## Permissões {#permissions}

| Permissão | Permite |
| --- | --- |
| `read` | o esquema, o domínio, plan, metadata, model, parameters, constraints, existência e exportação de stages, e `execute` **apenas quando todas as sentenças são `select`** |
| `write` | `execute` que grava (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): um script pode fazer qualquer coisa internamente, por isso é uma permissão própria |
| `queue` | `execute-queued` (e `write` se a consulta grava) |
| `stageImport` | importar um stage |
| `schemaRead`, `schemaWrite`, `schemaAdmin`, `workbenchWrite`, `ddl`, `build` | a [administração](Admin.md#turning-it-on): nunca dadas por padrão |
| `sessionAdmin` | listar todas as [sessões](Transports.md#sessions) de `management` e revogar as de outras credenciais (sem ela, uma credencial vê e fecha apenas as suas): nunca dada por padrão |

- A autorização acontece no worker do esquema, antes de executar qualquer coisa, igual para REST, MCP e WebSocket.
- Para saber se uma consulta grava, o gateway a analisa (seu `metadata`): com apenas `read`, uma consulta com qualquer
  sentença que não seja `select`, inclusive dentro de um `include`, é recusada.
- Sem a permissão: `403` no REST, `status: 403` no WebSocket, `isError: true` no MCP, com a mensagem
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` responde o nome e as permissões da credencial, nunca seu segredo.

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
| `login`, `logout`, `sessionExpired`, `sessionRevoked`, `loginRejected` | as [sessões](Transports.md#sessions) de `management`, com o id da sessão (nunca seu token), o endereço e quem a revogou |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- É gravada após a execução, inclusive quando ela falha (`"result": "error"` com a mensagem).
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
| `400` | uma consulta ou um modelo inválido (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), uma violação de not null ou de check, dados inválidos (Postgres `22xxx`) |
| `401` | nenhuma credencial, ou uma incorreta; em `management`, nenhuma sessão ou uma expirada ou revogada |
| `403` | a credencial não tem a permissão; scripts desabilitados |
| `404` | um nome que o esquema não tem (uma entidade, enum, source, mapping, stage), um esquema não exposto nesse transporte, uma rota desconhecida |
| `409` | uma violação de chave única ou estrangeira (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`); na administração, um workspace ocupado, um comando em execução ou sem sua pré-visualização |
| `412`, `428` | administração: alguém o alterou desde que foi lido; uma escrita sem a versão que altera |
| `413` | um corpo, uma resposta ou um script grande demais |
| `422` | administração: o esquema não seria válido (`details.issues`, cada um em sua linha) |
| `429` | limite de taxa, ou operações simultâneas demais no esquema |
| `503` | o esquema não está `ready` (`SchemaUnavailableError`: iniciando, em erro, reiniciando); uma source que o gateway não alcança, ou cuja variável de conexão não está definida (`ConnectionError`) |
| `504` | a operação demorou mais que `server.timeout` (`TimeoutError`) |
| *n* | um script executou `throw { status: n, message }` (400–599) |
| `500` | qualquer outra coisa |
