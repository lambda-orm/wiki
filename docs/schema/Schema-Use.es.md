# Uso del esquema {#schema-use}

Esta página muestra cómo escribir un esquema sencillo en YAML o JSON, cómo generar a partir de él el modelo y los repositorios con la CLI, y cómo cargarlo en una aplicación.

## Ejemplo de configuración sencilla {#simple-configuration-example}

El mismo esquema, con una entidad mapeada a la tabla `TBL_COUNTRIES` de una base de datos MySQL, escrito en YAML y en JSON.

**Configuración en YAML:**

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

**Configuración en JSON:**

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

## Generar el código fuente {#build-source-code}

Cuando se crea o se modifica el esquema, el modelo y los repositorios se generan con el comando `build` de la CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)):

```sh
lambdaorm build -l node
```

`-m` genera solo el modelo y `-r` solo los repositorios; por defecto se generan ambos.
Los archivos se escriben en la carpeta `domain` dentro de la carpeta `src` (ver [Paths](SchemaDefinition.md#paths)). Ver también [Build](../cli/Commands/Build.md).

El archivo del modelo, `model.ts`, tiene una clase, una interfaz de consulta y un queryable por cada entidad:

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

Se genera un archivo de repositorio por cada entidad, por ejemplo `repositoryCountry.ts`. Se crea una sola vez, así que se le puede añadir código propio:

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

## Establecer el esquema {#set-schema}

`orm.init()` inicializa el ORM con el esquema. El esquema se puede indicar de tres maneras:

- Sin argumentos: el archivo del esquema se busca en la carpeta actual. Se usa un archivo `.yaml`, `.yml` o `.json` cuyo nombre contenga `lambdaorm` (por ejemplo `lambdaORM.yaml`); si no lo hay, uno cuyo nombre contenga `orm`, `schema` o `lambda`.
- Con la ruta del archivo del esquema, incluida su extensión (`.yaml`, `.yml` o `.json`), que indica cómo leerlo. También se puede indicar una carpeta.
- Con el esquema como objeto.

En este ejemplo se indica la ruta del archivo del esquema y se ejecuta una consulta:

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
