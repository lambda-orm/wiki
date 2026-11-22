# Administration {#administration}

With `admin.enabled`, the gateway and its [UI](Ui.md) stop being read only: the schemas are **created, edited and
removed** from them, as YAML or element by element, what is saved (queries, scripts, diagrams) is shared in the
workspaces, and the **commands of the [CLI](../cli/index.md)** run from the UI. Everything is in the volume of the
gateway, one workspace per schema; the gateway notices what changes and serves it without restarting.

## Turning it on

```yaml
admin:
  enabled: true              # off by default
  commandTimeoutMs: 600000   # how long a command may take
  maxFileBytes: 2MB          # the largest file that can be written
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: modeler, value: $MODELER_KEY, permissions: [ read, schemaRead, schemaWrite, schemaAdmin, workbenchWrite, ddl, build ] }
    - { name: analyst, value: $ANALYST_KEY, permissions: [ read, workbenchWrite ] }
```

The administration answers at `/admin` of the [`http` transport](Transports.md#http), with its authentication. Its
permissions are **never given by default**: a credential without a list of permissions gets those of the data only.

| Permission | Allows |
| --- | --- |
| `schemaRead` | read the `lambdaORM.yaml` of each workspace and validate it |
| `schemaWrite` | change it (as YAML or element by element), `pull`, `introspect` |
| `schemaAdmin` | create and remove workspaces; set the variables of the connections |
| `workbenchWrite` | save queries, scripts and diagrams in the workspaces, without touching the schema |
| `ddl` | change the structure of the databases of a stage (`push`, `drop`) |
| `build` | generate the code of the domain in `src/` of the workspace |

With `authentication: none`, nobody administers unless `admin.allowAnonymous: true` (local development only).

## Workspaces in the volume

Every folder under `orm.workspacePath` with a `lambdaORM.yaml` is a schema, and its route is its path (`iot/v1`):

```text
/workspaces/iot/v1/
  lambdaORM.yaml     the schema
  .env               the variables of its connections
  workbench/         what is saved: folders, *.query.yaml, *.script.yaml, *.diagram.yaml
  data/              exports
  src/domain/        the code of build
  orm_state/         the state of λORM and the record of each command
```

While the gateway runs (`orm.watch`, on by default), it watches them:

- a folder with a `lambdaORM.yaml` that appears is a **new schema**, served on every transport at once;
- a `lambdaORM.yaml` or `.env` whose content changed **reloads its schema blue-green**: the new version starts next to
  the current one, which keeps serving until the new one is ready. If the new one doesn't start (an invalid YAML),
  **the last one that started keeps serving**, and the state of the schema says why (`pending`);
- a folder that goes takes its schema;
- other files (`workbench/`, `data/`) are only notified ([`workspace.changed`](WebSocket.md#notifications)).

The file events are the fast path; a scan every `orm.watch.intervalMs` (5 s) sees what they miss in some mounted
volumes. What changed is decided by the content, not by the event. A file can also be edited outside the gateway (an
editor, `git pull`): the same happens.

## Concurrency

Two people, or a person and an agent, don't overwrite each other:

- every read answers the **version** of what it read and every write says which one it changes; another version is
  a `412` with what there is now, and the UI shows both to choose;
- a form changes **one element** (an entity, a property, a source…): someone else's change to another element doesn't
  collide; to the same element, the form shows what it has now;
- the writes to a workspace go one at a time (a lock file, also across replicas on the same volume) and each file is
  written atomically;
- commands run one at a time per schema.

## The schema

- **As YAML:** the whole `lambdaORM.yaml` in an editor, validated while it is typed (each error at its line), with the
  completion of the keys of each place and of the known values (types, dialects, entities, enums, mappings), saved
  with Ctrl+S.
- **As forms:** each section (entities, enums, sources, mappings, stages) and each element in a form; the properties,
  relations, indexes and values in tables. **Rename** renames what names the element too (relations, keys, indexes,
  mappings, stages); **Remove** first shows who uses it.
- What the gateway writes keeps the **comments, the order and the style** of the file: only what changed is new.
- An invalid schema is not written: the validation checks the YAML, the shape, a name repeated in a list, the types
  (a type λORM doesn't know is a warning) and λORM completing the schema, without connecting and without running
  anything of it.

## The connections

The variables a schema names (`connection: ${SHOP_CNX}`) are set in the `.env` of its workspace from the UI (or the
API), which shows which ones the schema names, which ones the `.env` defines and the sources that use them. **A value is
never shown** once it is set. Changing them reloads the schema. A variable can also come from the configuration of
the gateway (`orm.schemas[].env`) or its environment.

## The commands

The commands of the [CLI](../cli/index.md) run in the worker of the schema, with its connections, as **jobs** (one at
a time per schema), from the **Commands** panel of the UI:

| Command | Before running it, the UI shows | Permission |
| --- | --- | --- |
| `fetch` | — (it compares the databases with the model) | `read` |
| `export` | — (downloaded, or saved in `data/`) | `read` |
| `push` | the sentences by source | `ddl` |
| `drop` | the sentences; the stage is typed again | `ddl` |
| `import` | the rows of each entity | `stageImport` |
| `pull` | the diff of the `lambdaORM.yaml` | `schemaWrite` |
| `introspect` | the diff and the rows of the data | `schemaWrite` |
| `incorporate` | the diff and the rows; then the schema reloads, `push` creates its tables and the rows are imported | `schemaWrite`, `ddl`, `stageImport` |
| `build` | — (written in `src/`, or downloaded as a `.zip`) | `build` |

A command that changes the databases or the schema runs **exactly the preview that was shown**, once, within 10
minutes, and only while the `lambdaORM.yaml` is the one it was made with. Each job leaves its record in
`orm_state/jobs/`; `push`, `drop` and `import` are [audited](Security.md#audit).

## What is saved

With `workbenchWrite`, the folders, queries, scripts and diagrams of the explorer are saved in `workbench/` of each
workspace, one file per item, and everyone with access to the schema sees them (they can be versioned with git next to
the schema). Without it, they stay in the browser as before. A file written by hand is an item too; one that is not
valid YAML is shown as such and never replaced.

## Over MCP

The MCP server of each schema adds `admin_schema_get`, `admin_schema_validate` and `admin_stage_fetch` for credentials
with `schemaRead`: an agent reads the schema, checks a change and sees whether the databases are in step. Writing is
not offered over MCP: a model would do it without the preview and the confirmation of the UI.

## The API

The REST routes are in the [REST API](Rest.md#administration); a workspace is named by its route in one URL segment
(`iot%2Fv1`).
