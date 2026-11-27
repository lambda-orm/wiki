# Conexiones {#connections}

Una conexión es un gateway con el que trabaja el IDE: la dirección de su puerto `management` y una credencial. El IDE no
tiene login ni página de inicio: guarda sus conexiones, y la primera vez se abre en una **Nueva conexión**. Puede haber
varias conexiones abiertas a la vez, cada una un árbol del [explorador](Explorer.md): su **Administración** (lo que su credencial puede administrar
del gateway) y sus **Esquemas**, con sus pestañas una al lado de la otra.

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

Un clic en su nombre abre **Conexión: nombre** (desde IDE 1.5.0, solo la conexión; sus herramientas, roles, sesiones y
escrituras que esperan están en su [Administración](#administration)):

- **El formulario** arriba, con **Guardar** (guardarla sin cambios la conecta de nuevo, después de una revocación) y
  **Quitar**, que pregunta antes y la quita solo del IDE: no se quita nada del gateway, y sus pestañas se cierran.
- **Quién soy acá** (data-gateway 5.0, `GET /admin/me`): el usuario de la credencial, su contexto y cada uno de sus roles
  como vale, con sus permisos, sus esquemas y, en cada uno, sus vistas y stages (marcado el que se usa cuando no se elige
  nada). En cada esquema los permisos son los de los roles que permiten la vista y el stage elegidos. Un rol que el
  gateway no tiene dice *desconocido: no da nada*. Con un gateway anterior a 5.0, su nombre y sus permisos.

## Su administración {#administration}

**Desde IDE 1.5.0, con data-gateway 5.0.** En el explorador, cada conexión tiene el nodo **Administración** sobre sus
**Esquemas**, con lo que su credencial puede administrar; lo que necesita un permiso que no tiene no se muestra:

```text
northwind  http://data-gateway:9090
├─ Administración
│  ├─ Roles                    (roles)        cada rol un nodo: Editar, Quitar
│  ├─ Acceso                   (roles)
│  ├─ Persistencia             (roles o persist)
│  │  ├─ Config                su lambdaORM.yaml, en Monaco
│  │  └─ Conexión              (persist)
│  ├─ Sesiones
│  ├─ Escrituras que esperan   (approve)
│  ├─ Herramientas             API REST · WebSocket · MCP
│  └─ Observabilidad           (observability)   Métricas · Logs · Trazas
└─ Esquemas
   └─ /
```

### Roles {#roles}

**Permisos por rol:** un rol por fila y un permiso por columna (la configuración y el estado juntos), con sus esquemas.
**+ Agregar un rol** abre uno nuevo. Cada rol es un nodo propio: todo lo que da, sus permisos y, por esquema, sus vistas
y stages con los de por defecto marcados, de dónde viene (*su configuración*, o quién lo cambió y cuándo), con
**Editar** y **Quitar**.

**Editar** tiene una casilla por permiso (los que da su configuración, marcados y fijos: lo que se guarda extiende un rol
de la configuración, nunca le quita), sus **Esquemas** (ninguno: todos los esquemas) y, para cada esquema elegido, sus
vistas y stages para marcar con su **Vista por defecto** y su **Stage por defecto**, **Máximo de filas**, *Sus escrituras
esperan que una persona las apruebe* y **Por qué (opcional)**. Un rol *bloqueado* en la configuración no se puede
extender; un rol que la 4.4 guardó para un esquema se marca *de un esquema (4.4): no se aplica; quitalo*. **Sus
cambios** dice quién cambió qué y cuándo. Ver [roles](../data-gateway/Security.md#roles).

### Acceso {#access}

**Acceso: keys y tokens:** quién puede entrar, como lo dice la configuración (`GET /admin/access`): por **Dónde** (*en
todo*, un transporte, un esquema) cada **Método** y **Credencial** con sus roles y su **Contexto**; un método `jwt` dice
su emisor y el claim de sus roles. Nunca un secreto.

### Persistencia {#persist}

Dónde guarda el gateway su administración (las sesiones, los roles, su observabilidad, las escrituras que esperan y los
cambios de cada uno): su base o archivo, quién lo lee y escribe, quién lo dice (*state.source de la configuración*, *por
defecto: el SQLite del volumen*, *la administración*), cada cuánto lo releen las réplicas, si es obligatorio y si se
puede leer ahora.

- **Config:** el `lambdaORM.yaml` de la administración, en Monaco: las entidades, el mapping y la fuente del estado como
  los usa λORM. Con `persist` se puede editar su mapping (la tabla de cada entidad y sus columnas): **Guardar el
  mapping** copia el estado a las tablas nuevas y el gateway se reinicia.
- **Conexión** (con `persist`): **Ahora**, la base del momento, y **Otra base**: **Copiar el estado y mover** lo copia
  ahí con λORM y el gateway se reinicia con ella (las conexiones abiertas se reconectan); **Volver a la configuración**
  lo deshace. Ver [dónde se guarda el estado](../data-gateway/Admin.md#persist).

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

### Observabilidad {#observability}

Con `observability`: lo que envía el gateway y a dónde, en tres nodos, **Métricas** (*Enviar por OTLP*, *Cada (ms)*,
*lambdaorm.entity en las métricas*; `/metrics` para Prometheus se sirve siempre), **Logs** (*A la consola*, su
**Nivel**, por OTLP) y **Trazas** (*Muestreo (0–1)*, *Seguir la decisión de quien llama*, *Texto de las consultas en
los spans*); **A dónde va: el exportador OTLP** (su **Endpoint**; sus headers solo en `OTEL_EXPORTER_OTLP_HEADERS`) y
**Dónde se ve** (**URL de Grafana**, los datasources de **Tempo**, **Prometheus** y **Loki**, la **Organización de
Grafana**), con **Abrir en Grafana**. **Guardar y aplicar** lo guarda sobre la configuración y lo aplica enseguida (el
edge se reinicia y los esquemas cuya telemetría cambia se recargan); **Volver a la configuración** lo deshace. El
enlace de una entidad a sus trazas ([Entidades](Entities.md)) viene de aquí, no de cada IDE.

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
