# Incorporate {#incorporate}

Diese Seite erklärt incorporate, das das Schema anhand einer JSON-Datendatei aktualisiert, die Änderungen auf die Quellen (Datenbanken) überträgt und die Daten importiert: den CLI-Befehl `lambdaorm incorporate` und die Methode `orm.stage.incorporate()`.

Incorporate:

1. Leitet die Entitäten, Eigenschaften und Beziehungen aus den Daten ab und fügt sie der Schema-Datei hinzu, wie es [introspect](SchemaSynchronization-Introspect.md) tut.
2. Führt einen [Push](SchemaSynchronization-Push.md) aus, sodass die Datenbanken des Stages die neuen Tabellen und Spalten erhalten.
3. Importiert die Daten in die Datenbanken.

## CLI {#cli}

```sh
lambdaorm incorporate -d countries.json -n countries
```

| Option | Beschreibung |
|--------|-------------|
| `-d`, `--data` | JSON-Datendatei (oder die Daten als Inline-JSON). Erforderlich. |
| `-n`, `--name` | Name der Wurzelentität (Standard: der Name der Datei). |
| `-w`, `--workspace` | Ordner des Projekts (Standard: der aktuelle Ordner). |
| `-s`, `--stage` | Name des Stages (Standard: der erste Stage). |
| `-e`, `--envfile` | Zu lesende Datei mit Umgebungsvariablen. |

Im Ordner `orm_state` erzeugte Dateien:

```sh
├── orm_state
│   ├── default-data.json
│   ├── default-model.json
│   └── <source>
│       └── V<yyMMddHHmmss>__push.sql
```

- `<stage>-model.json`: das Modell des Stages.
- `<stage>-data.json`: der Zustand des Imports.
- `<source>/V<yyMMddHHmmss>__push.sql`: die auf die Quelle angewendete DDL.

Angewendete DDL (MySQL):

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

Siehe das [CLI-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/13-incorporate).

## Node {#node}

`orm.stage.incorporate(data, name, options)` erhält die Daten, den Namen der Wurzelentität und optional die Abfrageoptionen (zum Beispiel den Stage):

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

Als Ergebnis:

- Die Datei `lambdaORM.yaml` wird mit der aus den Daten abgeleiteten Struktur aktualisiert.
- Die Datenbanken des Stages werden mit dem neuen Schema aktualisiert.
- Die Daten werden in die Datenbanken importiert.

Siehe das [Node-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/13-incorporate).
