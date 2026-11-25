# Migrationen {#migrations}

## Änderungen, die Daten verlieren können {#changes-that-can-lose-data}

`push` löscht niemals, was nur in der Datenbank existiert; was Daten verlieren kann, ist das Ändern einer Spalte: ein
Typ, der nicht breiter ist (`decimal` zu `integer`), oder ein kürzerer Text (`string(50)` zu `string(20)`). `push` hält
mit einem `DestructiveChangeError` an, der sie auflistet, und wendet sie mit `lambdaorm push --allow-destructive`
(`options.allowDestructive`) an.

## Rückgängig machen {#undo}

Neben jede `orm_state/<source>/V<version>__push.sql` schreibt `push` eine `U<version>__push.sql`, ihr Undo: Es löscht die
Tabellen und Spalten, die der Push erstellt hat, macht die Umbenennungen rückgängig und stellt die Typen wieder her, die
die Datenbank hatte. Was in das geschrieben wurde, was es löscht, kommt nicht zurück.

## Die Historie und migrate {#the-history-and-migrate}

Mit `infrastructure.migrations: {}` speichert die Datenbank die Historie ihrer Migrationen (die Entität
`LambdaOrmMigrations`), mit dem Undo jeder einzelnen:

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version
lambdaorm push -s dev                             # goes forward again
```
