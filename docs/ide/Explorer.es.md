# Explorador {#explorer}

A la izquierda, las conexiones y los esquemas de cada una: su metadata, su estado, su código fuente y lo que se guarda
en ellos. Es donde empieza todo: un clic abre una entidad, una consulta, un diagrama o un formulario en una pestaña a la
derecha.

## Su árbol {#its-tree}

```text
λORM Data Gateway ▾   Conexiones 1          ⟳ · + Nueva conexión
northwind  http://data-gateway:9090         ⟳ Actualizar
Esquemas                                    Nuevo esquema · Exportar · Importar
└─ /                                        su pestaña: comandos, información, historial   ⟳
   ├─ Metadata
   │  ├─ config                             el lambdaORM.yaml                  (schemaRead)
   │  ├─ domain                             doble clic: el dominio como YAML, solo lectura
   │  │  ├─ Entidades  +                    filtro · cada entidad: Propiedades (n), Relaciones (n)
   │  │  └─ Enums  +
   │  ├─ application                        sus tareas de inicio y listeners   (schemaRead)
   │  └─ infrastructure                                                        (schemaRead)
   │     ├─ Mappings  +
   │     ├─ Sources  +
   │     ├─ Stages  +                       cada stage: ◇ su diagrama
   │     └─ Variables (.env)
   ├─ Estado                                                                   (schemaRead)
   │  └─ data                               los archivos de data/
   ├─ Código fuente  </>                    el código generado, por lenguaje   (schemaRead)
   │  └─ TypeScript · node                  ⤓ .zip · ↻ volver a generar · 🗑 eliminar
   └─ Workbench  +                          proyectos, carpetas, consultas y diagramas
```

![El explorador](images/ide-explorer.png)

Lo que necesita un permiso no se muestra sin él: con solo `read`, un esquema tiene su **Metadata → domain** y su
**Workbench**. El **+** de **Entidades**, **Enums**, **Mappings**, **Sources** y **Stages** (con `schemaWrite`) abre el
formulario de uno nuevo ([Administración](Administration.md#forms)).

| Fila | Un clic | Sus botones |
| --- | --- | --- |
| una conexión | su nombre abre su página ([Conexiones](Connections.md)) | ⟳ actualizar |
| un esquema | lo despliega y abre su pestaña ([Administración](Administration.md#the-schema-tab)) | ⟳ actualizarlo |
| **config** | abre el `lambdaORM.yaml` ([Administración](Administration.md#the-yaml)) | |
| **domain** | lo despliega; un doble clic abre el dominio como YAML (solo el dominio: nunca los sources, las conexiones ni el resto de la configuración) | |
| una entidad | la despliega y abre su [vista](Entities.md) | |
| una propiedad de una entidad | nada: su nombre, en negrita para la clave primaria, y su tipo | |
| una relación de una entidad | abre la entidad a la que llega (`customer → Customers · N — 1`) | ↗ abrirla |
| un enum, un mapping, un source, un stage | abre su formulario ([Administración](Administration.md#forms)) | un stage: ◇ su [diagrama](Administration.md#the-diagram-of-a-stage) |
| **application**, **Variables (.env)** | lo abre ([Administración](Administration.md)) | |
| un archivo de **data** o de un código | lo abre, solo lectura | |
| un código de **Código fuente** | despliega sus archivos | ⤓, ↻, 🗑 ([Administración](Administration.md#source-code)) |
| una carpeta, una consulta, un diagrama | lo abre ([Workbench](Projects.md)) | **+** en una carpeta, ✎ editar, 🗑 eliminar |

Un esquema que no arrancó se muestra atenuado, con su estado y su motivo (o `La gateway no da el motivo: mirá su log`),
su **config** para corregirlo y, con `schemaAdmin`, 🗑 para eliminarlo; uno cuya versión nueva no arrancó muestra ⚠
mientras atiende la anterior.

**Actualizar.** Los esquemas se vuelven a leer solos, y enseguida cuando el gateway anuncia un cambio. ⟳ vuelve a leer
lo que cambió en otro lado (por otro IDE, la CLI, alguien que edita los archivos): en la raíz, todas las conexiones; en
una conexión, sus esquemas, sus dominios y lo guardado; en un esquema, solo ese.

## El filtro de las entidades {#the-filter-of-the-entities}

La caja sobre las entidades (`Filtrar: entidad, propiedad, Entidad.campo`) deja las que tienen el texto en su nombre, o
en el nombre de una de sus propiedades o relaciones: `21 de 192`, o `Nada coincide`. Las propiedades y relaciones que
coincidieron se muestran debajo de su entidad, aunque esté plegada. `Orders.customer` busca la relación `customer` de
`Orders`. Escape lo borra.

## Teclado {#keyboard}

| Tecla | Hace |
| --- | --- |
| Tab | se mueve entre filas |
| → / ← | despliega / pliega |
| Enter | abre la fila (o la despliega) |

## Su ancho {#its-width}

Arrastra su borde para cambiarle el ancho (entre 180 y 720 px); un doble clic en el borde lo ajusta a los nombres.
Desde el teclado, en el borde: ← y → lo cambian de a 20 px (con Shift, 60), Enter lo ajusta. El botón ◫ a la izquierda
de las pestañas lo oculta y lo muestra. El ancho se recuerda.

## Las pestañas {#the-tabs}

| Pestaña | Se abre desde | Título |
| --- | --- | --- |
| una consulta | **+** de las pestañas, **Consultar** de una entidad, una consulta guardada, el asistente | `Consulta 1`, la entidad, el nombre de la consulta guardada |
| una entidad | una fila de una entidad | su nombre |
| un diagrama | un diagrama guardado | su nombre |
| el dominio | doble clic en **domain** | `Dominio (YAML) /` |
| un esquema | una fila de un esquema | `Esquema /` |
| su YAML, un elemento, un diagrama de stage | las filas de [administración](Administration.md) | `lambdaORM.yaml /`, `Orders`, `Nuevo en Entidades`, `Stage default`… |
| un archivo | un archivo de data o de un código | su nombre |
| una conexión, preferencias, herramientas | la conexión, el menú | `Conexión: northwind`, `Preferencias`, `API REST · northwind`… |

- **+** abre una pestaña de consulta en la conexión de la pestaña activa, en su primer esquema que está listo; **×**
  cierra una pestaña; hasta 20 pestañas.
- Un clic derecho en una pestaña, o **⋯** al final de la barra: **Cerrar**, **Cerrar los demás**, **Cerrar todos**.
- Un **•** después del título marca cambios sin guardar.
- Con varias conexiones, el título dice cuál: `Orders · production`.
- Sin ninguna pestaña abierta: `Abrí una consulta, una entidad o un diagrama desde el explorador, o empezá una consulta con +.`

**Donde estaba.** Las pestañas abiertas (con el texto de cada consulta como se escribió, y los diagramas todavía sin
guardar), la activa y lo que estaba desplegado en el explorador se guardan en el navegador: una recarga, o el día
siguiente, empieza donde estaba.
