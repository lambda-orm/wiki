# Una API REST como fuente {#a-rest-api-as-a-source}

El dialecto **`Http`** hace que las entidades de una API REST formen parte del dominio: relaciones, `include`,
validaciones, vistas y observabilidad, como con una base de datos.

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

La convención es `GET /invoices`, `GET /invoices/{id}`, `POST /invoices`, `PATCH /invoices/{id}` y
`DELETE /invoices/{id}`; `http` declara lo que difiere (`list`, `get`, `insert`, `update`, `delete` — por ejemplo
`'PUT /invoices/{id}'` — e `items`, donde están las filas de una lista).

| Sentencia | En la API | En memoria |
| --- | --- | --- |
| Un filtro por su clave | `GET /invoices/{id}` (404: sin filas) | — |
| Una lista | `GET /invoices?status=…` (las propiedades de `filters`) | el resto del filtro, map, agrupamiento, ordenamiento, página |
| Un include de ella | `GET /invoices/{id}` por cada clave | — |
| `insert` / `update` / `delete` por clave | `POST` / `PATCH` / `DELETE` | — |

Una API no tiene rollback: dentro de una transacción sus escrituras esperan al commit, que la API hace **antes** que las
bases de datos. `push`, `drop` y `truncate` no hacen nada sobre ella.
