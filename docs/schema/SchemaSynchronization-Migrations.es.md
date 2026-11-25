# Migraciones {#migrations}

Esta página explica cómo λORM protege los datos cuando el esquema cambia y cómo una base de datos vuelve a una versión
anterior: los cambios que pueden perder datos, el script de deshacer de cada push y el historial que usa
`lambdaorm migrate`. [Push](SchemaSynchronization-Push.md) compara el modelo con la propia base de datos, así que no hay
archivos de migración que escribir a mano: estas herramientas sirven para aplicar un cambio con seguridad y para
deshacerlo.

## Cambios que pueden perder datos {#changes-that-can-lose-data}

`push` nunca elimina lo que solo existe en la base de datos; lo que puede perder datos es modificar una columna: un tipo
que no es más amplio (`decimal` a `integer`, texto a fecha) o un texto más corto (`string(50)` a `string(20)`, un texto
sin longitud a `string(n)`). `push` se detiene con un `DestructiveChangeError` que los lista, y los aplica solo con
`lambdaorm push --allow-destructive` (`options.allowDestructive` en Node). Ampliar un tipo o una longitud no es
destructivo.

## Deshacer {#undo}

Junto a cada `orm_state/<source>/V<version>__push.sql`, `push` escribe `U<version>__push.sql`, su deshacer, calculado al
mismo tiempo: elimina las tablas y columnas que creó el push, deshace los renombrados y devuelve el tipo, la longitud y
la nulabilidad que tenían las columnas en la base de datos. Lo que se escribió en lo que elimina no vuelve (el archivo lo
indica).

## El historial y migrate {#the-history-and-migrate}

Con `infrastructure.migrations: {}` en el esquema, λORM añade la entidad `LambdaOrmMigrations` (versión, stage, fuente,
acción, archivo, deshacer, estado, fecha y quién), y cada `push` registra en ella, por fuente, lo que hizo y su
deshacer. Cada base de datos conoce su propia versión:

```yaml
infrastructure:
  migrations: {}
```

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first, applied or undone
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version, the newest first
lambdaorm push -s dev                             # goes forward again
```

| Opción | Descripción |
|--------|-------------|
| `-w`, `--workspace` | Carpeta del proyecto (por defecto: la carpeta actual). |
| `-s`, `--stage` | Nombre del stage (por defecto: el primer stage). |
| `-e`, `--envfile` | Archivo de variables de entorno que se lee. |
| `--list` | Las migraciones del stage, la más reciente primero. |
| `--to` | La versión a la que volver, tal como la muestra `--list`. |
| `--allow-destructive` | Aplica también un deshacer que puede perder datos (reducir lo que el push amplió). |

`migrate` ejecuta el deshacer guardado en el historial, así que no necesita la carpeta `orm_state` de ese entorno y
funciona también en MongoDB; las versiones que deshace se marcan como `undone`. Sin `infrastructure.migrations`,
`migrate` lo indica; `push` sigue escribiendo los archivos `V` y `U` y deteniendo los cambios destructivos.

En Node, `orm.stage.migrate(version, { stage })` vuelve a una versión, y `orm.stage.migrations` lee el historial.
Ver también el [comando migrate](../cli/Commands/Migrate.md).
