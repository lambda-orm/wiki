# Esquema {#schema}

Esta sección explica el esquema de λORM: qué contiene, cómo se define y se usa, y cómo se sincroniza con las bases de datos.

El esquema contiene toda la configuración que necesita el ORM. Separa el modelo de negocio (**dominio**) de la persistencia de los datos (**infraestructura**):

- En el dominio, las entidades y los enums que representan el modelo de negocio quedan completamente limpios, sin ningún atributo que los acople a la persistencia.
- Todas las consultas se escriben sobre el modelo de negocio, por lo que quedan desacopladas del modelo físico de los datos.
- En la infraestructura se define todo lo necesario para guardar y leer los datos en las distintas fuentes (bases de datos).

El esquema se puede escribir en un archivo YAML o JSON (normalmente `lambdaORM.yaml`), o pasarse como objeto al inicializar el ORM.

Sus fuentes pueden ser bases de datos (MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB, SQLite) y APIs REST, mezcladas en el mismo stage.

Todas las expresiones que se usan para definir condiciones y acciones las evalúa el motor de expresiones [3xpr](https://www.npmjs.com/package/3xpr).

## De un vistazo {#at-a-glance}

Una consulta se escribe sobre el **dominio**. Las **vistas** deciden qué ve de él cada rol, y la **infraestructura** decide dónde vive cada entidad: su mapping nombra las tablas y columnas, y las reglas del stage envían cada sentencia a su fuente.

![El schema: dominio, vistas y aplicación, infraestructura y sus fuentes](images/schema-anatomy.svg)

## Ejemplo {#example}

Este ejemplo muestra un stage que usa dos fuentes: la fuente 1 es MySQL y contiene la tabla `Countries`, y la fuente 2 es PostgreSQL y contiene la tabla `States`.

Para la entidad `Countries`, los nombres de la tabla y de sus columnas son los mismos que los de la entidad y sus propiedades, así que no hace falta escribir ningún mapping.
Para la entidad `States`, los nombres de la tabla y de sus columnas son distintos, así que el mapping los define.

![Stage stage1: States en PostgreSQL con su mapping, el resto en MySQL](images/schema5.svg)

## En esta sección {#in-this-section}

- [Definición](SchemaDefinition.md): todas las claves del esquema.
- [Expresiones](SchemaDefinition-Expressions.md), [Variables de entorno](SchemaDefinition-EnvironmentVariables.md) y [Entidades compuestas](SchemaDefinition-Composite.md).
- [Uso del esquema](Schema-Use.md): cómo cargar el esquema y generar el modelo.
- Ejemplos: [Básico](SchemaExample-Basic.md), [Extend](SchemaExample-Extend.md), [Varios stages](SchemaExample-MultiplesStages.md), [Stage con varias fuentes](SchemaExample-StageMultiplesSources.md), [Compuesto](SchemaExample-Composite.md) y [Listener](SchemaExample-Listener.md).
- [Vistas](Views.md), [Contexto y filtros de filas](Context.md), [Observabilidad](Observability.md) y [Una API REST como fuente](HttpSource.md).
- [Sincronización](SchemaSynchronization.md): push, pull, fetch, introspect, incorporate, [migraciones](SchemaSynchronization-Migrations.md) y [seed](SchemaSynchronization-Seed.md).
- [Motores de base de datos](Engines.md): diferencias entre los motores de base de datos (PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite y MongoDB).

El [Data Gateway](../data-gateway/index.md) publica un esquema en la red; su propia configuración está en un [archivo de configuración](../data-gateway/Configuration.md) aparte.
