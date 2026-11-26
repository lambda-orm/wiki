# MCP {#mcp}

El gateway es un servidor [Model Context Protocol](https://modelcontextprotocol.io), de modo que los agentes de IA (Claude Code y cualquier
cliente MCP) pueden explorar el dominio y consultar los datos con el lenguaje de λORM. Hay **un servidor MCP por esquema**
(`/iot/v1/mcp`): sus herramientas describen el dominio de ese esquema, y cada versión se registra como un servidor distinto en el
cliente (`iot-v1`, `iot-v2`).

```sh
claude mcp add --transport http iot-v1 http://localhost:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

Con un único esquema en la raíz: `http://localhost:8081/mcp`.

## Herramientas {#tools}

Una herramienta por cada operación del esquema, **escrituras incluidas**: un agente puede hacer lo mismo que una aplicación, **si su
credencial lo permite**. Las descripciones y los esquemas de entrada se generan al arrancar el esquema y contienen su dominio
(entidades, propiedades, relaciones, enums), de modo que el modelo sabe qué consultar sin una llamada previa.

| Herramienta | Argumentos | Equivalente REST | Permiso | Indicación |
| --- | --- | --- | --- | --- |
| `orm_execute` | `query`, `data?`, `options?` | `POST /execute` | `read` (selects) o `write` | solo lectura con `read`; destructiva con `write` |
| `orm_execute_script` | `script`, `data?`, `options?` | `POST /script` | `script` | destructiva |
| `orm_execute_queued` | `topic`, `query`, `data?`, `chunk?`, `options?` | `POST /execute-queued` | `queue` | destructiva |
| `orm_plan` | `query`, `options?` | `POST /plan` | `read` | solo lectura |
| `orm_metadata` | `query` | `POST /metadata` | `read` | solo lectura |
| `orm_model` | `query` | `POST /model` | `read` | solo lectura |
| `orm_parameters` | `query` | `POST /parameters` | `read` | solo lectura |
| `orm_constraints` | `query` | `POST /constraints` | `read` | solo lectura |
| `query_<name>` (4.1.0) | los parámetros de la consulta | `POST /queries/{name}` | `read` (o `write` si escribe) | solo lectura, o destructiva |
| `schema_get` | — | `GET /schema` | `read` | solo lectura |
| `schema_version` | — | `GET /schema/version` | `read` | solo lectura |
| `schema_domain` | — | `GET /domain` | `read` | solo lectura |
| `schema_entities` | `entity?` | `GET /entities[/{entity}]` | `read` | solo lectura |
| `schema_enums` | `enum?` | `GET /enums[/{enum}]` | `read` | solo lectura |
| `schema_sources` | `source?` | `GET /sources[/{source}]` | `read` | solo lectura |
| `schema_mappings` | `mapping?`, `entity?` | `GET /mappings…` | `read` | solo lectura |
| `schema_views` | — | `GET /views` | `read` | solo lectura |
| `schema_stages` | `stage?` | `GET /stages[/{stage}]` | `read` | solo lectura |
| `schema_search` | `text` | `GET /search?q=` | `read` | solo lectura |
| `schema_describe` | `entities` | `GET /describe?entities=` | `read` | solo lectura |
| `stage_exists` | `stage` | `GET /stages/{stage}/exists` | `read` | solo lectura |
| `stage_export` | `stage` | `GET /stages/{stage}/export` | `read` | solo lectura |
| `stage_import` | `stage`, `data` | `POST /stages/{stage}/import` | `stageImport` | destructiva |
| `gateway_version` | — | `GET /version` | `read` | solo lectura |
| `gateway_health` | — | `GET /health` | `read` | solo lectura |
| `admin_schema_get` | — | `GET /admin/workspaces/{ruta}/schema` | `schemaRead` | solo lectura |
| `admin_schema_validate` | `text` | `POST /admin/validate` | `schemaRead` | solo lectura |
| `admin_stage_fetch` | `stage?` | `fetch` | `schemaRead` | solo lectura |

Las tools `admin_*` existen solo cuando el transporte `management` está expuesto ([Administración](Admin.md#over-mcp)); escribir no se ofrece por MCP.

- **`tools/list` muestra a cada credencial solo las herramientas que puede usar.** Sin `script`, `orm_execute_script` no
  aparece; con solo `read`, `orm_execute` se describe como "read-only queries with this credential".
- Las indicaciones (`readOnlyHint`, `destructiveHint`) no bloquean nada: le dicen al cliente qué herramientas modifican datos,
  para que pueda pedir confirmación. Lo que bloquea son los [permisos](Security.md#permissions).
- Las mismas reglas que en REST: `orm_execute_script` falla si los scripts están deshabilitados; `orm_execute_queued`, si el esquema no tiene
  cola.
- `mcp.tools.include` / `exclude` (globales o por esquema) restringen aún más la lista, por ejemplo
  `exclude: [ orm_execute_script, stage_import ]` (o `query_<name>`).
- Con una [vista](Security.md#views) (4.1.0), las descripciones y los recursos llevan el dominio **de esa vista**: a un
  agente no se le habla de lo que no puede ver.

### Consultas con nombre y herramientas curadas {#named-queries}

Desde data-gateway 4.1.0. Cada [consulta con nombre](Rest.md#named-queries) del esquema es una herramienta
`query_<name>`: su descripción, sus parámetros como argumentos tipados y lo que devuelve. Un agente llama a una
consulta curada en lugar de escribir una:

```yaml
mcp:
  freeQueries: false      # without orm_execute, orm_execute_script, orm_execute_queued nor orm_plan
orm:
  schemas:
    - path: shop
      mcp: { freeQueries: false }                         # or per schema
      queries:
        customersOf: { maxRows: 100, timeout: 5s }        # the limits of a query
```

Con `freeQueries: false` un agente tiene solo las consultas con nombre y las herramientas del esquema (`schema_*`): lo
que puede ejecutar es lo que el esquema declara. Las herramientas se listan en la vista de quien llama, y una consulta
que escribe solo a una credencial con `write`.

### Esquemas grandes {#large-schemas}

Cuando el dominio no entra en la descripción de `orm_execute` (el Cloud de Ilusor: 192 entidades, 389 KB en JSON), la
descripción da los nombres de las entidades y apunta a dos herramientas, para que el modelo lea solo lo que necesita:

- `schema_search { text }`: las entidades, propiedades y relaciones cuyo nombre contiene el texto, una línea cada una
  (`Products.cat` → `Products.categoryId: integer`, `Products.category → Categories`); sin coincidencias, los nombres
  más cercanos (`Prodcts` → `products`, `Products`, `product`).
- `schema_describe { entities }`: hasta 30 entidades en dos líneas cada una, sus propiedades y sus relaciones; un
  nombre que no conoce viene en `notFound` con los más cercanos.

## Resultados y errores {#results-and-errors}

- Un resultado es `{ content: [{ type: "text", text: <JSON> }] }`, con `structuredContent` también cuando es pequeño.
- **Límite de filas (`mcp.maxRows`, por defecto 500).** Cuando `orm_execute` u `orm_execute_script` responden una lista más larga, se
  corta y se le indica al modelo cómo pedir menos:

  ```json
  { "rows": [ "…500 rows…" ], "truncated": true, "returned": 500, "total": 18234,
    "hint": "The result was cut to 500 rows. Use .page(1, 500) (or a smaller page), aggregate with map/count, or filter the query more." }
  ```

  Se aplica solo a MCP y después de ejecutarse la consulta: protege el contexto del modelo. La base de datos está protegida por
  `server.maxResponseBytes` y `server.timeout`.
- Un error de λORM (sintaxis, una entidad desconocida, una restricción, un script deshabilitado) o un permiso que falta responde
  `isError: true` con el mensaje, para que el modelo pueda leerlo y corregir la consulta.
- El error viene también en `structuredContent`: `{ error, status, code?, message, suggestions? }`, el status y el código
  de la base de datos que respondería REST, y para un nombre que no existe los más cercanos.

## Recursos {#resources}

| URI | Contenido |
| --- | --- |
| `lambdaorm://guide/expressions` | una guía breve del lenguaje de consultas (Markdown), para dar contexto al modelo |
| `lambdaorm://schema/domain` | el dominio completo del esquema, en JSON |
| `lambdaorm://entities/{entity}` | una entidad (plantilla) |

## Qué puede hacer un agente {#what-an-agent-can-do}

Desde 4.3.0, las escrituras de un agente pueden [esperar a una persona](Security.md#approvals) (`mcp.approval: writes`):
la herramienta responde al instante que la escritura está pendiente, y `approval_status` dice después si se aprobó y
su resultado.

No hay un modo de solo lectura del transporte: lo que un agente puede hacer lo deciden **los permisos de su credencial**. Un
agente que solo consulta recibe una credencial con `[ read ]`: puede ejecutar selects pero no escribir, ejecutar scripts, encolar ni
importar, por ningún transporte. Además: `schemas[].transports` para dejar un esquema fuera de MCP, `mcp.tools.exclude`, las indicaciones
y los permisos del usuario de la base de datos (la garantía de fondo). Cada escritura que hace un agente queda
[auditada](Security.md#audit) con el nombre de su credencial y `"transport": "mcpHttp"`.

## Transportes {#transports}

### mcpHttp {#mcphttp}

| Ruta | Protocolo |
| --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP: Claude Code `--transport http` y los clientes actuales |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (obsoleto), con `legacySse: true` |
| `GET {basePath}/status` | el estado del transporte, los esquemas y las sesiones SSE abiertas |

Streamable HTTP no tiene estado por defecto (`stateful: false`): cada `POST` es independiente y cualquier réplica lo responde.
Con `stateful: true` el servidor mantiene una sesión por cliente (hasta `maxConnections`), lo que necesita afinidad de
sesión con varias réplicas, como HTTP+SSE. La credencial va en cada petición.

### mcpWebSocket {#mcpwebsocket}

Un upgrade en `{basePath}/{schema}/mcp` con el subprotocolo `mcp`, autenticado en el handshake (un navegador envía la
credencial en los subprotocolos, como en la [API WebSocket](Transports.md#websocket)); mensajes JSON-RPC 2.0 con los
métodos de MCP (`initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, …). No es un
transporte MCP estándar: se ofrece para clientes y gateways que lo soportan por su cuenta. Su documento AsyncAPI está en
`GET {basePath}/asyncapi` (y `/asyncapi.json`).

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "orm_execute", "arguments": { "query": "Products.filter(p => p.price > 50).map(p => p.name)" } } }
← { "jsonrpc": "2.0", "id": 1, "result": { "content": [ { "type": "text", "text": "[\"Côte de Blaye\", \"Thüringer Rostbratwurst\"]" } ] } }
```
