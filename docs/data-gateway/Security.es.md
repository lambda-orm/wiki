# Seguridad {#security}

Quién puede usar el gateway y qué puede hacer cada uno se decide en su configuración, una vez, para todos los
transportes: una **credencial** (una clave, un token o un usuario) tiene un nombre y los **roles** que tiene, y un rol
dice qué puede hacer y dónde: sus **permisos**, sus esquemas, vistas y stages. El gateway los comprueba antes de que
nada llegue a una base de datos, **audita** cada escritura con el nombre de la credencial y pone **límites** a lo que
puede ocupar una petición. Esta página explica cada parte.

!!! warning "data-gateway 5.0.0: solo roles"
    Desde 5.0.0 lo que puede hacer una credencial lo dicen **solo sus roles** (`authorization.roles`). Una clave, un
    token o un usuario nombra sus `roles` (obligatorio) y puede decir su `context`; con sus propios `permissions`,
    `view` o `approval`, o un método `jwt` con sus propios `roles`, o `orm.schemas[].roles`, el gateway no arranca y el
    error dice dónde va cada uno. Para pasar una configuración de 4.x: [abajo](#from-4x).

## Autenticación {#authentication}

El bloque `authentication` tiene tres niveles: global, por transporte (`transports.<t>.authentication`) y por esquema
(`orm.schemas[].authentication`). El más específico reemplaza a los demás (esquema → transporte → global). Lo aplica
el edge worker antes de que nada llegue al esquema.

| `adapter` | Una credencial (todos los permisos) | Varias credenciales con permisos | El cliente envía |
| --- | --- | --- | --- |
| `none` (por defecto) | — | — | nada: una credencial anónima con todos los permisos |
| `local`, `type: bearer` | `token` y sus `roles` | `tokens: [{ name, value, roles, context }]` | `Authorization: Bearer <token>` |
| `local`, `type: apikey` | `value` y sus `roles` (y `header`, por defecto `X-Api-Key`) | `keys: [{ name, value, roles, context }]` | `<header>: <key>` |
| `local`, `type: basic` | `username`, `password` y sus `roles` | `users: [{ username, password, roles, context }]` | `Authorization: Basic <base64(user:password)>` |
| `jwt` (4.1.0) | — | los usuarios de un proveedor de identidad, con los roles de un claim de su token ([abajo](#jwt)) | `Authorization: Bearer <JWT>` |
| `methods` (4.1.0) | — | varios de los anteriores, en orden: tokens para los usuarios, claves para los servicios ([abajo](#jwt)) | lo que toma cada uno |

```yaml
authorization:
  roles:
    reader:  { permissions: [ read ] }
    backend: { permissions: [ read, write, script, queue, stageImport ] }
authentication:
  adapter: local
  type: bearer
  tokens:
    - { name: reports, value: $REPORTS_TOKEN, roles: [ reader ] }
    - { name: backend, value: $BACKEND_TOKEN, roles: [ backend ] }
```

- Una credencial `local` sin su secreto (o cuya `$VAR` no está definida) detiene el arranque. El acceso abierto solo es
  `adapter: none`, escrito a propósito.
- Los secretos se comparan en tiempo constante. El secreto nunca viaja a los workers de los esquemas: solo el nombre y los
  permisos de la credencial.
- Sin credencial (o con una incorrecta) la respuesta es `401` (`{ "error": "Unauthorized", "message": … }`); los
  upgrades de WebSocket se rechazan.
- `/ping`, `/health`, `/metrics`, `/version` (también bajo cada esquema), `/schemas`, `/transports` y la documentación
  (`/openapi.json`, `/doc`, `/api-docs`) no necesitan credencial.
- Una credencial local sin `roles` (una lista vacía, o ninguna) detiene el arranque; un rol que nombra y que
  `authorization.roles` no tiene se avisa (puede venir del [estado del gateway](Admin.md#roles)).
- `adapter: none` es la única credencial con todos los permisos: la anónima.
- En `management` (el IDE) la credencial va solo en el login, y cada petición lleva el token de una
  [sesión](Transports.md#sessions): las sesiones se listan, terminan por inactividad y se pueden revocar al instante.
- Ningún transporte responde CORS: un navegador de otro origen no puede llamar al gateway; un backend propio, sí.

## Tokens de un proveedor de identidad (JWT / OIDC) {#jwt}

Desde data-gateway 4.1.0 (probado contra Keycloak desde 4.3.0: sus roles, una vista por un claim y la rotación de
su clave, en los cinco transportes). Los usuarios traen el token que les da su proveedor de identidad (Keycloak, Auth0, Entra ID,
Cognito, Google…) y el gateway lo verifica sin llamar al proveedor en cada petición:

```yaml
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop          # iss; its keys are discovered from it (OIDC)
      audience: data-gateway                                # aud
      # jwksUri: https://…/certs                            # if the discovery is not there
      # algorithms: [ RS256, ES256 ]                        # default RS256, ES256, PS256
      # clockTolerance: 30s
      principal:
        name: preferred_username                            # the claim of the name (default sub)
        permissions:
          claim: realm_access.roles                         # a list, or a text separated by spaces (as scope)
      context:                                              # claim → variable of the context of λORM
        tenant: tenant_id
        region: address.region
    - adapter: local                                        # the services keep their keys
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, roles: [ admin ] }
authorization:
  roles:                                                    # the names of the claim are these roles
    reader:  { permissions: [ read ] }
    support: { permissions: [ read ], views: [ support ] }  # a role with its view (below)
    admin:   { permissions: [ read, write, script ] }
```

- **La firma** se verifica con las claves públicas del emisor (su JWKS, en caché; un token firmado con una clave nueva
  las vuelve a leer), y después el emisor, la audiencia y los tiempos. `secret: $JWT_SECRET` (HS256) en lugar de las
  claves es para desarrollo y pruebas.
- **Quién es:** su nombre (`principal.name`), sus roles (los nombres del claim que tiene `authorization.roles`: uno que
  no tiene no da nada) y su **contexto**: lo que leen los [filtros de filas de las vistas](#views), los valores por
  defecto y las condiciones del esquema (`context.tenant`). Un claim puede ser un camino (`address.region`) o un nombre
  con puntos o una URL, como los nombra Auth0 (`https://example.com/roles`).
- **`methods`:** decide el primero que reconoce la credencial. Un JWT que falla se rechaza como token, una clave
  incorrecta como clave; ninguno se prueba con el otro.
- **Un token rechazado dice por qué:** `401` con `the token is not valid: expired` (o `issuer`, `audience`,
  `signature`, `algorithm`, `unknown key`, `not yet valid`) y `WWW-Authenticate: Bearer error="invalid_token"`. Un
  emisor que no se puede alcanzar es `503`, no `401`. El token nunca se escribe en los logs, la auditoría ni las trazas.
- **Nada sobrevive al token:** una sesión de `management` termina en su `exp`; una conexión WebSocket o MCP WebSocket
  se cierra con el código `4401`.
- El [cliente Node](Clients.md) toma el token como una función, para renovarlo; el [IDE](../ide/Connections.md) lo toma
  como un token Bearer.

## La vista de cada llamador {#views}

Desde data-gateway 4.1.0. Una [vista](../schema/Views.md) del esquema decide qué se ve del dominio: sus entidades, sus
propiedades (enmascaradas, ocultas o calculadas) y sus filas (un filtro con el contexto). **El gateway elige la vista
de cada petición**, nunca el cliente:

```yaml
authorization:
  roles:
    billing: { permissions: [ read ], views: [ billing ] }     # the view of a role, for a key or a token
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: billing, value: $BILLING_KEY, roles: [ billing ] }
orm:
  schemas:
    - path: shop
      view: public            # the one of a caller without a view; without it, default (the whole domain)
```

- **Todo está en esa vista:** las consultas (lo que enmascara viene enmascarado, lo que excluye no existe, sus filas se
  filtran con el contexto del token), su `metadata`, `model`, `parameters` y `constraints`, el dominio (`/schema`,
  `/domain`, `/entities`, `/typings`, la búsqueda), las entidades de los mappings, las vistas listadas, lo que MCP le
  dice a un agente y `/whoami` (`view`).
- **Un `context` enviado por un cliente en `options` se descarta**, por todos los transportes: un cliente no puede leer
  las filas de otro tenant; el contexto viene del token (sus claims) o de la [clave](#context).
- **Elegida entre las de sus roles** (desde 4.4.0, [abajo](#roles)): el cliente puede pedir una de ellas en
  `options.view`; otra es `403`. Antes de 4.4.0 el cliente nunca elegía, y un token cuyos roles daban dos vistas era
  `403`. Una vista que el esquema no tiene se advierte al cargar el esquema y sus pedidos son `403`. Una entidad que la
  vista excluye es `403 ViewError`.
- Los comandos de stage (`import`, `export`, `push`…) ven todo el esquema: una credencial con una vista y `stageImport`
  o `ddl` se advierte cuando se lee la configuración.

## Roles: dónde trabajan y qué pueden hacer {#roles}

**Desde data-gateway 4.4.0; desde 5.0.0 el único camino.** Un rol es del gateway: dice **dónde** puede trabajar, sus
esquemas y en cada uno las vistas y los stages de λORM que puede usar, y **qué** puede hacer ahí, sus permisos y sus
límites. Los tokens nombran sus roles por su claim; las claves, los tokens y los usuarios, por `roles`:

```yaml
authorization:
  roles:
    support:
      schemas:                         # dónde vale (sus rutas); ninguno, todos los esquemas
        shop: { views: [support, public], view: public, stages: [default, reporting], stage: default }
        sales: {}                      # las vistas y stages de abajo (o los del esquema)
      views: [support]                 # en sus esquemas, salvo el que dice las suyas; la primera, la de quien no elige
      permissions: [read]
    analyst:
      views: [analytics, support]
      stages: [default, reporting]     # ninguno, el del esquema
      permissions: [read]
      maxRows: 5000                    # options.maxRows: el cliente puede pedir menos, nunca más
    backend:
      permissions: [read, write]       # sin views: la del esquema
    agent:
      permissions: [read, write]
      approval: writes                 # sus escrituras esperan a una persona (abajo)
    operator:
      stages: [default, staging]
      permissions: [read, ddl, destructive]
    admin:
      permissions: [read, schemaRead, roles]
      locked: true                     # no se extiende desde la administración
  # stages: open                       # un stage que ningún rol nombra se puede elegir, como antes de 4.4.0 (por una versión)
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop
      principal:
        permissions: { claim: realm_access.roles }    # los nombres del claim son los de authorization.roles
    - adapter: local
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, roles: [backend] }
orm:
  schemas:
    - path: shop
      view: public                     # la vista del esquema
      stage: default                   # el stage del esquema
```

- **Un rol del gateway (5.0.0):** en un esquema que sus `schemas` no nombran no da nada. Por esquema puede decir las
  vistas y stages que usa ahí y los de quien no elige (`view`, `stage`, que tienen que estar entre sus `views` y
  `stages`); reemplazan los del rol en ese esquema. Un rol que necesita otros permisos o vistas en otro esquema es otro
  rol. `GET /admin/scopes` (permiso `roles`) dice las vistas y stages de cada esquema servido.
- **El cliente elige solo entre ellos:** `options.view` y `options.stage` de cualquier petición, por todos los
  transportes; uno que sus roles no permiten es `403`. Sin elegir, el primero de sus roles; si sus roles no coinciden,
  el del esquema cuando lo permiten, si no `403` pidiendo elegir. Un agente por MCP no elige: los de sus roles.
- **Los permisos de los roles que permiten lo elegido,** no la suma de todos: con `support` (lee, en la vista
  `support`) y `backend` (escribe, en la vista del esquema), una petición en `support` solo lee. Los comandos de un
  stage (`push`, `migrate`, `seed`, `export`, `import`…) solo en los stages de su rol; los permisos de la
  administración, se elija lo que se elija. `scope: any` en un rol mantiene sus permisos se elija lo que se elija.
- **`options.maxRows`** solo menor que el del rol; **`allowDestructive`** ya no es una opción del cliente: un push o una
  migración que pierde datos necesita el permiso `destructive` además de `ddl`.
- **`GET /whoami`** dice la vista y el stage de quien llama sin elegir, todos los que puede elegir y sus roles;
  **`GET /admin/me`** (5.0.0, de `management`, cualquier credencial sobre sí misma) su nombre, su contexto y cada uno de
  sus roles como vale: permisos, esquemas, vistas y stages.
- **Los roles [guardados en el estado del gateway](Admin.md#roles)** extienden los de `authorization.roles`: más
  esquemas, vistas, stages o permisos, nunca menos. Un rol del estado que el YAML no tiene es uno nuevo.

### El contexto de una clave {#context}

**Desde data-gateway 5.0.0.** Una clave, un token o un usuario de un método `local` puede decir su `context`: el
contexto de λORM de sus peticiones, como un [token](#jwt) lo da desde sus claims. Es lo que leen los filtros de filas de
las vistas, los valores por defecto y los `writeValue` del esquema:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: ana, value: $ANA_KEY, roles: [editor], context: { username: ana@acme.com, region: south } }
```

- Cada variable es un texto, un número o un booleano: quién es la clave, nunca un secreto. Sin él, la clave no tiene
  contexto.
- Un esquema con `default: context.username` (un abstracto `Audited` con `createdBy`, por ejemplo) lo llena con el
  usuario de la clave; un cliente no puede reemplazarlo (su `options.context` se descarta). Llega también a una sesión
  abierta con la clave.

### Desde 4.x {#from-4x}

| 4.x | 5.0.0 |
| --- | --- |
| una clave con `permissions: [read, write]` | un rol `authorization.roles.backend: { permissions: [read, write] }` y la clave con `roles: [backend]` |
| una clave con `view: billing` | `views: [billing]` en su rol |
| una clave con `approval: writes` | `approval: writes` en su rol |
| `roles` dentro de un método `jwt` | los mismos roles en `authorization.roles`; el método solo guarda `principal.permissions.claim` |
| `orm.schemas[].roles` | en `authorization.roles`, con `schemas: [<path>]` (o `schemas: { <path>: { views, stages } }`) |
| un rol guardado para un esquema desde la administración | se lista como ignorado: se quita (`DELETE /admin/roles/{name}?schema=`) y se agrega de nuevo con sus `schemas` |

## Permisos {#permissions}

| Permiso | Permite |
| --- | --- |
| `read` | el esquema, el dominio, plan, metadata, model, parameters, constraints, la existencia y la exportación de stages, y `execute` **solo cuando todas las sentencias son `select`** |
| `write` | `execute` que escribe (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): un script puede hacer cualquier cosa dentro, por eso es un permiso propio |
| `queue` | `execute-queued` (y `write` si la consulta escribe) |
| `stageImport` | importar un stage |
| `schemaRead`, `schemaWrite`, `schemaAdmin`, `workbenchWrite`, `ddl`, `build` | la [administración](Admin.md#turning-it-on): nunca se dan por defecto |
| `approve` | (4.3.0) aprobar o rechazar las [escrituras que esperan](#approvals), nunca las propias: nunca se da por defecto |
| `destructive` | (4.4.0) con `ddl`, un push o una migración que pierde datos (`allowDestructive`): nunca se da por defecto |
| `roles` | (4.4.0) ver y cambiar los [roles del estado del gateway](Admin.md#roles), y ver quién puede entrar (`/admin/access`, 5.0.0): nunca se da por defecto |
| `observability` | (5.0.0) ver y cambiar la [observabilidad](Admin.md#observability) desde la administración: nunca se da por defecto |
| `persist` | (5.0.0) ver y cambiar [dónde se guarda el estado](Admin.md#persist): nunca se da por defecto |
| `sessionAdmin` | listar todas las [sesiones](Transports.md#sessions) de `management` y revocar las de otras credenciales (sin él, una credencial ve y cierra solo las suyas): nunca se da por defecto |

- La autorización ocurre en el worker del esquema, antes de ejecutar nada, igual para REST, MCP y WebSocket.
- Para saber si una consulta escribe, el gateway la analiza (su `metadata`): con solo `read`, se rechaza una consulta con alguna
  sentencia que no sea un `select`, también dentro de un `include`.
- Sin el permiso: `403` en REST, `status: 403` en WebSocket, `isError: true` en MCP, con el mensaje
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` responde el nombre y los permisos de la credencial (su vista, 4.1.0; su stage, lo que puede elegir y
  sus roles, 4.4.0), nunca su secreto.
- Ninguna credencial tiene un permiso por sí misma: son los de sus roles (o todos, para la anónima de
  `adapter: none`).

## Escrituras que esperan a una persona {#approvals}

**Desde data-gateway 4.3.0.** Un agente puede proponer cambios sin hacerlos solo: su escritura espera hasta que una
persona la apruebe.

```yaml
mcp:
  approval: writes           # every write by MCP waits (also per schema)
  approvalExpires: 1h        # one nobody decides expires
authorization:
  roles:
    agent: { permissions: [ read, write ], approval: writes }   # on every transport
    ops:   { permissions: [ read, approve ] }
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: agent, value: $AGENT_KEY, roles: [ agent ] }
    - { name: ops,   value: $OPS_KEY,   roles: [ ops ] }
```

- La escritura responde al instante `{ "approval": "…", "status": "pending", "expiresAt" }` (REST: `202`); todavía no
  cambió nada. Un script siempre espera (puede escribir); una escritura encolada no puede esperar (`403`).
- Quien la pidió ve su estado con la herramienta MCP `approval_status`, `GET /{schema}/approvals/{id}` o
  `approvals.status`: `pending`, `done` (con su resultado), `failed`, `rejected` (con el motivo) o `expired`.
- Quien tiene `approve` las lista con las sentencias que correría cada una y las aprueba o rechaza, en la
  [administración](Admin.md#since-4-3-0) o el [IDE](../ide/Connections.md#approvals); **nunca la propia**. Aprobada,
  corre una vez como quien la pidió (su vista, su contexto) y queda auditada con `approvedBy`.
- Viven en el [estado del gateway](Admin.md#persist) (el SQLite del volumen, o una base de datos), compartido por sus
  réplicas.

## Auditoría {#audit}

Cada operación que modifica datos, o puede hacerlo, deja una entrada de auditoría: una línea JSON con `"type": "audit"` en la salida
estándar, para que el recolector de logs (Loki, ELK, CloudWatch, …) pueda separarla.

| Operación | Se audita |
| --- | --- |
| `execute` | cuando alguna sentencia no es un `select` |
| `executeScript` | siempre |
| `executeQueued` | siempre (al encolarse) |
| `stageImport` | siempre, también el comando `import` de la [administración](Admin.md#the-commands) |
| `stagePush`, `stageDrop` | los comandos `push` y `drop` de la administración |
| `stageMigrate`, `stageSeed` | los comandos `migrate` y `seed` de la administración (4.1.0) |
| `login`, `logout`, `sessionExpired`, `sessionRevoked`, `loginRejected` | las [sesiones](Transports.md#sessions) de `management`, con el id de la sesión (nunca su token), la dirección y quién la revocó |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- Se escribe después de la ejecución, también cuando falla (`"result": "error"` con el mensaje).
- Una [consulta con nombre](Rest.md#named-queries) se audita con su `name` (4.1.0).
- Contiene el nombre de la credencial, nunca su secreto. Los parámetros (`data`) solo se añaden con
  `audit.includeData: true`, porque pueden contener datos personales. `audit.enabled: false` la desactiva.

## Límites {#limits}

| Límite | Clave | Cuando se alcanza |
| --- | --- | --- |
| Peticiones por ventana (solo `http`) | `rateLimit.windowMs`, `rateLimit.max` (`0` = desactivado) | `429` |
| Operaciones simultáneas por esquema | `server.maxConcurrent` | `429` con `Retry-After` (MCP: `isError`; WebSocket: `status: 429`) |
| Tiempo de una operación | `server.timeout` | `504 TimeoutError`, la operación se abandona |
| Tamaño de un cuerpo | `server.requestBodySize` | `413` |
| Tamaño de una respuesta | `server.maxResponseBytes` | `413`: usar `.page(1, n)` o agregar en la consulta |
| Scripts | `scripts.maxLength`, `timeoutMs`, `maxIterations` | `413 ScriptTooLongError` (longitud) o un error del script |
| Filas de un resultado para MCP | `mcp.maxRows` | se corta, con una indicación ([MCP](Mcp.md#results-and-errors)) |
| Filas y tiempo de una [consulta con nombre](Rest.md#named-queries) (4.1.0) | `orm.schemas[].queries.<name>.maxRows` / `timeout` | `422 TooManyRowsError` / `504` |

## Errores {#errors}

Una petición fallida responde un status que un cliente puede mapear y un cuerpo JSON:

```json
{
  "error": "ExecutionError",
  "code": "23505",
  "message": "ERROR: duplicate key value violates unique constraint \"device_types_pkey\" …"
}
```

| Campo | Significado |
| --- | --- |
| `error` | el nombre del error: `ExecutionError`, `ValidationError`, `ForbiddenError`, `ScriptDisabledError`, … |
| `code` | el código de error de la base de datos cuando lo hay (SQLSTATE de Postgres como `23505`, `ER_DUP_ENTRY` de MySQL) |
| `message` | el mensaje |
| `suggestions` | para un nombre de la consulta que no existe, los más cercanos: `[{ "name": "nme", "didYouMean": ["name"] }]` |
| `details` | en la administración, lo necesario para seguir: los problemas de un esquema inválido, lo que hay ahora tras un conflicto |

| Status | Causa |
| --- | --- |
| `400` | una consulta o un modelo inválidos (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), una violación de not null o de check, datos inválidos (Postgres `22xxx`); un valor del contexto que un filtro necesita y la identidad no trae (`ContextError`, `details.variable`) |
| `401` | sin credencial, o con una incorrecta (un token dice por qué: `expired`, `audience`…); en `management`, sin sesión o con una vencida o revocada |
| `403` | la credencial no tiene el permiso; scripts deshabilitados; una entidad que su vista excluye, o una escritura fuera del filtro de su vista (`ViewError`, `details.view`, `details.entity`); un token con dos vistas |
| `404` | un nombre que el esquema no tiene (una entidad, enum, source, mapping, stage), un esquema no expuesto en ese transporte, una ruta desconocida |
| `409` | una violación de clave única o foránea (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`); en la administración, un workspace ocupado, un comando en curso o sin su vista previa, un `push` que puede perder datos sin `allowDestructive` (`DestructiveChangeError`, `details.changes`) |
| `412`, `428` | administración: alguien lo cambió desde que se leyó; una escritura sin la versión que cambia |
| `413` | un cuerpo, una respuesta o un script demasiado grandes |
| `422` | administración: el esquema no sería válido (`details.issues`, cada uno en su línea); una consulta entre sources con más filas de las que puede traer a memoria (`CrossSourceError`); una consulta con nombre por encima de su `maxRows` (`TooManyRowsError`) |
| `429` | límite de tasa, o demasiadas operaciones simultáneas en el esquema |
| `503` | el esquema no está `ready` (`SchemaUnavailableError`: arrancando, en error, reiniciándose); una source que el gateway no alcanza, o cuya variable de conexión no está definida (`ConnectionError`); el emisor de los tokens no se puede alcanzar |
| `504` | la operación tardó más que `server.timeout` (`TimeoutError`) |
| *n* | un script ejecutó `throw { status: n, message }` (400–599) |
| `500` | cualquier otro caso |
