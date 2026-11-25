# Introspect {#introspect}

Diese Seite erklärt introspect, das das Schema anhand der Struktur einer JSON-Datendatei aktualisiert und die Änderungen anschließend auf die Quellen (Datenbanken) überträgt: den CLI-Befehl `lambdaorm introspect` und die Methode `orm.stage.introspect()`.
Verwenden Sie es, um ein Modell aus bereits vorhandenen Daten (einem Export, der Antwort einer API) zu beginnen, statt die Entitäten von Hand zu schreiben.

Introspect:

1. Leitet die Entitäten, Eigenschaften und Beziehungen aus den Daten ab und fügt sie der Schema-Datei hinzu.
2. Führt einen [Push](SchemaSynchronization-Push.md) aus, sodass die Datenbanken des Stages die neuen Tabellen und Spalten erhalten.

Die Daten werden nicht importiert; um sie ebenfalls zu importieren, verwenden Sie [incorporate](SchemaSynchronization-Incorporate.md).

## CLI {#cli}

```sh
lambdaorm introspect -d countries.json -n countries
```

| Option | Beschreibung |
|--------|-------------|
| `-d`, `--data` | JSON-Datendatei (oder die Daten als Inline-JSON). Erforderlich. |
| `-n`, `--name` | Name der Wurzelentität (Standard: der Name der Datei). |
| `-w`, `--workspace` | Ordner des Projekts (Standard: der aktuelle Ordner). |
| `-s`, `--stage` | Name des Stages (Standard: der erste Stage). |
| `-e`, `--envfile` | Zu lesende Datei mit Umgebungsvariablen. |

Dieser Befehl aktualisiert `lambdaORM.yaml` mit der Struktur der Daten in `countries.json`, mit `Countries` als Wurzelentität, und überträgt die Änderungen.
Wie push schreibt er das Modell des Stages und die auf jede Quelle angewendete DDL in den Ordner `orm_state`:

```sh
├── countries.json
├── lambdaORM.yaml
└── orm_state
    ├── default-model.json
    └── <source>
        └── V<yyMMddHHmmss>__push.sql
```

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

Siehe das [CLI-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/12-introspect).

## Node {#node}

`orm.stage.introspect(data, name, options)` erhält die Daten, den Namen der Wurzelentität und optional die Abfrageoptionen (zum Beispiel den Stage):

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

Als Ergebnis:

- Die Datei `lambdaORM.yaml` wird mit der aus den Daten abgeleiteten Struktur aktualisiert.
- Die Datenbanken des Stages werden mit dem neuen Schema aktualisiert.
- Das Modell des Stages und die angewendete DDL werden in den Ordner `orm_state` geschrieben.

Siehe das [Node-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/12-introspect).
