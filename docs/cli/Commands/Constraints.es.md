# Constraints {#constraints}

Devuelve las restricciones que se comprueban al ejecutar una expresión de consulta.

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
lambdaorm constraints -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Resultado:

```json
{
  "entity": "Orders",
  "constraints": [],
  "children": [
    {
      "entity": "Orders.details",
      "constraints": []
    }
  ]
}
```
