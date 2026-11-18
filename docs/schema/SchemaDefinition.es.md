# Definición {#definition}

Esta página es la referencia del archivo del esquema (`lambdaORM.yaml`): su estructura y todas las claves de sus secciones `domain`, `application` e `infrastructure`, con un ejemplo para cada una.

El esquema contiene toda la configuración que necesita el ORM. Separa el modelo de negocio (**dominio**) de la persistencia de los datos (**infraestructura**):

- En el dominio, las entidades y los enums que representan el modelo de negocio quedan completamente limpios, sin ningún atributo que los acople a la persistencia.
- Todas las consultas se escriben sobre el modelo de negocio, por lo que quedan desacopladas del modelo físico de los datos.
- En la infraestructura se define todo lo necesario para guardar y leer los datos en las distintas fuentes.

El esquema se puede escribir en un archivo YAML o JSON, o pasarse como objeto al inicializar el ORM (ver [Uso del esquema](Schema-Use.md)).

Todas las expresiones que se usan para definir condiciones y acciones las evalúa el motor de expresiones [3xpr](https://www.npmjs.com/package/3xpr) (ver [Expresiones en el esquema](SchemaDefinition-Expressions.md)), y cualquier valor puede venir de una variable de entorno (ver [Variables de entorno](SchemaDefinition-EnvironmentVariables.md)).

## Estructura {#structure}

```yaml
domain:
  enums:
    - name: string
      extends: string
      abstract: boolean
      values:
        - name: string
          value: any
  entities:
    - name: string
      abstract: boolean
      extends: string
      singular: string
      view: boolean
      primaryKey: string[]
      uniqueKey: string[]
      required: string[]
      properties:
        - name: string
          type: string | integer | decimal | boolean | dateTime | date | time | json
          length: number
          required: boolean
          autoIncrement: boolean
          view: boolean
          enum: string
          key: string
          default: expression
          readExp: expression
          readValue: expression
          writeValue: expression
      indexes:
        - name: string
          fields: string[]
      relations:
        - name: string
          type: oneToMany | manyToOne | oneToOne
          from: string
          entity: string
          to: string
          composite: boolean
          weak: boolean
          target: string
      constraints:
        - message: string
          condition: expression
application:
  start:
    - name: string
      condition: expression
      expression: expression
  end:
    - name: string
      condition: expression
      expression: expression
  listeners:
    - name: string
      on: [select | insert | upsert | update | delete]
      condition: expression
      before: expression
      after: expression
      error: expression
      transactional: boolean
infrastructure:
  mappings:
    - name: string
      extends: string
      entities:
        - name: string
          mapping: string
          abstract: boolean
          extends: string
          sequence: string
          filter: expression
          properties:
            - name: string
              mapping: string
              readMappingExp: expression
              dbType: string
              previousMapping: string
  sources:
    - name: string
      dialect: MySQL | MariaDB | PostgreSQL | Oracle | SqlServer | MongoDB | SQLjs
      mapping: string
      connection: object | environment variable
  stages:
    - name: string
      sources:
        - name: string
          condition: expression
  views:
    - name: string
      entities:
        - name: string
          exclude: boolean
          properties:
            - name: string
              exclude: boolean
              readExp: expression
  paths:
    src: string
    state: string
    domain: string
  queue:
    config: object
    consumers:
      - name: string
        config: object
        subscribe: object
        execute: expression
```

## Secciones principales {#main-sections}

| Clave          | Descripción                                                         |
|:---------------|:--------------------------------------------------------------------|
| domain         | El modelo de negocio: enums y entidades.                            |
| application    | Tareas que se ejecutan al iniciar y al terminar el ORM, y listeners. |
| infrastructure | Cómo y dónde se guardan los datos: mappings, fuentes, stages, vistas. |

## Dominio {#domain}

| Clave    | Descripción                    |
|----------|--------------------------------|
| enums    | Los enums del modelo.          |
| entities | Las entidades del modelo.      |

- Un **enum** se puede usar como tipo de una propiedad.
- Una **entidad** se define con sus propiedades, relaciones, claves, índices y restricciones.

### Enum {#enum}

Un enum define un conjunto de valores que luego se puede usar como tipo de una propiedad.

| Clave    | Descripción                                                 | Obligatorio |
|----------|-------------------------------------------------------------|:--------:|
| name     | Nombre del enum.                                            | sí       |
| values   | Valores del enum (`name` y `value`).                        | sí       |
| extends  | Nombre de otro enum cuyos valores hereda este enum.         |          |
| abstract | El enum solo se usa como base para otros enums.             |          |

Cuando un valor no tiene `value`, se usa su `name`.

#### Ejemplo de enum {#enum-example}

En este ejemplo se define el enum **DeviceType** y se usa como tipo de la propiedad **type** de la entidad **Devices**.

```yaml
domain:
  enums:
    - name: DeviceType
      values:
        - name: phone
          value: phone
        - name: computer
          value: computer
        - name: robot
          value: robot
  entities:
    ...
    - name: Devices
      extends: Products
      primaryKey: ["id"]
      uniqueKey: ["name"]
      properties:
        - name: id
          length: 32
          required: true
          default: 'concat(type,"-",switch(type){case"phone":imei;default:mac;})'
        - name: type
          length: 16
          required: true
          enum: DeviceType
        - name: name
          length: 32
          required: true
    ...
```

### Entidad {#entity}

Una entidad se define con sus propiedades, relaciones y restricciones.

| Clave       | Descripción                                                                                       | Obligatorio |
|-------------|---------------------------------------------------------------------------------------------------|:--------:|
| name        | Nombre de la entidad. Un nombre con un punto (`Orders.details`) define una [entidad compuesta](SchemaDefinition-Composite.md). | sí |
| properties  | Propiedades de la entidad.                                                                        | sí       |
| abstract    | La entidad solo se usa como base para otras entidades (no se crea ninguna tabla para ella).       |          |
| extends     | Nombre de la entidad cuyas propiedades, clave primaria y relaciones hereda esta entidad.           |          |
| singular    | Nombre en singular, usado para las clases que genera `lambdaorm build` (por defecto se deduce del nombre). |  |
| view        | La entidad es una vista: push no crea ninguna tabla para ella (ver más abajo).                     |          |
| primaryKey  | Propiedades de la clave primaria.                                                                 |          |
| uniqueKey   | Propiedades de la clave única.                                                                    |          |
| required    | Propiedades obligatorias (equivale a `required: true` en cada una de ellas).                      |          |
| indexes     | Índices (`name` y `fields`).                                                                      |          |
| relations   | Relaciones con otras entidades.                                                                   |          |
| constraints | Restricciones que se validan al escribir un registro.                                             |          |

Las propiedades de la clave primaria y de la clave única son obligatorias salvo que indiquen lo contrario.

#### Abstract y extends en la entidad {#abstract-and-extends-in-entity}

En este ejemplo se define la entidad abstracta **Positions**, y la entidad **Countries** la extiende: Countries obtiene las propiedades `latitude` y `longitude`.

```yaml
domain:
  entities:
    - name: Positions
      abstract: true
      properties:
        - name: latitude
          length: 16
        - name: longitude
          length: 16
    - name: Countries
      extends: Positions
      primaryKey: ["iso3"]
      uniqueKey: ["name"]
      properties:
        - name: name
          required: true
        - name: iso3
          length: 3
          required: true
```

No hace falta que una entidad sea abstracta para poder extenderla. Ver [Extend](SchemaExample-Extend.md).

#### Definir una entidad como vista {#set-entity-as-view}

Este ejemplo define la entidad **Users** como vista, porque su tabla la gestiona un sistema externo.
Push no crea ninguna tabla para una entidad vista, y los comandos de stage no la modifican.

```yaml
domain:
  entities:
    ...
    - name: Users
      view: true
      extends: Basics
      primaryKey: ["username"]
      uniqueKey: ["email"]
      properties:
        - name: username
          length: 32
          required: true
        - name: firstname
          required: true
        - name: lastname
    ...
```

### Propiedad {#property}

| Clave         | Descripción                                                                         | Obligatorio | Por defecto |
|---------------|-------------------------------------------------------------------------------------|:--------:|:----------:|
| name          | Nombre de la propiedad.                                                             | sí       |            |
| type          | Tipo de la propiedad (ver [Tipos de propiedad](#property-types)).                   |          | string     |
| length        | Longitud de una propiedad string.                                                   |          | ver más abajo |
| required      | La propiedad no puede ser nula.                                                     |          | false      |
| autoIncrement | El valor lo genera la base de datos.                                                |          | false      |
| enum          | Nombre del enum al que debe pertenecer el valor.                                    |          |            |
| view          | La propiedad no se guarda: su valor viene de `readExp`.                             |          | false      |
| default       | Expresión que evalúa λORM para establecer el valor al insertar un registro.         |          |            |
| readExp       | Expresión de lectura, resuelta en la fuente (base de datos).                        |          |            |
| readValue     | Expresión que evalúa λORM sobre el valor leído de la fuente.                        |          |            |
| writeValue    | Expresión que evalúa λORM sobre el valor antes de escribirlo.                       |          |            |
| key           | Valor fijo que se usa para filtrar lecturas y actualizaciones, y que se asigna al insertar. |  |            |

#### Tipos de propiedad {#property-types}

| Tipo      | Valor en Node            | Columna que crea push (por defecto)                                                        |
|-----------|--------------------------|--------------------------------------------------------------------------------------------|
| string    | string                   | `VARCHAR(length)`; sin `length`: `TEXT` en PostgreSQL, `VARCHAR(80)` en los demás motores  |
| integer   | number                   | `INTEGER` (Oracle `NUMBER(10)`)                                                            |
| decimal   | number                   | `DECIMAL(10,4)` (Oracle `NUMBER(19,4)`)                                                    |
| boolean   | boolean                  | `BOOLEAN` (SqlServer `BIT`, Oracle `CHAR(1)`)                                              |
| dateTime  | Date                     | `TIMESTAMP` (PostgreSQL), `DATETIME` (MySQL, MariaDB, SqlServer), `DATE` (Oracle)          |
| date      | Date                     | `DATE` (SqlServer `SMALLDATETIME`)                                                         |
| time      | Date                     | `TIME` (Oracle `DATE`)                                                                     |
| json      | objeto o lista           | `JSONB` (PostgreSQL), `JSON` (MySQL, MariaDB), `NVARCHAR(MAX)` (SqlServer), `CLOB` (Oracle), `TEXT` (otros) |

- **json**: los objetos y las listas se escriben y se leen como tales (no hace falta llamar a `JSON.stringify` ni a `JSON.parse`).
- **dateTime**: en PostgreSQL el valor se escribe con milisegundos y su desplazamiento horario, por lo que una columna `timestamptz` (ver `dbType` en [Mapping de propiedad](#property-mapping)) conserva el instante exacto.
- **string sin longitud**: en PostgreSQL es ilimitado (`TEXT`); en los demás motores es `VARCHAR(80)`, así que hay que definir `length` cuando un valor puede ser más largo.
- `''`, `0` y `false` son valores, nunca NULL (Oracle es la excepción: guarda `''` como NULL).

Ver también [Motores de base de datos](Engines.md) para las diferencias entre motores.

En este ejemplo `name` no tiene longitud, `settings` es un objeto JSON y `createdAt` una fecha y hora:

```yaml
domain:
  entities:
    - name: Products
      primaryKey: ["id"]
      properties:
        - name: id
          length: 36
          required: true
        - name: name                # TEXT on PostgreSQL, VARCHAR(80) elsewhere
          required: true
        - name: settings
          type: json                # { "color": "red", "tags": ["a", "b"] } in and out as an object
        - name: createdAt
          type: dateTime
```

#### Definir una propiedad como vista y readExp {#set-property-as-view-and-readexp}

Una propiedad vista no se guarda en la base de datos (push no crea ninguna columna para ella): su valor se calcula al leer, con la expresión de **readExp**.
En este ejemplo `fullName` se construye a partir de `lastname` y `firstname`.

```yaml
domain:
  entities:
    ...
    - name: Users
      extends: Basics
      primaryKey: ["username"]
      uniqueKey: ["email"]
      properties:
        - name: username
          length: 32
          required: true
        - name: firstname
          required: true
        - name: lastname
          required: true
        - name: fullName
          view: true
          readExp: concat(lastname,", ",firstname)
    ...
```

**readExp** también se puede definir en una propiedad que se guarda: la expresión se aplica al leer, y al escribir no cambia nada.

#### Valor por defecto en la propiedad {#default-value-in-property}

Cuando se inserta un registro sin valor para la propiedad, λORM (no la base de datos) evalúa la expresión de **default** y escribe su resultado.
En este ejemplo el `id` de un grupo se construye a partir de su nombre.

```yaml
domain:
  entities:
    - name: Groups
      extends: Basics
      primaryKey: ["id"]
      uniqueKey: ["name"]
      properties:
        - name: id
          length: 32
          default: lower(substring(replace(name," ","-"),0,32))
          required: true
        - name: name
          length: 32
          required: true
```

#### Valor de lectura y escritura en la propiedad {#read-and-write-value-in-property}

**readValue** y **writeValue** los evalúa λORM: **writeValue** transforma el valor antes de escribirlo, y **readValue** transforma el valor leído de la base de datos.
En este ejemplo el email se guarda cifrado y se devuelve descifrado; la clave viene de una variable de entorno.

```yaml
domain:
  entities:
    ...
    - name: Users
      extends: Basics
      primaryKey: ["username"]
      uniqueKey: ["email"]
      properties:
        - name: username
          length: 32
          required: true
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
    ...
```

#### Valor key en la propiedad {#key-value-in-property}

El valor definido en **key** se usa como filtro en las consultas de lectura, actualización y eliminación, y se asigna a la propiedad al insertar un registro.

Esto es útil para definir varias entidades sobre la misma tabla o colección.
En este ejemplo una tabla **Locations** guarda países, estados y ciudades, y cada uno se trabaja como una entidad separada:

```yaml
domain:
  entities:
    - name: Locations
      abstract: true
      primaryKey: ["type","code"]
      uniqueKey: ["type","name"]
      properties:
        - name: code
          required: true
          length: 16
        - name: type
          required: true
          length: 16
        - name: name
          required: true
    - name: Countries
      extends: Locations
      properties:
        - name: type
          key: 'country'
    - name: States
      extends: Locations
      properties:
        - name: type
          key: 'state'
    - name: Cities
      extends: Locations
      properties:
        - name: type
          key: 'city'
infrastructure:
  mappings:
    - name: default
      entities:
        - name: Locations
          abstract: true
          mapping: TBL_LOCATIONS
          properties:
            - name: code
              mapping: CODE
            - name: type
              mapping: TYPE
            - name: name
              mapping: NAME
        - name: Countries
          extends: Locations
        - name: States
          extends: Locations
        - name: Cities
          extends: Locations
```

### Relación {#relation}

| Clave     | Descripción                                                                                         | Obligatorio | Por defecto |
|-----------|-----------------------------------------------------------------------------------------------------|:--------:|:---------:|
| name      | Nombre de la relación.                                                                              | sí       |           |
| from      | Propiedad de esta entidad.                                                                          | sí       |           |
| entity    | Entidad relacionada.                                                                                | sí       |           |
| to        | Propiedad de la entidad relacionada.                                                                | sí       |           |
| type      | Tipo de la relación (ver más abajo).                                                                |          | oneToMany |
| composite | Los registros relacionados forman parte de esta entidad (ver [Entidad compuesta](SchemaDefinition-Composite.md)). |  | false |
| weak      | Push no crea ninguna clave foránea para la relación (por ejemplo entre entidades de distintas fuentes). |      | false     |
| target    | Nombre de la relación inversa que se crea en la entidad relacionada.                                |          |           |

El tipo de la relación determina qué devuelve:

| Tipo      | Significado                                                          | Devuelve        |
|-----------|----------------------------------------------------------------------|-----------------|
| oneToMany | Muchos registros de esta entidad referencian un registro de `entity`. | un objeto      |
| manyToOne | Muchos registros de `entity` referencian este registro.              | una lista       |
| oneToOne  | Un registro de esta entidad se relaciona con un registro de `entity`. | un objeto      |

Las relaciones `manyToOne` siempre son weak.

#### Relación target {#target-relation}

Con **target**, la relación inversa se crea en la entidad relacionada.
Por ejemplo, si la entidad **DeviceStatuses** tiene una relación con **Devices** con `target: statuses`, se crea en **Devices** una relación llamada **statuses**.
El tipo de la relación target depende del tipo de la relación de origen:

| Origen    | Target    |
|-----------|-----------|
| oneToMany | manyToOne |
| oneToOne  | oneToOne  |

```yaml
domain:
  entities:
    - name: DeviceStatuses
      extends: Basics
      primaryKey: ["id"]
      indexes:
        - name: time
          fields: ["time"]
      properties:
        - name: id
          type: integer
          required: true
          autoIncrement: true
        - name: deviceId
          length: 32
          required: true
        - name: time
          type: dateTime
      relations:
        - name: device
          from: deviceId
          entity: Devices
          to: id
          target: statuses
```

### Restricción {#constraint}

| Clave     | Descripción                         | Obligatorio |
|-----------|-------------------------------------|:--------:|
| message   | Mensaje que se devuelve cuando falla. | sí     |
| condition | Expresión booleana que se evalúa.   | sí       |

Las restricciones son expresiones que evalúa λORM al insertar o actualizar un registro.
El ORM también crea restricciones a partir de otras definiciones, por ejemplo:

- Una propiedad obligatoria obtiene una restricción que comprueba que no sea nula.
- Una propiedad cuyo tipo es un **enum** obtiene una restricción que comprueba que el valor pertenezca al enum.

Se pueden añadir restricciones propias con un **message** y una **condition**: cuando la condición no se cumple, la escritura falla con el mensaje.
En este ejemplo se validan el formato del email y el orden de dos fechas:

```yaml
domain:
  entities:
    - name: Users
      properties:
        ...
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
      constraints:
        - message: invalid email
          condition: test(email,"^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$")
    - name: Files
      properties:
        - name: id
          length: 255
          required: true
        - name: type
          length: 16
          required: true
          enum: FileType
        - name: deviceId
          length: 32
          required: true
        - name: startDate
          type: dateTime
          required: true
        - name: endDate
          type: dateTime
          required: true
      constraints:
        - message: endDate cannot be less than startDate
          condition: startDate<=endDate
```

## Aplicación {#application}

| Clave     | Descripción                                                       |
|:----------|:------------------------------------------------------------------|
| start     | Tareas que se ejecutan al inicializar el ORM (`orm.init()`).      |
| end       | Tareas que se ejecutan al cerrar el ORM (`orm.end()`).            |
| listeners | Expresiones que se ejecutan antes o después de una consulta, o cuando falla. |

### Tarea {#task}

Cada tarea de `start` y `end` tiene:

| Clave      | Descripción                                         | Obligatorio |
|------------|-----------------------------------------------------|:--------:|
| name       | Nombre de la tarea.                                 | sí       |
| expression | Expresión que se ejecuta.                           | sí       |
| condition  | La tarea solo se ejecuta cuando esta expresión es verdadera. |  |

### Listener {#listener}

| Clave         | Descripción                                                                                   | Obligatorio | Por defecto |
|---------------|-----------------------------------------------------------------------------------------------|:--------:|:-------:|
| name          | Nombre del listener.                                                                          | sí       |         |
| on            | Categorías de consulta que lo disparan: `select`, `insert`, `upsert`, `update`, `delete`.     | sí       |         |
| condition     | El listener solo se ejecuta cuando esta expresión es verdadera.                               |          |         |
| before        | Expresión que se ejecuta antes de la consulta.                                                |          |         |
| after         | Expresión que se ejecuta después de la consulta.                                              |          |         |
| error         | Expresión que se ejecuta cuando la consulta falla.                                            |          |         |
| transactional | `false` ejecuta el listener fuera de la transacción de la consulta.                           |          | true    |

Ver [Listener](SchemaExample-Listener.md) para saber cómo se ejecutan los listeners y qué argumentos reciben.

## Infraestructura {#infrastructure}

| Clave    | Descripción                                                                 |
|----------|-----------------------------------------------------------------------------|
| mappings | Cómo se mapean las entidades a las tablas o colecciones de las bases de datos. |
| sources  | Las bases de datos y sus conexiones.                                        |
| stages   | Escenarios que deciden de qué fuente se lee y en qué fuente se escribe cada entidad. |
| views    | Vistas que restringen o modifican los resultados de las consultas.          |
| paths    | Carpetas donde se escriben los archivos generados y el estado del ORM.      |
| queue    | Cola de Kafka, usada por el [Data Gateway](../data-gateway/index.md).        |

Cuando se omiten algunas de ellas, λORM las completa:

- Sin `mappings`, se crea un mapping vacío (con el nombre de la fuente cuando solo hay una fuente).
- Una fuente sin `mapping` usa el primer mapping.
- Sin `stages`, se crea un stage llamado `default` con la primera fuente.
- Sin `views`, se crea una vista llamada `default` sin restricciones.

### Mapping {#mapping}

Un mapping define cómo se guardan las entidades en las tablas o colecciones de una base de datos.
Las entidades y propiedades que no se enumeran se mapean a una tabla o columna con el mismo nombre.

| Clave    | Descripción                                                | Obligatorio |
|----------|------------------------------------------------------------|:--------:|
| name     | Nombre del mapping.                                        | sí       |
| entities | Mappings de entidad.                                       |          |
| extends  | Nombre de un mapping cuyos mappings de entidad hereda este. |         |

#### Mapping de entidad {#entity-mapping}

| Clave      | Descripción                                                  | Obligatorio | Por defecto     |
|------------|--------------------------------------------------------------|:--------:|:---------------:|
| name       | Nombre de la entidad.                                        | sí       |                 |
| mapping    | Nombre de la tabla o colección en la base de datos.          |          | el nombre de la entidad |
| abstract   | El mapping de entidad solo se usa como base para otros.      |          |                 |
| extends    | Nombre del mapping de entidad del que hereda este.           |          |                 |
| sequence   | Nombre de la secuencia que se usa para generar los valores.  |          |                 |
| filter     | Expresión que filtra los registros de la tabla.              |          |                 |
| properties | Mappings de propiedad.                                       |          |                 |

##### Abstract y extends en el mapping de entidad {#abstract-and-extends-in-entity-mapping}

Los mappings de entidad abstractos son útiles como base para otros mappings de entidad.
Este ejemplo define el mapping de entidad abstracto **Locations**, y las entidades concretas lo extienden, de modo que las tres se guardan en la tabla `TBL_LOCATIONS`.

```yaml
...
infrastructure:
  mappings:
    - name: default
      entities:
        - name: Locations
          abstract: true
          mapping: TBL_LOCATIONS
          properties:
            - name: code
              mapping: CODE
            - name: type
              mapping: TYPE
            - name: name
              mapping: NAME
        - name: Countries
          extends: Locations
        - name: States
          extends: Locations
        - name: Cities
          extends: Locations
...
```

##### Filtro en el mapping de entidad {#filter-in-entity-mapping}

El filtro de un mapping de entidad se aplica a todas las consultas de la entidad.
Este ejemplo lee los usuarios de la tabla **user_entity** que pertenecen a un **realmId** dado.

```yaml
...
infrastructure:
  mappings:
    - name: default
    - name: keycloak
      entities:
        - name: Users
          mapping: user_entity
          filter: realmId == "${REALM_ID}"
          properties:
            - name: username
              mapping: username
            - name: firstname
              mapping: first_name
            - name: lastname
              mapping: last_name
            - name: email
              mapping: email
            - name: created
              mapping: created_timestamp
              readMappingExp: millisecondToDate(created/1000)
            - name: realmId
              length: 255
              mapping: realm_id
...
```

#### Mapping de propiedad {#property-mapping}

| Clave           | Descripción                                                                         | Obligatorio | Por defecto       |
|-----------------|-------------------------------------------------------------------------------------|:--------:|:-----------------:|
| name            | Nombre de la propiedad.                                                             | sí       |                   |
| mapping         | Nombre de la columna en la base de datos.                                           |          | el nombre de la propiedad |
| readMappingExp  | Expresión de lectura, resuelta en la fuente.                                        |          |                   |
| dbType          | Tipo de columna que usa push (DDL), en lugar del que se deduce del tipo de la propiedad. |     |                   |
| previousMapping | Nombre anterior de la columna: push renombra la columna en lugar de añadir una nueva. |        |                   |

##### Tipo de columna en el mapping de propiedad {#column-type-in-property-mapping}

**dbType** establece el tipo de columna que usa todo DDL que crea o modifica la columna (`push`, `push -o`).
Sirve para elegir un tipo que el tipo de la propiedad por sí solo no da, por ejemplo un instante con milisegundos o un JSON binario en PostgreSQL:

```yaml
infrastructure:
  mappings:
    - name: catalog
      entities:
        - name: Products
          mapping: products
          properties:
            - name: settings
              mapping: settings
              dbType: jsonb
            - name: createdAt
              mapping: created_at
              dbType: timestamptz(3)
```

##### Renombrar una columna con previousMapping {#rename-a-column-with-previousmapping}

Para renombrar una columna sin perder sus datos, se pone el nombre nuevo en **mapping** y el actual en **previousMapping**.
Push genera entonces `ALTER TABLE … RENAME COLUMN icon TO icon_name` (en SqlServer `sp_rename`) en lugar de añadir una columna nueva.

```yaml
infrastructure:
  mappings:
    - name: catalog
      entities:
        - name: Categories
          mapping: categories
          properties:
            - name: icon
              mapping: icon_name
              previousMapping: icon
```

Hay que quitar **previousMapping** una vez aplicado el renombrado en todas las bases de datos. No se admite renombrar una tabla.

##### Expresión de lectura en el mapping de propiedad {#read-expression-in-property-mapping}

La expresión de **readMappingExp** se resuelve en la fuente, y su resultado se devuelve en las consultas de lectura.
En este ejemplo la columna `created_timestamp`, guardada en milisegundos, se devuelve como fecha:

```yaml
infrastructure:
  mappings:
    - name: default
    - name: keycloak
      entities:
        - name: Users
          mapping: user_entity
          filter: realmId == "${REALM_ID}"
          properties:
            ...
            - name: created
              mapping: created_timestamp
              readMappingExp: millisecondToDate(created/1000)
            - name: realmId
              length: 255
              mapping: realm_id
...
```

### Fuente {#source}

Una fuente es una base de datos y su conexión.

| Clave      | Descripción                                                              | Obligatorio | Por defecto       |
|------------|--------------------------------------------------------------------------|:--------:|:-----------------:|
| name       | Nombre de la fuente.                                                     | sí       |                   |
| dialect    | Dialecto: `MySQL`, `MariaDB`, `PostgreSQL`, `Oracle`, `SqlServer`, `MongoDB` o `SQLjs`. | sí |       |
| mapping    | Nombre del mapping que usa la fuente.                                    |          | el primer mapping |
| connection | Conexión: un objeto o una variable de entorno que la contiene.           | sí       |                   |

#### Definir la conexión en la fuente {#set-connection-in-source}

La conexión se puede definir con una variable de entorno o directamente en el esquema.
No se recomienda escribirla en el esquema, por seguridad y porque la conexión suele cambiar de un entorno a otro; úsese solo para una prueba local temporal.

Con una variable de entorno:

```yaml
...
infrastructure:
  sources:
    - name: test
      dialect: MySQL
      mapping: test
      connection: ${CNN_MYSQL}
...
```

En el esquema:

```yaml
...
infrastructure:
  sources:
    - name: test
      dialect: MySQL
      mapping: test
      connection:
        host: localhost
        port: 3306
        user: test
        password: test
        database: test
...
```

### Stage {#stage}

Un stage es un escenario: sus reglas deciden qué fuente usa cada entidad.
Una consulta se ejecuta en el stage indicado en sus opciones; si no se indica ninguno, se ejecuta en el primer stage.

| Clave   | Descripción          | Obligatorio |
|---------|----------------------|:--------:|
| name    | Nombre del stage.    | sí       |
| sources | Reglas de fuente.    | sí       |

#### Regla de fuente {#source-rule}

| Clave     | Descripción                                    | Obligatorio | Por defecto |
|-----------|------------------------------------------------|:--------:|:-------:|
| name      | Nombre de la fuente.                           | sí       |         |
| condition | Expresión booleana que selecciona la fuente.   |          | true    |

#### Condición en la regla de fuente {#condition-on-source-rule}

**condition** decide en qué fuente se ejecuta una consulta o una sentencia DDL.
Las variables disponibles en la expresión son:

| Variable | Descripción                                    | Valor                                                                  |
|----------|------------------------------------------------|------------------------------------------------------------------------|
| entity   | Entidad de la sentencia                        | nombre de la entidad                                                   |
| action   | Acción de la sentencia                         | `select`, `insert`, `bulkInsert`, `update`, `upsert`, `delete`, `createEntity`, … |
| category | Categoría de la sentencia                      | `select`, `insert`, `upsert`, `update`, `delete`, `create`, `alter`, `drop`, … |
| type     | Tipo de la sentencia                           | `dql`, `dml`, `ddl`                                                    |
| read     | La sentencia lee                               | boolean                                                                |
| write    | La sentencia escribe                           | boolean                                                                |
| dml      | La sentencia es una consulta (DQL o DML)       | boolean                                                                |
| ddl      | La sentencia es DDL                            | boolean                                                                |

Las reglas se evalúan en el orden en que se definen, y se usa la primera fuente cuya condición sea verdadera.

En el siguiente ejemplo, la entidad **Users** usa la fuente **keycloak**, y todas las demás entidades usan la fuente **main**.

```yaml
...
infrastructure:
  stages:
    - name: default
      sources:
        - name: main
          condition: entity != "Users"
        - name: keycloak
          condition: entity == "Users"
```

#### Fuente comodín {#catch-all-source}

Una regla de fuente sin **condition** es un comodín: como gana la primera fuente que coincide, solo recibe las entidades que no tomó ninguna fuente anterior.
Esto se aplica tanto a las consultas (DML) como a push y a los demás comandos de stage (DDL), de modo que la fuente comodín no recibe las tablas de las entidades asignadas a otras fuentes.
Hay que ponerla en último lugar.

```yaml
infrastructure:
  stages:
    - name: default
      sources:
        - name: keycloak
          condition: entity == "Users"
        - name: main
```

### Vista {#view}

Una vista restringe o modifica los resultados de las consultas.
Una consulta usa la vista indicada en la opción `view`; las entidades que no se enumeran en una vista no tienen restricciones.

| Clave    | Descripción          | Obligatorio |
|----------|----------------------|:--------:|
| name     | Nombre de la vista.  | sí       |
| entities | Vistas de entidad.   |          |

En el siguiente ejemplo, la vista **default** enmascara `apiKey` y oculta `email`, la vista **collector** no puede acceder a usuarios ni grupos, y la vista **admin** puede acceder a todo.

```yaml
infrastructure:
  views:
    - name: default
      entities:
        - name: Devices
          properties:
            - name: apiKey
              readExp: '"***"'
        - name: Users
          properties:
            - name: created
              readExp: date(created)
            - name: email
              exclude: true
    - name: collector
      entities:
        - name: Users
          exclude: true
        - name: Groups
          exclude: true
        - name: GroupUsers
          exclude: true
    - name: admin
      entities: []
```

#### Vista de entidad {#entity-view}

| Clave      | Descripción                                      | Obligatorio |
|------------|--------------------------------------------------|:--------:|
| name       | Nombre de la entidad.                            | sí       |
| exclude    | No se puede acceder a la entidad con esta vista. |          |
| properties | Vistas de propiedad.                             |          |

##### Exclude en la vista de entidad {#exclude-in-entity-view}

No se puede acceder a una entidad con **exclude** cuando se usa esta vista.

```yaml
infrastructure:
  views:
    ...
    - name: collector
      entities:
        - name: Users
          exclude: true
        - name: Groups
          exclude: true
        - name: GroupUsers
          exclude: true
    ...
```

#### Vista de propiedad {#property-view}

| Clave   | Descripción                                        | Obligatorio |
|---------|----------------------------------------------------|:--------:|
| name    | Nombre de la propiedad.                            | sí       |
| exclude | No se puede acceder a la propiedad con esta vista. |          |
| readExp | Expresión de lectura, resuelta en la fuente.       |          |

##### Exclude en la vista de propiedad {#exclude-in-property-view}

No se puede acceder a una propiedad con **exclude** cuando se usa esta vista.

```yaml
infrastructure:
  views:
    - name: default
      entities:
        ...
        - name: Users
          properties:
            - name: created
              readExp: date(created)
            - name: email
              exclude: true
      ...
```

##### Expresión de lectura en la vista de propiedad {#read-expression-in-property-view}

Con **readExp**, en las consultas de lectura se devuelve el resultado de la expresión en lugar del valor guardado.
En este ejemplo `created` se devuelve como fecha, sin la hora:

```yaml
infrastructure:
  views:
    - name: default
      entities:
        ...
        - name: Users
          properties:
            - name: created
              readExp: date(created)
      ...
```

### Paths {#paths}

Carpetas, relativas a la carpeta del esquema, donde se escriben los archivos generados y el estado del ORM.

| Clave  | Descripción                                                                         | Por defecto |
|--------|-------------------------------------------------------------------------------------|:-----------:|
| src    | Carpeta del código fuente.                                                          | `src`       |
| domain | Carpeta, dentro de `src`, donde `lambdaorm build` escribe el modelo y los repositorios. | `domain` |
| state  | Carpeta del estado del ORM (modelo de cada stage, scripts DDL aplicados por push).  | `orm_state` |

```yaml
infrastructure:
  paths:
    src: src
    domain: domain
    state: orm_state
```

### Queue {#queue}

`infrastructure.queue` configura una cola de Kafka. No la usa `@lambdaorm/lib` en sí: la lee el [Data Gateway](../data-gateway/index.md) para las ejecuciones encoladas, y añade a las expresiones la función `queue.send(topic, messages)`.

| Clave     | Descripción                                                                                  |
|-----------|----------------------------------------------------------------------------------------------|
| config    | Configuración del cliente de Kafka ([kafkajs](https://kafka.js.org/docs/configuration)).     |
| consumers | Consumidores: cada uno tiene un `name`, una `config` de consumidor, un `subscribe` (topic) y una expresión `execute` que se ejecuta para cada mensaje, con las variables `message`, `topic` y `partition`. |

En este ejemplo cada mensaje del topic `insights-sync` se ejecuta en el stage `insights`:

```yaml
infrastructure:
  queue:
    config: $QUEUE_CONFIG
    consumers:
      - name: syncInsights
        config:
          groupId: group1
        subscribe:
          topic: insights-sync
          fromBeginning: true
        execute: orm.execute(message.query, message.data, {stage:"insights"})
```
