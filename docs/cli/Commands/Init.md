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

## Example

```sh
lambdaorm init -w lab/countries -d PostgreSQL
```
