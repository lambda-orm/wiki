# Export

Exports the data of the databases of a stage to a JSON file, `<stage>-export.json`, in the target folder. The file can be loaded with [import](Import.md).

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage (default: the first stage of the schema). |
| envfile | `-e` | Reads a file of environment variables. |
| target | `-t` | Folder where the export file is written (default: the current directory). |
| force | `-f` | If a statement fails, continue with the next statements. |
| url | `-u` | URL of the schema on a [Data Gateway](../../data-gateway/index.md), to run the command there. |

## Example

```sh
lambdaorm export -w lab/countries -e lab/countries/.env -t ./lab/countries/data
```
