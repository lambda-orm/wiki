# A REST API as a source

The dialect **`Http`** makes the entities of a REST API part of the domain: relations, `include`, validations, views
and observability, as with a database.

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

The convention is `GET /invoices`, `GET /invoices/{id}`, `POST /invoices`, `PATCH /invoices/{id}` and
`DELETE /invoices/{id}`; `http` declares what differs (`list`, `get`, `insert`, `update`, `delete` — for example
`'PUT /invoices/{id}'` — and `items`, where the rows of a list are).

| Sentence | On the API | In memory |
| --- | --- | --- |
| A filter by its key | `GET /invoices/{id}` (404: no rows) | — |
| A list | `GET /invoices?status=…` (the properties of `filters`) | the rest of the filter, map, grouping, sort, page |
| An include of it | `GET /invoices/{id}` for each key | — |
| `insert` / `update` / `delete` by key | `POST` / `PATCH` / `DELETE` | — |

An API has no rollback: inside a transaction its writes wait for the commit, which the API does **before** the
databases. `push`, `drop` and `truncate` do nothing on it.
