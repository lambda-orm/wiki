# Fetch

The fetch is the process that shows the differences between the sources (Databases) and the schema, without applying any change. It is done by the command `lambdaorm fetch`.

## What fetch compares

Fetch reads the databases of the stage and compares them with the model (drift). The result has one entry per mapping, with the entities that differ:

- tables missing in the database or missing in the model,
- columns missing on one side,
- columns with another type, length or nullability,
- a different primary key.

Each entity carries its `differences`, readable. **When the databases are in step with the model, every mapping has no entities.**

Relations (foreign keys) and indexes are not compared.
On MongoDB, which is schemaless, fetch only checks that each collection exists.

Example of a result, after adding the property `phone` to `Customers` in the model:

```yaml
- name: default
  entities:
    - name: Customers
      mapping: customers
      differences:
        - column phone missing in the database
```

In step:

```yaml
- name: default
  entities: []
```

## CLI

```sh
lambdaorm fetch -s default -o yaml
```

The `-o` argument sets the output format: `json`, `beautiful`, `light` or `yaml`.

**The command exits with code 1 when there are differences** (and 0 when the databases are in step), so it can be used in CI to detect drift:

```sh
lambdaorm fetch -s default || echo "the database differs from the model"
```

[View lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/10-fetch)

## Node

`orm.stage.fetch()` returns the differences. To read the mappings of the databases as they are (every table and column), use `orm.stage.read()`.

```Typescript
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

[View lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/10-fetch)
