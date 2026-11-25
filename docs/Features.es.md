# Características {#features}

Un resumen de lo que λORM hace hoy, con enlaces a las páginas que describen cada característica.

## Fuentes {#sources}

- Bases de datos: MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB y SQLite (con sql.js, dialecto `SQLjs`).
- [Una API REST como fuente](schema/HttpSource.md): el dialecto `Http`, con OAuth2 client credentials y headers
  reenviados desde el contexto de quien llama.
- Una consulta puede involucrar varias fuentes, incluso de motores distintos; los
  [stages](schema/SchemaExample-MultiplesStages.md) deciden dónde se guarda cada entidad.
- [Motores](schema/Engines.md): en qué se diferencian (tipos, cadenas vacías, `upsert`, …).

## Lenguaje de consultas {#query-language}

- Un [lenguaje de consultas](queries/Query-Language.md) basado en expresiones lambda de JavaScript, escrito como
  código TypeScript o como string.
- [Select](queries/Select.md), [insert](queries/Insert.md), [bulk insert](queries/BulkInsert.md),
  [update](queries/Update.md) y [delete](queries/Delete.md).
- [Joins](queries/Join.md) implícitos y [agrupación](queries/Grouping.md).
- Carga anticipada de relaciones con [include](queries/Include.md), también entre bases de datos: una consulta por
  relación, nunca una por fila.
- [Consultas entre fuentes](queries/CrossSource.md): filtrar, proyectar, agrupar y ordenar por campos de relaciones
  guardadas en otras fuentes.
- [Rutas JSON, vectores y puntos](queries/JsonVectorsPoints.md): `p.meta.address.zip` y `jsonSet`;
  `cosineDistance`, `l2Distance` e `innerProduct` para la búsqueda por similitud (RAG); `distance` en metros, `within`
  e `inside` (un polígono) para geografía.
- [Operadores y funciones](queries/operatorsAndFunctions/OperatorsAndFunctions.md).
- [Metadatos de consultas](queries/Metadata.md): los parámetros, el modelo, las restricciones y el plan de ejecución
  de una consulta, sin ejecutarla.

## Escrituras {#writes}

- Inserciones con sus hijos (`Orders.insert().include(p => p.details)`), [bulk insert](queries/BulkInsert.md),
  `upsert`, `bulkMerge` y `bulkDelete`.
- `update` y `delete` responden la cantidad de filas afectadas: 0 significa que no se encontró, o un conflicto con el
  bloqueo optimista.
- `update().include()` de una relación compuesta guarda el agregado completo.

## Uso {#usage}

- [Ejemplos de uso](usage/Usage.md): una sola fuente, varias fuentes, CQRS y el cliente de Node.js.
- [Repositorios](usage/Repository.md), generados por `lambdaorm build` y extendidos con métodos propios.
- [Transacciones](usage/Transaction.md) entre fuentes y stages.
- [Scripts](usage/Script.md): un caso de uso completo (variables, condiciones, bucles y varias consultas) en una sola
  transacción, también a través del Data Gateway.
- [Cambios de los datos y outbox](usage/DataEvents.md): `orm.onDataChange` después de cada commit, y un outbox escrito
  en la misma transacción.
- [Consultas tipadas](usage/TypedQueries.md): consultas con nombre en el esquema y los tipos de sus resultados.

## Esquema {#schema}

- Un [esquema](schema/Schema.md) en YAML o JSON que desacopla el dominio de la infraestructura.
- [Mappings](schema/SchemaDefinition.md) entre el dominio y las bases de datos, y
  [herencia de entidades](schema/SchemaExample-Extend.md) (`extends`).
- [Variables de entorno](schema/SchemaDefinition-EnvironmentVariables.md) para las conexiones y los secretos.
- Índices, claves únicas, restricciones, valores por defecto y propiedades calculadas, escritos como
  [expresiones](schema/SchemaDefinition-Expressions.md) de [3xpr](https://www.npmjs.com/package/3xpr).
- [Stages](schema/SchemaExample-MultiplesStages.md): varias infraestructuras para el mismo dominio (desarrollo,
  producción, CQRS).
- [Listeners y subscribers](schema/SchemaExample-Listener.md): se esperan (await) y se ejecutan en la transacción de la
  sentencia que los dispara.

## Control de acceso {#access-control}

- [Vistas](schema/Views.md): restringen entidades y propiedades, las enmascaran, agregan calculadas y marcan los datos
  personales (PII).
- [Contexto y filtros de filas](schema/Context.md): quién ejecuta una consulta y las filas que ve cada vista.
- El [Data Gateway](data-gateway/Security.md): credenciales con permisos y una auditoría de cada escritura.

## Sincronización y migraciones {#synchronization-and-migrations}

- [Sincronización](schema/SchemaSynchronization.md) entre el esquema y las bases de datos:
  [push](schema/SchemaSynchronization-Push.md), [pull](schema/SchemaSynchronization-Pull.md),
  [fetch](schema/SchemaSynchronization-Fetch.md) (las diferencias, con código de salida 1 para CI),
  [introspect](schema/SchemaSynchronization-Introspect.md) e
  [incorporate](schema/SchemaSynchronization-Incorporate.md).
- [Migraciones](schema/SchemaSynchronization-Migrations.md): los cambios que pueden perder datos detienen `push` salvo
  que se permitan, cada cambio se escribe con su deshacer, y `migrate` vuelve a una versión.
- [Seed](schema/SchemaSynchronization-Seed.md): los datos con los que empieza un stage, insertados solo donde faltan.

## Rendimiento y operación {#performance-and-operations}

- [Inserción masiva](queries/BulkInsert.md), e includes que leen las claves de cada nivel con `IN`, en lotes que se
  ejecutan en paralelo.
- Pool de conexiones.
- [Observabilidad](schema/Observability.md): logs, métricas y trazas con OpenTelemetry.

## Herramientas y clientes {#tools-and-clients}

- La [CLI](cli/index.md) (`npm i -g @lambdaorm/cli`, comando `lambdaorm`): proyectos, generación de código,
  sincronización, importación y exportación, consultas y scripts.
- El [Data Gateway](data-gateway/index.md) (imagen Docker `flaviorita/data-gateway`):
    - [REST](data-gateway/Rest.md), [WebSocket](data-gateway/WebSocket.md) y [MCP](data-gateway/Mcp.md) para agentes
      de IA, con varios esquemas por instancia;
    - [credenciales con permisos](data-gateway/Security.md), auditoría de escrituras, métricas y health checks.
- El [IDE](ide/index.md) del Data Gateway (Docker o escritorio): conexiones, explorador, formularios de entidades,
  consultas con autocompletado, diagramas y administración; sus componentes de React son
  [`@lambdaorm/ui`](ide/Embedding.md).
- [Clientes](data-gateway/Clients.md):
    - el cliente de Node.js (`@lambdaorm/client`, REST o WebSocket), con la interfaz de la librería;
    - otros lenguajes: generar un cliente a partir del documento OpenAPI 3 del Data Gateway.
