# Push {#push}

Esta página explica push, que actualiza las fuentes (bases de datos) de un stage con el esquema: cómo funciona, el comando de la CLI `lambdaorm push` y el método `orm.stage.push()`.

## Cómo funciona push {#how-push-works}

Push lee las bases de datos del stage (como hace [fetch](SchemaSynchronization-Fetch.md)) y genera el DDL que las lleva al modelo:

- Las tablas que no existen se crean con su clave primaria, clave única, claves foráneas e índices.
- En las tablas existentes, se añaden las columnas que faltan (`ALTER TABLE … ADD`) y se modifican las columnas con otro tipo, longitud o nulabilidad.
- Una columna declarada con `previousMapping` en el mapping de su propiedad se renombra (`ALTER TABLE … RENAME COLUMN`, en SqlServer `sp_rename`) en lugar de añadirse. Ver [Renombrar una columna](SchemaDefinition.md#rename-a-column-with-previousmapping).
- **Push nunca elimina** nada que solo exista en la base de datos (tablas, columnas). `fetch` lo informa, para poder eliminarlo a mano si hace falta.
- Los tipos de columna siguen los tipos de propiedad y el `dbType` del mapping de la propiedad. Ver [Tipos de propiedad](SchemaDefinition.md#property-types).
- Cada entidad va a la fuente que eligen las reglas del stage; una fuente sin condición solo recibe las entidades que no tomó ninguna otra fuente.

Como la comparación se hace contra las bases de datos, push funciona igual en cualquier host o job de CI: no necesita la carpeta `orm_state` de un push anterior.
La carpeta `orm_state` se sigue escribiendo, como registro de lo que se aplicó.

No se admite renombrar una tabla.

## CLI {#cli}

Aplicar los cambios:

```sh
lambdaorm push
```

| Opción | Descripción |
|--------|-------------|
| `-w`, `--workspace` | Carpeta del proyecto (por defecto: la carpeta actual). |
| `-s`, `--stage` | Nombre del stage (por defecto: el primer stage). |
| `-e`, `--envfile` | Archivo de variables de entorno que se lee. |
| `-o`, `--output` | Genera el DDL sin aplicarlo (ver más abajo). |
| `-f`, `--force` | Cuando una sentencia falla, continúa con las siguientes. |

Ejemplo del DDL generado sobre una base de datos vacía:

```sql
CREATE TABLE Countries (name VARCHAR(80) NOT NULL ,iso3 VARCHAR(3) NOT NULL ,CONSTRAINT Countries_PK PRIMARY KEY (iso3));
ALTER TABLE Countries ADD CONSTRAINT Countries_UK UNIQUE (name);
CREATE TABLE States (id INTEGER NOT NULL ,name VARCHAR(80) NOT NULL ,countryCode VARCHAR(3) NOT NULL ,CONSTRAINT States_PK PRIMARY KEY (id));
ALTER TABLE States ADD CONSTRAINT States_UK UNIQUE (countryCode,name);
ALTER TABLE States ADD CONSTRAINT States_country_FK FOREIGN KEY (countryCode) REFERENCES Countries (iso3);
```

Tras añadir una propiedad `phone` a `Customers` y renombrar la columna `icon` a `icon_name` (con `previousMapping: icon`), un push genera solo esos cambios:

```sql
ALTER TABLE customers ADD phone VARCHAR(32);
ALTER TABLE categories RENAME COLUMN icon TO icon_name;
```

### Generar el DDL sin aplicarlo {#generate-the-ddl-without-applying-it}

Con `-o`, push genera el DDL pero no lo aplica.

- `-o` solo imprime las sentencias de cada fuente.
- `-o <dir>` escribe un script por cada fuente que cambia, con el nombre `<stage>.<source>.sql`. Las fuentes sin cambios no generan archivo, y una base de datos sincronizada con el modelo no genera ningún archivo.

```sh
lambdaorm push -s default -o migrations
```

```sh
migrations
├── default.catalog.sql
└── default.accounts.sql
```

Los nombres son deterministas, así que los scripts se pueden renombrar como migraciones versionadas y aplicarse con un proceso de despliegue propio.

### Archivos en orm_state {#files-in-orm_state}

Cuando push aplica los cambios, los registra en la carpeta `orm_state`:

```sh
├── orm_state
│   ├── default-model.json
│   └── main
│       └── V231122154351__push.sql
```

- `<stage>-model.json`: el modelo del stage en el último push.
- `<source>/V<yyMMddHHmmss>__push.sql`: las sentencias ejecutadas en esa fuente.

Laboratorios:

- [Simple](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/01-simple)
- [Dos stages](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/03-two-stages)
- [Northwind](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/05-northwind)
- [Northwind con varias fuentes de datos](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
- [Northwind CQRS](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs)

## Node {#node}

`orm.stage.push()` devuelve una acción que puede dar las sentencias sin aplicarlas, o aplicarlas:

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
		// apply them
		await orm.stage.push({ stage: 'default' }).execute()
	} finally {
		await orm.end()
	}
})()
```
