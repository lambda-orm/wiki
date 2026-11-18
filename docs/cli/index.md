# λORM CLI

λORM CLI (`@lambdaorm/cli`, 1.6.x) is a command line application to use [λORM](https://www.npmjs.com/package/@lambdaorm/lib),
locally with a workspace (`-w`) or on a [Data Gateway](../data-gateway/index.md) (`-u <url>`).

## Installation

Install the package globally; it adds the `lambdaorm` command:

```sh
npm i -g @lambdaorm/cli
lambdaorm --version
```

It needs Node 20 or later. The unscoped `lambdaorm-cli` package is the old, unmaintained one. The Data Gateway's Docker image
([flaviorita/data-gateway](https://hub.docker.com/r/flaviorita/data-gateway)) already includes the CLI.

## CLI

| Command | Description |
|:--|:--|
| version | Prints the CLI version and the `@lambdaorm/lib` version the project uses. |
| init | Generates the λORM project structure. |
| build | Adds configuration, model and repositories according to the language. |
| schema | Returns schema information. |
| push | Synchronizes the databases with the model (`-o` writes the scripts instead). |
| pull | Pulls the stage with the sources. |
| fetch | Shows the differences between the databases and the model; exit code 1 when there are any. |
| introspect | Reads and analyzes data and updates the schema. |
| incorporate | Updates the schema, pushes the sources and imports the data. |
| drop | Removes all database objects but not the database. |
| import | Imports data from a file to the database. |
| export | Exports data from a database. |
| execute | Executes a query. |
| script | Runs a script: several queries in one transaction. |
| plan | Returns the execution plan of a query. |
| metadata | Returns the metadata of a query. |
| parameters | Returns the parameters of a query. |
| model | Returns the model of a query. |
| constraints | Returns the constraints of a query. |

`lambdaorm <command> -h` lists the options of a command.

Every command exits with code 1 when it fails (from @lambdaorm/cli 1.6.3). Commands on a Data Gateway (`-u <url>`, the
URL of the schema: `http://gateway:8080/iot/v1`) send `SERVICE_TOKEN` from the environment as `Authorization: Bearer`
when it is set (a gateway with [bearer authentication](../data-gateway/Security.md#authentication)).

## Usage

* Commands
  * Infrastructure Commands
    * [Version](Version.md)
    * [Init](Commands/Init.md)
    * [Build](Commands/Build.md)
  * DDL Commands
    * [Push](Commands/Push.md)
    * [Fetch](Commands/Fetch.md)
    * [Drop](Commands/Drop.md)
    * Pull, Introspect, Incorporate: see [Schema synchronization](../schema/SchemaSynchronization.md)
  * Data Commands
    * [Import](Commands/Import.md)
    * [Export](Commands/Export.md)
  * Query Commands
    * [Execute](Commands/Execute.md)
    * [Script](Commands/Script.md)
    * [Plan](Commands/Plan.md)
    * [Metadata](Commands/Metadata.md)
    * [Parameters](Commands/Parameters.md)
    * [Model](Commands/Model.md)
    * [Constraints](Commands/Constraints.md)
* [source](source/README.md)
* [Change log](CHANGELOG.md)

## Labs

You can access various labs at [github.com/lambda-orm/lambdaorm-labs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli)
