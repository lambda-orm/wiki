# Lenguaje de consultas {#query-language}

Esta página presenta el lenguaje de consultas de λORM: cómo es una consulta, qué tipos de consultas hay y dónde se documenta cada uno.

Las consultas de λORM se escriben como [expresiones lambda de JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) sobre las entidades del dominio. Se pueden escribir como código TypeScript/JavaScript, navegando por las entidades del modelo, o enviar como un string (por ejemplo desde la [CLI](../cli/index.md) o al [Data Gateway](../data-gateway/index.md)).

λORM traduce cada consulta al lenguaje del motor de base de datos de cada fuente (SQL para MySQL, MariaDB, PostgreSQL, SQL Server, Oracle y SQLite, pipelines de agregación de MongoDB, o peticiones HTTP a una API REST para una [fuente Http](../schema/HttpSource.md)). Una consulta también puede combinar entidades de distintas fuentes: ver [Consultas entre fuentes](CrossSource.md).

## JavaScript sobre tu dominio {#javascript-over-your-domain}

Una consulta de λORM es **el código que escribirías sobre un array de objetos**. Toma una lista de productos en memoria:

```typescript
// an array in memory: plain JavaScript
products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort((a, b) => b.price - a.price)
```

La misma intención, como consulta de λORM sobre los `Products` del dominio:

```typescript
// a λORM query: the same lambdas, over the domain
Products
  .filter(p => p.category.name == 'Beverages' && p.price > 20)
  .map(p => ({ name: p.name, category: p.category.name, price: p.price }))
  .sort(p => desc(p.price))
```

que λORM ejecuta en PostgreSQL como:

```sql
SELECT p.ProductName AS "name", c.CategoryName AS "category", p.UnitPrice AS "price"
FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (c.CategoryName = 'Beverages' AND p.UnitPrice > 20)
ORDER BY p.UnitPrice desc
```

La consulta no nombró ninguna tabla, columna ni join: basta con `p.category.name`, y el mapping del esquema indica que
`Products` es la tabla `Products`, `name` la columna `ProductName` y la relación `category` un join sobre
`CategoryID`.

`filter`, `map`, `sort`, `includes`, `p.category.name`: arrow functions, rutas de propiedades y operadores de
JavaScript. λORM lee esa expresión y la convierte en SQL, en un pipeline de MongoDB o en llamadas a una API REST. Eso es
lo que lo distingue de otros ORMs y lenguajes de consulta:

| | λORM | Otros enfoques |
| --- | --- | --- |
| **El lenguaje** | lambdas de JavaScript, como con un array | SQL en strings, un query builder propio (`.where('price', '>', 20)`) o un DSL (GraphQL, JPQL, HQL) |
| **Qué nombra una consulta** | el dominio: `p.category.name`, `p.details` | tablas, columnas y joins, o los nombres de una base de datos concreta |
| **Relaciones** | se siguen con un punto (`p.category.name`): λORM escribe los joins, o las consultas por fuente | joins escritos a mano, o una API para cargarlas |
| **Dónde se ejecuta** | MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, SQLite, MongoDB, APIs REST, varias a la vez | normalmente una sola familia de motores |
| **Dónde la escribes** | código TypeScript, un string, la CLI, REST, WebSocket, MCP, el IDE: el mismo texto | una forma distinta para cada uno |

### Transparente en TypeScript y JavaScript {#transparent-in-typescript-and-javascript}

En una aplicación, una consulta es código. `lambdaorm build` genera el modelo del dominio (`Orders`, `Customers`…, ver
[Uso del esquema](../schema/Schema-Use.md)) y una consulta es una función sobre él: sus parámetros son los parámetros
de la consulta.

```typescript
import { orm } from '@lambdaorm/lib'
import { Orders } from './domain/model'

const ordersOf = (country: string) => Orders
  .filter(p => p.customer.country == country)
  .map(p => ({ id: p.id, customer: p.customer.name, date: p.orderDate }))

const result = await orm.execute(ordersOf, { country: 'Germany' })
```

- **IntelliSense:** el editor completa las entidades, sus propiedades y sus relaciones, como con cualquier objeto
  tipado; un nombre incorrecto es un error de compilación, no una sorpresa en tiempo de ejecución.
- **Refactorización y revisión:** una consulta se lee como el resto del código, y la entiende cualquiera que sepa
  JavaScript.
- **Resultados tipados:** las [consultas con nombre](../usage/TypedQueries.md) del esquema obtienen el tipo de su
  resultado.

### El mismo texto en todas partes {#the-same-text-everywhere}

La misma expresión viaja como string donde no hay TypeScript: la [CLI](../cli/index.md), las APIs REST, WebSocket y
MCP del [Data Gateway](../data-gateway/index.md), o un agente de IA. En el [IDE del Data Gateway](../ide/Queries.md),
el editor de consultas la completa mientras escribes, a partir del esquema: entidades, propiedades y relaciones
(`p.customer.` lista las propiedades de `Customers`), y el [asistente de consultas](../ide/QueryWizard.md) la construye
por ti.

El mismo lenguaje se usa en el propio esquema: los filtros de las [vistas](../schema/Views.md), las condiciones de los
stages, las restricciones y los valores por defecto también son expresiones lambda.

## Tipos de consultas {#query-types}

### DQL {#dql}

Las consultas DQL (Data Query Language) obtienen datos. Pueden ser tan simples como leer todos los registros de una entidad, o pueden filtrar, ordenar, agrupar y paginar los registros, calcular valores a partir de ellos y cargar entidades relacionadas.

**Ver:** [Select](Select.md), [Join](Join.md), [Agrupación](Grouping.md), [Include](Include.md), [JSON, vectores y puntos](JsonVectorsPoints.md), [Consultas entre fuentes](CrossSource.md)

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
