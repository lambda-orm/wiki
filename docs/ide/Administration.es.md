# Administración {#administration}

A través del puerto `management`, una credencial con los permisos de administración edita los esquemas desde el IDE:
su `lambdaORM.yaml` como YAML o como formularios, las variables de sus conexiones, los comandos del CLI sobre sus
stages (push, pull, import…), el código de su dominio, y esquemas nuevos. Es la forma de modelar un esquema y aplicarlo
a las bases de datos sin una terminal ni un despliegue. Lo que hace el gateway con cada cambio se explica en
[Administración](../data-gateway/Admin.md).

| Permiso | Permite, en el IDE |
| --- | --- |
| `schemaRead` | las filas **config**, **application**, **infrastructure**, **Estado** y **Código fuente** del explorador; la **Información** y el **Historial** de un esquema |
| `schemaWrite` | **Editar** en el YAML y los formularios; **+** entidades, enums, sources, mappings, stages nuevos; **Editar** y **Eliminar** de una entidad |
| `schemaAdmin` | **Nuevo esquema**, **Eliminar** un esquema; definir y eliminar las variables del `.env` |
| `ddl` | **push**, **pull**, **drop** |
| `stageImport` | **import**, **incorporate** |
| `build` | **build**, y volver a generar o eliminar un código de **Código fuente** |
| `workbenchWrite` | **export → data/** |

Los esquemas se vuelven a leer cada 5 segundos (cada 60 mientras llegan los eventos del gateway): uno agregado,
eliminado o recargado se muestra sin recargar la página, y una versión nueva que no arrancó muestra ⚠ con su motivo
mientras atiende la anterior. Un cambio hecho por otra persona se anuncia con quién lo hizo y **Actualizar**
([Sesiones](Connections.md#sessions)).

## La pestaña del esquema {#the-schema-tab}

Un clic en un esquema abre **Esquema nombre**: una barra de herramientas con el **Stage** y los comandos, luego su
**Información**, su **Historial** y los **Últimos comandos**.

Los comandos son iconos; el puntero encima de uno dice qué hace. Un comando que la credencial no puede ejecutar está
deshabilitado.

| Comando | Qué hace | Antes de ejecutarse |
| --- | --- | --- |
| **fetch** | compara el modelo con las bases de datos del stage | se ejecuta enseguida: `Sin diferencias: las bases coinciden con el modelo` |
| **export** | los datos del stage, para descargar (`northwind-default.json`, **Descargar**) | se ejecuta enseguida |
| **export → data/** | los datos del stage, a `data/` del workspace | se ejecuta enseguida |
| **import…** | un archivo exportado al stage | pide el archivo, luego muestra las filas que va a escribir |
| **push…** | aplica el modelo a las bases de datos (crea y altera tablas) | muestra las sentencias, por source |
| **pull…** | trae las bases de datos al modelo | muestra cómo va a cambiar `lambdaORM.yaml` |
| **drop…** | elimina las tablas del stage | muestra las sentencias; escribes el nombre del stage para confirmar |
| **introspect…** | crea una entidad desde un archivo de datos | pide el archivo y la entidad, luego muestra cómo va a cambiar `lambdaORM.yaml` |
| **incorporate…** | crea una entidad desde un archivo de datos e importa sus filas | pide el archivo y la entidad, luego muestra el cambio y las filas |
| **build…** | genera el código del dominio ([abajo](#source-code)) | el lenguaje y lo que genera |
| **version** | las versiones de λORM en el gateway | se ejecuta enseguida |

Para ejecutar un comando que muestra primero lo que va a hacer:

1. Elige el **Stage**.
2. Haz clic en el comando (y, para import, introspect e incorporate, elige el archivo y **Ver qué va a hacer**).
3. Lee la vista previa: las sentencias por source, el cambio de `lambdaORM.yaml` (`+3 −0 líneas`) o las filas de cada
   entidad. Push y drop tienen **seguir aunque falle una sentencia (tryAllCan)**; drop pide el nombre del stage.
4. **Ejecutar push** (en rojo) ejecuta exactamente eso; **Cancelar** no.

Cada comando se ejecuta como un job: su estado (**en curso**, **terminado**, **falló**) y su resultado se muestran
debajo, y **Últimos comandos** los lista con el stage, la credencial y cuándo (un clic vuelve a mostrar uno).

![La vista previa de push](images/ide-schema-push.png)

**Información** tiene el **Nombre**, la **Descripción** y la **Versión** del esquema (las claves de arriba de su
`lambdaORM.yaml`), con **Editar** y, con `schemaAdmin`, **Eliminar** ([abajo](#new-schema-remove-a-schema)).

## Historial {#history}

El **Historial** de la pestaña del esquema (plegado) lista sus cambios, los más nuevos primero: **Cuándo**, **Quién**
(la credencial y su cliente: el IDE, la CLI, el gateway) y **Qué** (`schema set`, `ddl push`…). Un clic en un cambio
muestra sus **Cambios** (`+` agregado, `-` quitado, `~` reemplazado), el elemento **Antes** y **Después**, y los
archivos de DDL que escribió un push. **Cambios anteriores** lee más. Cada entidad tiene el suyo en su pestaña
**Historial** ([Entidades](Entities.md#history)). El gateway lo guarda desde data-gateway 4.1.0.

![El historial de un esquema](images/ide-schema-history.png)

## El YAML {#the-yaml}

**config** abre el `lambdaORM.yaml` del esquema en un editor que lo verifica mientras escribes (`3 errores`,
`2 advertencias`, `Válido`), con las sugerencias de su schema. **Editar**, luego **Guardar** (Ctrl+S): `Guardado: la
gateway recarga el esquema`; **Cancelar** descarta los cambios. Un esquema con errores no se guarda. Los secretos nunca
se muestran: las conexiones están en las variables ([abajo](#variables)).

Si otra persona guardó una versión nueva mientras editabas, se muestran las dos una al lado de otra, **En la gateway** y
**El tuyo**, con quién la cambió y cuándo: **Guardar el mío encima**, o **Tomar el de la gateway**.

![El YAML del esquema](images/ide-schema-yaml.png)

## Formularios {#forms}

Cada elemento del esquema tiene su propio formulario, en su propia pestaña: una entidad, un enum, un source, un
mapping, un stage. Se abre en solo lectura, con **Editar** → **Guardar** o **Cancelar**; **Renombrar**; **Eliminar**
(antes dice qué lo usa: `Customers lo usan: …`). El **+** de **Entidades**, **Enums**, **Sources**, **Mappings** y
**Stages** en el explorador abre uno nuevo (`Nuevo en Entidades`). Guardar cambia solo ese elemento, y conserva los
comentarios del archivo. Si otra persona cambió el elemento mientras tanto, el formulario dice quién y muestra lo que
tiene ahora.

| Formulario | Campos |
| --- | --- |
| **Entidad** | extends, abstract, view, primaryKey, uniqueKey; luego las pestañas **Propiedades** (name, type, length, required, autoIncrement, default, enum, expressions), **Relaciones** (name, type, from, entity, to, target, weak), **Índices** (name, fields) y **Restricciones** (message, condition), cada una con cuántos tiene |
| **Enum** | sus valores (name, value) |
| **Source** | dialect (PostgreSQL, MySQL, MariaDB, SqlServer, Oracle, MongoDB, SQLjs), mapping, connection (`${NORTHWIND_DB}`) |
| **Mapping** | extends; el nombre de cada entidad en la base de datos |
| **Stage** | sus sources en orden, cada uno con una condición: el primero cuya condición es verdadera toma la sentencia; uno último sin condición toma el resto |

![El formulario de una entidad](images/ide-schema-entity.png)

Las **expresiones** de una propiedad (`readExp`, `writeExp`, `readValue`, `writeValue`) y la **condición** de una
restricción se editan debajo de su tabla, cada una en un editor con las propiedades de la entidad y las funciones como
sugerencias ([Entidades](Entities.md#properties)).

En un stage, ✎ edita la condición de un source en su propio diálogo: una expresión (`entity.in(["Products","Orders"])
&& read`) con sugerencias (Ctrl+Espacio), verificada por el gateway mientras escribes, y las **Variables de la
sentencia** para insertar con un clic; **Aplicar** la conserva. ↑ y ↓ cambian el orden de los sources, × saca uno,
**Agregar source** agrega uno.

![Un stage](images/ide-schema-stage.png)

**application** se edita como YAML (sus tareas de inicio y listeners).

## El diagrama de un stage {#the-diagram-of-a-stage}

El ◇ de un stage en el explorador abre **Stage nombre**: el **Data Gateway** y, debajo, cada source del stage en su
orden, con su dialecto, su mapping y las tablas que viven en él (nombradas por su mapping), y las tablas cuyas lecturas
o escrituras toma mientras viven en otro source (una réplica para lectura). Un clic en la flecha de un source muestra su
condición abajo, con los colores del editor; una entidad que ningún source toma se indica arriba del dibujo.

Su barra: las herramientas **seleccionar** y **mover**, el zoom y **ajustar**, el **outline**, **mostrar** (las tablas
de cada source, o solo el nombre de cada source), el gateway arriba o a la izquierda, y **acomodar de nuevo**. Las cajas
se arrastran donde quieras (varias seleccionadas a la vez). **Guardar** lo conserva, como quedó, en el
[workbench](Projects.md) (la primera vez pide un nombre, una descripción y una carpeta; **Guardar como…** hace una
copia); el ◇ de su stage abre entonces el guardado. Necesita data-gateway 4.1.0 o posterior.

![El diagrama de un stage](images/ide-stage-diagram.png)

## Variables (.env) {#variables}

**infrastructure → Variables (.env)**: las variables del `.env` del workspace, cada una **definida** o **no está en
.env**, y dónde se usa. Sus valores nunca se muestran. Con `schemaAdmin`, **Valor nuevo** y **Definir**, **Eliminar**,
y **Agregar** una nueva; cambiarlas recarga el esquema. Una variable también puede venir de la configuración o del
entorno del gateway.

![Variables](images/ide-schema-variables.png)

## Estado {#state}

**Estado → data** lista los archivos de `data/` del workspace (los exports guardados ahí, los datos de los stages):
cada uno se abre en solo lectura, con los colores de su tipo.

## Código fuente {#source-code}

**Código fuente** lista el código generado desde el dominio, un nodo por cada código en `src/`, nombrado por su
lenguaje y, para un build del gateway, su carpeta (`TypeScript · node`, `TypeScript · client-node`); sus archivos se
abren en solo lectura. Cada nodo tiene ⤓ **Descargar como .zip**, ↻ **Volver a generar** y 🗑 **Eliminar** (pregunta
antes: se van sus archivos, también los repositorios escritos a mano).

**build** (el </> de **Código fuente**, o **build…** en la pestaña del esquema) pide:

- el lenguaje: `node` (`@lambdaorm/lib`) o `client-node` (`@lambdaorm/client`);
- **Qué genera**: el **modelo** (`-m`, se reescribe) y los **repositorios** (`-r`; uno que ya está queda), al menos
  uno;
- luego **Descargar .zip**, o **Escribir en src/ del workspace**, que lista los archivos creados y actualizados.

## Nuevo esquema, eliminar un esquema {#new-schema-remove-a-schema}

Con `schemaAdmin`, **Nuevo esquema** (en la cabecera de **Esquemas**): su **Ruta** (`sales/v1`), **Nombre** y
**Descripción**, partiendo de **un esquema vacío** o de **una copia de** otro: `Esquema sales/v1 creado: arranca en un
momento`. Un gateway cuyo esquema está en la raíz (`/`) sirve solo ese.

**Eliminar** en la **Información** de un esquema (o el 🗑 de un esquema que no arrancó) lo elimina, después de escribir
su ruta: su workspace va a `.trash` del volumen, no se borra nada, y se cierran sus pestañas.
