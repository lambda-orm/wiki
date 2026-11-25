# Uma API REST como fonte {#a-rest-api-as-a-source}

O dialeto **`Http`** torna as entidades de uma API REST parte do domínio: relações, `include`, validações, visões e
observabilidade, como com um banco de dados. Use-o quando parte dos dados está atrás de um serviço (faturamento, um CRM,
a API de outra equipe) e você quer consultá-los e relacioná-los com as mesmas expressões que as tabelas dos seus bancos
de dados.

```yaml
infrastructure:
  mappings:
    - name: main
    - name: billing
      entities:
        - name: Invoices
          mapping: /invoices                       # its route: the REST convention
          http: { filters: [status, customerId] }  # what the API filters by as parameters
          properties:
            - { name: id, autoIncrement: true }    # the API generates the key
            - { name: customerId, mapping: customer_id }   # the name of the field in the API
  sources:
    - name: billing
      dialect: Http
      mapping: billing
      connection: { url: https://api.billing.com, headers: { Authorization: 'Bearer ${BILLING_TOKEN}' }, timeout: 10000 }
    - name: db
      dialect: PostgreSQL
      mapping: main
      connection: ${CNN_POSTGRES}
  stages:
    - name: default
      sources:
        - { name: billing, condition: 'entity == "Invoices"' }
        - { name: db }
```

## A rota de uma entidade {#the-route-of-an-entity}

O `mapping` da entidade é a sua rota, e a convenção é `GET /invoices`, `GET /invoices/{id}`, `POST /invoices`,
`PATCH /invoices/{id}` e `DELETE /invoices/{id}`. A chave `http` do mapeamento da entidade declara o que difere:

| Chave | Descrição | Exemplo |
| --- | --- | --- |
| `list` | Outra rota para uma lista | `'GET /v2/invoices/search'` |
| `get`, `insert`, `update`, `delete` | Outra rota para essa ação | `'PUT /invoices/{id}'` |
| `items` | Onde estão as linhas de uma lista na resposta (por padrão a própria resposta, seu `data` ou seus `items`) | `'data.items'` |
| `filters` | As propriedades pelas quais a API filtra como parâmetros de consulta; o resto do filtro é executado em memória | `[status, customerId]` |

A chave é gerada pela API: declare-a `autoIncrement`, e o `insert` retorna a chave que a API respondeu.

## O que cada sentença faz {#what-each-sentence-does}

| Sentença | Na API | Em memória |
| --- | --- | --- |
| Um filtro pela sua chave | `GET /invoices/{id}` (404: sem linhas) | — |
| Uma lista | `GET /invoices?status=…` (as propriedades de `filters`) | o resto do filtro, map, agrupamento, `having`, ordenação, página |
| Um include dela | `GET /invoices/{id}` para cada chave | — |
| `insert` | `POST`, com os nomes da API | — |
| `update` / `delete` por chave | `PATCH` / `DELETE` `/invoices/{id}` | — |

Um `update` ou `delete` sem a chave no seu filtro é um erro. `push`, `drop` e `truncate` não fazem nada sobre uma API.

## Autenticação {#authentication}

A mais simples é um cabeçalho da conexão, com o segredo em uma variável de ambiente (`headers` acima). A conexão também
pode obter um token com OAuth2 e repassar cabeçalhos a partir do contexto de quem executa a consulta:

```yaml
connection:
  url: https://api.billing.com
  auth:                                  # OAuth2 client credentials
    type: oauth2
    tokenUrl: https://auth.billing.com/oauth/token
    clientId: ${BILLING_CLIENT_ID}
    clientSecret: ${BILLING_CLIENT_SECRET}
    scope: invoices                      # and audience, if the API asks for it
  forward:                               # header: a 3xpr expression on the context of the query
    X-User: context.user
    X-Tenant: upper(context.tenant)
```

- **`auth`:** o λORM pede o token (`grant_type=client_credentials`), envia-o como `Authorization: Bearer …` e o guarda,
  compartilhado pelas conexões, até um minuto antes de expirar (`expires_in`; sem ele, uma hora). Se a API responde
  401, ele pede outro token e repete a requisição uma vez.
- **`forward`:** cabeçalhos tirados do [contexto](Context.md) de quem executa a consulta (`options.context`), de modo
  que um gateway pode repassar à API a identidade ou o token do usuário que o chamou. Sem o valor, ou se a expressão
  falha, o cabeçalho não é enviado. Ele vai em todas as requisições: leituras, escritas (também as adiadas para o
  commit) e `bulkInsert`.

## Transações {#transactions}

Uma API não tem rollback. Dentro de uma transação, suas escritas esperam o commit, que a fonte Http faz **antes** dos
bancos de dados: se algo falha antes, elas não são enviadas; se a API falha, os bancos de dados fazem rollback. Um
`insert` cuja chave a API gera é enviado na hora, porque sua resposta é necessária. A única brecha que resta é uma API
que responde bem seguida de um banco de dados cujo commit falha; para uma garantia completa, use o
[outbox](SchemaDefinition.md#outbox).
