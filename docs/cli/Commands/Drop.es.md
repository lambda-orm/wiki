# Drop {#drop}

Elimina todos los objetos de base de datos de un stage, pero no la base de datos en sí. Con `-o`, imprime las sentencias en lugar de ejecutarlas.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage (por defecto: el primer stage del esquema). |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| output | `-o` | Genera las sentencias pero no las aplica. |
| force | `-f` | Si una sentencia falla, continúa con las siguientes. |
| url | `-u` | URL del esquema en un [Data Gateway](../../data-gateway/index.md), para ejecutar el comando allí. |

## Ejemplo {#example}

```sh
lambdaorm drop -w lab/countries -e lab/countries/.env
```
