# Migrate {#migrate}

El historial de las migraciones de un stage, y volver a una versión. Necesita `infrastructure.migrations`; ver
[Migraciones](../../schema/SchemaSynchronization-Migrations.md).

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage. |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| list | | Las migraciones del stage, la más nueva primero. |
| to | | La versión a la que volver: el deshacer de cada versión posterior, la más nueva primero. |
| allow-destructive | | Aplicar también los cambios que pueden perder datos. |

## Ejemplos {#examples}

```sh
lambdaorm migrate -s dev --list
lambdaorm migrate -s dev --to 261125014929
```
