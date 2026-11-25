# Schema {#schema}

Devuelve una parte del esquema del proyecto, o de un esquema servido por un [Data Gateway](../../data-gateway/index.md)
con `-u`: el esquema completo, el dominio, una entidad, un mapping, un stage o las vistas. Sirve para inspeccionar lo
que λORM cargó, con las variables de entorno resueltas y las entidades heredadas completas.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| path | `-p` | La parte del esquema a devolver (obligatoria); ver abajo. |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| output | `-o` | Formato de salida: `json`, `beautiful`, `light` o `yaml`. |
| url | `-u` | URL del esquema en un [Data Gateway](../../data-gateway/index.md), para ejecutar el comando allí. |

| Ruta | Devuelve |
| :-- | :-- |
| `schema` | El esquema completo. |
| `schema/version` | La versión del esquema. |
| `domain` | El dominio: entidades y enumeraciones. |
| `entities`, `entities/<nombre>` | Las entidades, o una de ellas. |
| `enums`, `enums/<nombre>` | Las enumeraciones, o una de ellas. |
| `sources/<nombre>` | Una fuente. |
| `mappings`, `mappings/<nombre>`, `mappings/<nombre>/<entidad>` | Los mappings, uno de ellos, o el mapping de una entidad. |
| `stages`, `stages/<nombre>` | Los stages, o uno de ellos. |
| `views` | Las vistas. |

Una ruta desconocida imprime `the path … is not valid` y termina con código 1.

## Ejemplos {#examples}

```sh
lambdaorm schema -w lab/northwind -p entities/Orders -o yaml
lambdaorm schema -u http://gateway:8080/northwind -p mappings/default/Customers -o beautiful
```
