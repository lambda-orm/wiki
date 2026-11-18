# Fetch {#fetch}

Muestra las diferencias entre las bases de datos de un stage y el modelo: por mapping, las entidades que difieren
(ausentes en uno de los lados, con columnas, tipos, longitudes, nulabilidad o clave primaria distintos), cada una con
sus `differences`. La lista de entidades está vacía cuando las bases de datos están al día con el modelo. No se comparan
las relaciones ni los índices.

**Termina con código 1 cuando hay diferencias**, por lo que se puede usar en CI.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage (por defecto: el primer stage del esquema). |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| output | `-o` | Formato de salida: `json`, `beautiful`, `light` o `yaml`. |
| url | `-u` | URL del esquema en un [Data Gateway](../../data-gateway/index.md), para ejecutar el comando allí. |

## Ejemplo {#example}

```sh
lambdaorm fetch -w lab/countries -e lab/countries/.env -o beautiful || echo "the database differs from the model"
```

Resultado:

```json
[
  {
    "name": "default",
    "entities": [
      {
        "name": "Countries",
        "mapping": "Countries",
        "differences": ["column phone missing in the database"],
        "properties": [ ... ]
      }
    ]
  }
]
```

Al día:

```json
[
  {
    "name": "default",
    "entities": []
  }
]
```
