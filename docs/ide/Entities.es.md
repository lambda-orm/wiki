# Entidades {#entities}

Cada entidad del dominio tiene una vista, como una tabla en un IDE de bases de datos: sus propiedades, sus relaciones,
sus claves, sus restricciones, sus filas, su diagrama y el historial de sus cambios. Un clic en su fila del
[explorador](Explorer.md) la abre en su propia pestaña; un enlace a otra entidad (una relación, una referencia) abre
esa.

Su cabecera tiene el nombre de la entidad, su esquema, y **abstracta**, **vista** o **extiende Entity** cuando lo es.
Sus botones:

| Botón | Hace | Necesita |
| --- | --- | --- |
| **Ver trazas** | abre las trazas de esta entidad en Grafana (Tempo, filtradas por `lambdaorm.entity`) | la **Observabilidad** de la [conexión](Connections.md#a-new-connection) |
| **Eliminar** | dice qué usa la entidad y, confirmado, la elimina del esquema | `schemaWrite` |
| **Editar** | abre su [formulario](Administration.md#forms), ya en edición: **Cancelar** o **Guardar** vuelven a esta vista | `schemaWrite` |
| **Consultar** | abre una pestaña de consulta con `Entity.page(1, 10)` (no en una entidad abstracta) | |

Debajo de la cabecera, sus pestañas: **Propiedades (n)**, **Relaciones (n)**, **Claves e índices**,
**Restricciones (n)**, **Datos**, **Diagrama** e **Historial**.
El número de **Relaciones** incluye las relaciones de otras entidades que apuntan a esta (**Referenciada por**), así que puede ser mayor que el del explorador.

## Propiedades {#properties}

| Columna | Qué es |
| --- | --- |
| **#** | su posición |
| **Nombre** | en negrita, la clave primaria |
| **Tipo** | `string`, `integer`, `decimal`, `dateTime`…, o el enum del que toma sus valores (`Status (enum)`) |
| **Largo** | de un string |
| **Obligatoria** | ✓ cuando no puede ser nula |
| **PK** | ✓ en la clave primaria (`U` cuando además está en la clave única) |
| **Auto** | ✓ cuando la base de datos da su valor |
| **Por defecto** | su valor por defecto |
| **Referencia a** | para una clave foránea, la entidad y la propiedad a la que referencia: un enlace a esa entidad |
| **Expresiones** | **ƒ Expresión** cuando tiene expresiones o la usan restricciones |

![Propiedades](images/ide-entity-properties.png)

Un clic en **ƒ Expresión** muestra, debajo de la tabla, las expresiones de esa propiedad con los colores del editor,
cada una con lo que hace, y las restricciones cuya condición la usa:

| Expresión | Qué hace |
| --- | --- |
| `readExp` | reemplaza la columna al leer: λORM la traduce a la consulta (`mask(email)`) |
| `writeExp` | pensada para lo que se escribe en la columna (λORM todavía no la aplica: usa `writeValue`) |
| `readValue` | transforma cada valor después de leerlo, en el gateway (`decrypt(email, $DATA_SECRET_KEY)`) |
| `writeValue` | transforma cada valor antes de escribirlo, en el gateway (`encrypt(email, $DATA_SECRET_KEY)`) |

## Relaciones {#relations}

**Relaciones** lista sus relaciones: nombre, tipo (`oneToMany`: a una, como un pedido a su cliente; `manyToOne`: a
muchas, como un pedido a sus líneas; `oneToOne`; λORM las nombra desde el lado de la otra entidad), la entidad a la que
llegan, los campos que unen (**Desde**, **Hasta**), la cardinalidad (`N — 1`, `1 — N`) y si es débil.
**Referenciada por** lista las relaciones de otras entidades que llegan a esta. Cada entidad es un enlace a su vista.
El contador de la pestaña suma ambas.

![Relaciones](images/ide-entity-relations.png)

## Claves e índices {#keys-and-indexes}

La clave primaria, la clave única, y los índices con sus campos.

## Restricciones {#constraints}

Las condiciones que λORM comprueba antes de cada insert y update (después de `writeValue`): una condición falsa
rechaza la sentencia con su mensaje. Cada una con su **Mensaje**, su **Condición** con los colores del editor y las
**Propiedades que usa**.

## Datos {#data}

Sus filas, 50 por página, **◀ Anterior** y **Siguiente ▶**. Una entidad abstracta no tiene datos.

- **Ordenar** por una columna: un clic en su encabezado (ascendente ▲, descendente ▼, ninguno). **Filtrar** con una
  condición sobre `p` (`p.price > 18`) y **Aplicar** (o Enter).
- **Exportar** la página (**CSV**, **JSON**, **XLSX**) o todo (**CSV ∀**, **JSON ∀**, **XLSX ∀**): todas las páginas,
  con su orden y su filtro, hasta 100 000 filas, con las filas leídas hasta el momento y **Cancelar**. El `.xlsx` es un
  archivo de Excel de verdad (`Orders.xlsx`, `Orders-page-1.csv`).

Con una credencial que tiene `write` y una entidad con clave primaria, la tabla es además un **backoffice** (desde el
IDE 1.2.0):

- **Cambiar una celda:** doble clic, el valor nuevo, Enter (Escape la deja). Cambia solo mientras la celda todavía
  tiene lo que se leyó: si alguien la cambió mientras tanto, no se cambia nada y la tabla lo dice y la muestra ahora.
  La clave, lo calculado (`view`, `readExp`) y lo `autoIncrement` no se editan; un valor que no es de su tipo (`x` en
  un número) no se manda.
- **+ Agregar una fila:** un formulario con las propiedades de la entidad (las requeridas marcadas con `*`).
- **✕** al final de una fila la borra, después de mostrar su clave y preguntar.

Todo pasa por la gateway con la credencial de la connection: sus permisos, su
[vista](../data-gateway/Security.md#views) y la auditoría. Sin `write`, la tabla es de solo lectura.

Desde el IDE 1.3.0:

- Los **puntos** (`point`) se muestran como longitud, latitud con **↗** a un mapa, y se editan en dos campos; los
  **vectores** (`vector`) muestran sus primeros números y cuántos (`[0.12, -0.03, 0.5, …] (1536)`), y se escriben como
  JSON en el formulario de la fila, controlados contra sus dimensiones.
- Una propiedad que guarda [archivos](../data-gateway/Configuration.md#files) (data-gateway 4.3.0) muestra su archivo:
  un clic lo abre (una URL de vida corta); con `write`, **⤒** sube otro, directo al almacenamiento, y **✕** lo quita de
  la fila.

![Datos](images/ide-entity-data.png)

## Diagrama {#diagram}

La entidad y sus vecinas, solo lectura. La caja **entidad** centra el diagrama en otra, y la profundidad va de
**vecinas** a **2 niveles** o **todo el modelo**. Un clic en una caja la centra; un doble clic abre su vista. El resto
del diagrama (zoom, mostrar, outline, exportar) es como en [Diagramas](Diagrams.md).

![Diagrama](images/ide-entity-diagram.png)

## Historial {#history}

Con `schemaRead` (el gateway guarda el historial de sus esquemas desde data-gateway 4.1.0): los cambios de esta
entidad, los más nuevos primero, con **Cuándo**, **Quién** (la credencial y su cliente: el IDE, la CLI) y **Qué**.
Un clic en un cambio muestra sus **Cambios** (`+` agregado, `-` quitado, `~` reemplazado) y la entidad **Antes** y
**Después**; **Cambios anteriores** lee más. El esquema entero también tiene su historial
([Administración](Administration.md#history)).
