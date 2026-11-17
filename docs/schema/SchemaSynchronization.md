# Synchronization

The synchronization is the process of updating the schema defined in yaml/json configuration file with structure in sources (Databases). The synchronization is a process that can be done in both directions, from the schema configuration to the sources (Databases) and from the source to the schema file configuration.

## Push

The push is the process of updating the sources (Databases) with the schema defined in the configuration file. The push process is done by the command `lambdaorm push`.

Push compares the model with the databases themselves: it creates missing tables, adds and alters columns, renames the columns declared with `previousMapping`, and never drops what exists only in the database. `lambdaorm push -o <dir>` writes the DDL as one script per source (`<stage>.<source>.sql`) without applying it.

[more info](https://lambda-orm.github.io/wiki/SchemaSynchronization-Push)

## Pull

The pull is the process of updating the schema defined in the configuration file with the structure in the sources (Databases). The pull process is done by the command `lambdaorm pull`. What was written by hand in the schema (relations, listeners, stages) is kept.

[more info](https://lambda-orm.github.io/wiki/SchemaSynchronization-Pull)

## Fetch

The fetch is the process that shows the differences between the sources and the schema, without applying changes. It is done by the command `lambdaorm fetch`. The result is empty when the databases are in step with the model, and the command exits with code 1 when there are differences (useful in CI).

[more info](https://lambda-orm.github.io/wiki/SchemaSynchronization-Fetch)

## Introspect

Introspection is the process of updating the schema defined in the configuration file by introspecting a data file and then applying the changes to the sources (Databases). The introspection process is performed using the `lambdaorm introspect` command.

[more info](https://lambda-orm.github.io/wiki/SchemaSynchronization-Introspect)

## Incorporate

Onboarding is the process of updating the schema defined in the configuration file by introspecting a data file and then applying the changes to the sources (databases) and then importing the data into the sources (Databases). The introspection process is performed using the `lambdaorm incorporate` command.

[more info](https://lambda-orm.github.io/wiki/SchemaSynchronization-Incorporate)
