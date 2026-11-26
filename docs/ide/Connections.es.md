# Conexiones {#connections}

Una conexión es un gateway con el que trabaja el IDE: la dirección de su puerto `management` y una credencial. El IDE no
tiene login ni página de inicio: guarda sus conexiones, y la primera vez se abre en una **Nueva conexión**. Puede haber
varias conexiones abiertas a la vez, cada una con sus esquemas en el [explorador](Explorer.md) y sus pestañas una al
lado de otra.

Agrega una conexión por cada gateway y credencial que uses: uno local, el de un entorno de pruebas, el mismo gateway
con una credencial que solo lee y otra que administra.

## Una conexión nueva {#a-new-connection}

El **+** junto a **Conexiones**, arriba del explorador:

| Campo | Qué es |
| --- | --- |
| **Nombre** | cómo se muestra la conexión (`local`, `production`…) |
| **Protocolo** | `REST · http` o `REST · https` |
| **Dirección del management** | `host:puerto/ruta base` del `management` del gateway, **como lo alcanza el servidor del IDE**: `data-gateway:9090` para un IDE web en el mismo compose, `localhost:9090` para la aplicación de escritorio en la máquina del gateway |
| **Autenticación** | **API key** (su **Header**, por defecto `X-Api-Key`, y su **Clave**), **Token Bearer (JWT)** (su **Token**: una clave del gateway o el [token de un proveedor de identidad](../data-gateway/Security.md#jwt); cuando vence la conexión lo dice y pide uno nuevo), **Basic (usuario y contraseña)**, **OpenID Connect (iniciar sesión)** (IDE 1.3.0: su **Emisor**, **Client ID** y **Scopes**; ver abajo) o **Ninguna** |
| **Recordar la clave en este navegador** | se guarda con la conexión; si no, solo en esa pestaña del navegador, y se vuelve a pedir después de cerrarla |
| **Otras URLs de sus transportes** (plegado) | la **URL de REST**, la **URL del WebSocket** y la **URL del MCP**, solo cuando el IDE no los alcanza en los puertos que dice el gateway (un proxy adelante, otra red) |
| **Observabilidad** (plegado) | la **URL de Grafana** y su **Datasource de Tempo (uid)** (`tempo` por defecto): entonces una entidad muestra un enlace a sus trazas ([Entidades](Entities.md)) |

**OpenID Connect (iniciar sesión)**: la página de la connection tiene **Iniciar sesión**, que abre el login del
proveedor de identidad (en el navegador, una ventana propia; en la app de escritorio, el navegador del sistema, que
vuelve a la app); el token queda en esa pestaña y se renueva antes de vencer; **Cerrar sesión** termina también la
sesión del proveedor. El proveedor necesita un cliente público con PKCE cuyas redirect URIs acepten el IDE
(`…/oidc-callback.html` del IDE, y `http://127.0.0.1:*` para la app de escritorio); el servidor del IDE lo alcanza, así
que su origen va en `DATA_GATEWAY_IDE_TARGETS` ([Despliegue](Deploying.md)).

**Mostrar** muestra la clave que se escribió. **Probar** abre una sesión y la cierra enseguida: `Conectado como admin ·
data-gateway 4.0.0`, o por qué no pudo. **Conectar** agrega la conexión y abre su página.

![Nueva conexión](images/ide-new-connection.png)

La conexión queda en el navegador (en la aplicación de escritorio, en sus datos); sus esquemas, workspaces y lo que se
guarda en ellos están en el gateway.

## Su fila en el explorador {#its-row-in-the-explorer}

| Elemento | Qué hace |
| --- | --- |
| ▸ | pliega y despliega sus esquemas |
| su nombre y su dirección | abren su página |
| ⟳ **Actualizar** | vuelve a leer lo que cambió en otro lado: sus esquemas, sus dominios y lo guardado |
| ⚠ en lugar de su icono | algo para ver: el puntero encima dice qué |

Los problemas que indica, en rojo debajo de su nombre:

- **Falta su clave: abrí la conexión para ingresarla** — la clave no se recordó y se cerró la pestaña del navegador.
- **La credencial no es válida.**
- **El servidor del IDE no llega a la data-gateway** — su dirección, o su `management` no está expuesto; sigue el
  motivo (un destino no permitido: [Despliegue](Deploying.md#its-targets)).
- **La sesión terminó: …** — revocada ([abajo](#sessions)).
- **La sesión vence en 2 minutos: guardá lo que estés editando.**

## Su página {#its-page}

Un clic en su nombre abre **Conexión: nombre**, con cuatro pestañas.

### Conexión {#connection}

El formulario de arriba, con **Guardar** (guardarlo sin cambios lo vuelve a conectar, después de una revocación) y
**Quitar**, que pregunta antes y la quita solo del IDE: no se borra nada del gateway, y se cierran sus pestañas. Debajo
del formulario, quién es la credencial: su nombre, la URL y su autenticación.

### Herramientas {#tools}

**API REST (Swagger)**, **WebSocket** y **MCP**: los transportes del gateway, cada uno abierto en su propia pestaña
(`API REST · northwind`…), con la credencial de la conexión. Un transporte que el gateway no expone está deshabilitado
(`esta data-gateway no lo expone`). El IDE sabe dónde están por el gateway (`GET /transports` de su `management`), o
por **Otras URLs de sus transportes**.

| Herramienta | Qué tiene |
| --- | --- |
| **API REST (Swagger)** | el OpenAPI del gateway, cada método con **Try it out**; la credencial va con cada petición |
| **WebSocket** | un **Esquema**, **Conectar** / **Desconectar**, sus **Métodos** (de su AsyncAPI: un clic llena el pedido), el **Pedido** (JSON-RPC) con **Enviar** (Ctrl+Enter) y los **Mensajes** enviados y recibidos (los últimos 200) |
| **MCP** | un **Esquema** y **Conectar**, luego las **Tools del esquema**: elegida una, sus **Argumentos** (llenos con los obligatorios), **Llamar** (Ctrl+Enter) y su **Resultado** |

![Herramientas](images/ide-connection-tools.png)

### Roles {#roles}

Lo que puede hacer la credencial, en dos grupos, **Datos** y **Administración**, cada uno con cuántos están otorgados
(`1 / 5`): cada permiso, **otorgado** o **no otorgado**, con lo que permite.

| Permiso | Permite |
| --- | --- |
| `read` | consultas que solo seleccionan, el esquema, planes, metadatos y exportar un stage |
| `write` | consultas que insertan, actualizan, borran, hacen upsert o merge de filas |
| `script` | ejecutar scripts |
| `queue` | enviar consultas a la cola, para ejecutarlas después |
| `stageImport` | importar datos en un stage |
| `schemaRead` | leer el `lambdaORM.yaml` de cada workspace (sin secretos) y validarlo |
| `schemaWrite` | cambiar el `lambdaORM.yaml`: entidades, sources, stages…, desde los formularios o el YAML |
| `schemaAdmin` | crear y eliminar esquemas, definir las variables de su `.env` |
| `workbenchWrite` | guardar consultas, scripts y diagramas en los proyectos de los workspaces |
| `ddl` | cambiar la estructura de las bases de datos de un stage (push, drop) |
| `build` | generar el código del dominio (modelo y repositorios) en `src/` del workspace |
| `sessionAdmin` | ver todas las sesiones de `management` y revocar las de otras credenciales |

![Roles](images/ide-connection-roles.png)

Los permisos se dan a cada credencial en la configuración del gateway
([Seguridad](../data-gateway/Security.md)).

### Escrituras que esperan {#approvals}

Desde el IDE 1.3.0, con una credencial que tiene `approve`: las
[escrituras de agentes que esperan a una persona](../data-gateway/Security.md#approvals) en todos los schemas de la
gateway, cada una con quién la pidió y cuándo, su consulta (o script), **Lo que correría** (sus sentencias) y **Sus
datos**. **Aprobar** la corre como quien la pidió; **Rechazar** pide un motivo (opcional). Quien pidió una escritura no
puede aprobarla. La lista se relee cada 15 segundos.

### Sesiones {#sessions}

Conectarse inicia sesión en el `management` del gateway ([sesiones](../data-gateway/Transports.md#sessions)): el IDE
guarda el token en esa pestaña del navegador, y cada petición lo lleva, nunca la clave.

- Cuando la sesión **vence** (30 minutos sin actividad, o 12 horas) y la clave está a mano, el IDE abre otra por sí
  solo; sin ella, pide la clave.
- Cuando se **revoca**, el IDE dice quién la revocó y no vuelve por sí solo, aunque la clave esté recordada: guardar la
  conexión de nuevo la conecta.
- El IDE mantiene abierto el WebSocket de eventos del gateway: la sesión se muestra como *conectado* (un ● verde), y un
  esquema que cambia, o algo que guardó otra persona, se ve enseguida. Un cambio hecho por otra sesión (otra persona,
  otro IDE, la CLI a través del gateway) se anuncia debajo de la conexión, `modeler cambió Orders en /`, con
  **Actualizar**.

**Mis sesiones** lista las sesiones de la misma credencial: esta (**esta**) y las otras (otra pestaña, navegador o
computadora), cada una con su cliente, su dirección, lo que está mirando (su esquema y su pestaña activa), su última
actividad y cuándo vence. **Cerrar** cierra una; **Cerrar las otras**, todas menos esta.

Con `sessionAdmin`, **Sesiones activas** lista todas las sesiones del gateway por credencial: **Revocar** una, o
**Revocar todas** las de una credencial (pregunta antes; en la tuya, esta sesión queda).

![Sesiones](images/ide-connection-sessions.png)
