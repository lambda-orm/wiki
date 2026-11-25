# Incorporate

This page explains incorporate, which updates the schema from a JSON data file, pushes the changes to the sources (databases) and imports the data: the CLI command `lambdaorm incorporate` and the `orm.stage.incorporate()` method.
Use it to load a data file into a database in one step, with the model deduced from the data.

Incorporate:

1. Deduces the entities, properties and relations from the data and adds them to the schema file, as [introspect](SchemaSynchronization-Introspect.md) does.
2. Runs a [push](SchemaSynchronization-Push.md), so the databases of the stage get the new tables and columns.
3. Imports the data into the databases.

## CLI

```sh
lambdaorm incorporate -d countries.json -n countries
```

| Option | Description |
|--------|-------------|
| `-d`, `--data` | JSON data file (or the data as inline JSON). Required. |
| `-n`, `--name` | Name of the root entity (default: the name of the file). |
| `-w`, `--workspace` | Folder of the project (default: the current folder). |
| `-s`, `--stage` | Name of the stage (default: the first stage). |
| `-e`, `--envfile` | File of environment variables to read. |

Files generated in the `orm_state` folder:

```sh
├── orm_state
│   ├── default-data.json
│   ├── default-model.json
│   └── <source>
│       └── V<yyMMddHHmmss>__push.sql
```

- `<stage>-model.json`: the model of the stage.
- `<stage>-data.json`: the state of the import.
- `<source>/V<yyMMddHHmmss>__push.sql`: the DDL applied to the source.

DDL applied (MySQL):

```sql
CREATE TABLE CountriesLanguages (id INTEGER  AUTO_INCREMENT,languageCode VARCHAR(4) NOT NULL ,countryName VARCHAR(32) NOT NULL ,CONSTRAINT CountriesLanguages_PK PRIMARY KEY (id));
ALTER TABLE CountriesLanguages ADD CONSTRAINT CountriesLanguages_UK UNIQUE (countryName,languageCode);
CREATE TABLE Languages (code VARCHAR(4) NOT NULL ,name VARCHAR(16) NOT NULL ,CONSTRAINT Languages_PK PRIMARY KEY (code));
CREATE TABLE Regions (code VARCHAR(2) NOT NULL ,name VARCHAR(32) NOT NULL ,CONSTRAINT Regions_PK PRIMARY KEY (code));
CREATE TABLE Positions (lat DECIMAL(10,4) NOT NULL ,`long` DECIMAL(10,4) NOT NULL ,CONSTRAINT Positions_PK PRIMARY KEY (lat));
ALTER TABLE Positions ADD CONSTRAINT Positions_UK UNIQUE (`long`);
CREATE TABLE Timezones (GmtOffset INTEGER  ,name VARCHAR(32) NOT NULL ,positionLat DECIMAL(10,4) NOT NULL ,countryName VARCHAR(32) NOT NULL ,CONSTRAINT Timezones_PK PRIMARY KEY (name));
CREATE TABLE Countries (name VARCHAR(32) NOT NULL ,phoneCode INTEGER NOT NULL ,priority INTEGER NOT NULL ,regionCode VARCHAR(2) NOT NULL ,CONSTRAINT Countries_PK PRIMARY KEY (name));
ALTER TABLE Countries ADD CONSTRAINT Countries_UK UNIQUE (phoneCode);
ALTER TABLE CountriesLanguages ADD CONSTRAINT CountriesLanguages_countries_FK FOREIGN KEY (countryName) REFERENCES Countries (name);
ALTER TABLE CountriesLanguages ADD CONSTRAINT CountriesLanguages_languages_FK FOREIGN KEY (languageCode) REFERENCES Languages (code);
ALTER TABLE Timezones ADD CONSTRAINT Timezones_position_FK FOREIGN KEY (positionLat) REFERENCES Positions (lat);
ALTER TABLE Timezones ADD CONSTRAINT Timezones_countries_FK FOREIGN KEY (countryName) REFERENCES Countries (name);
ALTER TABLE Countries ADD CONSTRAINT Countries_region_FK FOREIGN KEY (regionCode) REFERENCES Regions (code);
```

See the [CLI lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/13-incorporate).

## Node

`orm.stage.incorporate(data, name, options)` receives the data, the name of the root entity and, optionally, the query options (for example the stage):

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const workspace = process.cwd()
	const orm = new Orm()
	try {
		const data = JSON.parse(await orm.helper.fs.read(workspace + '/countries.json') || '{}')
		await orm.init(workspace + '/lambdaORM.yaml')
		await orm.stage.incorporate(data, 'countries', { stage: 'default' })
	} catch (e) {
		console.log(e)
	} finally {
		await orm.end()
	}
})()
```

As a result:

- The `lambdaORM.yaml` file is updated with the structure deduced from the data.
- The databases of the stage are updated with the new schema.
- The data is imported into the databases.

See the [Node lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/13-incorporate).
