# Import {#import}

Importa datos de un archivo a las bases de datos de un stage. El archivo tiene el formato que escribe [export](Export.md).

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage (por defecto: el primer stage del esquema). |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| data | `-d` | Datos a importar: la ruta de un archivo JSON, o JSON. |
| url | `-u` | URL del esquema en un [Data Gateway](../../data-gateway/index.md), para ejecutar el comando allí. |

## Ejemplo {#example}

```sh
lambdaorm import -w lab/countries -e lab/countries/.env -d ./lab/countries/data/default-export.json
```
