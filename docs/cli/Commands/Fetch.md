# Fetch

Shows the drift between the databases of a stage and the model: per mapping, the entities that differ (missing on one
side, different columns, types, lengths, nullability or primary key), each with its `differences`. The entities are
empty when the databases are in step with the model. Relations and indexes are not compared.

It **exits with code 1 when there are differences**, so it can be used in CI.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage (default: the first stage of the schema). |
| envfile | `-e` | Reads a file of environment variables. |
| output | `-o` | Output format: `json`, `beautiful`, `light` or `yaml`. |
| url | `-u` | URL of the schema on a [Data Gateway](../../data-gateway/index.md), to run the command there. |

## Example

```sh
lambdaorm fetch -w lab/countries -e lab/countries/.env -o beautiful || echo "the database differs from the model"
```

Result:

```json
[
  {
    "name": "default",
    "entities": [
      {
        "name": "Countries",
        "mapping": "Countries",
        "differences": ["column phone missing in the database"],
        "properties": [ ... ]
      }
    ]
  }
]
```

In step:

```json
[
  {
    "name": "default",
    "entities": []
  }
]
```
