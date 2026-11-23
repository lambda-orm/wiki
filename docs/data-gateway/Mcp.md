# MCP

The gateway is a [Model Context Protocol](https://modelcontextprotocol.io) server, so AI agents (Claude Code and any
MCP client) can explore the domain and query the data with λORM's language. There is **one MCP server per schema**
(`/iot/v1/mcp`): its tools describe that schema's domain, and each version is registered as a separate server in the
client (`iot-v1`, `iot-v2`).

```sh
claude mcp add --transport http iot-v1 http://localhost:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

With a single schema at the root: `http://localhost:8081/mcp`.

## Tools

One tool per operation of the schema, **writes included**: an agent can do what an application does, **if its
credential allows it**. The descriptions and input schemas are generated when the schema starts and carry its domain
(entities, properties, relations, enums), so the model knows what to query without a previous call.

| Tool | Arguments | REST equivalent | Permission | Hint |
| --- | --- | --- | --- | --- |
| `orm_execute` | `query`, `data?`, `options?` | `POST /execute` | `read` (selects) or `write` | read only with `read`; destructive with `write` |
| `orm_execute_script` | `script`, `data?`, `options?` | `POST /script` | `script` | destructive |
| `orm_execute_queued` | `topic`, `query`, `data?`, `chunk?`, `options?` | `POST /execute-queued` | `queue` | destructive |
| `orm_plan` | `query`, `options?` | `POST /plan` | `read` | read only |
| `orm_metadata` | `query` | `POST /metadata` | `read` | read only |
| `orm_model` | `query` | `POST /model` | `read` | read only |
| `orm_parameters` | `query` | `POST /parameters` | `read` | read only |
| `orm_constraints` | `query` | `POST /constraints` | `read` | read only |
| `schema_get` | — | `GET /schema` | `read` | read only |
| `schema_version` | — | `GET /schema/version` | `read` | read only |
| `schema_domain` | — | `GET /domain` | `read` | read only |
| `schema_entities` | `entity?` | `GET /entities[/{entity}]` | `read` | read only |
| `schema_enums` | `enum?` | `GET /enums[/{enum}]` | `read` | read only |
| `schema_sources` | `source?` | `GET /sources[/{source}]` | `read` | read only |
| `schema_mappings` | `mapping?`, `entity?` | `GET /mappings…` | `read` | read only |
| `schema_views` | — | `GET /views` | `read` | read only |
| `schema_stages` | `stage?` | `GET /stages[/{stage}]` | `read` | read only |
| `schema_search` | `text` | `GET /search?q=` | `read` | read only |
| `schema_describe` | `entities` | `GET /describe?entities=` | `read` | read only |
| `stage_exists` | `stage` | `GET /stages/{stage}/exists` | `read` | read only |
| `stage_export` | `stage` | `GET /stages/{stage}/export` | `read` | read only |
| `stage_import` | `stage`, `data` | `POST /stages/{stage}/import` | `stageImport` | destructive |
| `gateway_version` | — | `GET /version` | `read` | read only |
| `gateway_health` | — | `GET /health` | `read` | read only |
| `admin_schema_get` | — | `GET /admin/workspaces/{route}/schema` | `schemaRead` | read only |
| `admin_schema_validate` | `text` | `POST /admin/validate` | `schemaRead` | read only |
| `admin_stage_fetch` | `stage?` | `fetch` | `schemaRead` | read only |

The `admin_*` tools exist only when the `management` transport is exposed ([Administration](Admin.md#over-mcp)); writing is not offered over MCP.

- **`tools/list` shows a credential only the tools it can use.** Without `script`, `orm_execute_script` doesn't
  appear; with only `read`, `orm_execute` is described as "read-only queries with this credential".
- The hints (`readOnlyHint`, `destructiveHint`) don't block anything: they tell the client which tools change data,
  so it can ask for confirmation. What blocks is the [permissions](Security.md#permissions).
- The same rules as REST: `orm_execute_script` fails if scripts are disabled; `orm_execute_queued`, if the schema has
  no queue.
- `mcp.tools.include` / `exclude` (global or per schema) restrict the list further, for example
  `exclude: [ orm_execute_script, stage_import ]`.

### Large schemas

When the domain doesn't fit in the description of `orm_execute` (Ilusor's Cloud: 192 entities, 389 KB as JSON), the
description gives the names of the entities and points to two tools, so the model reads only what it needs:

- `schema_search { text }`: the entities, properties and relations whose name contains the text, one line each
  (`Products.cat` → `Products.categoryId: integer`, `Products.category → Categories`); with no match, the closest
  names (`Prodcts` → `products`, `Products`, `product`).
- `schema_describe { entities }`: up to 30 entities in two lines each, their properties and their relations; a name
  it doesn't know comes in `notFound` with the closest ones.

## Results and errors

- A result is `{ content: [{ type: "text", text: <JSON> }] }`, with `structuredContent` too when it is small.
- **Row limit (`mcp.maxRows`, default 500).** When `orm_execute` or `orm_execute_script` answer a longer list, it is
  cut and the model is told how to ask for less:

  ```json
  { "rows": [ "…500 rows…" ], "truncated": true, "returned": 500, "total": 18234,
    "hint": "The result was cut to 500 rows. Use .page(1, 500) (or a smaller page), aggregate with map/count, or filter the query more." }
  ```

  It applies only to MCP and after the query ran: it protects the model's context. The database is protected by
  `server.maxResponseBytes` and `server.timeout`.
- An error of λORM (syntax, an unknown entity, a constraint, a disabled script) or a missing permission answers
  `isError: true` with the message, so the model can read it and correct the query.
- The error also comes in `structuredContent`: `{ error, status, code?, message, suggestions? }`, the status and the
  database code REST would answer, and for a name that doesn't exist the closest ones.

## Resources

| URI | Content |
| --- | --- |
| `lambdaorm://guide/expressions` | a short guide of the query language (Markdown), to give the model context |
| `lambdaorm://schema/domain` | the whole domain of the schema, JSON |
| `lambdaorm://entities/{entity}` | one entity (template) |

## What an agent can do

There is no read-only mode of the transport: what an agent can do is decided by **its credential's permissions**. An
agent that only queries gets a credential with `[ read ]`: it can run selects but not write, run scripts, queue or
import, by any transport. Besides: `schemas[].transports` to keep a schema out of MCP, `mcp.tools.exclude`, the hints,
and the permissions of the database user (the guarantee underneath). Every write an agent makes is
[audited](Security.md#audit) with the name of its credential and `"transport": "mcpHttp"`.

## Transports

### mcpHttp

| Route | Protocol |
| --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP: Claude Code `--transport http` and current clients |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (deprecated), with `legacySse: true` |
| `GET {basePath}/status` | the state of the transport, the schemas and the open SSE sessions |

Streamable HTTP is stateless by default (`stateful: false`): each `POST` stands alone and any replica answers it. The
credential goes in every request.

### mcpWebSocket

An upgrade at `{basePath}/{schema}/mcp`, authenticated in the handshake; JSON-RPC 2.0 messages with the MCP methods
(`initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, …). It is not a standard MCP
transport: it is offered for clients and gateways that support it on their own. Its AsyncAPI document is at
`GET {basePath}/asyncapi`.

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "orm_execute", "arguments": { "query": "Products.filter(p => p.price > 50).map(p => p.name)" } } }
← { "jsonrpc": "2.0", "id": 1, "result": { "content": [ { "type": "text", "text": "[\"Côte de Blaye\", \"Thüringer Rostbratwurst\"]" } ] } }
```
