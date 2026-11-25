# Migrations

## Changes that can lose data

`push` never drops what exists only in the database; what can lose data is altering a column: a type that isn't
wider (`decimal` to `integer`) or a shorter text (`string(50)` to `string(20)`). `push` stops with a
`DestructiveChangeError` that lists them, and applies them with `lambdaorm push --allow-destructive`
(`options.allowDestructive`).

## Undo

Next to each `orm_state/<source>/V<version>__push.sql`, `push` writes `U<version>__push.sql`, its undo: it drops the
tables and columns the push created, undoes the renames and gives back the types the database had. What was written in
what it drops doesn't come back.

## The history and migrate

With `infrastructure.migrations: {}`, the database keeps the history of its migrations (the entity
`LambdaOrmMigrations`), with the undo of each one:

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version
lambdaorm push -s dev                             # goes forward again
```
