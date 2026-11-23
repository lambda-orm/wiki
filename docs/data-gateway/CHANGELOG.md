# Change log

The versions of the Docker image [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway).

### 4.0.0 (unreleased)

The UI becomes the [data-gateway-ide](Ui.md), an image of its own, and the gateway gains a port for it.

**Breaking changes:**

- **The `management` transport** ([Transports](Transports.md#management)): the API of the IDE on its own port, the
  routes of `http` for every schema and the [administration](Admin.md) at `/admin`, with the same credentials and
  permissions. Without its port there is no administration and no IDE: a production gateway whose schemas come in its
  volumes leaves it out. The `admin_*` tools of MCP are there when it is exposed.
- **`/admin` is no longer on `http`**, and `admin.enabled` is gone (warned about and ignored): the administration is on
  when `management` has a port. `admin.allowAnonymous`, `maxFileBytes` and `commandTimeoutMs` stay.
- **The gateway serves no UI:** `/ui` and `transports.http.ui` (warned about and ignored) are gone.
- **No CORS on any transport:** a web application that called the gateway from the browser calls it from its backend.

| 3.x | 4.0.0 |
| --- | --- |
| `admin: { enabled: true }` | `transports.management.port` |
| `transports.http.ui: { enabled: true }`, the UI at `/ui` | the data-gateway-ide, with a connection to `management` |
| a browser calling the gateway (CORS) | through a backend of its own (the IDE's, or the application's) |

**Features:**

- `GET /transports`: the transports of the gateway (port, base path, how a schema is reached, its document), and
  `GET /openapi.json`.
- A WebSocket from a browser authenticates with the credential in its subprotocols (`lambdaorm`,
  `lambdaorm.headers.<base64url>`). Also the MCP over WebSocket.
- `GET /admin/workspaces/{path}/files` and `…/files/content`: the files of `data/` and `src/` of a workspace.
- `GET /admin/expressions` and `POST /admin/expressions/check`: the language of the expressions and the variables of
  the condition of a source of a stage, and one expression checked.
- `GET`/`PUT /admin/session`: where the UI of each credential was, so that a reload or another browser starts there.

### 3.2.0 (2026-11-22)

Uses `@lambdaorm/lib` 3.8.1 and `@lambdaorm/ui` 0.5.0. The administration of the workspaces (phases 1 to 6 of
`docs/DATA_GATEWAY_ADMIN_PLAN.md`). Nothing to change in the configuration: `orm.watch` is on by default, `admin` off.

**Features:**

- **The workspaces are watched while the gateway runs** (`orm.watch`): a folder with a `lambdaORM.yaml` that appears
  is a new schema, served on every transport without restarting the gateway; a folder that goes takes its schema (its
  routes answer `404`, its WebSocket connections are closed with `4404`).
- **A `lambdaORM.yaml` or `.env` whose content changed reloads its schema blue-green**: the new worker starts next to
  the current one, which keeps serving until the new one is ready, without a moment out of service. If the new
  version doesn't start (an invalid YAML), the last one that did keeps serving, and the state of the schema says why
  in `pending` (`GET /schemas`, `schema.statusChanged`).
- WebSocket notification `workspace.changed` (`{ path, kind, files?, at }`; `added`, `removed`, `schema`, `env`,
  `files`), on the connections to that schema and to the root.
- With `orm.watch`, an empty volume starts and waits for its first schema, and an `orm.schemas` adjustment of a schema
  not there yet is a warning, applied when it appears.
- **The administration of the workspaces** (`admin.enabled`, off by default; `docs/DATA_GATEWAY.md` §11), on
  `/admin` of the http transport, with new permissions never given by default (`schemaRead`, `schemaWrite`,
  `schemaAdmin`, `workbenchWrite`): workspaces created (empty or a copy) and removed (to `.trash`), the
  `lambdaORM.yaml` read and written with its version (`If-Match`; `412` with what there is now, `428` without it), its
  validation with the line of each issue (without running `application.start`), and what the UI saves as files in
  `workbench/` of each workspace. Writes to a workspace go one at a time (a lock file, also across replicas) and are
  atomic; the monitor of the workspaces serves what is written.
- **The commands of a workspace as jobs** (`DATA_GATEWAY.md` §11.3): `version`, `fetch`, `export` (also saved in
  `data/`), `push`, `drop` and `import`, run by the worker of the schema, one at a time per schema. The ones that change
  the databases first show what they will do (the sentences by source, the rows of each entity) and run exactly that
  preview, only with the same `lambdaORM.yaml`. New permission `ddl`; `admin.commandTimeoutMs`.
- `pull`, `introspect` and `incorporate` from the gateway: their preview is the diff of the `lambdaORM.yaml`, and it is
  written keeping its comments, order and style (only what changed is new; λORM writes it with js-yaml, which loses
  them). `pull` updates the state of the stage as λORM does; `incorporate` waits for the new schema, pushes it and
  imports the data.
- **One element of a schema at a time** (`DATA_GATEWAY.md` §11.4): `PATCH /admin/workspaces/{path}/schema` with `set`,
  `add`, `remove` or `rename` of an element named by names; a rename renames what names it (relations, keys, indexes,
  mappings, stages…). Concurrency per element: someone else's change to another element doesn't collide. Written
  keeping the comments and the rest of the file. The validation rejects a name repeated in a list.
- **The connections and the code** (`DATA_GATEWAY.md` §11.5): the variables of the connections in the `.env` of a
  workspace, listed (defined or not, used by which sources) and set or removed keeping the rest of the file, never
  answered; and `build` of the model and repositories (node, client-node) in `src/` of the workspace or as a `.zip`.
  New permission `build`.
- **The administration over MCP, read only** (`DATA_GATEWAY.md` §11.6): `admin_schema_get`, `admin_schema_validate` and
  `admin_stage_fetch`, for credentials with `schemaRead` when `admin.enabled`. Writing is not offered over MCP.
- The UI at `/ui` (`@lambdaorm/ui` 0.5.0), with those permissions: the `lambdaORM.yaml` of each schema editable in Monaco
  (validated while typed, saved with Ctrl+S, a conflict shown side by side), new and removed schemas, what is saved
  shared in the workspaces, the panel of commands, the schema as forms with
  its variables, the code of the domain and the completion of the keys and values of the lambdaORM.yaml.
- The UI at `/ui` reads the schemas again every 5 s: a schema added, removed or reloaded shows without reloading the
  page (its domain and typings are read again), and a version that didn't start is marked ⚠ with its reason.

**Bug Fixes:**

- After a blue-green reload, the new worker was terminated 30 s later (its pongs were not counted) and its fall didn't
  restart the schema: it is now a worker of the schema like any other.

### 3.1.0 (2026-11-21)

Uses `@lambdaorm/lib` 3.8.0 and `@lambdaorm/ui` 0.4.0. Nothing to change in the configuration; the API gains routes,
tools and fields, and some answers change status (below).

**Features:**

- **Large schemas** (Ilusor's Cloud: 192 entities, the domain 389 KB as JSON):
    - MCP: a domain that doesn't fit in the description of `orm_execute` gives the names of its entities and points to
      two new tools, `schema_search { text }` (entities, properties and relations by part of their name, compact;
      `Areas.type` only in Areas; the closest names when nothing matches) and `schema_describe { entities }` (some
      entities in two lines each). It used to cut the domain and point to reading it whole.
    - The same on REST, `GET /{schema}/search?q=` and `GET /{schema}/describe?entities=A,B`, and on WebSocket,
      `schema.search` and `schema.describe`.
- **The errors of a query say what is there instead** (from `@lambdaorm/lib` 3.8.0): `nam is neither a property nor
  a relation of Areas; did you mean name?`, `entity Area not found; did you mean Areas?`, or the key of the entity;
  and as data, `suggestions: [{ name, didYouMean }]`, in the body of REST, `error.data` of WebSocket and
  `structuredContent` of MCP.
- **MCP errors** carry `structuredContent` with the name, status and database code that REST and WebSocket answer.
- **From `@lambdaorm/lib` 3.8.0:** relations of several fields (`from: [locationId, areaId]`), and Ilusor's model:
  reads with includes without a transaction and MongoDB `transactions: false` (FerretDB), includes by a `uuid` key
  with several parents, UUIDs read from MongoDB as text, `fetch` with `uuid` and `character(n)` columns and the
  PostgreSQL catalog across schemas and partitions.
- **The UI at `/ui`** (from `@lambdaorm/ui` 0.4.0): a filter of the entities in the explorer, "use name" on an error
  with a suggestion, the width of the explorer kept and fitted to the names, and the schemas that didn't start
  shown with their reason.

**Changes of status:**

- A name that doesn't exist (an entity, an enum, a source, a mapping, a stage, `GET /entities/Nope`) answers `404`; it
  answered `204` without a body.
- A query error that answered `500` answers `400`: an unknown entity, a missing required property (λORM kept the
  class of the error), an include of a relation that doesn't exist, a function that doesn't exist.
- A route that doesn't exist answers a `404` in JSON (`{ error: "NotFoundError", message }`) with the closest routes;
  it was the HTML page of Express.
- `ConnectionError` (a source the gateway can't reach, or whose connection variable is not set) answers `503`, not
  `500`.

**Bug Fixes:**

- A connection whose environment variable is not set (`${ORM_SALES_DOCUMENTS_CNX}`) failed with `Cannot read
  properties of undefined (reading 'startsWith')`. With `runtime.checkConnections`, the schema now doesn't start and
  its reason lists every variable that is missing and where to give it, before connecting to anything; without it, the
  first query to that source answers `503` naming the variable.

### 3.0.3 (2026-11-20)

Uses `@lambdaorm/lib` 3.7.0 and `@lambdaorm/ui` 0.3.4. Nothing changes in the configuration or the API.

**Bug Fixes:**

- From `@lambdaorm/ui` 0.3.4, in the UI at `/ui`: a new query tab picks the schema by itself when only one is ready
  (it asked even with one), and the checkboxes of the diagram dialog sit next to their names.

### 3.0.2 (2026-11-20)

Uses `@lambdaorm/lib` 3.7.0 and `@lambdaorm/ui` 0.3.3. Nothing changes in the configuration or the API.

**Bug Fixes:**

- From `@lambdaorm/lib` 3.7.0: dates are stored in UTC on every engine, whatever the time zone of the gateway
  (`TZ`). On PostgreSQL, MySQL, MariaDB and Oracle they were written in the time zone of the process (12:34Z was
  stored as 13:34 by a gateway in Madrid), so the functions of the database (`hour`, `dateToString`, a comparison with
  `now()`) and other applications saw a different time. Dates already stored in the local time of the gateway are
  read shifted by its offset.

### 3.0.1 (2026-11-19)

Uses `@lambdaorm/lib` 3.6.0 and `@lambdaorm/ui` 0.3.3. Nothing changes in the configuration or the API.

**Bug Fixes:**

- From `@lambdaorm/lib` 3.6.0, checked by the engines lab on the six engines:
    - **MongoDB:** dates are stored and compared as BSON dates (the `Date` of MongoDB), not ISO text: the values of
      inserts and updates, and the dates of filters. `distinct` applies `sort` and `page` (they were ignored, and the
      rows came nested in one list), also as a function of the map. `<<` and `>>` work.
    - **Oracle:** a date written in the query is a `DATE` / `TIMESTAMP` literal (`ORA-01861`), a variable named as a
      reserved word works (`to`, `from`, `date`: `ORA-01745`), and `<<` and `>>` work.

### 3.0.0 (2026-11-19)

The first stable version: it moves `latest`. Uses `@lambdaorm/lib` 3.5.5 and `@lambdaorm/ui` 0.3.2. Nothing changes in
the configuration or the API since `3.0.0-rc.4`; the queries the gateway runs are translated right on more engines.

**Bug Fixes:**

- From `@lambdaorm/lib` 3.5.4 and 3.5.5, every engine checked against a real database by the engines lab:
    - **MongoDB:** `sort` by a column, names with spaces (`Order Details`), `like` / `startsWith` / `includes` /
      `isNull` in filters, the date functions on stored dates, comparisons of an expression in a filter
      (`year(p.date) == 2026`), `log`, `trunc` and a map of one expression.
    - **SQL Server:** the functions are T-SQL (they were Oracle's: 52 of 62 failed).
    - **Oracle:** the date functions are Oracle's (they were MySQL's: 20 of 56 failed).
    - **Every engine:** `includes` of a list is an `IN` and of a text a contains (on SQL Server a list was a `LIKE`);
      an `include` with its own filter keeps the condition on the parents; `first` / `last` as aggregates are a clear
      error on SQL databases, which have no such aggregate.
- UI: the autocompletion of the query editor offers the functions the language has (`hour`, `addHour`, `dayDiff`, …),
  not names that don't exist (`hours`, `addHours`).
- Swagger (`/doc`): `POST /script` says what scripts need, `scripts.enabled: true` and a credential with the `script`
  permission, instead of the former service's `SCRIPT_ENABLED`.

### 3.0.0-rc.4 (2026-11-18)

Prerelease: it doesn't move `latest`. Uses `@lambdaorm/lib` 3.5.3.

**Bug Fixes:**

- Swagger (`/doc`): Authorize offers the credential the served schemas are configured with (an API key in its header,
  a bearer token or basic); it offered a fixed bearer token, so it didn't work with an API key. Each http transport
  serves its own document.
- From `@lambdaorm/lib` 3.5.3: a PostgreSQL `bytea` column is read as `buffer` (`lambdaorm pull`, `fetch` and
  `introspect` failed with `error with type: bytea`), and a `buffer` property is created as `BYTEA`.

### 3.0.0-rc.3 (2026-11-18)

Prerelease: it doesn't move `latest`. Uses `@lambdaorm/lib` 3.5.2.

**Features** (the UI at `/ui`, built on `@lambdaorm/ui`):

- Named Data Gateway: a home page with what it is and the schemas, a login page (show / hide the secret) and the
  query page, with logout; the theme (system / light / dark) and the language (English, Español, Português,
  Français, Italiano, Deutsch, Nederlands, Català, Galego, Euskara) are chosen at the top and kept in the browser. The
  credential is never kept.
- An explorer of the schemas on the left. For each schema: its domain as YAML, read only (only `GET /{schema}/domain`:
  never the sources nor the connections); its entities with their properties and relations, and the form of each
  entity (properties, relations and references, keys, indexes and constraints, rows read only by pages, diagram).
- Folders, queries and diagrams saved with a name and a description, moved by dragging; queries in tabs with Save,
  Save as… and Ctrl+S. Saved diagrams: the chosen entities laid out by themselves, boxes and lines moved by hand,
  boxes taken out with their ×, the names of the relations, export to SVG and PNG.
- What is saved stays in the browser (IndexedDB, per gateway and user of the credential) and is exported to and
  imported from a JSON file.
- Results: a copy icon and an export menu (JSON, YAML, tab-separated text).
- The Swagger page says Data Gateway and the version of the instance.

### 3.0.0-rc.2 (2026-11-18)

Prerelease: it doesn't move `latest`.

Uses `@lambdaorm/lib` 3.5.2.

**Bug Fixes (from `@lambdaorm/lib` 3.5.1 / 3.5.2):**

- `like(p.name, 'Ch%')` with the pattern written in the query, `p.name.includes('ch')` ("contains"), and
  `startsWith` / `includes` with the value in a variable work on every SQL engine.
- The date functions (`year`, `month`, `day`, `addDay`, `dayDiff`, …) on a column work on PostgreSQL.
- The MCP guide (`lambdaorm://guide/expressions`) and the description of `orm_execute` teach them; the evaluation set
  has two more questions (contains, `like` with `_`).

### 3.0.0-rc.1 (2026-11-18)

First release of the Data Gateway, published as the Docker image `flaviorita/data-gateway`. Prerelease: it doesn't
move `latest`. Uses `@lambdaorm/lib` 3.5.0.

**Features:**

- One mandatory configuration file (`DATA_GATEWAY_CONFIG_PATH`, default `/config/data-gateway.config.yaml`), with
  environment variables anywhere in it.
- Transports by configuration, each on its own port, none by default: `http` (the REST API), `mcpHttp` (MCP Streamable
  HTTP, stateless or stateful, plus the deprecated HTTP+SSE), `mcpWebSocket` and `webSocket` (JSON-RPC with
  notifications).
- MCP: 22 tools (one per operation, writes included) listed by the credential's permissions, with `readOnlyHint` /
  `destructiveHint`, the domain in the description of `orm_execute`, resources (`lambdaorm://guide/expressions`,
  the domain, each entity) and `mcp.maxRows`.
- Several schemas: discovered under `orm.workspacePath` (the folder is the route: `/iot/v1`) and declared in
  `orm.schemas`, with overrides per schema (transports, authentication, env, scripts, mcp, server, runtime). Each
  schema worker receives only its own variables.
- Runtime: a supervisor, an edge worker with the transports and a worker per schema (`thread` or `process`); heartbeat,
  restarts with a growing wait, `server.maxConcurrent` (429) and `server.maxResponseBytes` (413). A schema that
  doesn't start or falls doesn't affect the others; at start each schema checks a connection of each source.
- Credentials with permissions (`read`, `write`, `script`, `queue`, `stageImport`) for bearer, API key and basic; a
  write with only `read` is refused before connecting.
- Audit of writes, scripts, queued executions and stage imports (a JSON line `"type":"audit"` on stdout).
- The query UI at `/ui` (`transports.http.ui.enabled`, off by default), built on `@lambdaorm/ui`; `GET /typings` and
  `GET /whoami` per schema.
- Metrics of every worker in `/metrics` (and `/{schema}/metrics`); logs labeled by worker.
- The image runs `node index.js` (it stops on `SIGTERM`).

**Known limits** (of `@lambdaorm/lib`, avoided by the MCP guide): `like` with a literal pattern, `includes` over
text, grouping by an expression, the `sql.js` adapter. Fixed in rc.2.
