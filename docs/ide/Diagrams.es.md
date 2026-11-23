# Diagramas {#diagrams}

Un diagrama del dominio dibuja las entidades elegidas como cajas, con sus propiedades, tipos, **PK** y **FK** (las
obligatorias en negrita, una entidad abstracta en cursiva), y sus relaciones como líneas con su cardinalidad
(**1 — N**, **1 — 1**); una herencia es una línea punteada con un triángulo hueco. Los diagramas se guardan en un
[proyecto](Projects.md), como las consultas.

![Un diagrama](images/ide-diagram.png)

## Un diagrama nuevo {#a-new-diagram}

El **+** de una carpeta (o de **proyectos**) → **Nuevo diagrama**: un **Nombre**, una **Descripción**, su **Carpeta** y
**las entidades**, buscadas, marcadas una por una, o completadas con **Agregar sus vecinas** (las entidades relacionadas
con las marcadas); **Limpiar** las desmarca todas. **Crear** lo abre.

![Nuevo diagrama](images/ide-new-diagram.png)

## En un diagrama {#in-a-diagram}

| Para | Haz |
| --- | --- |
| acomodarlo | se acomoda al abrirse ([ELK](https://eclipse.dev/elk/)); **acomodar de nuevo** vuelve a eso después de mover cajas |
| mover una caja o una línea | arrástrala; una línea mantiene sus extremos en las filas de los campos que une; un doble clic en una línea la vuelve a su lugar |
| seleccionar varias | Shift o Ctrl y clic, o Shift y arrastrar el fondo (la herramienta **seleccionar**: arrastrar el fondo selecciona); Ctrl+A todas, Esc ninguna |
| agregar entidades | el **+** de una caja: sus tablas relacionadas que no están en el diagrama; o **Entidades…** |
| quitar una entidad | su **×**, o seleccionarla y Supr; **quitar las seleccionadas (n)** |
| hacer zoom y moverlo | la rueda; arrastrar el fondo (la herramienta **mover**); **acercar**, **alejar** (5 % a 300 %), **ajustar** lo muestra entero |
| abrir una entidad | doble clic en su caja: su [formulario](Entities.md) |
| consultar sus datos | **consulta del diagrama**: una pestaña de consulta que lee lo que muestra, desde la caja seleccionada o la más relacionada |
| ver menos | **mostrar**: todas las propiedades, claves (PK y FK), clave primaria, o solo el nombre de la tabla; **nombres de relaciones** en las líneas |
| exportarlo | **exportar**: **PDF**, **PNG** o **SVG**, el diagrama entero, con los colores del tema |

**Guardar** (Ctrl+S) conserva las entidades, el lugar de cada caja y línea, lo que muestra y los nombres de las
relaciones; **guardado** dice que no tiene cambios. Un diagrama todavía sin guardar queda en su pestaña después de una
recarga.

## El diagrama de una entidad {#the-diagram-of-an-entity}

La pestaña **Diagrama** de una [entidad](Entities.md#diagram) la dibuja con sus vecinas, solo lectura: **entidad** lo
centra en otra, y la profundidad va a **2 niveles** o **todo el modelo**.

## El diagrama del asistente {#the-diagram-of-the-wizard}

El [asistente de consultas](QueryWizard.md) usa el mismo diagrama, con una casilla en cada campo de sus tablas.
