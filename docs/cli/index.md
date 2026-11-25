# λORM CLI

The λORM CLI ([`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli)) is a command line application to use
[λORM](https://www.npmjs.com/package/@lambdaorm/lib): it creates projects, synchronizes the databases with the schema,
imports and exports data, and runs queries and scripts. Its commands run locally with a workspace (`-w`), and most of
them can also run on a [Data Gateway](../data-gateway/index.md) (`-u <url>`).

## Installation

Install the package globally; it adds the `lambdaorm` command:

```sh
npm i -g @lambdaorm/cli
lambdaorm --version
```

It requires Node.js 20 or later. The Docker image of the Data Gateway
([flaviorita/data-gateway](https://hub.docker.com/r/flaviorita/data-gateway)) already includes the CLI.

!!! note
    The unscoped `lambdaorm-cli` package is the old one and is no longer maintained.

## Commands

| Command | Description |
| :-- | :-- |
| [version](Version.md) | Prints the CLI version and the `@lambdaorm/lib` version the project uses. |
| [init](Commands/Init.md) | Generates the structure of a λORM project. |
| [build](Commands/Build.md) | Generates the model and the repositories for the language. |
| [schema](Commands/Schema.md) | Returns a part of the schema: the domain, an entity, a mapping, the stages, the views… |
| [push](Commands/Push.md) | Synchronizes the databases with the model (`-o` writes the scripts instead). |
| [pull](../schema/SchemaSynchronization-Pull.md) | Updates the schema with the structure of the databases of a stage. |
| [fetch](Commands/Fetch.md) | Shows the differences between the databases and the model; exits with code 1 when there are any. |
| [introspect](../schema/SchemaSynchronization-Introspect.md) | Reads and analyzes a data file and updates the schema. |
| [incorporate](../schema/SchemaSynchronization-Incorporate.md) | Updates the schema from a data file, pushes the changes to the databases and imports the data. |
| [drop](Commands/Drop.md) | Removes all the database objects, but not the database itself. |
| [import](Commands/Import.md) | Imports data from a file into the databases. |
| [export](Commands/Export.md) | Exports data from the databases. |
| [execute](Commands/Execute.md) | Executes a query. |
| [script](Commands/Script.md) | Runs a script: several queries in one transaction. |
| [plan](Commands/Plan.md) | Returns the execution plan of a query. |
| [metadata](Commands/Metadata.md) | Returns the metadata of a query. |
| [parameters](Commands/Parameters.md) | Returns the parameters of a query. |
| [model](Commands/Model.md) | Returns the model of the result of a query. |
| [constraints](Commands/Constraints.md) | Returns the constraints of a query. |

`lambdaorm <command> -h` lists the options of a command; `lambdaorm -h` lists the commands.

The `sync` command no longer exists: it was replaced by [push](Commands/Push.md).

## Common options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Path of the project (the folder with `lambdaORM.yaml`). Default: the current directory. |
| stage | `-s` | Name of the stage. Default: the first stage of the schema. |
| envfile | `-e` | Reads a file of environment variables (for example the connection strings). |
| output | `-o` | Output format of the result: `json`, `beautiful`, `light` or `yaml`. In `push` and `drop`, it prints (or writes) the statements instead of applying them. |
| url | `-u` | URL of the schema on a Data Gateway, to run the command there instead of locally. |

Each command page lists the options that command accepts.

## Exit code and Data Gateway

Every command exits with code 1 when it fails (from @lambdaorm/cli 1.6.3).

Commands run on a Data Gateway with `-u` and the URL of the schema, for example `http://gateway:8080/iot/v1`. When the
`SERVICE_TOKEN` environment variable is set, it is sent as `Authorization: Bearer <token>` (for a gateway with
[bearer authentication](../data-gateway/Security.md#authentication)). See also [Clients](../data-gateway/Clients.md#cli).

## More

- [Source code reference](source/README.md)
- [Change log](CHANGELOG.md)
- [CLI labs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli)
