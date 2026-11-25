# Verwendung des Schemas {#schema-use}

Diese Seite zeigt, wie Sie ein einfaches Schema in YAML oder JSON schreiben, wie Sie daraus mit der CLI das Modell und die Repositories generieren und wie Sie es in einer Anwendung laden.

## Einfaches Konfigurationsbeispiel {#simple-configuration-example}

Dasselbe Schema, mit einer Entität, die auf die Tabelle `TBL_COUNTRIES` einer MySQL-Datenbank abgebildet wird, in YAML und in JSON geschrieben.

**Konfiguration in YAML:**

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

**Konfiguration in JSON:**

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

## Quellcode generieren {#build-source-code}

Wenn das Schema erstellt oder geändert wird, werden das Modell und die Repositories mit dem Befehl `build` der CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)) generiert:

```sh
lambdaorm build -l node
```

`-m` generiert nur das Modell und `-r` nur die Repositories; standardmäßig wird beides generiert.
Die Dateien werden in den Ordner `domain` innerhalb des Ordners `src` geschrieben (siehe [Pfade](SchemaDefinition.md#paths)). Siehe auch [Build](../cli/Commands/Build.md).

Die Modelldatei `model.ts` enthält für jede Entität eine Klasse, eine Abfrage-Schnittstelle und ein Queryable:

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

Für jede Entität wird eine Repository-Datei generiert, zum Beispiel `repositoryCountry.ts`. Sie wird nur einmal erstellt, sodass Sie ihr eigenen Code hinzufügen können:

```typescript
import { Repository, IOrm } from '@lambdaorm/lib'
import { Country, QryCountry } from './model'
export class CountryRepository extends Repository<Country, QryCountry> {
	constructor (stage?: string, orm?:IOrm, view?: string) {
		super('Countries', stage, orm, view)
	}
	// Add your code here
}
```

Mit `--view <name>` generiert `build` das Modell und die Repositories dieser [Sicht](Views.md): nur ihre Entitäten und Eigenschaften sowie Repositories, die sie verwenden.
Wenn das Schema [benannte Abfragen](SchemaDefinition.md#named-query) (`application.queries`) enthält, schreibt `build` außerdem `queries.ts` mit dem Typ des Ergebnisses jeder Abfrage und einer Funktion, die sie ausführt (siehe [Typisierte Abfragen](../usage/TypedQueries.md)).

## Schema festlegen {#set-schema}

`orm.init()` initialisiert das ORM mit dem Schema. Das Schema kann auf drei Arten übergeben werden:

- Ohne Argumente: Die Schema-Datei wird im aktuellen Ordner gesucht. Verwendet wird eine Datei `.yaml`, `.yml` oder `.json`, deren Name `lambdaorm` enthält (zum Beispiel `lambdaORM.yaml`); gibt es keine, eine, deren Name `orm`, `schema` oder `lambda` enthält.
- Mit dem Pfad der Schema-Datei einschließlich ihrer Erweiterung (`.yaml`, `.yml` oder `.json`), die angibt, wie sie zu lesen ist. Es kann auch ein Ordner angegeben werden.
- Mit dem Schema als Objekt.

In diesem Beispiel wird der Pfad der Schema-Datei angegeben und eine Abfrage ausgeführt:

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
