# Execute {#execute}

Ejecuta una expresión de consulta e imprime su resultado.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage (por defecto: el primer stage del esquema). |
| query | `-q` | Expresión de consulta. |
| data | `-d` | Datos (parámetros) de la consulta: JSON, o la ruta de un archivo JSON. |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| output | `-o` | Formato de salida: `json`, `beautiful`, `light` o `yaml`. |
| url | `-u` | URL del esquema en un [Data Gateway](../../data-gateway/index.md), para ejecutar el comando allí. |

## Ejemplos {#examples}

### Inserción masiva {#bulk-insert}

Inserta los países de un archivo JSON, con sus estados:

```sh
lambdaorm execute -w lab/countries -e lab/countries/.env -q "Countries.bulkInsert().include(p => p.states)" -d ./lab/countries/countries.json
```

### Consulta {#query}

```sh
lambdaorm execute -e ".env" -o beautiful -q "Products.distinct(p => ({ quantity: p.quantity, category: p.category.name })).sort(p => p.category).page(1,3)"
```

Resultado:

```json
[
  {
    "quantity": "10 boxes x 20 bags",
    "category": "Beverages"
  },
  {
    "quantity": "24 - 12 oz bottles",
    "category": "Beverages"
  },
  {
    "quantity": "12 - 355 ml cans",
    "category": "Beverages"
  }
]
```

### En un Data Gateway {#on-a-data-gateway}

```sh
lambdaorm execute -u http://gateway:8080/iot/v1 -o beautiful -q "Devices.filter(p => p.status == status)" -d '{"status": "active"}'
```

Con autenticación bearer, el token se indica en la variable de entorno `SERVICE_TOKEN` (ver la [CLI](../index.md#exit-code-and-data-gateway)).
