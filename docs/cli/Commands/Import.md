# Import

Imports data from a file into the databases of a stage. The file has the format written by [export](Export.md).

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage (default: the first stage of the schema). |
| envfile | `-e` | Reads a file of environment variables. |
| data | `-d` | Data to import: the path of a JSON file, or JSON. |
| url | `-u` | URL of the schema on a [Data Gateway](../../data-gateway/index.md), to run the command there. |

## Example

```sh
lambdaorm import -w lab/countries -e lab/countries/.env -d ./lab/countries/data/default-export.json
```
