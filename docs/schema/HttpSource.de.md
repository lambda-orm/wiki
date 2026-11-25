# Eine REST-API als Quelle {#a-rest-api-as-a-source}

Der Dialekt **`Http`** macht die Entitäten einer REST-API zu einem Teil der Domäne: Beziehungen, `include`,
Validierungen, Sichten und Observability, wie bei einer Datenbank. Verwenden Sie ihn, wenn ein Teil der Daten hinter
einem Dienst liegt (Abrechnung, ein CRM, die API eines anderen Teams) und Sie ihn mit denselben Ausdrücken abfragen und
in Beziehung setzen möchten wie die Tabellen Ihrer Datenbanken.

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

## Die Route einer Entität {#the-route-of-an-entity}

Das `mapping` der Entität ist ihre Route, und die Konvention ist `GET /invoices`, `GET /invoices/{id}`,
`POST /invoices`, `PATCH /invoices/{id}` und `DELETE /invoices/{id}`. Der Schlüssel `http` des Entitäts-Mappings
deklariert, was abweicht:

| Schlüssel | Beschreibung | Beispiel |
| --- | --- | --- |
| `list` | Eine andere Route für eine Liste | `'GET /v2/invoices/search'` |
| `get`, `insert`, `update`, `delete` | Eine andere Route für diese Aktion | `'PUT /invoices/{id}'` |
| `items` | Wo die Zeilen einer Liste in der Antwort stehen (standardmäßig die Antwort selbst, ihr `data` oder ihr `items`) | `'data.items'` |
| `filters` | Die Eigenschaften, nach denen die API als Query-Parameter filtert; der Rest des Filters wird im Speicher ausgeführt | `[status, customerId]` |

Der Schlüssel wird von der API generiert: Deklarieren Sie ihn als `autoIncrement`, und `insert` gibt den Schlüssel
zurück, den die API geantwortet hat.

## Was jede Anweisung tut {#what-each-sentence-does}

| Anweisung | In der API | Im Speicher |
| --- | --- | --- |
| Ein Filter nach ihrem Schlüssel | `GET /invoices/{id}` (404: keine Zeilen) | — |
| Eine Liste | `GET /invoices?status=…` (die Eigenschaften von `filters`) | der Rest des Filters, Map, Gruppierung, `having`, Sortierung, Seite |
| Ein Include von ihr | `GET /invoices/{id}` für jeden Schlüssel | — |
| `insert` | `POST`, mit den Namen der API | — |
| `update` / `delete` nach Schlüssel | `PATCH` / `DELETE` `/invoices/{id}` | — |

Ein `update` oder `delete` ohne den Schlüssel in seinem Filter ist ein Fehler. `push`, `drop` und `truncate` tun auf
einer API nichts.

## Authentifizierung {#authentication}

Am einfachsten ist ein Header der Verbindung, mit dem Geheimnis in einer Umgebungsvariablen (`headers` oben). Die
Verbindung kann außerdem ein Token per OAuth2 beziehen und Header aus dem Kontext dessen weiterleiten, der die Abfrage
ausführt:

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

- **`auth`:** λORM fordert das Token an (`grant_type=client_credentials`), sendet es als `Authorization: Bearer …` und
  behält es, gemeinsam für alle Verbindungen, bis eine Minute vor seinem Ablauf (`expires_in`; ohne diesen Wert eine
  Stunde). Antwortet die API mit 401, fordert es ein neues Token an und wiederholt die Anfrage einmal.
- **`forward`:** Header, die aus dem [Kontext](Context.md) dessen entnommen werden, der die Abfrage ausführt
  (`options.context`), sodass ein Gateway die Identität oder das Token des aufrufenden Benutzers an die API
  weitergeben kann. Fehlt der Wert oder schlägt der Ausdruck fehl, wird der Header nicht gesendet. Er wird mit jeder
  Anfrage gesendet: Lesevorgänge, Schreibvorgänge (auch die bis zum Commit zurückgestellten) und `bulkInsert`.

## Transaktionen {#transactions}

Eine API hat kein Rollback. Innerhalb einer Transaktion warten ihre Schreibvorgänge auf den Commit, den die Http-Quelle
**vor** den Datenbanken ausführt: Schlägt vorher etwas fehl, werden sie nicht gesendet; schlägt die API fehl, führen die
Datenbanken ein Rollback aus. Ein `insert`, dessen Schlüssel die API generiert, wird sofort gesendet, weil seine Antwort
benötigt wird. Die einzige verbleibende Lücke ist eine API, die erfolgreich antwortet, gefolgt von einer Datenbank,
deren Commit fehlschlägt; für eine vollständige Garantie verwenden Sie die [Outbox](SchemaDefinition.md#outbox).
