# Import {#import}

Importiert Daten aus einer Datei in die Datenbanken eines Stages. Die Datei hat das von [export](Export.md) geschriebene Format.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| data | `-d` | Zu importierende Daten: der Pfad einer JSON-Datei oder JSON. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

## Beispiel {#example}

```sh
lambdaorm import -w lab/countries -e lab/countries/.env -d ./lab/countries/data/default-export.json
```
