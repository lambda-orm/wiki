# Plan {#plan}

Gibt den Ausführungsplan eines Abfrageausdrucks zurück: die Anweisung, die auf jeder Quelle läuft, ohne sie auszuführen.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| query | `-q` | Abfrageausdruck. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Ausgabeformat: `json`, `beautiful`, `light` oder `yaml`. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

## Beispiel {#example}

```sh
lambdaorm plan -o beautiful -q "Orders.filter(p => p.customerId == customerId).include(p => [p.customer.map(p => p.name), p.details.include(p => p.product.include(p => p.category.map(p => p.name)).map(p => p.name)).map(p => [p.quantity, p.unitPrice])]).page(1,2)"
```

Ergebnis:

```json
{
  "entity": "Orders",
  "dialect": "MongoDB",
  "source": "Ordering",
  "sentence": "[{ \"$match\" : { \"CustomerID\":{{customerId}} } }, { \"$project\" :{ \"_id\": 0 , \"id\":\"$_id\", \"customerId\":\"$CustomerID\", \"employeeId\":\"$EmployeeID\", \"orderDate\":\"$OrderDate\", \"requiredDate\":\"$RequiredDate\", \"shippedDate\":\"$ShippedDate\", \"shipViaId\":\"$ShipVia\", \"freight\":\"$Freight\", \"name\":\"$ShipName\", \"address\":\"$ShipAddress\", \"city\":\"$ShipCity\", \"region\":\"$ShipRegion\", \"postalCode\":\"$ShipPostalCode\", \"country\":\"$ShipCountry\", \"__customerId\":\"$CustomerID\", \"__id\":\"$_id\" ,\"details\": { \"$map\":{ \"input\": \"$\\\"Order Details\\\"\", \"in\": { \"quantity\":\"$$this.Quantity\", \"unitPrice\":\"$$this.UnitPrice\", \"__productId\":\"$$this.ProductID\", \"LambdaOrmParentId\":\"$$this.OrderID\" } }} }} , { \"$sort\" :{ \"_id\":1 } } , { \"$skip\" : 0 }, { \"$limit\" : 2 } , { \"$project\": { \"_id\": 0 } }]",
  "children": [
    {
      "entity": "Customers",
      "dialect": "PostgreSQL",
      "source": "Crm",
      "sentence": "SELECT c.CompanyName AS \"name\", c.CustomerID AS \"LambdaOrmParentId\" FROM Customers c  WHERE  c.CustomerID IN ($1) "
    },
    {
      "entity": "Orders.details",
      "dialect": "MongoDB",
      "source": "Ordering",
      "sentence": "[{ \"$unwind\" : \"$\\\"Order Details\\\"\" }, { \"$replaceRoot\": { \"newRoot\": \"$\\\"Order Details\\\"\" } }, { \"$match\" : { \"OrderID\":{ \"$in\" :[{{LambdaOrmParentId}}]} } }, { \"$project\" :{ \"_id\": 0 , \"quantity\":\"$Quantity\", \"unitPrice\":\"$UnitPrice\", \"__productId\":\"$ProductID\", \"LambdaOrmParentId\":\"$OrderID\" }} , { \"$project\": { \"_id\": 0 } }]",
      "children": [
        {
          "entity": "Products",
          "dialect": "MySQL",
          "source": "Catalog",
          "sentence": "SELECT p.ProductName AS name, p.CategoryID AS `__categoryId`, p.ProductID AS LambdaOrmParentId FROM Products p  WHERE  p.ProductID IN (?) ",
          "children": [
            {
              "entity": "Categories",
              "dialect": "MySQL",
              "source": "Catalog",
              "sentence": "SELECT c1.CategoryName AS name, c1.CategoryID AS LambdaOrmParentId FROM Categories c1  WHERE  c1.CategoryID IN (?) "
            }
          ]
        }
      ]
    }
  ]
}
```
