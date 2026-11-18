# Export {#export}

Exportiert die Daten der Datenbanken eines Stages in eine JSON-Datei, `<stage>-export.json`, im Zielordner. Die Datei kann mit [import](Import.md) geladen werden.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| target | `-t` | Ordner, in den die Exportdatei geschrieben wird (Standard: das aktuelle Verzeichnis). |
| force | `-f` | Schlägt eine Anweisung fehl, wird mit den nächsten Anweisungen fortgefahren. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

## Beispiel {#example}

```sh
lambdaorm export -w lab/countries -e lab/countries/.env -t ./lab/countries/data
```
