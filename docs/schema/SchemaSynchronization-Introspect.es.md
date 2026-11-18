# Introspect {#introspect}

Esta página explica introspect, que actualiza el esquema a partir de la estructura de un archivo de datos JSON y luego aplica los cambios a las fuentes (bases de datos): el comando de la CLI `lambdaorm introspect` y el método `orm.stage.introspect()`.

Introspect:

1. Deduce las entidades, propiedades y relaciones a partir de los datos y las añade al archivo del esquema.
2. Ejecuta un [push](SchemaSynchronization-Push.md), de modo que las bases de datos del stage reciben las nuevas tablas y columnas.

Los datos no se importan; para importarlos también, se usa [incorporate](SchemaSynchronization-Incorporate.md).

## CLI {#cli}

```sh
lambdaorm introspect -d countries.json -n countries
```

| Opción | Descripción |
|--------|-------------|
| `-d`, `--data` | Archivo de datos JSON (o los datos como JSON en línea). Obligatorio. |
| `-n`, `--name` | Nombre de la entidad raíz (por defecto: el nombre del archivo). |
| `-w`, `--workspace` | Carpeta del proyecto (por defecto: la carpeta actual). |
| `-s`, `--stage` | Nombre del stage (por defecto: el primer stage). |
| `-e`, `--envfile` | Archivo de variables de entorno que se lee. |

Este comando actualiza `lambdaORM.yaml` con la estructura de los datos de `countries.json`, con `Countries` como entidad raíz, y aplica los cambios.
Igual que push, escribe en la carpeta `orm_state` el modelo del stage y el DDL aplicado a cada fuente:

```sh
├── countries.json
├── lambdaORM.yaml
└── orm_state
    ├── default-model.json
    └── <source>
        └── V<yyMMddHHmmss>__push.sql
```

DDL aplicado (MySQL):

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

Ver el [laboratorio de la CLI](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/12-introspect).

## Node {#node}

`orm.stage.introspect(data, name, options)` recibe los datos, el nombre de la entidad raíz y, opcionalmente, las opciones de la consulta (por ejemplo el stage):

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const workspace = process.cwd()
	const orm = new Orm()
	try {
		const data = JSON.parse(await orm.helper.fs.read(workspace + '/countries.json') || '{}')
		await orm.init(workspace + '/lambdaORM.yaml')
		await orm.stage.introspect(data, 'countries', { stage: 'default' })
	} catch (e) {
		console.log(e)
	} finally {
		await orm.end()
	}
})()
```

Como resultado:

- El archivo `lambdaORM.yaml` se actualiza con la estructura deducida de los datos.
- Las bases de datos del stage se actualizan con el nuevo esquema.
- El modelo del stage y el DDL aplicado se escriben en la carpeta `orm_state`.

Ver el [laboratorio de Node](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/12-introspect).
