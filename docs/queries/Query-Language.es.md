# Lenguaje de consultas {#query-language}

Esta página presenta el lenguaje de consultas de λORM: cómo es una consulta, qué tipos de consultas hay y dónde se documenta cada uno.

Las consultas de λORM se escriben como [expresiones lambda de JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) sobre las entidades del dominio. Se pueden escribir como código TypeScript/JavaScript, navegando por las entidades del modelo, o enviar como un string (por ejemplo desde la [CLI](../cli/index.md) o al [Data Gateway](../data-gateway/index.md)).

λORM traduce cada consulta al lenguaje del motor de base de datos de cada fuente (SQL para MySQL, MariaDB, PostgreSQL, SQL Server, Oracle y SQLite, o consultas de MongoDB).

## Tipos de consultas {#query-types}

### DQL {#dql}

Las consultas DQL (Data Query Language) obtienen datos. Pueden ser tan simples como leer todos los registros de una entidad, o pueden filtrar, ordenar, agrupar y paginar los registros, calcular valores a partir de ellos y cargar entidades relacionadas.

**Ver:** [Select](Select.md), [Join](Join.md), [Agrupación](Grouping.md), [Include](Include.md)

### DML {#dml}

Las consultas DML (Data Manipulation Language) modifican datos. Incluyen las siguientes operaciones:

- **insert**: añade registros nuevos a una entidad (también `bulkInsert` y `upsert`).
- **update**: modifica registros existentes.
- **delete**: elimina registros.

**Ver:** [Insert](Insert.md), [Inserción masiva](BulkInsert.md), [Update](Update.md), [Delete](Delete.md)

### DDL {#ddl}

Las sentencias DDL (Data Definition Language) crean, modifican y eliminan estructuras de la base de datos y objetos relacionados:

- **CREATE**: crea objetos nuevos en la base de datos, como tablas e índices.
- **ALTER**: modifica la estructura de objetos existentes, por ejemplo añadiendo, cambiando o eliminando las columnas de una tabla.
- **DROP**: elimina objetos de la base de datos.

Las consultas DDL no se escriben: λORM las genera y las ejecuta cuando se usan los comandos de sincronización del esquema.

**Ver:** [Push](../schema/SchemaSynchronization-Push.md), [Pull](../schema/SchemaSynchronization-Pull.md), [Fetch](../schema/SchemaSynchronization-Fetch.md), [Introspect](../schema/SchemaSynchronization-Introspect.md), [Incorporate](../schema/SchemaSynchronization-Incorporate.md)

## Ejemplo {#example}

La siguiente consulta lee los países de una región, con sus estados cuyo nombre empieza por "F". Devuelve el nombre, la subregión y la posición de cada país, 3 países por página:

```typescript
Countries
	.filter(p => p.region == region)
	.map(p => [p.name, p.subregion, p.latitude, p.longitude]) // properties of the country
	.include(p => p.states.filter(p => substr(p.name, 1, 1) == "F") // states starting with 'F'
		.map(p => [p.name, p.latitude, p.longitude])
	)
	.page(1, 3) // first page, 3 countries per page
```

En este esquema, `Countries` está en una fuente MySQL y `States` en una fuente PostgreSQL (ver [Stage con varias fuentes](../schema/SchemaExample-StageMultiplesSources.md)). λORM ejecuta una sentencia por fuente:

```sql
-- MySQL: the countries of the region, first page of 3 records
SELECT c.name AS name, c.subregion AS subregion, c.latitude AS latitude, c.longitude AS longitude, c.iso3 AS `__iso3`
FROM Countries c
WHERE c.region = ?
ORDER BY c.name asc
LIMIT 0,3

-- PostgreSQL: the states starting with 'F' of the countries read above
SELECT s.NAME AS "name", s.LATITUDE AS "latitude", s.LONGITUDE AS "longitude", s.COUNTRY_CODE AS "LambdaOrmParentId"
FROM TBL_STATES s
WHERE SUBSTR(s.NAME,1,1) = 'F'
  AND s.COUNTRY_CODE IN (?)
```

Después, los estados se asocian a su país en memoria, de modo que cada país del resultado tiene un array `states`.

## Ventajas {#advantages}

- Las consultas se escriben en el mismo lenguaje de programación que la aplicación.
- No hay que aprender un lenguaje nuevo.
- Las consultas son fáciles de escribir y de leer.
- El IntelliSense del IDE ayuda a escribir las expresiones.
- Los errores de sintaxis se detectan mientras se escribe.
