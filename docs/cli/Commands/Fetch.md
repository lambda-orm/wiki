# Fetch

Shows the drift between the databases of a stage and the model: per mapping, the entities that differ (missing on one
side, different columns, types, lengths, nullability or primary key), each with its `differences`. The entities are
empty when the databases are in step with the model. Relations and indexes are not compared.

**Exit code 1 when there are differences**, so it can be used in CI.

## Params

| parameter | short | describe |
|-----------|-------|----------|
| workspace | -w | Project path. |
| stage | -s | Name of stage. |
| envfile | -e | Read in a file of environment variables. |
| output | -o | Generates an output according to the following possible values [json\|beautiful\|light\|yaml] |
| url | -u | Url of service. |

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
