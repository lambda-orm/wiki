# Migrações {#migrations}

## Mudanças que podem perder dados {#changes-that-can-lose-data}

O `push` nunca remove o que existe apenas no banco de dados; o que pode perder dados é alterar uma coluna: um tipo que
não é mais amplo (`decimal` para `integer`) ou um texto mais curto (`string(50)` para `string(20)`). O `push` para com
um `DestructiveChangeError` que as lista, e as aplica com `lambdaorm push --allow-destructive`
(`options.allowDestructive`).

## Desfazer {#undo}

Ao lado de cada `orm_state/<source>/V<version>__push.sql`, o `push` grava `U<version>__push.sql`, o seu desfazer: remove
as tabelas e colunas que o push criou, desfaz as renomeações e devolve os tipos que o banco de dados tinha. O que foi
gravado no que ele remove não volta.

## O histórico e o migrate {#the-history-and-migrate}

Com `infrastructure.migrations: {}`, o banco de dados guarda o histórico das suas migrações (a entidade
`LambdaOrmMigrations`), com o desfazer de cada uma:

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version
lambdaorm push -s dev                             # goes forward again
```
