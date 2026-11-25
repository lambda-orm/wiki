# Fetch

This page explains fetch, which shows the differences between the sources (databases) of a stage and the schema without applying any change: what it compares, the CLI command `lambdaorm fetch` and the `orm.stage.fetch()` method.
Use it before a push, to see what it would change, or in CI, to detect a database that drifted from the model.

## What fetch compares

Fetch reads the databases of the stage and compares them with the model (drift). The result has one entry per mapping, with the entities that differ:

- tables missing in the database or missing in the model,
- columns missing on one side,
- columns with another type, length or nullability,
- a different primary key.

Each entity has its `differences`, in readable text. **When the databases are in step with the model, every mapping has no entities.**

Relations (foreign keys) and indexes are not compared.
On MongoDB, which is schemaless, fetch only checks that each collection exists.
On SQLite it reads the structure from `sqlite_master`; on PostgreSQL it reads `geography` and `vector` columns with their type, so they show no false difference.

Example of a result, after adding the property `phone` to `Customers` in the model:

```yaml
- name: default
  entities:
    - name: Customers
      mapping: customers
      differences:
        - column phone missing in the database
```

Result when the database is in step with the model:

```yaml
- name: default
  entities: []
```

## CLI

```sh
lambdaorm fetch -s default -o yaml
```

| Option | Description |
|--------|-------------|
| `-w`, `--workspace` | Folder of the project (default: the current folder). |
| `-s`, `--stage` | Name of the stage (default: the first stage). |
| `-e`, `--envfile` | File of environment variables to read. |
| `-o`, `--output` | Output format: `json`, `beautiful`, `light` or `yaml`. |

**The command exits with code 1 when there are differences** (and 0 when the databases are in step), so it can be used in CI to detect drift:

```sh
lambdaorm fetch -s default || echo "the database differs from the model"
```

See the [CLI lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/10-fetch).

## Node

`orm.stage.fetch()` returns the differences. To read the mappings of the databases as they are (every table and column), use `orm.stage.read()`.

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const orm = new Orm()
	try {
		await orm.init('./lambdaORM.yaml')
		const mappings = await orm.stage.fetch({ stage: 'default' })
		const differing: any[] = mappings.flatMap(p => p.entities || [])
		for (const entity of differing) {
			console.log(entity.name, entity.differences)
		}
		// the databases' own mappings
		const database = await orm.stage.read({ stage: 'default' })
		await orm.helper.fs.write('./mappings.yaml', orm.helper.yaml.dump(database))
	} finally {
		await orm.end()
	}
})()
```

See the [Node lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/10-fetch).
