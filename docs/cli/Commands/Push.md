# Push

Synchronizes the databases of a stage with the model. It compares the model with the **databases** (what
[fetch](Fetch.md) reads), not with the `orm_state` file: new tables are created with keys, foreign keys and indexes;
in existing tables missing columns are added and columns with another type, length or nullability are altered. It
**never drops** what exists only in the database (`fetch` reports it). `orm_state` is still written as a record.

## Params

| parameter | short | describe |
|-----------|-------|----------|
| workspace | -w | Project path. |
| stage | -s | Name of stage. |
| envfile | -e | Read in a file of environment variables. |
| output | -o | Generates the queries but does not apply them. Alone: prints them per source. With a folder: writes one script per source that changes, `<stage>.<source>.sql`. |
| force | -f | If there is an error in a statement, continue executing the next statements. |

`push` runs locally only (no `-u`).

## Examples

Apply the changes:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env
```

Write the scripts instead (e.g. to save them as versioned migrations):

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -s default -o migrations
```

```sh
/home/user/lab/countries/migrations/default.default.sql
```

Print them:

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

To rename a column, set `previousMapping` in the property mapping (`{ name: icon, mapping: icon_name, previousMapping: icon }`);
remove it once applied. Table renames are not supported.
