# Init {#init}

Genera la estructura de un proyecto λORM: la carpeta del workspace y su archivo de esquema (`lambdaORM.yaml`), con una
fuente, un mapping y un stage.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: `my-project`). |
| source | `-s` | Nombre de la fuente de datos. |
| dialect | `-d` | Motor de base de datos del proyecto (`MySQL`, `MariaDB`, `PostgreSQL`, `SqlServer`, `Oracle`, `MongoDB`, `SQLjs`). Por defecto: `MySQL`. |
| connection | `-c` | Cadena de conexión de la base de datos. |
| data-path | | Ruta relativa de la carpeta de datos en el workspace (`--data-path`). |
| url | `-u` | URL de un esquema en un Data Gateway: el proyecto se crea con el dominio de ese esquema, para usarlo con el [cliente de Node.js](../../data-gateway/Clients.md). |

Sin `-c`, la fuente recibe una conexión local para el dialecto (por ejemplo `localhost:5432` para PostgreSQL, o el
archivo `data.sqlite` para `SQLjs`), que hay que reemplazar por la propia, idealmente con una
[variable de entorno](../../schema/SchemaDefinition-EnvironmentVariables.md). Si el archivo del esquema ya existe,
`init` lo completa en lugar de reemplazarlo. También agrega la carpeta de logs de λORM a `.gitignore`. Después,
[build](Build.md) genera el código y [push](Push.md) crea las tablas.

## Ejemplo {#example}

```sh
lambdaorm init -w lab/countries -d PostgreSQL
```
