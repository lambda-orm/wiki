# CLI de λORM {#orm-cli}

La CLI de λORM ([`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli)) es una aplicación de línea de comandos
para usar [λORM](https://www.npmjs.com/package/@lambdaorm/lib): crea proyectos, sincroniza las bases de datos con el
esquema, importa y exporta datos, y ejecuta consultas y scripts. Sus comandos se ejecutan localmente con un workspace
(`-w`), y la mayoría también se puede ejecutar en un [Data Gateway](../data-gateway/index.md) (`-u <url>`).

## Instalación {#installation}

Se instala el paquete de forma global; añade el comando `lambdaorm`:

```sh
npm i -g @lambdaorm/cli
lambdaorm --version
```

Requiere Node.js 20 o posterior. La imagen Docker del Data Gateway
([flaviorita/data-gateway](https://hub.docker.com/r/flaviorita/data-gateway)) ya incluye la CLI.

!!! note "Nota"
    El paquete sin scope `lambdaorm-cli` es el antiguo y ya no se mantiene.

## Comandos {#commands}

| Comando | Descripción |
| :-- | :-- |
| [version](Version.md) | Imprime la versión de la CLI y la versión de `@lambdaorm/lib` que usa el proyecto. |
| [init](Commands/Init.md) | Genera la estructura de un proyecto λORM. |
| [build](Commands/Build.md) | Genera el modelo y los repositorios para el lenguaje. |
| [schema](Commands/Schema.md) | Devuelve una parte del esquema: el dominio, una entidad, un mapping, los stages, las vistas… |
| [push](Commands/Push.md) | Sincroniza las bases de datos con el modelo (`-o` escribe los scripts en su lugar). |
| [pull](../schema/SchemaSynchronization-Pull.md) | Actualiza el esquema con la estructura de las bases de datos de un stage. |
| [fetch](Commands/Fetch.md) | Muestra las diferencias entre las bases de datos y el modelo; termina con código 1 cuando hay alguna. |
| [introspect](../schema/SchemaSynchronization-Introspect.md) | Lee y analiza un archivo de datos y actualiza el esquema. |
| [incorporate](../schema/SchemaSynchronization-Incorporate.md) | Actualiza el esquema a partir de un archivo de datos, aplica los cambios en las bases de datos e importa los datos. |
| [drop](Commands/Drop.md) | Elimina todos los objetos de base de datos, pero no la base de datos en sí. |
| [import](Commands/Import.md) | Importa datos de un archivo a las bases de datos. |
| [export](Commands/Export.md) | Exporta datos de las bases de datos. |
| [execute](Commands/Execute.md) | Ejecuta una consulta. |
| [script](Commands/Script.md) | Ejecuta un script: varias consultas en una sola transacción. |
| [plan](Commands/Plan.md) | Devuelve el plan de ejecución de una consulta. |
| [metadata](Commands/Metadata.md) | Devuelve los metadatos de una consulta. |
| [parameters](Commands/Parameters.md) | Devuelve los parámetros de una consulta. |
| [model](Commands/Model.md) | Devuelve el modelo del resultado de una consulta. |
| [constraints](Commands/Constraints.md) | Devuelve las restricciones de una consulta. |

`lambdaorm <command> -h` lista las opciones de un comando; `lambdaorm -h` lista los comandos.

El comando `sync` ya no existe: fue reemplazado por [push](Commands/Push.md).

## Opciones comunes {#common-options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (la carpeta con `lambdaORM.yaml`). Por defecto: el directorio actual. |
| stage | `-s` | Nombre del stage. Por defecto: el primer stage del esquema. |
| envfile | `-e` | Lee un archivo de variables de entorno (por ejemplo, las cadenas de conexión). |
| output | `-o` | Formato de salida del resultado: `json`, `beautiful`, `light` o `yaml`. En `push` y `drop`, imprime (o escribe) las sentencias en lugar de aplicarlas. |
| url | `-u` | URL del esquema en un Data Gateway, para ejecutar el comando allí en lugar de localmente. |

La página de cada comando lista las opciones que ese comando acepta.

## Código de salida y Data Gateway {#exit-code-and-data-gateway}

Todos los comandos terminan con código 1 cuando fallan (desde @lambdaorm/cli 1.6.3).

Los comandos se ejecutan en un Data Gateway con `-u` y la URL del esquema, por ejemplo `http://gateway:8080/iot/v1`.
Cuando la variable de entorno `SERVICE_TOKEN` está definida, se envía como `Authorization: Bearer <token>` (para un
gateway con [autenticación bearer](../data-gateway/Security.md#authentication)). Ver también [Clientes](../data-gateway/Clients.md#cli).

## Más {#more}

- [Referencia del código fuente](source/README.md)
- [Registro de cambios](CHANGELOG.md)
- [Labs de la CLI](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli)
