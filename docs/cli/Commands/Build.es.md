# Build {#build}

Genera el código fuente del dominio para el lenguaje de desarrollo: el modelo (`model.ts`, con las entidades y
enumeraciones) y un repositorio por entidad (`repository<Entity>.ts`). Ver [Repositorios](../../usage/Repository.md).

Un archivo de repositorio solo se genera si todavía no existe, de modo que se conserva el código propio que se le haya
añadido; el modelo se regenera cada vez.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto. |
| language | `-l` | Lenguaje de desarrollo: `node` (por defecto, usa `@lambdaorm/lib`) o `client-node` (usa `@lambdaorm/client`; el dominio se lee del Data Gateway indicado en `infrastructure.service.url` del esquema, tal como lo escribe [`init -u`](Init.md)). |
| model | `-m` | Genera el modelo. |
| repositories | `-r` | Genera los repositorios. |
| all | `-a` | Genera el modelo y los repositorios (es el valor por defecto cuando no se indica ninguna de `-m`, `-r`, `-a`). |
| src-path | | Ruta relativa del código fuente en el workspace (`--src-path`). |
| data-path | | Ruta relativa de la carpeta de datos en el workspace (`--data-path`). |
| domain-path | | Ruta relativa del dominio dentro de la ruta del código fuente (`--domain-path`). |
| url | `-u` | URL del esquema en un Data Gateway. |
| view | | Genera el modelo y los repositorios de una [vista](../../schema/Views.md): solo sus entidades y propiedades; sus repositorios la usan. |

Con `application.queries` en el schema, el modelo también escribe `queries.ts`: el tipo del resultado de cada consulta y un método tipado que la ejecuta ([Consultas tipadas](../../usage/TypedQueries.md)).

También prepara el proyecto: crea `package.json` y `tsconfig.json` si no existen, e instala `typescript`, la librería
(`@lambdaorm/lib`, o `@lambdaorm/client` con `client-node`) y, con `node`, el driver del dialecto de cada fuente
(`mysql2`, `pg`, `tedious`, …) cuando faltan. La ruta del código fuente es por defecto `src` y la del dominio `domain`
(o las de `infrastructure.paths` del esquema si están definidas). `--view` es solo para `node`: con el cliente, el
Data Gateway elige la vista de quien llama.

## Ejemplos {#examples}

```sh
lambdaorm build -w lab/countries
```

Un proyecto que usa un Data Gateway (creado con `lambdaorm init -u <url>`):

```sh
lambdaorm build -w lab/client -l client-node
```
