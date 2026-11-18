# Drop

Removes all the database objects of a stage, but not the database itself. With `-o`, it prints the statements instead of executing them.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage (default: the first stage of the schema). |
| envfile | `-e` | Reads a file of environment variables. |
| output | `-o` | Generates the statements but does not apply them. |
| force | `-f` | If a statement fails, continue with the next statements. |
| url | `-u` | URL of the schema on a [Data Gateway](../../data-gateway/index.md), to run the command there. |

## Example

```sh
lambdaorm drop -w lab/countries -e lab/countries/.env
```
