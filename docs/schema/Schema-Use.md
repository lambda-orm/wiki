# Schema Use

This page shows how to write a simple schema in YAML or JSON, how to generate the model and repositories from it with the CLI, and how to load it in an application.

## Simple configuration example

The same schema, with one entity mapped to the table `TBL_COUNTRIES` of a MySQL database, written in YAML and in JSON.

**Configuration in YAML:**

```yaml
domain:
  entities:
    - name: Countries
      primaryKey: ["iso3"]
      uniqueKey: ["name"]
      properties:
        - name: name
          required: true
        - name: iso3
          length: 3
          required: true
infrastructure:
  mappings:
    - name: mapping1
      entities:
        - name: Countries
          mapping: TBL_COUNTRIES
          properties:
            - name: iso3
              mapping: ISO3
            - name: name
              mapping: NAME
  sources:
    - name: source1
      dialect: MySQL
      mapping: mapping1
      connection: ${CNN_MYSQL}
```

**Configuration in JSON:**

```json
{
  "domain": {
    "entities": [
      {
        "name": "Countries",
        "primaryKey": ["iso3"],
        "uniqueKey": ["name"],
        "properties": [
          { "name": "iso3", "required": true, "type": "string", "length": 3 },
          { "name": "name", "required": true, "type": "string" }
        ]
      }
    ]
  },
  "infrastructure": {
    "mappings": [
      {
        "name": "mapping1",
        "entities": [
          {
            "name": "Countries",
            "mapping": "TBL_COUNTRIES",
            "properties": [
              { "name": "iso3", "mapping": "ISO3" },
              { "name": "name", "mapping": "NAME" }
            ]
          }
        ]
      }
    ],
    "sources": [
      {
        "name": "source1",
        "mapping": "mapping1",
        "dialect": "MySQL",
        "connection": "${CNN_MYSQL}"
      }
    ]
  }
}
```

## Build source code

When the schema is created or changed, the model and the repositories are generated with the `build` command of the CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)):

```sh
lambdaorm build -l node
```

`-m` generates only the model and `-r` only the repositories; by default both are generated.
The files are written in the `domain` folder inside the `src` folder (see [Paths](SchemaDefinition.md#paths)). See also [Build](../cli/Commands/Build.md).

The model file, `model.ts`, has a class, a query interface and a queryable for each entity:

```typescript
export class Country {
	iso3?: string
	name?: string
}
export interface QryCountry {
	iso3: string
	name: string
}
export let Countries: Queryable<QryCountry>
```

A repository file is generated for each entity, for example `repositoryCountry.ts`. It is created only once, so you can add your own code to it:

```typescript
import { Repository, IOrm } from '@lambdaorm/lib'
import { Country, QryCountry } from './model'
export class CountryRepository extends Repository<Country, QryCountry> {
	constructor (stage?: string, orm?:IOrm) {
		super('Countries', stage, orm)
	}
	// Add your code here
}
```

## Set schema

`orm.init()` initializes the ORM with the schema. The schema can be given in three ways:

- Without arguments: the schema file is looked for in the current folder. A `.yaml`, `.yml` or `.json` file whose name contains `lambdaorm` (for example `lambdaORM.yaml`) is used; if there is none, one whose name contains `orm`, `schema` or `lambda`.
- With the path of the schema file, including its extension (`.yaml`, `.yml` or `.json`), which tells how to read it. A folder can also be given.
- With the schema as an object.

In this example the path of the schema file is given, and a query is executed:

```typescript
import { orm } from '@lambdaorm/lib'
(async () => {
	await orm.init('/home/my/app1/lambdaORM.yaml')
	try {
		const countries = await orm.execute(`Countries.map(p=>{name:p.name,code:p.iso3})
                                                  .sort(p=> desc(p.name))
                                                  .page(1,10)`)
		console.log(countries)
	} catch (error) {
		console.log(error)
	} finally {
		await orm.end()
	}
})()
```
