# Fetch {#fetch}

Esta página explica fetch, que muestra las diferencias entre las fuentes (bases de datos) de un stage y el esquema sin aplicar ningún cambio: qué compara, el comando de la CLI `lambdaorm fetch` y el método `orm.stage.fetch()`.
Úsalo antes de un push, para ver lo que cambiaría, o en CI, para detectar una base de datos que se desvió del modelo.

## Qué compara fetch {#what-fetch-compares}

Fetch lee las bases de datos del stage y las compara con el modelo (desviaciones). El resultado tiene una entrada por mapping, con las entidades que difieren:

- tablas que faltan en la base de datos o en el modelo,
- columnas que faltan en uno de los dos lados,
- columnas con otro tipo, longitud o nulabilidad,
- una clave primaria distinta.

Cada entidad tiene sus `differences`, en texto legible. **Cuando las bases de datos están sincronizadas con el modelo, ningún mapping tiene entidades.**

Las relaciones (claves foráneas) y los índices no se comparan.
En MongoDB, que no tiene esquema, fetch solo comprueba que cada colección exista.
En SQLite lee la estructura de `sqlite_master`; en PostgreSQL lee las columnas `geography` y `vector` con su tipo, así que no muestran diferencias falsas.

Ejemplo de resultado, tras añadir la propiedad `phone` a `Customers` en el modelo:

```yaml
- name: default
  entities:
    - name: Customers
      mapping: customers
      differences:
        - column phone missing in the database
```

Resultado cuando la base de datos está sincronizada con el modelo:

```yaml
- name: default
  entities: []
```

## CLI {#cli}

```sh
lambdaorm fetch -s default -o yaml
```

| Opción | Descripción |
|--------|-------------|
| `-w`, `--workspace` | Carpeta del proyecto (por defecto: la carpeta actual). |
| `-s`, `--stage` | Nombre del stage (por defecto: el primer stage). |
| `-e`, `--envfile` | Archivo de variables de entorno que se lee. |
| `-o`, `--output` | Formato de salida: `json`, `beautiful`, `light` o `yaml`. |

**El comando termina con código 1 cuando hay diferencias** (y con 0 cuando las bases de datos están sincronizadas), por lo que se puede usar en CI para detectar desviaciones:

```sh
lambdaorm fetch -s default || echo "the database differs from the model"
```

Ver el [laboratorio de la CLI](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/10-fetch).

## Node {#node}

`orm.stage.fetch()` devuelve las diferencias. Para leer los mappings de las bases de datos tal como están (todas las tablas y columnas), se usa `orm.stage.read()`.

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

Ver el [laboratorio de Node](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/10-fetch).
