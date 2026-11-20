# Change log

The versions of the Docker image [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway).

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
