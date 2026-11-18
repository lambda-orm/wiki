# Execute

Executes a query expression and prints its result.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage (default: the first stage of the schema). |
| query | `-q` | Query expression. |
| data | `-d` | Data (parameters) of the query: JSON, or the path of a JSON file. |
| envfile | `-e` | Reads a file of environment variables. |
| output | `-o` | Output format: `json`, `beautiful`, `light` or `yaml`. |
| url | `-u` | URL of the schema on a [Data Gateway](../../data-gateway/index.md), to run the command there. |

## Examples

### Bulk insert

Inserts the countries of a JSON file, with their states:

```sh
lambdaorm execute -w lab/countries -e lab/countries/.env -q "Countries.bulkInsert().include(p => p.states)" -d ./lab/countries/countries.json
```

### Query

```sh
lambdaorm execute -e ".env" -o beautiful -q "Products.distinct(p => ({ quantity: p.quantity, category: p.category.name })).sort(p => p.category).page(1,3)"
```

Result:

```json
[
  {
    "quantity": "10 boxes x 20 bags",
    "category": "Beverages"
  },
  {
    "quantity": "24 - 12 oz bottles",
    "category": "Beverages"
  },
  {
    "quantity": "12 - 355 ml cans",
    "category": "Beverages"
  }
]
```

### On a Data Gateway

```sh
lambdaorm execute -u http://gateway:8080/iot/v1 -o beautiful -q "Devices.filter(p => p.status == status)" -d '{"status": "active"}'
```

With bearer authentication, set the token in the `SERVICE_TOKEN` environment variable (see the [CLI](../index.md#exit-code-and-data-gateway)).
