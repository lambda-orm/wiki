# Push

This page explains push, which updates the sources (databases) of a stage with the schema: how it works, the CLI command `lambdaorm push` and the `orm.stage.push()` method.
Run it after you change the domain or the mappings, so the databases get the new tables and columns.

## How push works

Push reads the databases of the stage (as [fetch](SchemaSynchronization-Fetch.md) does) and generates the DDL that takes them to the model:

- Tables that do not exist are created with their primary key, unique key, foreign keys and indexes.
- In existing tables, missing columns are added (`ALTER TABLE … ADD`) and columns with another type, length or nullability are altered, with the syntax of each engine (on MySQL and MariaDB the whole definition, so `AUTO_INCREMENT` is kept; on SQL Server the type with its nullability).
- A column declared with `previousMapping` in its property mapping is renamed (`ALTER TABLE … RENAME COLUMN`, SqlServer `sp_rename`) instead of being added. See [Rename a column](SchemaDefinition.md#rename-a-column-with-previousmapping).
- **Push never drops** anything that exists only in the database (tables, columns). `fetch` reports it, so it can be removed by hand if needed.
- The column types follow the property types and the `dbType` of the property mapping. See [Property types](SchemaDefinition.md#property-types).
- Each entity goes to the source chosen by the stage rules; a source without condition only gets the entities no other source took.
- **A change that can lose data stops push**: altering a column to a type that is not wider (`decimal` to `integer`, text to date) or to a shorter text (`string(50)` to `string(20)`). Push lists those changes and fails with a `DestructiveChangeError`; `--allow-destructive` applies them. Making a type or a length wider is not destructive. See [Migrations](SchemaSynchronization-Migrations.md).
- On SQLite, the unique key is a unique index, foreign keys are not created, and a change of the type or the nullability of a column is an error. On MongoDB, which is schemaless, push creates the collections and their indexes. On an Http source push does nothing. See [Engines](Engines.md).

Since the comparison is made against the databases, push works the same on any host or CI job: it does not need the `orm_state` folder of a previous push.
The `orm_state` folder is still written, as a record of what was applied.

Renaming a table is not supported.

## CLI

Apply the changes:

```sh
lambdaorm push
```

| Option | Description |
|--------|-------------|
| `-w`, `--workspace` | Folder of the project (default: the current folder). |
| `-s`, `--stage` | Name of the stage (default: the first stage). |
| `-e`, `--envfile` | File of environment variables to read. |
| `-o`, `--output` | Generate the DDL without applying it (see below). |
| `-f`, `--force` | When a sentence fails, continue with the next ones. |
| `--allow-destructive` | Apply also the changes that can lose data. |
| `--seed` | After the push, insert the data the stage starts with (see [Seed](SchemaSynchronization-Seed.md)). |

Example of the generated DDL on an empty database:

```sql
CREATE TABLE Countries (name VARCHAR(80) NOT NULL ,iso3 VARCHAR(3) NOT NULL ,CONSTRAINT Countries_PK PRIMARY KEY (iso3));
ALTER TABLE Countries ADD CONSTRAINT Countries_UK UNIQUE (name);
CREATE TABLE States (id INTEGER NOT NULL ,name VARCHAR(80) NOT NULL ,countryCode VARCHAR(3) NOT NULL ,CONSTRAINT States_PK PRIMARY KEY (id));
ALTER TABLE States ADD CONSTRAINT States_UK UNIQUE (countryCode,name);
ALTER TABLE States ADD CONSTRAINT States_country_FK FOREIGN KEY (countryCode) REFERENCES Countries (iso3);
```

After adding a property `phone` to `Customers` and renaming the column `icon` to `icon_name` (with `previousMapping: icon`), a push generates only those changes:

```sql
ALTER TABLE customers ADD phone VARCHAR(32);
ALTER TABLE categories RENAME COLUMN icon TO icon_name;
```

### Generate the DDL without applying it

With `-o`, push generates the DDL but does not apply it.

- `-o` alone prints the sentences of each source.
- `-o <dir>` writes one script per source that changes, named `<stage>.<source>.sql`. Sources without changes get no file, and a database in step with the model gives no files at all.

```sh
lambdaorm push -s default -o migrations
```

```sh
migrations
├── default.catalog.sql
└── default.accounts.sql
```

The names are deterministic, so the scripts can be renamed into versioned migrations and applied by your own deploy process.

### Files in orm_state

When push applies the changes, it records them in the `orm_state` folder:

```sh
├── orm_state
│   ├── default-model.json
│   └── main
│       ├── U231122154351__push.sql
│       └── V231122154351__push.sql
```

- `<stage>-model.json`: the model of the stage at the last push.
- `<source>/V<yyMMddHHmmss>__push.sql`: the sentences executed on that source. The version is the date, so the files of two developers do not collide in git.
- `<source>/U<yyMMddHHmmss>__push.sql`: the sentences that undo them (see [Migrations](SchemaSynchronization-Migrations.md)).

Labs:

- [Simple](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/01-simple)
- [Two stages](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/03-two-stages)
- [Northwind](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/05-northwind)
- [Northwind multiple datasources](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
- [Northwind CQRS](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs)

## Node

`orm.stage.push()` returns an action that can give the sentences without applying them, or apply them:

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const orm = new Orm()
	try {
		await orm.init('./lambdaORM.yaml')
		// the sentences, without applying them
		const sentences = await orm.stage.push({ stage: 'default' }).sentence()
		// the sentences grouped by source: [{ source: 'accounts', sentences: ['ALTER TABLE accounts ADD phone VARCHAR(32)'] }]
		const bySource = await orm.stage.push({ stage: 'default' }).sentencesBySource()
		// apply them ({ stage: 'default', allowDestructive: true } also applies the changes that can lose data)
		await orm.stage.push({ stage: 'default' }).execute()
	} finally {
		await orm.end()
	}
})()
```
