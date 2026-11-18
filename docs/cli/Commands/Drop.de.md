# Drop {#drop}

Entfernt alle Datenbankobjekte eines Stages, nicht jedoch die Datenbank selbst. Mit `-o` werden die Anweisungen ausgegeben, statt sie auszuführen.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Erzeugt die Anweisungen, wendet sie aber nicht an. |
| force | `-f` | Schlägt eine Anweisung fehl, wird mit den nächsten Anweisungen fortgefahren. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

## Beispiel {#example}

```sh
lambdaorm drop -w lab/countries -e lab/countries/.env
```
