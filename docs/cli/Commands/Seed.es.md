# Seed {#seed}

Inserta los datos con los que empieza un stage (`stages[].seed`): de cada archivo, las filas cuya clave todavía no está
en la base de datos. Ver [Seed](../../schema/SchemaSynchronization-Seed.md).

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage. |
| envfile | `-e` | Lee un archivo de variables de entorno. |

## Ejemplo {#example}

```sh
lambdaorm seed -s dev
```

```text
data/seed/base.json: Categories +2
data/seed/dev.json: Products +0 (2 already there)
```
