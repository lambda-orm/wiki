# Init

Generates the structure of a λORM project: the workspace folder and its schema file (`lambdaORM.yaml`), with a source,
a mapping and a stage.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: `my-project`). |
| source | `-s` | Name of the data source. |
| dialect | `-d` | Database engine of the project (`MySQL`, `MariaDB`, `PostgreSQL`, `SqlServer`, `Oracle`, `MongoDB`, `SQLjs`). Default: `MySQL`. |
| connection | `-c` | Connection string of the database. |
| data-path | | Relative path of the data folder in the workspace (`--data-path`). |
| url | `-u` | URL of a schema on a Data Gateway: the project is created with the domain of that schema, to be used with the [Node.js client](../../data-gateway/Clients.md). |

Without `-c`, the source gets a local connection for the dialect (for example `localhost:5432` for PostgreSQL, or the
file `data.sqlite` for `SQLjs`), to be replaced with yours, ideally with an
[environment variable](../../schema/SchemaDefinition-EnvironmentVariables.md). When the schema file already exists,
`init` completes it instead of replacing it. It also adds the logs folder of λORM to `.gitignore`. Next,
[build](Build.md) generates the code and [push](Push.md) creates the tables.

## Example

```sh
lambdaorm init -w lab/countries -d PostgreSQL
```
