# Push {#push}

Synchronisiert die Datenbanken eines Stages mit dem Modell. Verglichen wird das Modell mit den **Datenbanken** (dem, was
[fetch](Fetch.md) liest), nicht mit der Datei `orm_state`: Neue Tabellen werden mit Schlüsseln, Fremdschlüsseln und Indizes erstellt;
in bestehenden Tabellen werden fehlende Spalten hinzugefügt und Spalten mit abweichendem Typ, abweichender Länge oder Nullbarkeit geändert. Der Befehl
**löscht niemals**, was nur in der Datenbank existiert (`fetch` meldet es). `orm_state` wird weiterhin als Protokoll geschrieben.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Erzeugt die Anweisungen, wendet sie aber nicht an. Ohne Wert werden sie pro Quelle ausgegeben; mit einem Ordner wird für jede Quelle, die sich ändert, ein Skript geschrieben, `<stage>.<source>.sql`. |
| force | `-f` | Schlägt eine Anweisung fehl, wird mit den nächsten Anweisungen fortgefahren. |

!!! note "Hinweis"
    `push` läuft nur lokal: Es hat keine Option `-u`.

## Beispiele {#examples}

Änderungen anwenden:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env
```

Stattdessen die Skripte schreiben (zum Beispiel, um sie als versionierte Migrationen aufzubewahren):

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -s default -o migrations
```

```text
/home/user/lab/countries/migrations/default.default.sql
```

Die Anweisungen pro Quelle ausgeben, ohne sie anzuwenden:

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

## Eine Spalte umbenennen {#renaming-a-column}

Um eine Spalte umzubenennen, setzen Sie `previousMapping` im Mapping der Eigenschaft
(`{ name: icon, mapping: icon_name, previousMapping: icon }`) und entfernen Sie es, sobald die Änderung angewendet ist. Das Umbenennen von Tabellen
wird nicht unterstützt.
