# Migrationen {#migrations}

Diese Seite erklärt, wie λORM die Daten schützt, wenn sich das Schema ändert, und wie eine Datenbank zu einer früheren
Version zurückkehrt: die Änderungen, die Daten verlieren können, das Undo-Skript jedes Push und die Historie, die
`lambdaorm migrate` verwendet.
[Push](SchemaSynchronization-Push.md) vergleicht das Modell mit der Datenbank selbst, daher müssen keine
Migrationsdateien von Hand geschrieben werden: Diese Werkzeuge dienen dazu, eine Änderung sicher anzuwenden und sie
rückgängig zu machen.

## Änderungen, die Daten verlieren können {#changes-that-can-lose-data}

`push` löscht niemals, was nur in der Datenbank existiert; was Daten verlieren kann, ist das Ändern einer Spalte: ein
Typ, der nicht breiter ist (`decimal` zu `integer`, Text zu Datum), oder ein kürzerer Text (`string(50)` zu
`string(20)`, ein Text ohne Länge zu `string(n)`). `push` hält mit einem `DestructiveChangeError` an, der sie auflistet,
und wendet sie nur mit `lambdaorm push --allow-destructive` an (`options.allowDestructive` in Node). Einen Typ oder eine
Länge zu verbreitern ist nicht destruktiv.

## Rückgängig machen {#undo}

Neben jede `orm_state/<source>/V<version>__push.sql` schreibt `push` eine `U<version>__push.sql`, ihr Undo, das zur
selben Zeit berechnet wird: Es löscht die Tabellen und Spalten, die der Push erstellt hat, macht die Umbenennungen
rückgängig und stellt Typ, Länge und Nullbarkeit wieder her, die die Spalten in der Datenbank hatten. Was in das
geschrieben wurde, was es löscht, kommt nicht zurück (die Datei weist darauf hin).

## Die Historie und migrate {#the-history-and-migrate}

Mit `infrastructure.migrations: {}` im Schema fügt λORM die Entität `LambdaOrmMigrations` hinzu (Version, Stage,
Quelle, Aktion, Datei, Undo, Status, Datum und wer), und jeder `push` zeichnet darin pro Quelle auf, was er getan hat,
und sein Undo. Jede Datenbank kennt ihre eigene Version:

```yaml
infrastructure:
  migrations: {}
```

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first, applied or undone
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version, the newest first
lambdaorm push -s dev                             # goes forward again
```

| Option | Beschreibung |
|--------|-------------|
| `-w`, `--workspace` | Ordner des Projekts (Standard: der aktuelle Ordner). |
| `-s`, `--stage` | Name des Stages (Standard: der erste Stage). |
| `-e`, `--envfile` | Zu lesende Datei mit Umgebungsvariablen. |
| `--list` | Die Migrationen des Stages, die neueste zuerst. |
| `--to` | Die Version, zu der zurückgekehrt werden soll, wie `--list` sie anzeigt. |
| `--allow-destructive` | Wendet auch ein Undo an, das Daten verlieren kann (das Verkleinern dessen, was der Push verbreitert hat). |

`migrate` führt das in der Historie gespeicherte Undo aus, benötigt daher nicht den Ordner `orm_state` dieser Umgebung
und funktioniert auch auf MongoDB; die Versionen, die es rückgängig macht, werden als `undone` markiert. Ohne
`infrastructure.migrations` meldet `migrate` dies; `push` schreibt trotzdem die `V`- und `U`-Dateien und stoppt die
destruktiven Änderungen.

In Node kehrt `orm.stage.migrate(version, { stage })` zu einer Version zurück, und `orm.stage.migrations` liest die
Historie. Siehe auch den [Befehl migrate](../cli/Commands/Migrate.md).
