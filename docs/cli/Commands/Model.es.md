# Model {#model}

Devuelve el modelo del resultado de una expresión de consulta: los campos que devuelve, con sus tipos.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| query | `-q` | Expresión de consulta. |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| output | `-o` | Formato de salida: `json`, `beautiful`, `light` o `yaml`. |
| url | `-u` | URL del esquema en un [Data Gateway](../../data-gateway/index.md), para ejecutar el comando allí. |

## Ejemplo {#example}

```sh
lambdaorm model -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Resultado:

```json
[
  {
    "name": "id",
    "type": "integer"
  },
  {
    "name": "customerId",
    "type": "string"
  },
  {
    "name": "employeeId",
    "type": "integer"
  },
  {
    "name": "orderDate",
    "type": "dateTime"
  },
  {
    "name": "requiredDate",
    "type": "date"
  },
  {
    "name": "shippedDate",
    "type": "date"
  },
  {
    "name": "shipViaId",
    "type": "integer"
  },
  {
    "name": "freight",
    "type": "decimal"
  },
  {
    "name": "name",
    "type": "string"
  },
  {
    "name": "address",
    "type": "string"
  },
  {
    "name": "city",
    "type": "string"
  },
  {
    "name": "region",
    "type": "string"
  },
  {
    "name": "postalCode",
    "type": "string"
  },
  {
    "name": "country",
    "type": "string"
  },
  {
    "name": "details",
    "type": "Orders.details[]",
    "children": [
      {
        "name": "orderId",
        "type": "integer"
      },
      {
        "name": "productId",
        "type": "integer"
      },
      {
        "name": "unitPrice",
        "type": "decimal"
      },
      {
        "name": "quantity",
        "type": "decimal"
      },
      {
        "name": "discount",
        "type": "decimal"
      },
      {
        "name": "LambdaOrmParentId",
        "type": "integer"
      }
    ]
  }
]
```
