# Eine REST API als Quelle {#a-rest-api-as-a-source}

Der Dialekt **`Http`** macht die Entitäten einer REST API zu einem Teil der Domäne: Beziehungen, `include`,
Validierungen, Sichten und Observability, wie bei einer Datenbank.

```yaml
infrastructure:
  mappings:
    - name: billing
      entities:
        - name: Invoices
          mapping: /invoices                       # its route: the REST convention
          http: { filters: [status, customerId] }  # what the API filters by as parameters
          properties:
            - { name: id, autoIncrement: true }    # the API generates the key
            - { name: customerId, mapping: customer_id }
  sources:
    - name: billing
      dialect: Http
      mapping: billing
      connection: { url: https://api.billing.com, headers: { Authorization: 'Bearer ${BILLING_TOKEN}' }, timeout: 10000 }
```

Die Konvention ist `GET /invoices`, `GET /invoices/{id}`, `POST /invoices`, `PATCH /invoices/{id}` und
`DELETE /invoices/{id}`; `http` deklariert, was abweicht (`list`, `get`, `insert`, `update`, `delete` — zum Beispiel
`'PUT /invoices/{id}'` — und `items`, wo die Zeilen einer Liste stehen).

| Anweisung | In der API | Im Speicher |
| --- | --- | --- |
| Ein Filter nach ihrem Schlüssel | `GET /invoices/{id}` (404: keine Zeilen) | — |
| Eine Liste | `GET /invoices?status=…` (die Eigenschaften von `filters`) | der Rest des Filters, Map, Gruppierung, Sortierung, Seite |
| Ein Include von ihr | `GET /invoices/{id}` für jeden Schlüssel | — |
| `insert` / `update` / `delete` nach Schlüssel | `POST` / `PATCH` / `DELETE` | — |

Eine API hat kein Rollback: Innerhalb einer Transaktion warten ihre Schreibvorgänge auf den Commit, den die API **vor**
den Datenbanken ausführt. `push`, `drop` und `truncate` tun auf ihr nichts.
