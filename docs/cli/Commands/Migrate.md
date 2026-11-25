# Migrate

The history of the migrations of a stage, and going back to a version. It needs `infrastructure.migrations`; see
[Migrations](../../schema/SchemaSynchronization-Migrations.md).

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage. |
| envfile | `-e` | Reads a file of environment variables. |
| list | | The migrations of the stage, the newest first. |
| to | | The version to go back to: the undo of each later version, the newest first. |
| allow-destructive | | Apply also the changes that can lose data. |

## Examples

```sh
lambdaorm migrate -s dev --list
lambdaorm migrate -s dev --to 261125014929
```
