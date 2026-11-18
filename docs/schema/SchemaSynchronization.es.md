# Sincronización {#synchronization}

Esta página resume los comandos que mantienen sincronizados el esquema y las bases de datos de un stage.

La sincronización funciona en ambos sentidos: del esquema a las fuentes (bases de datos), y de las fuentes al archivo del esquema.
Cada operación está disponible como comando de la CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)) y como método de `orm.stage` en [@lambdaorm/lib](https://www.npmjs.com/package/@lambdaorm/lib).

| Operación   | Sentido                      | Modifica el esquema | Modifica las bases de datos |
|-------------|------------------------------|:------------------:|:---------------------:|
| push        | esquema → bases de datos     | no                 | sí                    |
| pull        | bases de datos → esquema     | sí                 | no                    |
| fetch       | compara ambos                | no                 | no                    |
| introspect  | archivo de datos → esquema → bases de datos | sí  | sí                    |
| incorporate | archivo de datos → esquema → bases de datos, y luego importa los datos | sí | sí |

## Push {#push}

Push actualiza las fuentes (bases de datos) con el esquema, mediante el comando `lambdaorm push`.

Push compara el modelo con las propias bases de datos: crea las tablas que faltan, añade y modifica columnas, renombra las columnas declaradas con `previousMapping` y nunca elimina lo que solo existe en la base de datos. `lambdaorm push -o <dir>` escribe el DDL como un script por fuente (`<stage>.<source>.sql`) sin aplicarlo.

[Más información](SchemaSynchronization-Push.md)

## Pull {#pull}

Pull actualiza el esquema con la estructura de las fuentes (bases de datos), mediante el comando `lambdaorm pull`. Lo que se escribió a mano en el esquema (relaciones, listeners, stages) se conserva.

[Más información](SchemaSynchronization-Pull.md)

## Fetch {#fetch}

Fetch muestra las diferencias entre las fuentes y el esquema, sin aplicar ningún cambio, mediante el comando `lambdaorm fetch`. El resultado está vacío cuando las bases de datos están sincronizadas con el modelo, y el comando termina con código 1 cuando hay diferencias (útil en CI).

[Más información](SchemaSynchronization-Fetch.md)

## Introspect {#introspect}

Introspect actualiza el esquema a partir de la estructura de un archivo de datos JSON y luego aplica los cambios a las fuentes (bases de datos), mediante el comando `lambdaorm introspect`.

[Más información](SchemaSynchronization-Introspect.md)

## Incorporate {#incorporate}

Incorporate hace lo mismo que introspect y luego importa los datos del archivo en las fuentes (bases de datos), mediante el comando `lambdaorm incorporate`.

[Más información](SchemaSynchronization-Incorporate.md)
