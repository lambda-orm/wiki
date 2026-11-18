# Execute {#execute}

Führt einen Abfrageausdruck aus und gibt sein Ergebnis aus.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| query | `-q` | Abfrageausdruck. |
| data | `-d` | Daten (Parameter) der Abfrage: JSON oder der Pfad einer JSON-Datei. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Ausgabeformat: `json`, `beautiful`, `light` oder `yaml`. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

## Beispiele {#examples}

### Masseneinfügung {#bulk-insert}

Fügt die Länder aus einer JSON-Datei zusammen mit ihren Bundesstaaten ein:

```sh
lambdaorm execute -w lab/countries -e lab/countries/.env -q "Countries.bulkInsert().include(p => p.states)" -d ./lab/countries/countries.json
```

### Abfrage {#query}

```sh
lambdaorm execute -e ".env" -o beautiful -q "Products.distinct(p => ({ quantity: p.quantity, category: p.category.name })).sort(p => p.category).page(1,3)"
```

Ergebnis:

```json
[
  {
    "quantity": "10 boxes x 20 bags",
    "category": "Beverages"
  },
  {
    "quantity": "24 - 12 oz bottles",
    "category": "Beverages"
  },
  {
    "quantity": "12 - 355 ml cans",
    "category": "Beverages"
  }
]
```

### Auf einem Data Gateway {#on-a-data-gateway}

```sh
lambdaorm execute -u http://gateway:8080/iot/v1 -o beautiful -q "Devices.filter(p => p.status == status)" -d '{"status": "active"}'
```

Bei Bearer-Authentifizierung setzen Sie das Token in der Umgebungsvariablen `SERVICE_TOKEN` (siehe [CLI](../index.md#exit-code-and-data-gateway)).
