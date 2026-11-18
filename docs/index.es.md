# λORM {#orm}

[![versión de npm](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![lenguaje typescript](https://img.shields.io/badge/language-typescript-blue)](https://www.npmjs.com/package/@lambdaorm/lib)
[![Licencia: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Únete a la comunidad en GitHub Discussions](https://img.shields.io/badge/Join%20the%20community-on%20GitHub%20Discussions-blue.svg)](https://github.com/lambda-orm/wiki/discussions)
[![Slack](https://img.shields.io/badge/chat-on%20slack-orange)](https://join.slack.com/t/nuevoespaciod-xo58767/shared_invite/zt-29ix7pc2r-Wd_ZBWnWRDv_5DM4NPtVhQ)
[![Gitter](https://badges.gitter.im/lambdaorm/community.svg)](https://app.gitter.im/#/room/#lambdaorm-how-to-contribute:gitter.im)
[![Discord](https://img.shields.io/badge/chat-on%20discord-orange)](https://discord.com/invite/yXT6XBX2)

λORM (LambdaORM) es un ORM de TypeScript que ejecuta **consultas distribuidas** sobre distintos motores de base de datos: MySQL,
MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB y SQLite.

Las consultas se escriben como **expresiones lambda** sobre un **modelo de dominio** independiente de la infraestructura. Una
sola consulta puede leer o escribir entidades almacenadas en distintas bases de datos —por ejemplo, unas en MySQL, otras en
PostgreSQL y otras en MongoDB— y λORM la divide en una sentencia por fuente y une los resultados.

Un mismo dominio puede tener varios **stages** (escenarios de infraestructura). En un stage los datos pueden estar repartidos entre SQL
Server, MongoDB y Oracle; en otro, todo puede residir en una única base de datos PostgreSQL. Esto permite
implementar patrones como [CQRS](https://microservices.io/patterns/data/cqrs.html) mediante configuración, sin
cambiar el código.

Consulta las [características](Features.md) para ver la lista completa.

## Cómo usarlo {#how-to-use-it}

| Forma | Paquete | Cuándo usarla |
| --- | --- | --- |
| Librería de Node.js | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | Ejecutar consultas desde una aplicación Node.js / TypeScript. Véase [Uso](usage/Usage.md). |
| Línea de comandos | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) (comando `lambdaorm`) | Crear un proyecto, sincronizar las bases de datos, importar y exportar datos y ejecutar consultas desde una terminal o desde CI. Véase [CLI](cli/index.md). |
| Data Gateway | Imagen Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | Exponer esquemas de λORM a través de la red: una API REST, MCP para agentes de IA, una API WebSocket y una UI web. Véase [Data Gateway](data-gateway/index.md). |
| Cliente de Node.js | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | Ejecutar las mismas consultas desde Node.js contra un Data Gateway. Véase [Clientes](data-gateway/Clients.md). |

```sh
npm install @lambdaorm/lib      # the library
npm install -g @lambdaorm/cli   # the lambdaorm command
```

!!! note "Nota"
    Los paquetes sin scope `lambdaorm`, `lambdaorm-cli` y `lambdaorm-client-node` ya no se mantienen: hay que usar los
    paquetes `@lambdaorm/*`.

## Lenguaje de consultas {#query-language}

La siguiente consulta devuelve el precio más alto de cada categoría de productos, considerando solo los productos que cumplen el
filtro y las categorías cuyo precio más alto supera 50:

```typescript
import { orm } from '@lambdaorm/lib'
import { Products } from './northwind/domain/model'

const query = (country: string) => Products
  .filter(p => (p.price > 5 && p.supplier.country == country) || (p.inStock < 3))
  .having(p => max(p.price) > 50)
  .map(p => ({ category: p.category.name, largestPrice: max(p.price) }))
  .sort(p => desc(p.largestPrice))

await orm.init('./lambdaORM.yaml')
// run the query, passing the value of the country parameter
const result = await orm.execute(query, { country: 'ARG' })
await orm.end()
```

En esta consulta:

- `filter` conserva los productos cuyo precio es mayor que 5 y cuyo proveedor está en el país indicado, así como
  los que tienen menos de 3 unidades en stock.
- `map` devuelve el nombre de la categoría y el precio más alto. La agrupación es implícita: los productos se agrupan por categoría
  porque `max` es una función de agregación.
- `having` conserva solo las categorías cuyo precio más alto es mayor que 50.
- `sort` ordena el resultado por el precio más alto, en orden descendente.
- `supplier` y `category` son relaciones: los joins son implícitos.

**Véase también:** [lenguaje de consultas](queries/Query-Language.md) |
[select](queries/Select.md) |
[join](queries/Join.md) |
[agrupación](queries/Grouping.md) |
[include](queries/Include.md) |
[insert](queries/Insert.md) |
[inserción masiva](queries/BulkInsert.md) |
[update](queries/Update.md) |
[delete](queries/Delete.md) |
[metadatos](queries/Metadata.md) |
[repositorio](usage/Repository.md) |
[uso](usage/Usage.md)

### Include {#include}

`include` devuelve una entidad junto con sus relaciones en la misma consulta, incluso cuando están almacenadas en distintas
bases de datos. En este ejemplo la consulta se escribe como una cadena, una alternativa a la expresión lambda:

```typescript
import { orm } from '@lambdaorm/lib'

(async () => {
  try {
    await orm.init('./config/northwind.yaml')
    const query = `Orders
      .filter(p => p.id === id)
      .include(p => [
        p.customer.map(p => p.name),
        p.details
          .include(p => p.product
            .include(p => p.category.map(p => p.name))
            .map(p => p.name))
          .map(p => [p.quantity, p.unitPrice])
      ])`
    const result = await orm.execute(query, { id: 102 }, { stage: 'PostgreSQL' })
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error(error.message)
  } finally {
    await orm.end()
  }
})()
```

**Resultado:**

```json
[
  {
    "id": 102,
    "customerId": "SPLIR",
    "employeeId": 7,
    "orderDate": "1996-11-07T23:00:00.000Z",
    "requiredDate": "1996-12-05T23:00:00.000Z",
    "shippedDate": "1996-11-14T23:00:00.000Z",
    "shipViaId": 1,
    "freight": 8.63,
    "name": "Split Rail Beer & Ale",
    "address": "P.O. Box 555",
    "city": "Lander",
    "region": "WY",
    "postalCode": "82520",
    "country": "USA",
    "customer": {
      "name": "Split Rail Beer & Ale"
    },
    "details": [
      {
        "quantity": 24,
        "unitPrice": 5.9,
        "product": {
          "name": "Tourtire",
          "category": {
            "name": "Meat/Poultry"
          }
        }
      }
    ]
  }
]
```

**Más información:** [include](queries/Include.md)

## Esquema {#schema}

El esquema define entidades, enumeraciones, índices, claves únicas, valores por defecto, restricciones, mappings, fuentes,
stages, listeners y más. Se escribe en YAML o JSON. Las condiciones y acciones usan el mismo
[lenguaje de expresiones](https://www.npmjs.com/package/3xpr) que las consultas.

**Véase también:** [esquema](schema/Schema.md) |
[definición](schema/SchemaDefinition.md) |
[uso](schema/Schema-Use.md) |
[expresiones](schema/SchemaDefinition-Expressions.md) |
[variables de entorno](schema/SchemaDefinition-EnvironmentVariables.md) |
[composición](schema/SchemaDefinition-Composite.md) |
[listeners](schema/SchemaExample-Listener.md) |
[múltiples stages](schema/SchemaExample-MultiplesStages.md) |
[múltiples fuentes](schema/SchemaExample-StageMultiplesSources.md) |
[motores de base de datos](schema/Engines.md)

### Sincronización {#synchronization}

λORM mantiene las bases de datos y el esquema sincronizados, en ambas direcciones:
[sincronización](schema/SchemaSynchronization.md) |
[push](schema/SchemaSynchronization-Push.md) |
[pull](schema/SchemaSynchronization-Pull.md) |
[fetch](schema/SchemaSynchronization-Fetch.md) |
[introspect](schema/SchemaSynchronization-Introspect.md) |
[incorporate](schema/SchemaSynchronization-Incorporate.md)

## Transacciones y scripts {#transactions-and-scripts}

- [Transacciones](usage/Transaction.md): `orm.transaction` ejecuta varias consultas en una sola transacción, también entre fuentes
  y stages.
- [Scripts](usage/Script.md): un caso de uso completo (variables, condiciones, bucles y varias consultas) en una sola transacción
  y en una única llamada, desde Node.js, la CLI o el Data Gateway.

## Labs {#labs}

Hay ejemplos completos disponibles en los [labs de λORM](labs/index.md).

## Proyectos relacionados {#related-projects}

- [λORM CLI](https://www.npmjs.com/package/@lambdaorm/cli): interfaz de línea de comandos de λORM.
- [Data Gateway](data-gateway/index.md): esquemas de λORM sobre REST, MCP y WebSocket, con una UI web.
- [Cliente de λORM](https://www.npmjs.com/package/@lambdaorm/client): cliente de Node.js para el Data Gateway.
- [3xpr](https://www.npmjs.com/package/3xpr): motor de expresiones extensible que evalúa expresiones matemáticas y
  lógicas; las consultas y los scripts de λORM se basan en él.
