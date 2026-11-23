# Primeros pasos {#getting-started}

De nada a una consulta, una consulta escrita por el asistente y un diagrama, sobre Northwind. Unos 10 minutos.

## 1. Un gateway con Northwind {#1-a-gateway-with-northwind}

Sigue los pasos 1 a 4 de los [Primeros pasos](../data-gateway/GettingStarted.md) del Data Gateway: su compose arranca
Postgres, un gateway con Northwind y el IDE web, crea las tablas e importa los datos. El gateway tiene su puerto
`management` en 9090, el puerto del IDE, al que solo llega el IDE dentro del compose.

Con la [aplicación de escritorio](Download.md) en lugar del IDE web, publica ese puerto solo en tu máquina, en el
servicio `data-gateway` del compose:

```yaml
    ports:
      - "127.0.0.1:9090:9090"   # management, para el IDE de escritorio
```

## 2. La conexión {#2-the-connection}

Abre el IDE: el web en `http://localhost:8090`, o la aplicación de escritorio. La primera vez se abre en una **Nueva
conexión**:

| Campo | Valor |
| --- | --- |
| **Nombre** | `northwind` |
| **Protocolo** | `REST · http` |
| **Dirección del management** | `data-gateway:9090` en el IDE web (como lo alcanza el IDE dentro del compose); `localhost:9090` en la aplicación de escritorio |
| **Autenticación** | API key, header `X-Api-Key`, clave `reader-demo-key` |
| **Recordar la clave en este navegador** | marcado, para que no la vuelva a pedir |

**Probar** dice quién es la clave y la versión del gateway; **Conectar** agrega la conexión.

![Nueva conexión](images/ide-new-connection.png)

Se abre la página de la conexión. Su pestaña **Roles** muestra lo que puede hacer `reader`: `read`, nada más. Con él
lees y consultas; lo que guardas queda en tu navegador ([Proyectos](Projects.md#where-it-is-saved)).

## 3. El explorador {#3-the-explorer}

A la izquierda, la conexión y su esquema (`/`, el único de este gateway). Despliega **Metadata → domain →
Entidades**: las entidades de Northwind. Un clic en `Orders` abre su formulario: sus propiedades, sus relaciones, sus
claves, sus filas y su diagrama ([Entidades](Entities.md)).

![El formulario de Orders](images/ide-entity-properties.png)

## 4. Una consulta {#4-a-query}

El botón **Consultar** de `Orders` abre una pestaña de consulta con `Orders.page(1, 10)`. Reemplázala por:

```ts
Customers
	.filter(p => p.country == 'Germany')
	.map(p => ({ id: p.id, name: p.name, city: p.city, country: p.country }))
	.sort(p => p.name)
	.page(1, 10)
```

El editor sugiere mientras escribes: después de `Customers.` las cláusulas, después de `p.` los campos y las
relaciones. **execute** (Ctrl+Enter) la ejecuta; **table** muestra las filas como una tabla.

![Una consulta y su resultado](images/ide-query.png)

## 5. Una consulta del asistente {#5-a-query-of-the-wizard}

Una pestaña nueva (**+**), luego **asistente**:

1. **partir de** `Orders`;
2. el **+** de `Orders`: marca `Customers` y `Orders.details`, **agregar (2)**; el **+** de `Orders.details`:
   `Products`;
3. marca `id` y `orderDate` de `Orders`, `name` y `country` de `Customers`, `quantity` y `unitPrice` de las
   líneas, `name` de `Products`;
4. **filtro:** `p.customer.country == 'Germany'`;
5. **+ agregar un orden:** `orderDate`, **descendente**; **filas por página:** `20`;
6. **crear la consulta**, luego **execute**.

Cada pedido viene con su cliente y sus líneas, cada línea con su producto. La página
[Asistente de consultas](QueryWizard.md) explica cada paso.

![El asistente](images/ide-wizard.png)

## 6. Guárdala {#6-save-it}

**Guardar** (Ctrl+S) pide un nombre, una descripción y una carpeta. Antes se crea una carpeta con el **+** de
**proyectos** → **Nuevo proyecto**. La consulta guardada conserva su asistente: su botón **asistente** lo abre como
quedó.

![Guardar la consulta](images/ide-save-query.png)

## 7. Un diagrama {#7-a-diagram}

El **+** de la carpeta → **Nuevo diagrama**: un nombre, marca `Orders` y **Agregar sus vecinas** (su cliente y sus
líneas), **Crear**. Las cajas se acomodan solas; arrástralas y **Guardar** las conserva donde quedaron
([Diagramas](Diagrams.md)).

![Un diagrama](images/ide-diagram.png)

## Siguiente {#next}

- La página de la conexión: sus sesiones, y la API REST, el WebSocket y el MCP del gateway en pestañas
  ([Conexiones](Connections.md)).
- Administrar los esquemas desde el IDE necesita una credencial con `schemaRead` y `schemaWrite`
  ([Administración](Administration.md)).
- Un IDE web para un equipo, junto a los gateways ([Despliegue](Deploying.md)).
