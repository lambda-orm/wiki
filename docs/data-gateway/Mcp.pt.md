# MCP {#mcp}

O gateway é um servidor [Model Context Protocol](https://modelcontextprotocol.io), de modo que agentes de IA (Claude Code e qualquer
cliente MCP) podem explorar o domínio e consultar os dados com a linguagem do λORM. Há **um servidor MCP por esquema**
(`/iot/v1/mcp`): suas ferramentas descrevem o domínio desse esquema, e cada versão é registrada como um servidor separado no
cliente (`iot-v1`, `iot-v2`).

```sh
claude mcp add --transport http iot-v1 http://localhost:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

Com um único esquema na raiz: `http://localhost:8081/mcp`.

## Ferramentas {#tools}

Uma ferramenta por operação do esquema, **escritas incluídas**: um agente pode fazer o que uma aplicação faz, **se sua
credencial permitir**. As descrições e os esquemas de entrada são gerados quando o esquema inicia e trazem seu domínio
(entidades, propriedades, relações, enums), de modo que o modelo sabe o que consultar sem uma chamada prévia.

| Ferramenta | Argumentos | Equivalente REST | Permissão | Dica |
| --- | --- | --- | --- | --- |
| `orm_execute` | `query`, `data?`, `options?` | `POST /execute` | `read` (selects) ou `write` | somente leitura com `read`; destrutiva com `write` |
| `orm_execute_script` | `script`, `data?`, `options?` | `POST /script` | `script` | destrutiva |
| `orm_execute_queued` | `topic`, `query`, `data?`, `chunk?`, `options?` | `POST /execute-queued` | `queue` | destrutiva |
| `orm_plan` | `query`, `options?` | `POST /plan` | `read` | somente leitura |
| `orm_metadata` | `query` | `POST /metadata` | `read` | somente leitura |
| `orm_model` | `query` | `POST /model` | `read` | somente leitura |
| `orm_parameters` | `query` | `POST /parameters` | `read` | somente leitura |
| `orm_constraints` | `query` | `POST /constraints` | `read` | somente leitura |
| `schema_get` | — | `GET /schema` | `read` | somente leitura |
| `schema_version` | — | `GET /schema/version` | `read` | somente leitura |
| `schema_domain` | — | `GET /domain` | `read` | somente leitura |
| `schema_entities` | `entity?` | `GET /entities[/{entity}]` | `read` | somente leitura |
| `schema_enums` | `enum?` | `GET /enums[/{enum}]` | `read` | somente leitura |
| `schema_sources` | `source?` | `GET /sources[/{source}]` | `read` | somente leitura |
| `schema_mappings` | `mapping?`, `entity?` | `GET /mappings…` | `read` | somente leitura |
| `schema_views` | — | `GET /views` | `read` | somente leitura |
| `schema_stages` | `stage?` | `GET /stages[/{stage}]` | `read` | somente leitura |
| `stage_exists` | `stage` | `GET /stages/{stage}/exists` | `read` | somente leitura |
| `stage_export` | `stage` | `GET /stages/{stage}/export` | `read` | somente leitura |
| `stage_import` | `stage`, `data` | `POST /stages/{stage}/import` | `stageImport` | destrutiva |
| `gateway_version` | — | `GET /version` | `read` | somente leitura |
| `gateway_health` | — | `GET /health` | `read` | somente leitura |

- **`tools/list` mostra a uma credencial apenas as ferramentas que ela pode usar.** Sem `script`, `orm_execute_script` não
  aparece; com apenas `read`, `orm_execute` é descrita como "consultas somente leitura com esta credencial".
- As dicas (`readOnlyHint`, `destructiveHint`) não bloqueiam nada: elas informam ao cliente quais ferramentas alteram dados,
  para que ele possa pedir confirmação. O que bloqueia são as [permissões](Security.md#permissions).
- As mesmas regras do REST: `orm_execute_script` falha se os scripts estiverem desabilitados; `orm_execute_queued`, se o esquema não tiver
  fila.
- `mcp.tools.include` / `exclude` (global ou por esquema) restringem ainda mais a lista, por exemplo
  `exclude: [ orm_execute_script, stage_import ]`.

## Resultados e erros {#results-and-errors}

- Um resultado é `{ content: [{ type: "text", text: <JSON> }] }`, também com `structuredContent` quando é pequeno.
- **Limite de linhas (`mcp.maxRows`, padrão 500).** Quando `orm_execute` ou `orm_execute_script` respondem com uma lista maior, ela é
  cortada e o modelo é informado sobre como pedir menos:

  ```json
  { "rows": [ "…500 rows…" ], "truncated": true, "returned": 500, "total": 18234,
    "hint": "The result was cut to 500 rows. Use .page(1, 500) (or a smaller page), aggregate with map/count, or filter the query more." }
  ```

  Ele se aplica apenas ao MCP e depois que a consulta foi executada: protege o contexto do modelo. O banco de dados é protegido por
  `server.maxResponseBytes` e `server.timeout`.
- Um erro do λORM (sintaxe, uma entidade desconhecida, uma restrição, um script desabilitado) ou uma permissão ausente responde
  `isError: true` com a mensagem, para que o modelo possa lê-la e corrigir a consulta.

## Recursos {#resources}

| URI | Conteúdo |
| --- | --- |
| `lambdaorm://guide/expressions` | um guia curto da linguagem de consulta (Markdown), para dar contexto ao modelo |
| `lambdaorm://schema/domain` | o domínio inteiro do esquema, em JSON |
| `lambdaorm://entities/{entity}` | uma entidade (template) |

## O que um agente pode fazer {#what-an-agent-can-do}

Não existe um modo somente leitura do transporte: o que um agente pode fazer é decidido pelas **permissões de sua credencial**. Um
agente que apenas consulta recebe uma credencial com `[ read ]`: pode executar selects, mas não gravar, executar scripts, enfileirar nem
importar, por nenhum transporte. Além disso: `schemas[].transports` para deixar um esquema fora do MCP, `mcp.tools.exclude`, as dicas
e as permissões do usuário do banco de dados (a garantia de base). Toda escrita feita por um agente é
[auditada](Security.md#audit) com o nome de sua credencial e `"transport": "mcpHttp"`.

## Transportes {#transports}

### mcpHttp {#mcphttp}

| Rota | Protocolo |
| --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP: Claude Code `--transport http` e clientes atuais |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (obsoleto), com `legacySse: true` |
| `GET {basePath}/status` | o estado do transporte, dos esquemas e das sessões SSE abertas |

O Streamable HTTP é sem estado por padrão (`stateful: false`): cada `POST` é independente e qualquer réplica o responde. A
credencial vai em cada requisição.

### mcpWebSocket {#mcpwebsocket}

Um upgrade em `{basePath}/{schema}/mcp`, autenticado no handshake; mensagens JSON-RPC 2.0 com os métodos do MCP
(`initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, …). Não é um transporte MCP
padrão: é oferecido para clientes e gateways que o suportam por conta própria. Seu documento AsyncAPI está em
`GET {basePath}/asyncapi`.

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "orm_execute", "arguments": { "query": "Products.filter(p => p.price > 50).map(p => p.name)" } } }
← { "jsonrpc": "2.0", "id": 1, "result": { "content": [ { "type": "text", "text": "[\"Côte de Blaye\", \"Thüringer Rostbratwurst\"]" } ] } }
```
