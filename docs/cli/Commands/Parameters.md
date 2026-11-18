# Parameters

Returns the parameters of a query expression, with their types.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| query | `-q` | Query expression. |
| envfile | `-e` | Reads a file of environment variables. |
| output | `-o` | Output format: `json`, `beautiful`, `light` or `yaml`. |
| url | `-u` | URL of the schema on a [Data Gateway](../../data-gateway/index.md), to run the command there. |

## Example

```sh
lambdaorm parameters -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Result:

```json
[
  {
    "name": "id",
    "type": "integer"
  },
  {
    "name": "details",
    "type": "Orders.details",
    "children": [
      {
        "name": "LambdaOrmParentId",
        "type": "any"
      }
    ]
  }
]
```
