# Uma API REST como fonte {#a-rest-api-as-a-source}

O dialeto **`Http`** torna as entidades de uma API REST parte do domínio: relações, `include`, validações, visões e
observabilidade, como com um banco de dados.

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

A convenção é `GET /invoices`, `GET /invoices/{id}`, `POST /invoices`, `PATCH /invoices/{id}` e
`DELETE /invoices/{id}`; `http` declara o que difere (`list`, `get`, `insert`, `update`, `delete` — por exemplo
`'PUT /invoices/{id}'` — e `items`, onde estão as linhas de uma lista).

| Sentença | Na API | Em memória |
| --- | --- | --- |
| Um filtro pela sua chave | `GET /invoices/{id}` (404: sem linhas) | — |
| Uma lista | `GET /invoices?status=…` (as propriedades de `filters`) | o resto do filtro, map, agrupamento, ordenação, página |
| Um include dela | `GET /invoices/{id}` para cada chave | — |
| `insert` / `update` / `delete` por chave | `POST` / `PATCH` / `DELETE` | — |

Uma API não tem rollback: dentro de uma transação suas escritas esperam o commit, que a API faz **antes** dos bancos de
dados. `push`, `drop` e `truncate` não fazem nada sobre ela.
