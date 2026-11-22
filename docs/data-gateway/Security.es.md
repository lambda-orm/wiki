# Seguridad {#security}

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
- Sin credencial (o con una incorrecta) la respuesta es `401`; los upgrades de WebSocket se rechazan.
- `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/doc` y los archivos de la UI no necesitan credencial.

## Permisos {#permissions}

| Permiso | Permite |
| --- | --- |
| `read` | el esquema, el dominio, plan, metadata, model, parameters, constraints, la existencia y la exportación de stages, y `execute` **solo cuando todas las sentencias son `select`** |
| `write` | `execute` que escribe (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | scripts (`POST /script`, `orm_execute_script`, `query.script`): un script puede hacer cualquier cosa dentro, por eso es un permiso propio |
| `queue` | `execute-queued` (y `write` si la consulta escribe) |
| `stageImport` | importar un stage |

- La autorización ocurre en el worker del esquema, antes de ejecutar nada, igual para REST, MCP y WebSocket.
- Para saber si una consulta escribe, el gateway la analiza (su `metadata`): con solo `read`, se rechaza una consulta con alguna
  sentencia que no sea un `select`, también dentro de un `include`.
- Sin el permiso: `403` en REST, `status: 403` en WebSocket, `isError: true` en MCP, con el mensaje
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` responde el nombre y los permisos de la credencial, nunca su secreto.

## Auditoría {#audit}

Cada operación que modifica datos, o puede hacerlo, deja una entrada de auditoría: una línea JSON con `"type": "audit"` en la salida
estándar, para que el recolector de logs (Loki, ELK, CloudWatch, …) pueda separarla.

| Operación | Se audita |
| --- | --- |
| `execute` | cuando alguna sentencia no es un `select` |
| script | siempre |
| ejecución encolada | siempre (al encolarse) |
| importación de stage | siempre |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- Se escribe después de la ejecución, también cuando falla (`"result": "error"` con el mensaje).
- Contiene el nombre de la credencial, nunca su secreto. Los parámetros (`data`) solo se añaden con
  `audit.includeData: true`, porque pueden contener datos personales. `audit.enabled: false` la desactiva.

## Límites {#limits}

| Límite | Clave | Cuando se alcanza |
| --- | --- | --- |
| Peticiones por ventana (solo `http`) | `rateLimit.windowMs`, `rateLimit.max` (`0` = desactivado) | `429` |
| Operaciones simultáneas por esquema | `server.maxConcurrent` | `429` con `Retry-After` (MCP: `isError`; WebSocket: `status: 429`) |
| Tiempo de una operación | `server.timeout` | error, la operación se abandona |
| Tamaño de un cuerpo | `server.requestBodySize` | `413` |
| Tamaño de una respuesta | `server.maxResponseBytes` | `413`: usar `.page(1, n)` o agregar en la consulta |
| Scripts | `scripts.maxLength`, `timeoutMs`, `maxIterations` | `413` (longitud) o un error del script |
| Filas de un resultado para MCP | `mcp.maxRows` | se corta, con una indicación ([MCP](Mcp.md#results-and-errors)) |

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

| Status | Causa |
| --- | --- |
| `400` | una consulta o un modelo inválidos (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), una violación de not null o de check, datos inválidos (Postgres `22xxx`) |
| `401` | sin credencial, o con una incorrecta |
| `403` | la credencial no tiene el permiso; scripts deshabilitados |
| `404` | un nombre que el esquema no tiene (una entidad, enum, source, mapping, stage), un esquema no expuesto en ese transporte, una ruta desconocida |
| `409` | una violación de clave única o foránea (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`) |
| `413` | un cuerpo, una respuesta o un script demasiado grandes |
| `429` | límite de tasa, o demasiadas operaciones simultáneas en el esquema |
| `503` | el esquema no está `ready` (arrancando, en error, reiniciándose); una source que el gateway no alcanza, o cuya variable de conexión no está definida (`ConnectionError`) |
| *n* | un script ejecutó `throw { status: n, message }` (400–599) |
| `500` | cualquier otro caso |
