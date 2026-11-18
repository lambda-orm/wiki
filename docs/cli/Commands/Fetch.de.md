# Fetch {#fetch}

Zeigt die Abweichungen zwischen den Datenbanken eines Stages und dem Modell: pro Mapping die Entitäten, die sich unterscheiden (auf einer
Seite fehlend, abweichende Spalten, Typen, Längen, Nullbarkeit oder Primärschlüssel), jeweils mit ihren `differences`. Die Liste der Entitäten ist
leer, wenn die Datenbanken mit dem Modell übereinstimmen. Beziehungen und Indizes werden nicht verglichen.

Der Befehl **endet mit Exit-Code 1, wenn es Unterschiede gibt**, und kann daher in CI eingesetzt werden.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Ausgabeformat: `json`, `beautiful`, `light` oder `yaml`. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

## Beispiel {#example}

```sh
lambdaorm fetch -w lab/countries -e lab/countries/.env -o beautiful || echo "the database differs from the model"
```

Ergebnis:

```json
[
  {
    "name": "default",
    "entities": [
      {
        "name": "Countries",
        "mapping": "Countries",
        "differences": ["column phone missing in the database"],
        "properties": [ ... ]
      }
    ]
  }
]
```

Bei Übereinstimmung:

```json
[
  {
    "name": "default",
    "entities": []
  }
]
```
