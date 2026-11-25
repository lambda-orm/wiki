# Version {#version}

Imprime la versión de la CLI en ejecución y la versión de `@lambdaorm/lib` que usa el proyecto.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| language | `-l` | Lenguaje de desarrollo (por defecto: `node`). |

## Ejemplo {#example}

```sh
lambdaorm version
```

Resultado (las versiones dependen de la instalación):

```text
lambdaorm cli version: 1.10.0
Local lambdaorm version: 3.15.0
```

Cuando el proyecto no depende de `@lambdaorm/lib`, la segunda línea es `Local lambdaorm not found.`

Para imprimir solo la versión de la CLI:

```sh
lambdaorm --version   # or lambdaorm -v
```

```text
1.10.0
```
