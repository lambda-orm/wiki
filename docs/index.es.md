# λORM {#orm}

[![npm version](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Escribe una consulta una vez. Ejecútala en cualquier base de datos, desde tu código, una terminal, una API o un agente de IA.**

λORM es un lenguaje de consultas y un motor de ejecución para tus datos. Describes tu **dominio** una sola vez
(entidades, relaciones, reglas) en un esquema y escribes las consultas como **expresiones lambda** sobre él:

```typescript
Orders
  .filter(p => p.customer.country == country && p.orderDate >= since)
  .include(p => [p.customer.map(c => c.name), p.details.include(d => d.product.map(p => p.name))])
```

λORM convierte esa consulta en SQL para **MySQL, MariaDB, PostgreSQL, SQL Server, Oracle y SQLite**, o en un pipeline
de agregación para **MongoDB**, incluso cuando las entidades de una misma consulta están en **bases de datos
distintas**. Y la misma consulta se ejecuta desde una librería de Node.js, la línea de comandos, una API REST o
WebSocket, o un agente de IA a través de MCP.

## Por qué λORM {#why-orm}

- **Un dominio, cualquier base de datos.** Las consultas hablan de `Orders` y `Customers`, no de tablas, dialectos ni
  de dónde se guarda cada entidad.
- **Una consulta sobre varias bases de datos.** Los pedidos en MongoDB, los clientes en PostgreSQL, los productos en
  MySQL: una consulta, un resultado. λORM la divide por fuente y une los resultados.
- **Stages.** El mismo dominio en un SQLite en desarrollo y distribuido en tres motores en producción, o un lado de
  escritura y uno de lectura ([CQRS](https://microservices.io/patterns/data/cqrs.html)), por configuración, no por
  código.
- **Todos los canales.** TypeScript (tipado), un texto, la CLI, REST, WebSocket, MCP: el mismo lenguaje en todas partes.
- **Acceso gobernado.** El [Data Gateway](data-gateway/index.md) publica tus esquemas con credenciales, permisos
  (`read`, `write`, …) y una auditoría de cada cambio, tanto para aplicaciones como para personas y agentes de IA.
- **Schema-first, en ambos sentidos.** De un YAML a las tablas (`push`), de las bases de datos al YAML (`pull`), o de
  un archivo JSON con datos a un esquema, sus tablas y sus filas (`incorporate`).

Consulta las [características](Features.md) para ver la lista completa.

## La misma consulta, desde cualquier lugar {#the-same-query-from-everywhere}

La expresión `Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])` es la misma en todos los canales.

### Node.js / TypeScript {#nodejs-typescript}

La librería, [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib). Véase [Uso](usage/Usage.md).

```typescript
import { orm } from '@lambdaorm/lib'

await orm.init('./lambdaORM.yaml')
const products = await orm.execute(
  (minPrice: number) => Products.filter(p => p.price > minPrice).map(p => [p.name, p.price]),
  { minPrice: 50 })
```

### Línea de comandos {#command-line}

El comando `lambdaorm`, [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli). Véase [CLI](cli/index.md).

```sh
lambdaorm execute -q "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])" -d '{"minPrice": 50}'
```

### API REST, desde cualquier lenguaje {#rest-api-from-any-language}

El [Data Gateway](data-gateway/index.md) publica el esquema por HTTP. Véase [API REST](data-gateway/Rest.md).

```sh
curl -X POST http://gateway:8080/northwind/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])", "data": {"minPrice": 50}}'
```

```python
import requests

products = requests.post("http://gateway:8080/northwind/execute", headers={"X-Api-Key": key}, json={
    "query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])",
    "data": {"minPrice": 50},
}).json()
```

### Cliente de Node.js {#nodejs-client}

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client): la interfaz de la librería, ejecutada en un
Data Gateway por REST o WebSocket. Véase [Clientes](data-gateway/Clients.md) y [API WebSocket](data-gateway/WebSocket.md).

```typescript
import { orm } from '@lambdaorm/client'

await orm.init('ws://gateway:8083/northwind', { headers: { 'X-Api-Key': key } })
const products = await orm.execute('Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])', { minPrice: 50 })
orm.on('schema.statusChanged', ({ status }) => console.log(status))
```

### Agentes de IA {#ai-agents}

El Data Gateway habla [MCP](data-gateway/Mcp.md): un agente explora el dominio y lo consulta con los permisos de su
credencial, nunca más.

```sh
claude mcp add --transport http northwind http://gateway:8081/northwind/mcp --header "X-Api-Key: $KEY"
```

> *"¿Qué productos cuestan más de 50?"*: el agente lee el dominio del esquema desde las herramientas y llama a
> `orm_execute` con `Products.filter(p => p.price > 50).map(p => [p.name, p.price])`. Con una credencial `read`, no
> puede modificar nada.

### El navegador {#the-browser}

El [IDE](ide/index.md) del Data Gateway, hecho con [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui):
se conecta a gateways, recorre los esquemas, muestra cada entidad como un formulario, escribe consultas con autocompletado y dibuja diagramas.

![La UI del Data Gateway](ide/images/ide-query.png)

## Una consulta, tres bases de datos {#one-query-three-databases}

Un stage del [lab de northwind](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
guarda el catálogo en MySQL, los clientes en PostgreSQL y los pedidos en MongoDB:

```yaml
stages:
  - name: default
    sources:
      - name: Catalog                                   # MySQL
        condition: entity.in(["Categories","Products"])
      - name: Crm                                       # PostgreSQL
        condition: entity.in(["Address","Customers"])
      - name: Ordering                                  # MongoDB
        condition: entity.in(["Orders","Orders.details"])
```

La aplicación no lo sabe. Pide los pedidos de un cliente con el nombre del cliente y, para cada línea, el producto y
su categoría:

```typescript
Orders
  .filter(p => p.customerId == customerId)
  .include(p => [
    p.customer.map(c => c.name),
    p.details
      .include(d => d.product.include(pr => pr.category.map(c => c.name)).map(pr => pr.name))
      .map(d => [d.quantity, d.unitPrice])
  ])
```

y `orm.plan` muestra lo que λORM va a ejecutar (abreviado):

```text
Orders            MongoDB     Ordering   aggregate [{ $match: { CustomerID: … } }, { $project: … }]
├─ Customers      PostgreSQL  Crm        SELECT c.CompanyName AS "name", … FROM Customers c WHERE c.CustomerID IN ($1)
└─ Orders.details MongoDB     Ordering   aggregate [{ $unwind: … }, { $match: { OrderID: { $in: … } } }, …]
   └─ Products    MySQL       Catalog    SELECT p.ProductName AS name, … FROM Products p WHERE p.ProductID IN (?)
      └─ Categories MySQL     Catalog    SELECT c1.CategoryName AS name, … FROM Categories c1 WHERE c1.CategoryID IN (?)
```

**Una consulta por relación, nunca una por fila:** cada nivel lee las claves del nivel anterior con un `IN`. Cuando
son muchas, las claves se dividen en bloques (como máximo 999 en Oracle, 7000 en los demás) que se ejecutan en
paralelo. El resultado es un único árbol JSON, como si todo estuviera en una sola base de datos. Véase
[include](queries/Include.md).

## Una consulta, el dialecto de cada motor {#one-query-each-engines-dialect}

```typescript
Products
  .filter(p => p.price > minPrice && p.category.name == category)
  .map(p => ({ name: p.name, price: p.price }))
  .sort(p => desc(p.price))
  .page(1, 10)
```

```sql
-- MySQL
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > ? AND c.CategoryName = ?) ORDER BY p.UnitPrice desc LIMIT 0,10

-- PostgreSQL
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > $1 AND c.CategoryName = $2) ORDER BY p.UnitPrice desc OFFSET 0 LIMIT 10

-- SQL Server
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > @minPrice AND c.CategoryName = @category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY

-- Oracle
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > :minPrice AND c.CategoryName = :category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

El join es implícito (`p.category.name`), los parámetros siempre van ligados y los nombres de las propiedades son los
del dominio (`price`), no los de las columnas (`UnitPrice`): el [mapeo](schema/SchemaDefinition.md) está en el esquema.
Véanse los [motores](schema/Engines.md) y el [lenguaje de consultas](queries/Query-Language.md).

## Stages: el mismo código, otra infraestructura {#stages-the-same-code-another-infrastructure}

```yaml
infrastructure:
  stages:
    - name: dev                  # everything in one database
      sources: [ { name: Local } ]
    - name: prod                 # the same domain, spread over three engines
      sources:
        - { name: Catalog,  condition: 'entity.in(["Categories","Products"])' }
        - { name: Crm,      condition: 'entity.in(["Address","Customers"])' }
        - { name: Ordering, condition: 'entity.in(["Orders","Orders.details"])' }
```

```typescript
await orm.execute(query, data, { stage: 'prod' })
```

Un stage de escritura y otro de lectura sobre bases de datos distintas es
[CQRS por configuración](schema/SchemaExample-MultiplesStages.md).

## Acceso gobernado: el Data Gateway {#governed-access-the-data-gateway}

El [Data Gateway](data-gateway/index.md) (Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway))
publica uno o varios esquemas por REST, WebSocket y MCP, con una UI web, sin escribir un backend:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: agent,   value: $AGENT_KEY,   permissions: [ read ] }
    - { name: backend, value: $BACKEND_KEY, permissions: [ read, write, script ] }
transports:
  http:       { port: 8080 }    # REST, OpenAPI
  mcpHttp:    { port: 8081 }    # agentes de IA
  management: { port: 9090 }    # el IDE (solo en la red interna; se omite en producción)
```

- Los mismos permisos en todos los transportes: un agente con `read` puede consultar, nunca escribir.
- Cada escritura deja una línea de auditoría: quién, qué, qué entidades, cuántas filas.
- Cada esquema en su propio worker; métricas de Prometheus, sondas de salud para Kubernetes, límites de tasa y de
  tamaño.

**Pruébalo en diez minutos:** [Primeros pasos](data-gateway/GettingStarted.md), desde una carpeta vacía hasta la API
REST, el IDE, MCP y WebSocket.

## El ecosistema {#the-ecosystem}

| Proyecto | Publicado como | Qué es |
| --- | --- | --- |
| [Librería](usage/Usage.md) | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | el ORM: ejecuta las consultas contra las bases de datos |
| [CLI](cli/index.md) | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) | el comando `lambdaorm`: proyectos, sincronización, importar / exportar, consultas, scripts |
| [Data Gateway](data-gateway/index.md) | Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | los esquemas por REST, MCP y WebSocket |
| [IDE del Data Gateway](ide/index.md) | Docker [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide) · [escritorio: Linux, Windows, macOS](ide/Download.md) | el IDE de los gateways: conexiones, explorador, consultas, diagramas, administración |
| [Cliente de Node.js](data-gateway/Clients.md) | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | la interfaz de la librería, ejecutada en un Data Gateway |
| [Componentes de UI](ide/Embedding.md) | [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui) | componentes de React: el editor de consultas, los resultados, el explorador y los diagramas |
| [3xpr](https://www.npmjs.com/package/3xpr) | [`3xpr`](https://www.npmjs.com/package/3xpr) | el motor de expresiones sobre el que se construyen las consultas, los scripts y las reglas del esquema |

El código fuente está en [github.com/lambda-orm/core](https://github.com/lambda-orm/core).

!!! note "Nota"
    Los paquetes sin scope `lambdaorm`, `lambdaorm-cli` y `lambdaorm-client-node` ya no se mantienen: usa los paquetes
    `@lambdaorm/*`.

## Primeros pasos {#get-started}

| Quiero… | Empieza aquí |
| --- | --- |
| consultar mis bases de datos desde Node.js / TypeScript | [Uso](usage/Usage.md) |
| crear un proyecto, sincronizar las bases de datos, importar datos | [CLI](cli/index.md) |
| dar acceso a mis datos a aplicaciones en cualquier lenguaje, o a agentes de IA | [Data Gateway: primeros pasos](data-gateway/GettingStarted.md) |
| aprender el lenguaje de consultas | [Lenguaje de consultas](queries/Query-Language.md) |
| definir el dominio, las fuentes y los stages | [Esquema](schema/Schema.md) |
| ver ejemplos completos | [Labs](labs/index.md) |

## Más información {#learn-more}

- **Consultas:** [lenguaje de consultas](queries/Query-Language.md) | [select](queries/Select.md) |
  [join](queries/Join.md) | [agrupación](queries/Grouping.md) | [include](queries/Include.md) |
  [insert](queries/Insert.md) | [bulk insert](queries/BulkInsert.md) | [update](queries/Update.md) |
  [delete](queries/Delete.md) | [metadatos](queries/Metadata.md) |
  [operadores y funciones](queries/operatorsAndFunctions/OperatorsAndFunctions.md)
- **Esquema:** [esquema](schema/Schema.md) | [definición](schema/SchemaDefinition.md) |
  [expresiones](schema/SchemaDefinition-Expressions.md) |
  [variables de entorno](schema/SchemaDefinition-EnvironmentVariables.md) |
  [composición](schema/SchemaDefinition-Composite.md) | [listeners](schema/SchemaExample-Listener.md) |
  [varios stages](schema/SchemaExample-MultiplesStages.md) |
  [varias fuentes](schema/SchemaExample-StageMultiplesSources.md) | [motores](schema/Engines.md)
- **Sincronización:** [visión general](schema/SchemaSynchronization.md) | [push](schema/SchemaSynchronization-Push.md) |
  [pull](schema/SchemaSynchronization-Pull.md) | [fetch](schema/SchemaSynchronization-Fetch.md) |
  [introspect](schema/SchemaSynchronization-Introspect.md) | [incorporate](schema/SchemaSynchronization-Incorporate.md)
- **Uso:** [uso](usage/Usage.md) | [repositorio](usage/Repository.md) | [transacciones](usage/Transaction.md) |
  [scripts](usage/Script.md)

## Comunidad {#community}

Las preguntas, ideas y comentarios son bienvenidos en [GitHub Discussions](https://github.com/lambda-orm/wiki/discussions)
y en [Discord](https://discord.com/invite/yXT6XBX2); los issues y pull requests, en
[github.com/lambda-orm/core](https://github.com/lambda-orm/core).
