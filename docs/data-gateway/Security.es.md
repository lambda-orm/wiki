# Seguridad {#security}

Quién puede usar el gateway y qué puede hacer cada uno se decide en su configuración, una vez, para todos los
transportes: una **credencial** (una clave, un token o un usuario) tiene un nombre y una lista de **permisos**; el
gateway los comprueba antes de que nada llegue a una base de datos, **audita** cada escritura con el nombre de la
credencial y pone **límites** a lo que puede ocupar una petición. Esta página explica cada parte.

## Autenticación {#authentication}

El bloque `authentication` tiene tres niveles: global, por transporte (`transports.<t>.authentication`) y por esquema
(`orm.schemas[].authentication`). El más específico reemplaza a los demás (esquema → transporte → global). Lo aplica
el edge worker antes de que nada llegue al esquema.

| `adapter` | Una credencial (todos los permisos) | Varias credenciales con permisos | El cliente envía |
| --- | --- | --- | --- |
| `none` (por defecto) | — | — | nada: una credencial anónima con todos los permisos |
| `local`, `type: bearer` | `token` | `tokens: [{ name, value, permissions }]` | `Authorization: Bearer <token>` |
| `local`, `type: apikey` | `value` (y `header`, por defecto `X-Api-Key`) | `keys: [{ name, value, permissions }]` | `<header>: <key>` |
| `local`, `type: basic` | `username`, `password` | `users: [{ username, password, permissions }]` | `Authorization: Basic <base64(user:password)>` |
| `jwt` (4.1.0) | — | los usuarios de un proveedor de identidad, con sus roles mapeados a permisos ([abajo](#jwt)) | `Authorization: Bearer <JWT>` |
| `methods` (4.1.0) | — | varios de los anteriores, en orden: tokens para los usuarios, claves para los servicios ([abajo](#jwt)) | lo que toma cada uno |

```yaml
authentication:
  adapter: local
  type: bearer
  tokens:
    - { name: reports, value: $REPORTS_TOKEN, permissions: [ read ] }
    - { name: backend, value: $BACKEND_TOKEN, permissions: [ read, write, script, queue, stageImport ] }
```

- Una credencial `local` sin su secreto (o cuya `$VAR` no está definida) detiene el arranque. El acceso abierto solo es
  `adapter: none`, escrito a propósito.
- Los secretos se comparan en tiempo constante. El secreto nunca viaja a los workers de los esquemas: solo el nombre y los
  permisos de la credencial.
- Sin credencial (o con una incorrecta) la respuesta es `401` (`{ "error": "Unauthorized", "message": … }`); los
  upgrades de WebSocket se rechazan.
- `/ping`, `/health`, `/metrics`, `/version` (también bajo cada esquema), `/schemas`, `/transports` y la documentación
  (`/openapi.json`, `/doc`, `/api-docs`) no necesitan credencial.
- Una credencial sin `permissions` recibe los de los datos (`read`, `write`, `script`, `queue`, `stageImport`), nunca
  los de la administración.
- En `management` (el IDE) la credencial va solo en el login, y cada petición lleva el token de una
  [sesión](Transports.md#sessions): las sesiones se listan, terminan por inactividad y se pueden revocar al instante.
- Ningún transporte responde CORS: un navegador de otro origen no puede llamar al gateway; un backend propio, sí.

## Tokens de un proveedor de identidad (JWT / OIDC) {#jwt}

Desde data-gateway 4.1.0. Los usuarios traen el token que les da su proveedor de identidad (Keycloak, Auth0, Entra ID,
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
          roles:
            reader: [ read ]
            support: { permissions: [ read ], view: support }  # a role with its view (below)
            admin: [ read, write, script ]
      context:                                              # claim → variable of the context of λORM
        tenant: tenant_id
        region: address.region
    - adapter: local                                        # the services keep their keys
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, permissions: [ read, write ] }
```

- **La firma** se verifica con las claves públicas del emisor (su JWKS, en caché; un token firmado con una clave nueva
  las vuelve a leer), y después el emisor, la audiencia y los tiempos. `secret: $JWT_SECRET` (HS256) en lugar de las
  claves es para desarrollo y pruebas.
- **Quién es:** su nombre (`principal.name`), los permisos de sus roles (un rol tiene que listarlos: un rol no listado
  no da nada) y su **contexto**: lo que leen los [filtros de filas de las vistas](#views), los defaults y las
  condiciones del esquema (`context.tenant`). Un claim puede ser una ruta (`address.region`) o un nombre con puntos o
  una URL, como los nombra Auth0 (`https://example.com/roles`).
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
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: billing, value: $BILLING_KEY, permissions: [ read ], view: billing }   # the view of a key
# or the view of a role of a token: roles: { support: { permissions: [ read ], view: support } }
orm:
  schemas:
    - path: shop
      view: public            # the one of a caller without a view; without it, default (the whole domain)
```

- **Todo está en esa vista:** las consultas (lo que enmascara viene enmascarado, lo que excluye no existe, sus filas se
  filtran con el contexto del token), su `metadata`, `model`, `parameters` y `constraints`, el dominio (`/schema`,
  `/domain`, `/entities`, `/typings`, la búsqueda), las entidades de los mappings, las vistas listadas, lo que MCP le
  dice a un agente y `/whoami` (`view`).
- **Una `view` o un `context` que un cliente envía en `options` se descarta**, en todos los transportes: un cliente no
  puede saltarse lo que su vista oculta ni leer las filas de otro tenant.
- **Nunca se adivina:** un token cuyos roles dan dos vistas es `403`; una vista que el esquema no tiene se advierte
  cuando el esquema carga y sus peticiones son `403`. Una entidad que la vista excluye es `403 ViewError`.
- Los comandos de stage (`import`, `export`, `push`…) ven todo el esquema: una credencial con una vista y `stageImport`
  o `ddl` se advierte cuando se lee la configuración.

## Permisos {#permissions}

| Permiso | Permite |
| --- | --- |
| `read` | el esquema, el dominio, plan, metadata, model, parameters, constraints, la existencia y la exportación de stages, y `execute` **solo cuando todas las sentencias son `select`** |
| `write` | `execute` que escribe (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): un script puede hacer cualquier cosa dentro, por eso es un permiso propio |
| `queue` | `execute-queued` (y `write` si la consulta escribe) |
| `stageImport` | importar un stage |
| `schemaRead`, `schemaWrite`, `schemaAdmin`, `workbenchWrite`, `ddl`, `build` | la [administración](Admin.md#turning-it-on): nunca se dan por defecto |
| `sessionAdmin` | listar todas las [sesiones](Transports.md#sessions) de `management` y revocar las de otras credenciales (sin él, una credencial ve y cierra solo las suyas): nunca se da por defecto |

- La autorización ocurre en el worker del esquema, antes de ejecutar nada, igual para REST, MCP y WebSocket.
- Para saber si una consulta escribe, el gateway la analiza (su `metadata`): con solo `read`, se rechaza una consulta con alguna
  sentencia que no sea un `select`, también dentro de un `include`.
- Sin el permiso: `403` en REST, `status: 403` en WebSocket, `isError: true` en MCP, con el mensaje
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` responde el nombre y los permisos de la credencial (y su vista, 4.1.0), nunca su secreto.

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
