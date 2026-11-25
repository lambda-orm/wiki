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
    port: 9090               # sin un puerto, no hay administración (ni IDE)
admin:
  commandTimeoutMs: 600000   # cuánto puede tardar un comando
  maxFileBytes: 2MB          # el archivo más grande que se puede escribir
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: modeler, value: $MODELER_KEY, permissions: [ read, schemaRead, schemaWrite, schemaAdmin, workbenchWrite, ddl, build ] }
    - { name: analyst, value: $ANALYST_KEY, permissions: [ read, workbenchWrite ] }
```

La administración responde en `/admin` del [transporte `management`](Transports.md#management), con su
autenticación; `http` no la tiene. Sus permisos **nunca se dan por defecto**: una credencial sin lista de permisos tiene solo los de los datos.

| Permiso | Permite |
| --- | --- |
| `schemaRead` | leer el `lambdaORM.yaml` de cada workspace y validarlo |
| `schemaWrite` | cambiarlo (como YAML o elemento por elemento), `pull`, `introspect` |
| `schemaAdmin` | crear y eliminar workspaces; definir las variables de las conexiones |
| `workbenchWrite` | guardar consultas, scripts y diagramas en los workspaces, sin tocar el esquema |
| `ddl` | cambiar la estructura de las bases de un stage (`push`, `drop`) |
| `build` | generar el código del dominio en `src/` del workspace |
| `sessionAdmin` | ver todas las [sesiones](Transports.md#sessions) de `management` (quién está conectado) y revocarlas |

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
| `push` | las sentencias por source | `ddl` |
| `drop` | las sentencias; se vuelve a escribir el stage | `ddl` |
| `import` | las filas de cada entidad | `stageImport` |
| `pull` | el diff del `lambdaORM.yaml` | `schemaWrite` |
| `introspect` | el diff y las filas de los datos | `schemaWrite` |
| `incorporate` | el diff y las filas; después el esquema se recarga, `push` crea sus tablas y se importan las filas | `schemaWrite`, `ddl`, `stageImport` |
| `build` | — (se escribe en `src/`, o se descarga como `.zip`) | `build` |

Un comando que cambia las bases o el esquema ejecuta **exactamente la vista previa que se mostró**, una vez, dentro de
10 minutos, y solo mientras el `lambdaORM.yaml` sea el mismo con que se hizo (si no, `409 PreviewRequiredError`); otro
comando del mismo esquema mientras uno corre responde `409 BusyError`. Cada job deja su registro en
`orm_state/jobs/`; `push`, `drop` e `import` se [auditan](Security.md#audit). `admin.commandTimeoutMs` (10 minutos)
limita cuánto puede tardar uno.

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

## En la próxima versión {#in-the-next-version}

No está en la imagen 4.0.0: el **historial de un esquema** (cada cambio hecho por la administración, con quién, el
antes, el después y el diff, en `logs/changes.jsonl` del workspace y `GET /admin/workspaces/{route}/history`), el
**ruteo de un stage** (adónde va cada entidad, `…/stages/{stage}/routing`) y `build` por lenguaje
(`src/<language>/domain/`), con solo el modelo o solo los repositorios, y un código generado descargado como zip o
eliminado.

## Por MCP {#over-mcp}

El servidor MCP de cada esquema suma `admin_schema_get`, `admin_schema_validate` y `admin_stage_fetch` para
credenciales con `schemaRead`: un agente lee el esquema, revisa un cambio y ve si las bases coinciden. Escribir no se
ofrece por MCP: un modelo lo haría sin la vista previa ni la confirmación de la UI.

## La API {#the-api}

Las rutas REST están en la [API REST](Rest.md#administration); un workspace se nombra por su ruta en un segmento de la
URL (`iot%2Fv1`).
