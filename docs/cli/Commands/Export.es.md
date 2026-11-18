# Export {#export}

Exporta los datos de las bases de datos de un stage a un archivo JSON, `<stage>-export.json`, en la carpeta de destino. El archivo se puede cargar con [import](Import.md).

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage (por defecto: el primer stage del esquema). |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| target | `-t` | Carpeta donde se escribe el archivo de exportación (por defecto: el directorio actual). |
| force | `-f` | Si una sentencia falla, continúa con las siguientes. |
| url | `-u` | URL del esquema en un [Data Gateway](../../data-gateway/index.md), para ejecutar el comando allí. |

## Ejemplo {#example}

```sh
lambdaorm export -w lab/countries -e lab/countries/.env -t ./lab/countries/data
```
