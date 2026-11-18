# Schema

This section explains the schema of λORM: what it contains, how it is defined and used, and how it is synchronized with the databases.

The schema holds all the configuration the ORM needs. It separates the business model (**domain**) from the persistence of the data (**infrastructure**):

- In the domain, the entities and enums that represent the business model are completely clean, without any attribute that couples them to persistence.
- All queries are written against the business model, so they are decoupled from the physical model of the data.
- In the infrastructure, everything needed to store and read the data in the different sources (databases) is defined.

The schema can be written in a YAML or JSON file (usually `lambdaORM.yaml`), or passed as an object when the ORM is initialized.

All the expressions used to define conditions and actions are evaluated by the expression engine [3xpr](https://www.npmjs.com/package/3xpr).

## Example

This example shows a stage that uses two sources: source 1 is MySQL and holds the `Countries` table, and source 2 is PostgreSQL and holds the `States` table.

For the `Countries` entity, the names of the table and its columns are the same as the names of the entity and its properties, so no mapping needs to be written.
For the `States` entity, the names of the table and its columns are different, so the mapping defines them.

![diagram](images/schema5.svg)

## In this section

- [Definition](SchemaDefinition.md): every key of the schema.
- [Expressions](SchemaDefinition-Expressions.md), [Environment variables](SchemaDefinition-EnvironmentVariables.md) and [Composite entities](SchemaDefinition-Composite.md).
- [Schema Use](Schema-Use.md): how to load the schema and generate the model.
- Examples: [Basic](SchemaExample-Basic.md), [Extend](SchemaExample-Extend.md), [Multiple stages](SchemaExample-MultiplesStages.md), [Stage with multiple sources](SchemaExample-StageMultiplesSources.md), [Composite](SchemaExample-Composite.md) and [Listener](SchemaExample-Listener.md).
- [Synchronization](SchemaSynchronization.md): push, pull, fetch, introspect and incorporate.
- [Engines](Engines.md): differences between database engines.

The [Data Gateway](../data-gateway/index.md) publishes a schema over the network; its own settings are in a separate [configuration file](../data-gateway/Configuration.md).
