# Migraciones {#migrations}

## Cambios que pueden perder datos {#changes-that-can-lose-data}

`push` nunca elimina lo que solo existe en la base de datos; lo que puede perder datos es modificar una columna: un tipo
que no es más amplio (`decimal` a `integer`) o un texto más corto (`string(50)` a `string(20)`). `push` se detiene con
un `DestructiveChangeError` que los lista, y los aplica con `lambdaorm push --allow-destructive`
(`options.allowDestructive`).

## Deshacer {#undo}

Junto a cada `orm_state/<source>/V<version>__push.sql`, `push` escribe `U<version>__push.sql`, su deshacer: elimina las
tablas y columnas que creó el push, deshace los renombrados y devuelve los tipos que tenía la base de datos. Lo que se
escribió en lo que elimina no vuelve.

## El historial y migrate {#the-history-and-migrate}

Con `infrastructure.migrations: {}`, la base de datos guarda el historial de sus migraciones (la entidad
`LambdaOrmMigrations`), con el deshacer de cada una:

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version
lambdaorm push -s dev                             # goes forward again
```
