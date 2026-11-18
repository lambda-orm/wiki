# Push {#push}

Sincroniza las bases de datos de un stage con el modelo. Compara el modelo con las **bases de datos** (lo que lee
[fetch](Fetch.md)), no con el archivo `orm_state`: las tablas nuevas se crean con sus claves, claves foráneas e índices;
en las tablas existentes, se añaden las columnas que faltan y se modifican las columnas con otro tipo, longitud o
nulabilidad. **Nunca elimina** lo que solo existe en la base de datos (`fetch` lo informa). `orm_state` se sigue
escribiendo como registro.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage (por defecto: el primer stage del esquema). |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| output | `-o` | Genera las sentencias pero no las aplica. Sin valor, las imprime por fuente; con una carpeta, escribe un script por cada fuente que cambia, `<stage>.<source>.sql`. |
| force | `-f` | Si una sentencia falla, continúa con las siguientes. |

!!! note "Nota"
    `push` solo se ejecuta localmente: no tiene la opción `-u`.

## Ejemplos {#examples}

Aplicar los cambios:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env
```

Escribir los scripts en su lugar (por ejemplo, para conservarlos como migraciones versionadas):

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -s default -o migrations
```

```text
/home/user/lab/countries/migrations/default.default.sql
```

Imprimir las sentencias, por fuente, sin aplicarlas:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -o
```

```json
[
  {
    "source": "default",
    "sentences": [
      "ALTER TABLE Countries ADD phone VARCHAR(20)"
    ]
  }
]
```

## Renombrar una columna {#renaming-a-column}

Para renombrar una columna, se indica `previousMapping` en el mapping de la propiedad
(`{ name: icon, mapping: icon_name, previousMapping: icon }`) y se quita una vez aplicado el cambio. No se admite
renombrar tablas.
