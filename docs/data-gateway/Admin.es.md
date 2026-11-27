# Administración {#administration}

Con su puerto `management`, la gateway y su [UI](../ide/index.md) dejan de ser solo de lectura: los esquemas se **crean, editan y
eliminan** desde ellas, como YAML o elemento por elemento, lo guardado (consultas, scripts, diagramas) se comparte en
los workspaces, y los **comandos de la [CLI](../cli/index.md)** corren desde la UI. Todo está en el volumen de la
gateway, un workspace por esquema; la gateway ve lo que cambia y lo sirve sin reiniciar.

Actívala donde las personas modelan los esquemas (desarrollo, un entorno compartido de modelado). En producción, cuando
los esquemas llegan listos en el volumen, deja `management` fuera: los transportes de datos funcionan igual, y nada
puede cambiar los esquemas ni la estructura de las bases a través de la gateway.

## Activarla {#turning-it-on}

```yaml
transports:
  management:
    port: 9090               # without a port, no administration (and no IDE)
admin:
  commandTimeoutMs: 600000   # how long a command may take
  maxFileBytes: 2MB          # the largest file that can be written
authorization:
  roles:
    modeler: { permissions: [ read, schemaRead, schemaWrite, schemaAdmin, workbenchWrite, ddl, build ] }
    analyst: { permissions: [ read, workbenchWrite ] }
    admin:   { permissions: [ read, roles, observability, persist, sessionAdmin ] }
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: modeler, value: $MODELER_KEY, roles: [ modeler ] }
    - { name: analyst, value: $ANALYST_KEY, roles: [ analyst ] }
    - { name: ops,     value: $OPS_KEY,     roles: [ admin ] }
```

La administración responde en `/admin` del [transporte `management`](Transports.md#management), con su
autenticación; `http` no la tiene. Sus permisos **nunca se dan por defecto**: una credencial los tiene solo cuando uno de sus [roles](Security.md#roles) los da.

| Permiso | Permite |
| --- | --- |
| `schemaRead` | leer el `lambdaORM.yaml` de cada workspace y validarlo |
| `schemaWrite` | cambiarlo (como YAML o elemento por elemento), `pull`, `introspect` |
| `schemaAdmin` | crear y eliminar workspaces; definir las variables de las conexiones |
| `workbenchWrite` | guardar consultas, scripts y diagramas en los workspaces, sin tocar el esquema |
| `ddl` | cambiar la estructura de las bases de un stage (`push`, `drop`) |
| `build` | generar el código del dominio en `src/` del workspace |
| `sessionAdmin` | ver todas las [sesiones](Transports.md#sessions) de `management` (quién está conectado) y revocarlas |
| `roles` | los [roles](#roles) del estado, y quién puede entrar (`/admin/access`, `/admin/scopes`) |
| `observability` | (5.0.0) la [observabilidad](#observability) del gateway |
| `persist` | (5.0.0) [dónde se guarda el estado](#persist) |

Con `authentication: none` nadie administra, salvo con `admin.allowAnonymous: true` (solo desarrollo local).

## Workspaces en el volumen {#workspaces-in-the-volume}

Cada carpeta bajo `orm.workspacePath` con un `lambdaORM.yaml` es un esquema, y su ruta es su camino (`iot/v1`):

```text
/workspaces/iot/v1/
  lambdaORM.yaml     el esquema
  .env               las variables de sus conexiones
  workbench/         lo guardado: carpetas, *.query.yaml, *.script.yaml, *.diagram.yaml
  data/              exports
  src/domain/        el código de build (después de 4.0.0: src/<language>/domain/)
  orm_state/         el estado de λORM y el registro de cada comando
```

Mientras la gateway corre (`orm.watch`, activo por defecto), los vigila:

- una carpeta con un `lambdaORM.yaml` que aparece es un **esquema nuevo**, servido en todos los transportes;
- un `lambdaORM.yaml` o `.env` cuyo contenido cambió **recarga su esquema blue-green**: la versión nueva arranca al
  lado de la actual, que sigue atendiendo hasta que la nueva está lista. Si la nueva no arranca (un YAML inválido),
  **sigue la última que arrancó**, y el estado del esquema dice por qué (`pending`);
- una carpeta que se va se lleva su esquema;
- los demás archivos (`workbench/`, `data/`) solo se notifican ([`workspace.changed`](WebSocket.md#notifications)).

Los eventos del sistema de archivos son el camino rápido; un recorrido cada `orm.watch.intervalMs` (5 s) ve lo que no
llega en algunos volúmenes montados. Lo que cambió se decide por el contenido, no por el evento. Un archivo también
se puede editar fuera de la gateway (un editor, `git pull`): pasa lo mismo.

## Concurrencia {#concurrency}

Dos personas, o una persona y un agente, no se pisan:

- cada lectura devuelve la **versión** de lo que leyó y cada escritura dice cuál cambia; otra versión es un `412` con
  lo que hay ahora, y la UI muestra las dos para elegir;
- un formulario cambia **un elemento** (una entidad, una propiedad, una source…): el cambio de otro a otro elemento no
  choca; al mismo elemento, el formulario muestra lo que tiene ahora;
- las escrituras a un workspace van de a una (un archivo de candado, también entre réplicas sobre el mismo volumen) y
  cada archivo se escribe atómico;
- los comandos corren de a uno por esquema.

## El esquema {#the-schema}

- **Como YAML:** el `lambdaORM.yaml` entero en un editor, validado mientras se escribe (cada error en su línea), con el
  autocompletado de las claves de cada lugar y de los valores conocidos (tipos, dialectos, entidades, enums,
  mappings), guardado con Ctrl+S.
- **Como formularios:** cada sección (entidades, enums, sources, mappings, stages) y cada elemento en un formulario;
  las propiedades, relaciones, índices y valores en tablas. **Renombrar** renombra también lo que nombra al elemento
  (relaciones, claves, índices, mappings, stages); **Eliminar** primero muestra quién lo usa.
- Lo que escribe la gateway conserva **los comentarios, el orden y el estilo** del archivo: solo es nuevo lo que cambió.
- Un esquema inválido no se escribe: la validación revisa el YAML, la forma, un nombre repetido en una lista, los
  tipos (uno que λORM no conoce es una advertencia) y λORM completando el esquema, sin conectar y sin ejecutar nada
  de él.

## Las conexiones {#the-connections}

Las variables que nombra un esquema (`connection: ${SHOP_CNX}`) se definen en el `.env` de su workspace desde la UI
(o la API), que muestra cuáles nombra el esquema, cuáles define el `.env` y las sources que las usan. **Un valor nunca
se muestra** una vez definido. Cambiarlas recarga el esquema. Una variable también puede venir de la configuración de
la gateway (`orm.schemas[].env`) o de su entorno.

## Los comandos {#the-commands}

Los comandos de la [CLI](../cli/index.md) corren en el worker del esquema, con sus conexiones, como **jobs** (de a uno
por esquema), desde el panel **Comandos** de la UI:

| Comando | Antes de ejecutarlo, la UI muestra | Permiso |
| --- | --- | --- |
| `version` | — (las versiones de la gateway y del esquema) | `read` |
| `fetch` | — (compara las bases con el modelo) | `read` |
| `export` | — (se descarga, o se guarda en `data/`) | `read` |
| `push` | las sentencias por source, y las que pueden perder datos (4.1.0: se ejecutan solo con `allowDestructive`) | `ddl` |
| `drop` | las sentencias; se vuelve a escribir el stage | `ddl` |
| `import` | las filas de cada entidad | `stageImport` |
| `pull` | el diff del `lambdaORM.yaml` | `schemaWrite` |
| `introspect` | el diff y las filas de los datos | `schemaWrite` |
| `incorporate` | el diff y las filas; después el esquema se recarga, `push` crea sus tablas y se importan las filas | `schemaWrite`, `ddl`, `stageImport` |
| `build` | — (se escribe en `src/`, o se descarga como `.zip`) | `build` |
| `migrations` (4.1.0) | — (el [historial de las migraciones](../schema/SchemaSynchronization-Migrations.md) del stage) | `read` |
| `migrate` (4.1.0) | el deshacer de cada migración posterior a la `version`, y lo que de él puede perder datos | `ddl` |
| `seed` (4.1.0) | los archivos del [seed](../schema/SchemaSynchronization-Seed.md) del stage | `stageImport` |

Un comando que cambia las bases o el esquema ejecuta **exactamente la vista previa que se mostró**, una vez, dentro de
10 minutos, y solo mientras el `lambdaORM.yaml` sea el mismo con que se hizo (si no, `409 PreviewRequiredError`); otro
comando del mismo esquema mientras uno corre responde `409 BusyError`. Cada job deja su registro en
`orm_state/jobs/`; `push`, `drop`, `import`, `migrate` y `seed` se [auditan](Security.md#audit). Un `push` o un
`migrate` cuya vista previa lista cambios que pueden perder datos (un tipo más estrecho, una longitud más corta) los
ejecuta solo con `"allowDestructive": true`; sin él el job falla con `DestructiveChangeError`. `admin.commandTimeoutMs`
(10 minutos) limita cuánto puede tardar uno.

Por la API, un comando es una vista previa y después un job:

```sh
S="X-Data-Gateway-Session: $TOKEN"
curl -X POST http://data-gateway:9090/admin/workspaces/~/commands/push/preview -H "$S" -H "Content-Type: application/json" -d '{"stage": "default"}'
# {"previewId":"…","stage":"default","sentences":[…],"expiresAt":"…"}
curl -X POST http://data-gateway:9090/admin/workspaces/~/commands/push -H "$S" -H "Content-Type: application/json" -d '{"stage": "default", "previewId": "…"}'
# 202 {"id":"…","command":"push","status":"running",…}
curl http://data-gateway:9090/admin/workspaces/~/jobs/<id> -H "$S"
```

## Lo guardado {#what-is-saved}

Con `workbenchWrite`, las carpetas, consultas, scripts y diagramas del explorador se guardan en `workbench/` de cada
workspace, un archivo por elemento, y los ve todo el que tiene acceso al esquema (se pueden versionar con git junto al
esquema). Sin él, quedan en el navegador como antes. Un archivo escrito a mano también es un elemento; uno que no es
YAML válido se muestra como tal y nunca se pisa.

## Los stages y sus sources {#stages-and-their-sources}

En un stage, cada source tiene una `condition`, una expresión que decide qué sentencias van a ella (el primer source
cuya condición es verdadera; uno último sin condición toma el resto). El IDE la escribe con sugerencias y la gateway la
verifica mientras se escribe (`/admin/expressions/check`): una condición que no parsea es un error del esquema, una
variable que no es de una sentencia (`entity`, `action`, `category`, `type`, `read`, `write`, `dml`, `ddl`), una
advertencia.

## Los archivos y dónde estaba cada uno {#files-and-where-each-one-was}

- Los archivos de `data/` y `src/` se pueden listar y leer (`/admin/workspaces/{route}/files`), nunca el `.env`,
  `orm_state/` ni un archivo oculto.
- Dónde estaba el IDE de cada credencial (sus pestañas y sus borradores, lo desplegado) lo guarda la gateway en
  `<orm.workspacePath>/.data-gateway/state.sqlite` (`/admin/session`), así que un refresco u otro navegador empieza ahí.

## Desde 4.1.0 {#since-4-1-0}

Desde data-gateway 4.1.0: los comandos `migrations`, `migrate` y `seed`, y los cambios que pueden perder datos en
`push` (arriba); el **historial de un esquema** (cada cambio hecho por la administración, con quién, el
antes, el después y el diff, en `logs/changes.jsonl` del workspace y `GET /admin/workspaces/{route}/history`), el
**ruteo de un stage** (adónde va cada entidad, `…/stages/{stage}/routing`) y `build` por lenguaje
(`src/<language>/domain/`), con solo el modelo o solo los repositorios, y un código generado descargado como zip o
eliminado.

## Desde 4.2.0 {#since-4-2-0}

Los eventos del [outbox](Changes.md#retries-and-dead-events) de un schema: `GET /admin/workspaces/{route}/outbox?status=dead`
lista los que fallaron demasiadas veces, con su error (`schemaRead`), y `POST …/outbox/{id}/retry` devuelve uno a
pendiente (`schemaRead` y `ddl`).

## Desde 4.3.0 {#since-4-3-0}

Las [escrituras que esperan a una persona](Security.md#approvals): `GET /admin/workspaces/{route}/approvals?status=pending`
las lista, cada una con quién la pidió, su consulta o script, sus datos y las sentencias que correría; `POST
…/approvals/{id}/approve` la corre como quien la pidió, `…/reject { reason }` la descarta. Las dos necesitan `approve`,
y nunca por quien la pidió.

## Los roles {#roles}

**Desde data-gateway 4.4.0** (<span id="since-4-4-0"></span>un rol del gateway con sus `schemas` desde 5.0.0). Los
[roles](Security.md#roles), con el permiso `roles`: `GET /admin/roles` lista los de la configuración (de solo lectura) y
los guardados en el [estado del gateway](Configuration.md#state); `PUT /admin/roles/{name}` `{ config: { permissions,
schemas, views, stages, maxRows, approval, scope }, reason? }` agrega un rol o extiende uno de la configuración;
`DELETE /admin/roles/{name}` quita uno del estado; `GET /admin/roles/changes` dice quién cambió qué, cuándo, antes y
después.

- Nadie da un permiso que no tiene, nadie se quita `roles` si es el último, y un rol `locked` en la configuración no se
  extiende.
- **Un rol dice sus esquemas** (5.0.0): un `PUT` con `schema` es `400`. Un rol que la 4.4 guardó para un esquema ya no
  vale: se lista como ignorado, para quitarlo (`DELETE /admin/roles/{name}?schema=`) y agregarlo de nuevo con sus
  `schemas`. `GET /admin/scopes` dice las vistas y stages de cada esquema servido, para elegirlos.
- Un cambio vale enseguida en la réplica que lo guarda, y en las otras dentro de `state.refresh`.

## Quién entra {#access}

**Desde data-gateway 5.0.0.**

- **`GET /admin/me`** (cualquier credencial, sobre sí misma): su nombre, su contexto y cada uno de sus roles como vale
  aquí, con sus permisos, esquemas, vistas y stages (la primera de cada uno, la de quien no elige). La página de una
  conexión del [IDE](../ide/Connections.md) lo muestra.
- **`GET /admin/access`** (permiso `roles`): quién puede entrar, como lo dice la configuración: las autenticaciones de
  cada nivel (global, transporte, esquema), cada clave, token o usuario con su nombre, sus roles y su contexto, el emisor
  y los claims de un método `jwt`, y todos los permisos que hay. **Nunca un secreto.**

## La observabilidad {#observability}

**Desde data-gateway 5.0.0,** con el permiso `observability`: `GET /admin/observability` da la
[observabilidad](Configuration.md#observability) vigente y de dónde viene; `PUT /admin/observability` `{ config,
reason }` reemplaza secciones enteras (`exporter`, `traces`, `metrics`, `logs`, `explore`), revisadas como el YAML (el
exporter nunca lleva headers: van en `OTEL_EXPORTER_OTLP_HEADERS`); `DELETE` vuelve al YAML.

- Se guarda en el estado del gateway, sobre el YAML, con quién la cambió y por qué.
- **Se aplica enseguida:** el edge se reinicia y los workers de los esquemas cuyo SDK cambia se recargan blue-green (las
  peticiones en curso terminan en el viejo), en todas las réplicas.

## Dónde se guarda el estado {#persist}

**Desde data-gateway 5.0.0.** `GET /admin/state` (permiso `roles` o `persist`) dice dónde guarda el gateway su
[estado](Configuration.md#state) (el SQLite del volumen, una base por λORM, memoria), cómo se lee, cada cuánto lo releen
las réplicas, si se puede leer ahora, y el `lambdaORM.yaml` de su esquema de sistema; la conexión sin sus secretos. Con
el permiso `persist` se cambia:

- `PUT /admin/persist/connection` `{ dialect, connection, reason }`: otra base (`SQLite`, `PostgreSQL`, `MySQL`,
  `MariaDB`, `SqlServer`, `Oracle`; la conexión puede nombrar variables, `$STATE_DB`).
- `PUT /admin/persist/schema` `{ text, reason }`: el `lambdaORM.yaml` del estado editado, del que solo cambia el mapping
  (la tabla de cada entidad y sus columnas).
- `DELETE /admin/persist`: volver a `state` del YAML.
- Se guarda en `.data-gateway/persist.yaml` del volumen (necesita `orm.workspacePath`), que reemplaza `state.source` y
  `state.mapping` del YAML al arrancar.
- **El estado se copia con λORM:** `push` de las tablas en el lugar nuevo, `export` del actual e `import` en el nuevo.
  Una base nueva que ya tiene estado se rechaza (`409`); un SQLite que tenía uno se guarda aparte (`.bak-<hora>`); si la
  copia falla, nada cambia. Después el gateway reinicia su edge y recarga los esquemas con la fuente nueva; las sesiones
  siguen (se copiaron) y las tablas viejas no se borran.

## Por MCP {#over-mcp}

El servidor MCP de cada esquema suma `admin_schema_get`, `admin_schema_validate` y `admin_stage_fetch` para
credenciales con `schemaRead`: un agente lee el esquema, revisa un cambio y ve si las bases coinciden. Escribir no se
ofrece por MCP: un modelo lo haría sin la vista previa ni la confirmación de la UI.

## La API {#the-api}

Las rutas REST están en la [API REST](Rest.md#administration); un workspace se nombra por su ruta en un segmento de la
URL (`iot%2Fv1`).
