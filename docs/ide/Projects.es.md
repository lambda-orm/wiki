# Workbench {#workbench}

Lo que guardas de un esquema, bajo **Workbench** en el [explorador](Explorer.md): proyectos, carpetas, consultas y
diagramas. Un proyecto es una carpeta en la raíz; las carpetas se anidan para organizar lo guardado. Guarda ahí las
consultas que vuelves a ejecutar, los diagramas que explican el dominio y los
[diagramas de los stages](Administration.md#the-diagram-of-a-stage), cada uno con un nombre y una descripción.

## Agregar {#adding}

El **+** de **Workbench** o de una carpeta:

| Elemento | Qué pide |
| --- | --- |
| **Nuevo proyecto** (en **Workbench**) / **Nueva carpeta** (en una carpeta): los dos abren el diálogo **Nueva carpeta** | un nombre, una descripción y la carpeta en la que va |
| **Nueva consulta** | abre una pestaña de consulta en esa carpeta; su primer **Guardar** pide su nombre |
| **Nuevo diagrama** | un nombre, una descripción, la carpeta y las entidades ([Diagramas](Diagrams.md#a-new-diagram)) |
| **Nuevo panel** (IDE 1.3.0) | nada: se abre al instante un panel llamado **Nuevo panel** (se renombra desde el explorador) |

## Paneles {#panels}

Desde el IDE 1.3.0. Un **panel** es una grilla de tarjetas, cada una una consulta y cómo se muestra su resultado: un
**número** (su primer valor), una **tabla**, **barras** o **líneas** (una columna de etiquetas y las de los valores:
ninguna, todas las numéricas) o una **torta**. **+ Tarjeta** agrega una y abre su formulario (**Título**, **Consulta**,
**Datos**, **Se muestra como**, sus columnas y **Ancha**, dos columnas de la grilla); **✎** la vuelve a abrir.
**Actualizar** las corre todas, **Actualizar solo** cada 30 s a 15 min; **Guardar** guarda el panel en el workbench
(`<nombre>.panel.yaml`). Las tarjetas corren con la credencial de la connection: su vista y sus permisos.

## Guardar una consulta {#saving-a-query}

**Guardar** (Ctrl+S) en una pestaña de consulta: la primera vez, pide un **Nombre**, una **Descripción** y una
**Carpeta**; luego guarda en el mismo lugar. **Guardar como…** guarda una copia con otro nombre. Lo que se guarda: el
modo, la consulta o el script, los datos, las opciones y, cuando la escribió el [asistente](QueryWizard.md), el
asistente.

![Guardar la consulta](images/ide-save-query.png)

- Un **•** en la pestaña marca cambios sin guardar; una vez guardada dice **guardado**.
- Una consulta guardada cuyo esquema se cambia en su pestaña se guarda como una nueva.
- Abrir una consulta guardada que ya está abierta lleva a su pestaña.

Un diagrama se guarda con **Guardar** en su barra ([Diagramas](Diagrams.md)); un diagrama de un stage pide la primera
vez su nombre, descripción y carpeta, y también tiene **Guardar como…**.

## Editar, mover, eliminar {#editing-moving-deleting}

Cada fila tiene ✎ **Editar** (su nombre, descripción y carpeta) y 🗑 **Eliminar** (pregunta antes; una carpeta se lleva
lo que contiene). Los elementos se **mueven arrastrándolos** sobre una carpeta, o sobre **Workbench** para llevarlos a
la raíz, dentro del mismo esquema. Dos elementos del mismo tipo no pueden tener el mismo nombre en una carpeta
(`Ya hay uno con ese nombre acá.`). La descripción se muestra cuando el puntero está sobre el elemento.

## Dónde se guarda {#where-it-is-saved}

| La credencial tiene | Lo guardado va a | Lo ve |
| --- | --- | --- |
| `workbenchWrite` | la carpeta `workbench/` del workspace del esquema, en el gateway: un archivo por elemento (`sales/German orders.query.yaml`, `model.diagram.yaml`) | todo el que usa ese esquema, desde cualquier navegador o la aplicación de escritorio |
| sin `workbenchWrite` | **este navegador**, en su almacenamiento, aparte para cada gateway y credencial | solo este navegador en este dispositivo, con esa credencial |

En el workspace, se detecta que dos personas guardan el mismo elemento a la vez: a la segunda se le dice que otra
persona lo cambió mientras tanto, y el elemento se vuelve a leer. Lo que guarda otra persona se ve enseguida. Los
archivos de `workbench/` que no se pueden leer se listan debajo de la conexión, para corregirlos a mano.

En el navegador:

- lo que guarda una credencial no se ve con otra (para esto se usa solo el nombre de la credencial, nunca su
  secreto);
- se pierde si se borran los datos del sitio; en un navegador que no permite guardar (algunas ventanas privadas), el
  explorador lo dice, y dura hasta que se cierra la página;
- si después se da `workbenchWrite`, el explorador ofrece una vez **Copiarlos al workspace**.

## Exportar e importar {#export-and-import}

**Exportar** (en la cabecera de **Esquemas**) descarga todo lo guardado con esa conexión a un archivo JSON
(`lambdaorm-workspace-2026-11-23.json`): una copia de seguridad, o una forma de llevarlo a otro navegador o a otra
persona. **Importar** lee un archivo así: **Agregar a lo que hay** (un elemento con el mismo id se reemplaza) o
**Reemplazar todo** (solo en el navegador: en el workspace una importación siempre agrega, ya que es compartido).
