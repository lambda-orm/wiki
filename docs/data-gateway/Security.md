# Security

## Authentication

The `authentication` block has three levels: global, per transport (`transports.<t>.authentication`) and per schema
(`orm.schemas[].authentication`). The most specific replaces the others (schema → transport → global). It is applied
by the edge worker before anything reaches the schema.

| `adapter` | One credential (every permission) | Several credentials with permissions | The client sends |
| --- | --- | --- | --- |
| `none` (default) | — | — | nothing: an anonymous credential with every permission |
| `local`, `type: bearer` | `token` | `tokens: [{ name, value, permissions }]` | `Authorization: Bearer <token>` |
| `local`, `type: apikey` | `value` (and `header`, default `X-Api-Key`) | `keys: [{ name, value, permissions }]` | `<header>: <key>` |
| `local`, `type: basic` | `username`, `password` | `users: [{ username, password, permissions }]` | `Authorization: Basic <base64(user:password)>` |

```yaml
authentication:
  adapter: local
  type: bearer
  tokens:
    - { name: reports, value: $REPORTS_TOKEN, permissions: [ read ] }
    - { name: backend, value: $BACKEND_TOKEN, permissions: [ read, write, script, queue, stageImport ] }
```

- A `local` credential without its secret (or whose `$VAR` is not defined) stops the start. Open access is only
  `adapter: none`, written on purpose.
- Secrets are compared in constant time. The secret never travels to the schema workers: only the name and the
  permissions of the credential.
- Without a credential (or with a wrong one) the answer is `401`; the WebSocket upgrades are refused.
- `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/doc` and the UI's files need no credential.

## Permissions

| Permission | Allows |
| --- | --- |
| `read` | the schema, the domain, plan, metadata, model, parameters, constraints, stage exists and export, and `execute` **only when every sentence is a `select`** |
| `write` | `execute` that writes (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): a script can do anything inside, so it is a permission of its own |
| `queue` | `execute-queued` (and `write` if the query writes) |
| `stageImport` | importing a stage |

- Authorization happens in the schema's worker, before running anything, the same for REST, MCP and WebSocket.
- To know whether a query writes, the gateway analyses it (its `metadata`): with only `read`, a query with any
  sentence that is not a `select`, also inside an `include`, is refused.
- Without the permission: `403` in REST, `status: 403` in WebSocket, `isError: true` in MCP, with the message
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` answers the name and permissions of the credential, never its secret.

## Audit

Every operation that changes data, or may, leaves an audit entry: a JSON line with `"type": "audit"` on the standard
output, so the log collector (Loki, ELK, CloudWatch, …) can keep it apart.

| Operation | Audited |
| --- | --- |
| `execute` | when some sentence is not a `select` |
| script | always |
| execute queued | always (when queued) |
| stage import | always |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- It is written after running, also when it fails (`"result": "error"` with the message).
- It has the credential's name, never its secret. The parameters (`data`) are added only with
  `audit.includeData: true`, because they can have personal data. `audit.enabled: false` turns it off.

## Limits

| Limit | Key | When it is reached |
| --- | --- | --- |
| Requests per window (`http` only) | `rateLimit.windowMs`, `rateLimit.max` (`0` = off) | `429` |
| Simultaneous operations per schema | `server.maxConcurrent` | `429` with `Retry-After` (MCP: `isError`; WebSocket: `status: 429`) |
| Time of an operation | `server.timeout` | error, the operation is abandoned |
| Size of a body | `server.requestBodySize` | `413` |
| Size of an answer | `server.maxResponseBytes` | `413`: use `.page(1, n)` or aggregate in the query |
| Scripts | `scripts.maxLength`, `timeoutMs`, `maxIterations` | `413` (length) or an error of the script |
| Rows of a result for MCP | `mcp.maxRows` | cut, with a hint ([MCP](Mcp.md#results-and-errors)) |

## Errors

A failed request answers a status a client can map and a JSON body:

```json
{
  "error": "ExecutionError",
  "code": "23505",
  "message": "ERROR: duplicate key value violates unique constraint \"device_types_pkey\" …"
}
```

| Field | Meaning |
| --- | --- |
| `error` | the name of the error: `ExecutionError`, `ValidationError`, `ForbiddenError`, `ScriptDisabledError`, … |
| `code` | the database's error code when there is one (Postgres SQLSTATE such as `23505`, MySQL `ER_DUP_ENTRY`) |
| `message` | the message |
| `suggestions` | for a name of the query that doesn't exist, the closest ones: `[{ "name": "nme", "didYouMean": ["name"] }]` |

| Status | Cause |
| --- | --- |
| `400` | an invalid query or model (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), a not null or check violation, invalid data (Postgres `22xxx`) |
| `401` | no credential, or a wrong one |
| `403` | the credential lacks the permission; scripts disabled |
| `404` | a name the schema doesn't have (an entity, enum, source, mapping, stage), a schema not exposed on that transport, an unknown route |
| `409` | a unique or foreign key violation (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`) |
| `413` | a body, an answer or a script too large |
| `429` | rate limit, or too many simultaneous operations on the schema |
| `503` | the schema is not `ready` (starting, in error, restarting); a source the gateway can't reach, or whose connection variable is not set (`ConnectionError`) |
| *n* | a script ran `throw { status: n, message }` (400–599) |
| `500` | anything else |
