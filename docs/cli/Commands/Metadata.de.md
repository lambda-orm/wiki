# Metadata {#metadata}

Gibt die Metadaten eines Abfrageausdrucks zurück: seine geparste Struktur.

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
lambdaorm metadata -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Ergebnis:

```json
{
  "classtype": "Sentence",
  "pos": {
    "ln": 0,
    "col": 35
  },
  "name": "select",
  "children": [
    {
      "classtype": "Sentence",
      "pos": {
        "ln": 0,
        "col": 38
      },
      "name": "select",
      "children": [],
      "type": "any",
      "entity": "Orders.details",
      "columns": [
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
      ],
      "parameters": [
        {
          "name": "LambdaOrmParentId",
          "type": "[integer]"
        }
      ],
      "constraints": [],
      "values": [],
      "defaults": [],
      "clause": "select",
      "alias": "o1"
    }
  ],
  "type": "any",
  "entity": "Orders",
  "columns": [
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
      "name": "__id",
      "type": "integer"
    }
  ],
  "parameters": [
    {
      "name": "id",
      "type": "integer"
    }
  ],
  "constraints": [],
  "values": [],
  "defaults": [],
  "clause": "select",
  "alias": "o"
}
```
