# Migrate {#migrate}

Die Historie der Migrationen eines Stages und das Zurückgehen zu einer Version. Benötigt `infrastructure.migrations`;
siehe [Migrationen](../../schema/SchemaSynchronization-Migrations.md).

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| list | | Die Migrationen des Stages, die neueste zuerst. |
| to | | Die Version, zu der zurückgegangen wird: das Undo jeder späteren Version, die neueste zuerst. |
| allow-destructive | | Auch die Änderungen anwenden, die Daten verlieren können. |

## Beispiele {#examples}

```sh
lambdaorm migrate -s dev --list
lambdaorm migrate -s dev --to 261125014929
```
