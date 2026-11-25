# Seed

Inserts the data a stage starts with (`stages[].seed`): of each file, the rows whose key isn't in the database yet.
See [Seed](../../schema/SchemaSynchronization-Seed.md).

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage. |
| envfile | `-e` | Reads a file of environment variables. |

## Example

```sh
lambdaorm seed -s dev
```

```text
data/seed/base.json: Categories +2
data/seed/dev.json: Products +0 (2 already there)
```
