# Security

Who can use the gateway and what each one can do is decided in its configuration, once, for every transport: a
**credential** (a key, a token or a user) has a name and a list of **permissions**; the gateway checks them before
anything reaches a database, **audits** every write with the name of the credential, and puts **limits** on what a
request can take. This page explains each part.

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
| `jwt` (4.1.0) | — | the users of an identity provider, their roles mapped to permissions ([below](#jwt)) | `Authorization: Bearer <JWT>` |
| `methods` (4.1.0) | — | several of the above, in order: tokens for the users, keys for the services ([below](#jwt)) | what each one takes |

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
- Without a credential (or with a wrong one) the answer is `401` (`{ "error": "Unauthorized", "message": … }`); the
  WebSocket upgrades are refused.
- `/ping`, `/health`, `/metrics`, `/version` (also under each schema), `/schemas`, `/transports` and the
  documentation (`/openapi.json`, `/doc`, `/api-docs`) need no credential.
- A credential without `permissions` gets those of the data (`read`, `write`, `script`, `queue`, `stageImport`), never
  those of the administration.
- On `management` (the IDE) the credential goes only in the login, and every request carries the token of a
  [session](Transports.md#sessions): sessions are listed, end on inactivity and can be revoked at once.
- No transport answers CORS: a browser of another origin can't call the gateway, a backend of its own does.

## Tokens of an identity provider (JWT / OIDC) {#jwt}

Since data-gateway 4.1.0. The users bring the token their identity provider gives them (Keycloak, Auth0, Entra ID,
Cognito, Google…) and the gateway checks it without calling the provider on every request:

```yaml
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop          # iss; its keys are discovered from it (OIDC)
      audience: data-gateway                                # aud
      # jwksUri: https://…/certs                            # if the discovery is not there
      # algorithms: [ RS256, ES256 ]                        # default RS256, ES256, PS256
      # clockTolerance: 30s
      principal:
        name: preferred_username                            # the claim of the name (default sub)
        permissions:
          claim: realm_access.roles                         # a list, or a text separated by spaces (as scope)
          roles:
            reader: [ read ]
            support: { permissions: [ read ], view: support }  # a role with its view (below)
            admin: [ read, write, script ]
      context:                                              # claim → variable of the context of λORM
        tenant: tenant_id
        region: address.region
    - adapter: local                                        # the services keep their keys
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, permissions: [ read, write ] }
```

- **The signature** is checked with the public keys of the issuer (its JWKS, cached; a token signed with a new key reads
  them again), then the issuer, the audience and the times. `secret: $JWT_SECRET` (HS256) instead of the keys is for
  development and tests.
- **Who it is:** its name (`principal.name`), the permissions of its roles (a role must list them: a role not listed
  gives nothing) and its **context**: what the [row filters of the views](#views), the defaults and the conditions of
  the schema read (`context.tenant`). A claim can be a path (`address.region`) or a name with dots or a URL, as Auth0
  names them (`https://example.com/roles`).
- **`methods`:** the first that recognizes the credential decides. A JWT that fails is refused as a token, a wrong key
  as a key; neither is tried by the other.
- **A refused token says why:** `401` with `the token is not valid: expired` (or `issuer`, `audience`, `signature`,
  `algorithm`, `unknown key`, `not yet valid`) and `WWW-Authenticate: Bearer error="invalid_token"`. An issuer that
  can't be reached is `503`, not `401`. The token is never written in the logs, the audit or the traces.
- **Nothing outlives the token:** a session of `management` ends at its `exp`; a WebSocket or MCP WebSocket connection
  is closed with the code `4401`.
- The [Node client](Clients.md) takes the token as a function, to refresh it; the [IDE](../ide/Connections.md) takes it
  as a Bearer token.

## The view of each caller {#views}

Since data-gateway 4.1.0. A [view](../schema/Views.md) of the schema decides what of the domain is seen: its entities,
its properties (masked, hidden or calculated) and its rows (a filter with the context). **The gateway chooses the view
of each request**, never the client:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: billing, value: $BILLING_KEY, permissions: [ read ], view: billing }   # the view of a key
# or the view of a role of a token: roles: { support: { permissions: [ read ], view: support } }
orm:
  schemas:
    - path: shop
      view: public            # the one of a caller without a view; without it, default (the whole domain)
```

- **Everything is in that view:** the queries (what it masks comes masked, what it excludes doesn't exist, its rows are
  filtered with the context of the token), their `metadata`, `model`, `parameters` and `constraints`, the domain
  (`/schema`, `/domain`, `/entities`, `/typings`, the search), the entities of the mappings, the views listed, what MCP
  tells an agent and `/whoami` (`view`).
- **A `view` or a `context` sent by a client in `options` is dropped**, by every transport: a client can't skip what
  its view hides nor read the rows of another tenant.
- **Never guessed:** a token whose roles give two views is `403`; a view the schema doesn't have is warned about when
  the schema loads and its requests are `403`. An entity the view excludes is `403 ViewError`.
- The commands of stage (`import`, `export`, `push`…) see the whole schema: a credential with a view and `stageImport`
  or `ddl` is warned about when the configuration is read.

## Permissions

| Permission | Allows |
| --- | --- |
| `read` | the schema, the domain, plan, metadata, model, parameters, constraints, stage exists and export, and `execute` **only when every sentence is a `select`** |
| `write` | `execute` that writes (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): a script can do anything inside, so it is a permission of its own |
| `queue` | `execute-queued` (and `write` if the query writes) |
| `stageImport` | importing a stage |
| `schemaRead`, `schemaWrite`, `schemaAdmin`, `workbenchWrite`, `ddl`, `build` | the [administration](Admin.md#turning-it-on): never given by default |
| `sessionAdmin` | list every [session](Transports.md#sessions) of `management` and revoke those of other credentials (without it, a credential sees and closes only its own): never given by default |

- Authorization happens in the schema's worker, before running anything, the same for REST, MCP and WebSocket.
- To know whether a query writes, the gateway analyses it (its `metadata`): with only `read`, a query with any
  sentence that is not a `select`, also inside an `include`, is refused.
- Without the permission: `403` in REST, `status: 403` in WebSocket, `isError: true` in MCP, with the message
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` answers the name and permissions of the credential (and its view, 4.1.0), never its secret.

## Audit

Every operation that changes data, or may, leaves an audit entry: a JSON line with `"type": "audit"` on the standard
output, so the log collector (Loki, ELK, CloudWatch, …) can keep it apart.

| Operation | Audited |
| --- | --- |
| `execute` | when some sentence is not a `select` |
| `executeScript` | always |
| `executeQueued` | always (when queued) |
| `stageImport` | always, also the `import` command of the [administration](Admin.md#the-commands) |
| `stagePush`, `stageDrop` | the `push` and `drop` commands of the administration |
| `stageMigrate`, `stageSeed` | the `migrate` and `seed` commands of the administration (4.1.0) |
| `login`, `logout`, `sessionExpired`, `sessionRevoked`, `loginRejected` | the [sessions](Transports.md#sessions) of `management`, with the id of the session (never its token), the address and who revoked it |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- It is written after running, also when it fails (`"result": "error"` with the message).
- A [named query](Rest.md#named-queries) is audited with its `name` (4.1.0).
- It has the credential's name, never its secret. The parameters (`data`) are added only with
  `audit.includeData: true`, because they can have personal data. `audit.enabled: false` turns it off.

## Limits

| Limit | Key | When it is reached |
| --- | --- | --- |
| Requests per window (`http` only) | `rateLimit.windowMs`, `rateLimit.max` (`0` = off) | `429` |
| Simultaneous operations per schema | `server.maxConcurrent` | `429` with `Retry-After` (MCP: `isError`; WebSocket: `status: 429`) |
| Time of an operation | `server.timeout` | `504 TimeoutError`, the operation is abandoned |
| Size of a body | `server.requestBodySize` | `413` |
| Size of an answer | `server.maxResponseBytes` | `413`: use `.page(1, n)` or aggregate in the query |
| Scripts | `scripts.maxLength`, `timeoutMs`, `maxIterations` | `413 ScriptTooLongError` (length) or an error of the script |
| Rows of a result for MCP | `mcp.maxRows` | cut, with a hint ([MCP](Mcp.md#results-and-errors)) |
| Rows and time of a [named query](Rest.md#named-queries) (4.1.0) | `orm.schemas[].queries.<name>.maxRows` / `timeout` | `422 TooManyRowsError` / `504` |

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
| `details` | in the administration, what is needed to go on: the issues of an invalid schema, what there is now after a conflict |

| Status | Cause |
| --- | --- |
| `400` | an invalid query or model (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), a not null or check violation, invalid data (Postgres `22xxx`); a value of the context a filter needs and the identity doesn't bring (`ContextError`, `details.variable`) |
| `401` | no credential, or a wrong one (a token says why: `expired`, `audience`…); on `management`, no session or an expired or revoked one |
| `403` | the credential lacks the permission; scripts disabled; an entity its view excludes, or a write out of the filter of its view (`ViewError`, `details.view`, `details.entity`); a token with two views |
| `404` | a name the schema doesn't have (an entity, enum, source, mapping, stage), a schema not exposed on that transport, an unknown route |
| `409` | a unique or foreign key violation (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`); in the administration, a workspace busy, a command running or without its preview, a `push` that can lose data without `allowDestructive` (`DestructiveChangeError`, `details.changes`) |
| `412`, `428` | administration: someone changed it since it was read; a write without the version it changes |
| `413` | a body, an answer or a script too large |
| `422` | administration: the schema would not be valid (`details.issues`, each at its line); a query across sources with more rows than it can bring to memory (`CrossSourceError`); a named query over its `maxRows` (`TooManyRowsError`) |
| `429` | rate limit, or too many simultaneous operations on the schema |
| `503` | the schema is not `ready` (`SchemaUnavailableError`: starting, in error, restarting); a source the gateway can't reach, or whose connection variable is not set (`ConnectionError`); the issuer of the tokens can't be reached |
| `504` | the operation took longer than `server.timeout` (`TimeoutError`) |
| *n* | a script ran `throw { status: n, message }` (400–599) |
| `500` | anything else |
