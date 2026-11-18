# Características {#features}

Una introducción a lo que ofrece λORM, con enlaces a las páginas que describen cada característica.

## Motores de base de datos {#database-engines}

- MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB y SQLite (SQLjs).
- Una sola consulta puede involucrar varias bases de datos, incluso de motores distintos.
- [Motores de base de datos](schema/Engines.md): las diferencias entre motores (tipos, cadenas vacías, `upsert`, …).

## Lenguaje de consultas {#query-language}

- [Lenguaje de consultas](queries/Query-Language.md) basado en expresiones lambda de JavaScript.
- Las consultas se pueden escribir como código JavaScript/TypeScript o como una cadena.
- Cláusulas [select](queries/Select.md), [insert](queries/Insert.md), [inserción masiva](queries/BulkInsert.md),
  [update](queries/Update.md) y [delete](queries/Delete.md).
- [Joins](queries/Join.md) y [agrupaciones](queries/Grouping.md) implícitos.
- Carga anticipada (eager loading) de relaciones con [include](queries/Include.md), también entre bases de datos.
- [Operadores y funciones](queries/operatorsAndFunctions/OperatorsAndFunctions.md).
- [Metadatos de consultas](queries/Metadata.md): los parámetros, el modelo, las restricciones y el plan de ejecución de una consulta.

## Uso {#usage}

- [Repositorios y repositorios personalizados](usage/Repository.md).
- [Transacciones y transacciones distribuidas](usage/Transaction.md), entre fuentes y stages.
- [Scripts](usage/Script.md): un caso de uso completo (variables, condiciones, bucles y varias consultas) en una sola transacción,
  también a través del Data Gateway.
- [Ejemplos de uso](usage/Usage.md): una sola fuente, varias fuentes, CQRS y el cliente de Node.js.

## Esquema {#schema}

- Configuración del [esquema](schema/Schema.md) que desacopla el modelo de dominio de la infraestructura.
- Configuración en JSON o YAML.
- [Mappings](schema/SchemaDefinition.md) entre el dominio y la infraestructura.
- [Herencia de entidades](schema/SchemaExample-Extend.md) (`extends`).
- [Variables de entorno](schema/SchemaDefinition-EnvironmentVariables.md).
- Índices, claves únicas y restricciones.
- Condiciones y acciones basadas en el motor de expresiones [3xpr](https://www.npmjs.com/package/3xpr)
  ([expresiones](schema/SchemaDefinition-Expressions.md)).
- [Stages](schema/SchemaExample-MultiplesStages.md): varios escenarios de infraestructura para el mismo dominio.
- [Sincronización](schema/SchemaSynchronization.md) entre el esquema y las bases de datos:
  [push](schema/SchemaSynchronization-Push.md), [pull](schema/SchemaSynchronization-Pull.md),
  [fetch](schema/SchemaSynchronization-Fetch.md), [introspect](schema/SchemaSynchronization-Introspect.md) e
  [incorporate](schema/SchemaSynchronization-Incorporate.md).
- [Listeners y subscribers](schema/SchemaExample-Listener.md): se esperan (await) y se ejecutan en la transacción de la sentencia
  que los dispara.

## Rendimiento {#performance}

- [Inserción masiva](queries/BulkInsert.md).
- Consultas de alto rendimiento.
- Pool de conexiones.

## Herramientas y clientes {#tools-and-clients}

- Soporte para TypeScript y JavaScript.
- [CLI](cli/index.md) (`npm i -g @lambdaorm/cli`, comando `lambdaorm`).
- [Data Gateway](data-gateway/index.md) (imagen Docker `flaviorita/data-gateway`):
    - una API REST, MCP para agentes de IA y una API WebSocket, con varios esquemas por instancia;
    - credenciales con permisos, auditoría de escrituras, métricas y health checks;
    - una UI web: explorador, formularios de entidades, consultas guardadas y diagramas del dominio.
- [Clientes](data-gateway/Clients.md):
    - [cliente de Node.js](https://www.npmjs.com/package/@lambdaorm/client) (`@lambdaorm/client`, REST o WebSocket);
    - otros lenguajes: generar un cliente a partir del documento OpenAPI 3 del Data Gateway.
