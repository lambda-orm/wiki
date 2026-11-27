# Security

Who can use the gateway and what each one can do is decided in its configuration, once, for every transport: a
**credential** (a key, a token or a user) has a name and the **roles** it has, and a role says what it may do and
where: its **permissions**, its schemas, views and stages. The gateway checks them before anything reaches a database,
**audits** every write with the name of the credential, and puts **limits** on what a request can take. This page
explains each part.

!!! warning "data-gateway 5.0.0: only roles"
    Since 5.0.0 what a credential may do is said **only by its roles** (`authorization.roles`). A key, a token or a
    user names its `roles` (required) and may say its `context`; with its own `permissions`, `view` or `approval`, or a
    method `jwt` with its own `roles`, or `orm.schemas[].roles`, the gateway doesn't start, and the error says where
    each one goes. To move a configuration of 4.x: [below](#from-4x).

## Authentication

The `authentication` block has three levels: global, per transport (`transports.<t>.authentication`) and per schema
(`orm.schemas[].authentication`). The most specific replaces the others (schema → transport → global). It is applied
by the edge worker before anything reaches the schema.

| `adapter` | One credential (every permission) | Several credentials with permissions | The client sends |
| --- | --- | --- | --- |
| `none` (default) | — | — | nothing: an anonymous credential with every permission |
| `local`, `type: bearer` | `token` and its `roles` | `tokens: [{ name, value, roles, context }]` | `Authorization: Bearer <token>` |
| `local`, `type: apikey` | `value` and its `roles` (and `header`, default `X-Api-Key`) | `keys: [{ name, value, roles, context }]` | `<header>: <key>` |
| `local`, `type: basic` | `username`, `password` and its `roles` | `users: [{ username, password, roles, context }]` | `Authorization: Basic <base64(user:password)>` |
| `jwt` (4.1.0) | — | the users of an identity provider, with the roles of a claim of their token ([below](#jwt)) | `Authorization: Bearer <JWT>` |
| `methods` (4.1.0) | — | several of the above, in order: tokens for the users, keys for the services ([below](#jwt)) | what each one takes |

```yaml
authorization:
  roles:
    reader:  { permissions: [ read ] }
    backend: { permissions: [ read, write, script, queue, stageImport ] }
authentication:
  adapter: local
  type: bearer
  tokens:
    - { name: reports, value: $REPORTS_TOKEN, roles: [ reader ] }
    - { name: backend, value: $BACKEND_TOKEN, roles: [ backend ] }
```

- A `local` credential without its secret (or whose `$VAR` is not defined) stops the start. Open access is only
  `adapter: none`, written on purpose.
- Secrets are compared in constant time. The secret never travels to the schema workers: only the name and the
  permissions of the credential.
- Without a credential (or with a wrong one) the answer is `401` (`{ "error": "Unauthorized", "message": … }`); the
  WebSocket upgrades are refused.
- `/ping`, `/health`, `/metrics`, `/version` (also under each schema), `/schemas`, `/transports` and the
  documentation (`/openapi.json`, `/doc`, `/api-docs`) need no credential.
- A local credential without `roles` (an empty list, or none) stops the start; a role it names that
  `authorization.roles` doesn't have is warned about (it may come from the [state of the gateway](Admin.md#roles)).
- `adapter: none` is the only credential with every permission: the anonymous one.
- On `management` (the IDE) the credential goes only in the login, and every request carries the token of a
  [session](Transports.md#sessions): sessions are listed, end on inactivity and can be revoked at once.
- No transport answers CORS: a browser of another origin can't call the gateway, a backend of its own does.

## Tokens of an identity provider (JWT / OIDC) {#jwt}

Since data-gateway 4.1.0 (tested against Keycloak since 4.3.0: its roles, a view by a claim and the rotation of its
key, on the five transports). The users bring the token their identity provider gives them (Keycloak, Auth0, Entra ID,
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
      context:                                              # claim → variable of the context of λORM
        tenant: tenant_id
        region: address.region
    - adapter: local                                        # the services keep their keys
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, roles: [ admin ] }
authorization:
  roles:                                                    # the names of the claim are these roles
    reader:  { permissions: [ read ] }
    support: { permissions: [ read ], views: [ support ] }  # a role with its view (below)
    admin:   { permissions: [ read, write, script ] }
```

- **The signature** is checked with the public keys of the issuer (its JWKS, cached; a token signed with a new key reads
  them again), then the issuer, the audience and the times. `secret: $JWT_SECRET` (HS256) instead of the keys is for
  development and tests.
- **Who it is:** its name (`principal.name`), its roles (the names of the claim that `authorization.roles` has: one it
  doesn't have gives nothing) and its **context**: what the [row filters of the views](#views), the defaults and the conditions of
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
authorization:
  roles:
    billing: { permissions: [ read ], views: [ billing ] }     # the view of a role, for a key or a token
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: billing, value: $BILLING_KEY, roles: [ billing ] }
orm:
  schemas:
    - path: shop
      view: public            # the one of a caller without a view; without it, default (the whole domain)
```

- **Everything is in that view:** the queries (what it masks comes masked, what it excludes doesn't exist, its rows are
  filtered with the context of the token), their `metadata`, `model`, `parameters` and `constraints`, the domain
  (`/schema`, `/domain`, `/entities`, `/typings`, the search), the entities of the mappings, the views listed, what MCP
  tells an agent and `/whoami` (`view`).
- **A `context` sent by a client in `options` is dropped**, by every transport: a client can't read the rows of another
  tenant; the context comes from the token (its claims) or from the [key](#context).
- **Chosen among those of its roles** (since 4.4.0, [below](#roles)): the client may ask for one of them in
  `options.view`; another is `403`. Before 4.4.0 the client never chose, and a token whose roles gave two views was
  `403`. A view the schema doesn't have is warned about when the schema loads and its requests are `403`. An entity
  the view excludes is `403 ViewError`.
- The commands of stage (`import`, `export`, `push`…) see the whole schema: a credential with a view and `stageImport`
  or `ddl` is warned about when the configuration is read.

## Roles: where they work and what they may do {#roles}

**Since data-gateway 4.4.0; since 5.0.0 the only way.** A role is of the gateway: it says **where** it may work, its
schemas and in each one the views and the stages of λORM it may use, and **what** it may do there, its permissions and
their limits. The tokens name their roles by their claim, the keys, tokens and users by `roles`:

```yaml
authorization:
  roles:
    support:
      schemas:                         # where it applies (their paths); none, every schema
        shop: { views: [support, public], view: public, stages: [default, reporting], stage: default }
        sales: {}                      # the views and stages below (or those of the schema)
      views: [support]                 # in its schemas, unless one says its own; the first, the one of who doesn't choose
      permissions: [read]
    analyst:
      views: [analytics, support]
      stages: [default, reporting]     # none, the one of the schema
      permissions: [read]
      maxRows: 5000                    # options.maxRows: the client may ask for fewer, never more
    backend:
      permissions: [read, write]       # no views: the one of the schema
    agent:
      permissions: [read, write]
      approval: writes                 # its writes wait for a person (below)
    operator:
      stages: [default, staging]
      permissions: [read, ddl, destructive]
    admin:
      permissions: [read, schemaRead, roles]
      locked: true                     # not extended from the administration
  # stages: open                       # a stage no role names may be chosen, as before 4.4.0 (for one version)
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop
      principal:
        permissions: { claim: realm_access.roles }    # the names of the claim are those of authorization.roles
    - adapter: local
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, roles: [backend] }
orm:
  schemas:
    - path: shop
      view: public                     # the view of the schema
      stage: default                   # the stage of the schema
```

- **A role of the gateway (5.0.0):** in a schema its `schemas` don't name it gives nothing. By schema it may say the views
  and stages it uses there and the defaults of who doesn't choose (`view`, `stage`, which must be among its `views` and
  `stages`); they replace those of the role in that schema. A role that needs other permissions or views in another
  schema is another role. `GET /admin/scopes` (permission `roles`) tells the views and stages of each schema served.
- **The client chooses only among them:** `options.view` and `options.stage` of any request, by every transport; one
  its roles don't allow is `403`. Without choosing, the first of its roles; if its roles disagree, the one of the
  schema when they allow it, else `403` asking to choose. An agent by MCP doesn't choose: the defaults of its roles.
- **The permissions of the roles that allow what was chosen,** not the sum of all of them: with `support` (reads, in
  the view `support`) and `backend` (writes, in the view of the schema), a request in `support` only reads. The
  commands of a stage (`push`, `migrate`, `seed`, `export`, `import`…) only in the stages of their role; the permissions
  of the administration, whatever was chosen. `scope: any` in a role keeps its permissions whatever was chosen.
- **`options.maxRows`** only lower than the role's; **`allowDestructive`** is no longer an option of the client: a push
  or a migration that loses data needs the permission `destructive` besides `ddl`.
- **`GET /whoami`** says the view and the stage of who calls without choosing, every one it may choose and its roles;
  **`GET /admin/me`** (5.0.0, of `management`, any credential about itself) its name, its context and each of its roles
  as it applies: permissions, schemas, views and stages.
- **The roles [kept in the state of the gateway](Admin.md#roles)** extend those of `authorization.roles`: more
  schemas, views, stages or permissions, never less. A role of the state the YAML doesn't have is a new one.

### The context of a key {#context}

**Since data-gateway 5.0.0.** A key, a token or a user of a `local` method may say its `context`: the context of λORM
of its requests, as a [token](#jwt) gives it from its claims. It is what the row filters of the views, the defaults and
the `writeValue` of the schema read:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: ana, value: $ANA_KEY, roles: [editor], context: { username: ana@acme.com, region: south } }
```

- Each variable is a text, a number or a boolean: who the key is, never a secret. Without it, the key has no context.
- A schema with `default: context.username` (an abstract `Audited` with `createdBy`, say) fills it with the user of
  the key; a client can't replace it (its `options.context` is dropped). It reaches a session opened with the key too.

### From 4.x {#from-4x}

| 4.x | 5.0.0 |
| --- | --- |
| a key with `permissions: [read, write]` | a role `authorization.roles.backend: { permissions: [read, write] }` and the key with `roles: [backend]` |
| a key with `view: billing` | `views: [billing]` in its role |
| a key with `approval: writes` | `approval: writes` in its role |
| `roles` inside a method `jwt` | the same roles in `authorization.roles`; the method keeps only `principal.permissions.claim` |
| `orm.schemas[].roles` | in `authorization.roles`, with `schemas: [<path>]` (or `schemas: { <path>: { views, stages } }`) |
| a role kept for a schema from the administration | listed as ignored: removed (`DELETE /admin/roles/{name}?schema=`) and added again with its `schemas` |

## Permissions

| Permission | Allows |
| --- | --- |
| `read` | the schema, the domain, plan, metadata, model, parameters, constraints, stage exists and export, and `execute` **only when every sentence is a `select`** |
| `write` | `execute` that writes (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): a script can do anything inside, so it is a permission of its own |
| `queue` | `execute-queued` (and `write` if the query writes) |
| `stageImport` | importing a stage |
| `schemaRead`, `schemaWrite`, `schemaAdmin`, `workbenchWrite`, `ddl`, `build` | the [administration](Admin.md#turning-it-on): never given by default |
| `approve` | (4.3.0) approve or reject the [writes that wait](#approvals), never its own: never given by default |
| `destructive` | (4.4.0) with `ddl`, a push or a migration that loses data (`allowDestructive`): never given by default |
| `roles` | (4.4.0) see and change the [roles of the state of the gateway](Admin.md#roles), and see who may come in (`/admin/access`, 5.0.0): never given by default |
| `observability` | (5.0.0) see and change the [observability](Admin.md#observability) from the administration: never given by default |
| `persist` | (5.0.0) see and change [where the state is kept](Admin.md#persist): never given by default |
| `sessionAdmin` | list every [session](Transports.md#sessions) of `management` and revoke those of other credentials (without it, a credential sees and closes only its own): never given by default |

- Authorization happens in the schema's worker, before running anything, the same for REST, MCP and WebSocket.
- To know whether a query writes, the gateway analyses it (its `metadata`): with only `read`, a query with any
  sentence that is not a `select`, also inside an `include`, is refused.
- Without the permission: `403` in REST, `status: 403` in WebSocket, `isError: true` in MCP, with the message
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` answers the name and permissions of the credential (its view, 4.1.0; its stage, what it may choose and
  its roles, 4.4.0), never its secret.
- No credential gets a permission by itself: they are the ones of its roles (or every one, for the anonymous of
  `adapter: none`).

## Writes that wait for a person {#approvals}

**Since data-gateway 4.3.0.** An agent can propose changes without making them alone: its write waits until a person
approves it.

```yaml
mcp:
  approval: writes           # every write by MCP waits (also per schema)
  approvalExpires: 1h        # one nobody decides expires
authorization:
  roles:
    agent: { permissions: [ read, write ], approval: writes }   # on every transport
    ops:   { permissions: [ read, approve ] }
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: agent, value: $AGENT_KEY, roles: [ agent ] }
    - { name: ops,   value: $OPS_KEY,   roles: [ ops ] }
```

- The write answers at once `{ "approval": "…", "status": "pending", "expiresAt" }` (REST: `202`); nothing changed yet.
  A script always waits (it may write); a queued write can't wait (`403`).
- Who asked sees its state with the MCP tool `approval_status`, `GET /{schema}/approvals/{id}` or `approvals.status`:
  `pending`, `done` (with its result), `failed`, `rejected` (with the reason) or `expired`.
- Who has `approve` lists them with the sentences each would run and approves or rejects them, in the
  [administration](Admin.md#since-4-3-0) or the [IDE](../ide/Connections.md#approvals); **never its own**. Approved,
  it runs once as who asked (its view, its context) and is audited with `approvedBy`.
- They live in the [state of the gateway](Admin.md#persist) (the SQLite of the volume, or a database), shared by its
  replicas.

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
