# Schema

Returns a part of the schema of the project, or of a schema served by a [Data Gateway](../../data-gateway/index.md)
with `-u`: the whole schema, the domain, an entity, a mapping, a stage or the views. Use it to inspect what λORM
loaded, with the environment variables resolved and the inherited entities completed.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| path | `-p` | The part of the schema to return (required); see below. |
| envfile | `-e` | Reads a file of environment variables. |
| output | `-o` | Output format: `json`, `beautiful`, `light` or `yaml`. |
| url | `-u` | URL of the schema on a [Data Gateway](../../data-gateway/index.md), to run the command there. |

| Path | Returns |
| :-- | :-- |
| `schema` | The whole schema. |
| `schema/version` | The version of the schema. |
| `domain` | The domain: entities and enumerations. |
| `entities`, `entities/<name>` | The entities, or one of them. |
| `enums`, `enums/<name>` | The enumerations, or one of them. |
| `sources/<name>` | A source. |
| `mappings`, `mappings/<name>`, `mappings/<name>/<entity>` | The mappings, one of them, or the mapping of an entity. |
| `stages`, `stages/<name>` | The stages, or one of them. |
| `views` | The views. |

An unknown path prints `the path … is not valid` and exits with code 1.

## Examples

```sh
lambdaorm schema -w lab/northwind -p entities/Orders -o yaml
lambdaorm schema -u http://gateway:8080/northwind -p mappings/default/Customers -o beautiful
```
