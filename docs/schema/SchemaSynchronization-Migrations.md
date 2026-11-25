# Migrations

This page explains how λORM protects the data when the schema changes and how a database goes back to an earlier
version: the changes that can lose data, the undo script of each push, and the history that `lambdaorm migrate` uses.
[Push](SchemaSynchronization-Push.md) compares the model with the database itself, so there are no migration files
to write by hand: these tools are for applying a change safely and for undoing it.

## Changes that can lose data

`push` never drops what exists only in the database; what can lose data is altering a column: a type that isn't
wider (`decimal` to `integer`, text to date) or a shorter text (`string(50)` to `string(20)`, a text without length to
`string(n)`). `push` stops with a `DestructiveChangeError` that lists them, and applies them only with
`lambdaorm push --allow-destructive` (`options.allowDestructive` in Node). Making a type or a length wider is not
destructive.

## Undo

Next to each `orm_state/<source>/V<version>__push.sql`, `push` writes `U<version>__push.sql`, its undo, computed at
the same time: it drops the tables and columns the push created, undoes the renames and gives back the type, length
and nullability the columns had in the database. What was written in what it drops doesn't come back (the file says
so).

## The history and migrate

With `infrastructure.migrations: {}` in the schema, λORM adds the entity `LambdaOrmMigrations` (version, stage, source,
action, file, undo, status, date and who), and each `push` records in it, per source, what it did and its undo. Each
database knows its own version:

```yaml
infrastructure:
  migrations: {}
```

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first, applied or undone
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version, the newest first
lambdaorm push -s dev                             # goes forward again
```

| Option | Description |
|--------|-------------|
| `-w`, `--workspace` | Folder of the project (default: the current folder). |
| `-s`, `--stage` | Name of the stage (default: the first stage). |
| `-e`, `--envfile` | File of environment variables to read. |
| `--list` | The migrations of the stage, the newest first. |
| `--to` | The version to go back to, as `--list` shows it. |
| `--allow-destructive` | Apply also an undo that can lose data (shrinking what the push widened). |

`migrate` runs the undo kept in the history, so it doesn't need the `orm_state` folder of that environment and works
on MongoDB too; the versions it undoes are marked `undone`. Without `infrastructure.migrations`, `migrate` says so;
`push` still writes the `V` and `U` files and stops the destructive changes.

In Node, `orm.stage.migrate(version, { stage })` goes back to a version, and `orm.stage.migrations` reads the history.
See also the [migrate command](../cli/Commands/Migrate.md).
