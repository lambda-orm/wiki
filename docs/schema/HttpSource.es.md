# Una API REST como fuente {#a-rest-api-as-a-source}

El dialecto **`Http`** hace que las entidades de una API REST formen parte del dominio: relaciones, `include`,
validaciones, vistas y observabilidad, como con una base de datos. Úsalo cuando parte de los datos vive detrás de un
servicio (facturación, un CRM, la API de otro equipo) y quieres consultarlos y relacionarlos con las mismas expresiones
que las tablas de tus bases de datos.

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

## La ruta de una entidad {#the-route-of-an-entity}

El `mapping` de la entidad es su ruta, y la convención es `GET /invoices`, `GET /invoices/{id}`, `POST /invoices`,
`PATCH /invoices/{id}` y `DELETE /invoices/{id}`. La clave `http` del mapping de la entidad declara lo que difiere:

| Clave | Descripción | Ejemplo |
| --- | --- | --- |
| `list` | Otra ruta para una lista | `'GET /v2/invoices/search'` |
| `get`, `insert`, `update`, `delete` | Otra ruta para esa acción | `'PUT /invoices/{id}'` |
| `items` | Dónde están las filas de una lista en la respuesta (por defecto la respuesta misma, su `data` o sus `items`) | `'data.items'` |
| `filters` | Las propiedades por las que la API filtra como parámetros de consulta; el resto del filtro se ejecuta en memoria | `[status, customerId]` |

La clave la genera la API: declárala `autoIncrement`, e `insert` devuelve la clave que respondió la API.

## Qué hace cada sentencia {#what-each-sentence-does}

| Sentencia | En la API | En memoria |
| --- | --- | --- |
| Un filtro por su clave | `GET /invoices/{id}` (404: sin filas) | — |
| Una lista | `GET /invoices?status=…` (las propiedades de `filters`) | el resto del filtro, map, agrupamiento, `having`, ordenamiento, página |
| Un include de ella | `GET /invoices/{id}` por cada clave | — |
| `insert` | `POST`, con los nombres de la API | — |
| `update` / `delete` por clave | `PATCH` / `DELETE` `/invoices/{id}` | — |

Un `update` o un `delete` sin la clave en su filtro es un error. `push`, `drop` y `truncate` no hacen nada sobre una
API.

## Autenticación {#authentication}

La más simple es un header de la conexión, con el secreto en una variable de entorno (`headers` arriba). La conexión
también puede obtener un token con OAuth2 y reenviar headers a partir del contexto de quien ejecuta la consulta:

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

- **`auth`:** λORM pide el token (`grant_type=client_credentials`), lo envía como `Authorization: Bearer …` y lo
  conserva, compartido por las conexiones, hasta un minuto antes de que expire (`expires_in`; sin él, una hora). Si la
  API responde 401, pide otro token y repite la petición una vez.
- **`forward`:** headers tomados del [contexto](Context.md) de quien ejecuta la consulta (`options.context`), para que
  un gateway pueda pasar a la API la identidad o el token del usuario que lo llamó. Sin el valor, o si la expresión
  falla, el header no se envía. Va con cada petición: lecturas, escrituras (también las diferidas al commit) y
  `bulkInsert`.

## Transacciones {#transactions}

Una API no tiene rollback. Dentro de una transacción sus escrituras esperan al commit, que la fuente Http hace
**antes** que las bases de datos: si algo falla antes, no se envían; si la API falla, las bases de datos hacen rollback.
Un `insert` cuya clave genera la API se envía de inmediato, porque se necesita su respuesta. El único hueco que queda es
una API que responde bien seguida de una base de datos cuyo commit falla; para una garantía completa, usa el
[outbox](SchemaDefinition.md#outbox).
