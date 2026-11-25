# Push

Synchronizes the databases of a stage with the model. It compares the model with the **databases** (what
[fetch](Fetch.md) reads), not with the `orm_state` file: new tables are created with keys, foreign keys and indexes;
in existing tables, missing columns are added and columns with another type, length or nullability are altered. It
**never drops** what exists only in the database (`fetch` reports it). `orm_state` is still written as a record: each
push writes `V<version>__push.sql` and its undo, `U<version>__push.sql` ([Migrations](../../schema/SchemaSynchronization-Migrations.md)).

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage (default: the first stage of the schema). |
| envfile | `-e` | Reads a file of environment variables. |
| output | `-o` | Generates the statements but does not apply them. Without a value, prints them per source; with a folder, writes one script per source that changes, `<stage>.<source>.sql`. |
| force | `-f` | If a statement fails, continue with the next statements. |
| allow-destructive | | Apply also the changes that can lose data (a type that narrows, a shorter text); without it, `push` stops and lists them. See [Migrations](../../schema/SchemaSynchronization-Migrations.md). |
| seed | | After it, insert the data the stage starts with ([Seed](Seed.md)). |

!!! note
    `push` runs only locally: it has no `-u` option.

## Examples

Apply the changes:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env
```

Write the scripts instead (for example, to keep them as versioned migrations):

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -s default -o migrations
```

```text
/home/user/lab/countries/migrations/default.default.sql
```

Print the statements, per source, without applying them:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -o
```

```json
[
  {
    "source": "default",
    "sentences": [
      "ALTER TABLE Countries ADD phone VARCHAR(20)"
    ]
  }
]
```

## Renaming a column

To rename a column, set `previousMapping` in the mapping of the property
(`{ name: icon, mapping: icon_name, previousMapping: icon }`) and remove it once the change is applied. Renaming tables
is not supported.
