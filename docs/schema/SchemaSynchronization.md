# Synchronization

This page summarizes the commands that keep the schema and the databases of a stage in step.

Synchronization works in both directions: from the schema to the sources (databases), and from the sources to the schema file.
Each operation is available as a command of the CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)) and as a method of `orm.stage` in [@lambdaorm/lib](https://www.npmjs.com/package/@lambdaorm/lib).

| Operation   | Direction                    | Changes the schema | Changes the databases |
|-------------|------------------------------|:------------------:|:---------------------:|
| push        | schema → databases           | no                 | yes                   |
| pull        | databases → schema           | yes                | no                    |
| fetch       | compares both                | no                 | no                    |
| introspect  | data file → schema → databases | yes              | yes                   |
| incorporate | data file → schema → databases, then imports the data | yes | yes      |

## Push

Push updates the sources (databases) with the schema, with the command `lambdaorm push`.

Push compares the model with the databases themselves: it creates missing tables, adds and alters columns, renames the columns declared with `previousMapping`, and never drops what exists only in the database. `lambdaorm push -o <dir>` writes the DDL as one script per source (`<stage>.<source>.sql`) without applying it.

[More information](SchemaSynchronization-Push.md)

## Pull

Pull updates the schema with the structure of the sources (databases), with the command `lambdaorm pull`. What was written by hand in the schema (relations, listeners, stages) is kept.

[More information](SchemaSynchronization-Pull.md)

## Fetch

Fetch shows the differences between the sources and the schema, without applying any change, with the command `lambdaorm fetch`. The result is empty when the databases are in step with the model, and the command exits with code 1 when there are differences (useful in CI).

[More information](SchemaSynchronization-Fetch.md)

## Introspect

Introspect updates the schema from the structure of a JSON data file and then pushes the changes to the sources (databases), with the command `lambdaorm introspect`.

[More information](SchemaSynchronization-Introspect.md)

## Incorporate

Incorporate does the same as introspect and then imports the data of the file into the sources (databases), with the command `lambdaorm incorporate`.

[More information](SchemaSynchronization-Incorporate.md)
