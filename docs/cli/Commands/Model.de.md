# Model {#model}

Gibt das Modell des Ergebnisses eines Abfrageausdrucks zurück: die Felder, die er liefert, mit ihren Typen.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| query | `-q` | Abfrageausdruck. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Ausgabeformat: `json`, `beautiful`, `light` oder `yaml`. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

## Beispiel {#example}

```sh
lambdaorm model -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Ergebnis:

```json
[
  {
    "name": "id",
    "type": "integer"
  },
  {
    "name": "customerId",
    "type": "string"
  },
  {
    "name": "employeeId",
    "type": "integer"
  },
  {
    "name": "orderDate",
    "type": "dateTime"
  },
  {
    "name": "requiredDate",
    "type": "date"
  },
  {
    "name": "shippedDate",
    "type": "date"
  },
  {
    "name": "shipViaId",
    "type": "integer"
  },
  {
    "name": "freight",
    "type": "decimal"
  },
  {
    "name": "name",
    "type": "string"
  },
  {
    "name": "address",
    "type": "string"
  },
  {
    "name": "city",
    "type": "string"
  },
  {
    "name": "region",
    "type": "string"
  },
  {
    "name": "postalCode",
    "type": "string"
  },
  {
    "name": "country",
    "type": "string"
  },
  {
    "name": "details",
    "type": "Orders.details[]",
    "children": [
      {
        "name": "orderId",
        "type": "integer"
      },
      {
        "name": "productId",
        "type": "integer"
      },
      {
        "name": "unitPrice",
        "type": "decimal"
      },
      {
        "name": "quantity",
        "type": "decimal"
      },
      {
        "name": "discount",
        "type": "decimal"
      },
      {
        "name": "LambdaOrmParentId",
        "type": "integer"
      }
    ]
  }
]
```
