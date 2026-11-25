# Definition

This page is the reference of the schema file (`lambdaORM.yaml`): its structure and every key of its `domain`, `application` and `infrastructure` sections, with an example for each.
Use it when you write or review a schema; for a first contact, start with [Schema Use](Schema-Use.md) and the [Basic example](SchemaExample-Basic.md).

The schema holds all the configuration the ORM needs. It separates the business model (**domain**) from the persistence of the data (**infrastructure**):

- In the domain, the entities and enums that represent the business model are completely clean, without any attribute that couples them to persistence.
- All queries are written against the business model, so they are decoupled from the physical model of the data.
- In the infrastructure, everything needed to store and read the data in the different sources is defined.

The schema can be written in a YAML or JSON file, or passed as an object when the ORM is initialized (see [Schema Use](Schema-Use.md)).

All the expressions used to define conditions and actions are evaluated by the expression engine [3xpr](https://www.npmjs.com/package/3xpr) (see [Expressions on Schema](SchemaDefinition-Expressions.md)), and any value can come from an environment variable (see [Environment Variables](SchemaDefinition-EnvironmentVariables.md)).

## Structure

```yaml
name: string
description: string
version: string
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
          type: string | integer | decimal | boolean | dateTime | date | time | json | point | vector
          length: number
          required: boolean
          autoIncrement: boolean
          view: boolean
          enum: string
          key: string
          pii: email | phone | card | id | name | string
          default: expression
          readExp: expression
          readValue: expression
          writeValue: expression
      indexes:
        - name: string
          fields: string[]
          type: string
          distance: cosine | l2 | ip
      relations:
        - name: string
          type: oneToMany | manyToOne | oneToOne
          from: string | string[]
          entity: string
          to: string | string[]
          composite: boolean
          weak: boolean
          target: string
      constraints:
        - message: string
          condition: expression
      observability:
        trace: expression
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
  queries:
    - name: string
      description: string
      query: expression
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
          http: object
          properties:
            - name: string
              mapping: string
              readMappingExp: expression
              dbType: string
              previousMapping: string
  sources:
    - name: string
      dialect: MySQL | MariaDB | PostgreSQL | Oracle | SqlServer | MongoDB | SQLjs | Http
      mapping: string
      connection: object | string | environment variable
  stages:
    - name: string
      sources:
        - name: string
          condition: expression
      seed: string[]
  views:
    - name: string
      pii: mask | hash | exclude
      entities:
        - name: string
          exclude: boolean
          filter: expression
          properties:
            - name: string
              exclude: boolean
              readExp: expression
              default: expression
              type: string
              length: number
              description: string
  paths:
    src: string
    state: string
    domain: string
    logs: string
  outbox:
    entities: string[]
    actions: string[]
    condition: expression
    maxAttempts: number
  migrations: {}
  crossSource:
    maxRows: number
  observability: object
  queue:
    config: object
    consumers:
      - name: string
        config: object
        subscribe: object
        execute: expression
```

## Main sections

| Key            | Description                                                                                  |
|:---------------|:---------------------------------------------------------------------------------------------|
| name           | A name for people (λORM does not use it).                                                    |
| description    | What the schema is for (λORM does not use it).                                               |
| version        | The version of the schema.                                                                   |
| domain         | The business model: enums and entities.                                                      |
| application    | Tasks run when the ORM starts and ends, listeners and named queries.                         |
| infrastructure | How and where the data is stored: mappings, sources, stages, views, and the optional services (outbox, migrations, observability). |

## Domain

| Key      | Description                    |
|----------|--------------------------------|
| enums    | The enums of the model.        |
| entities | The entities of the model.     |

- An **enum** can be used as the type of a property.
- An **entity** is defined with its properties, relations, keys, indexes and constraints.

### Enum

An enum defines a set of values that can then be used as the type of a property.

| Key      | Description                                                 | Required |
|----------|-------------------------------------------------------------|:--------:|
| name     | Name of the enum.                                           | yes      |
| values   | Values of the enum (`name` and `value`).                    | yes      |
| extends  | Name of another enum whose values this enum inherits.       |          |
| abstract | The enum is only used as a base for other enums.            |          |

When a value has no `value`, its `name` is used.

#### Enum example

In this example the **DeviceType** enum is defined and used as the type of the **type** property of the **Devices** entity.

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

### Entity

An entity is defined with its properties, relations and constraints.

| Key           | Description                                                                                       | Required |
|---------------|---------------------------------------------------------------------------------------------------|:--------:|
| name          | Name of the entity. A name with a period (`Orders.details`) defines a [composite entity](SchemaDefinition-Composite.md). | yes |
| properties    | Properties of the entity.                                                                         | yes      |
| abstract      | The entity is only used as a base for other entities (no table is created for it).                |          |
| extends       | Name of the entity whose properties, primary key and relations this entity inherits.             |          |
| singular      | Singular name, used for the classes generated by `lambdaorm build` (by default it is deduced from the name). |  |
| view          | The entity is a view: push creates no table for it (see below).                                   |          |
| primaryKey    | Properties of the primary key.                                                                    |          |
| uniqueKey     | Properties of the unique key.                                                                     |          |
| required      | Properties that are required (the same as `required: true` on each of them).                      |          |
| indexes       | Indexes (see [Index](#index)).                                                                    |          |
| relations     | Relations with other entities.                                                                    |          |
| constraints   | Constraints validated when a record is written.                                                   |          |
| observability | `trace`: a condition that decides which of its sentences are traced, instead of the trace rules (see [Observability](Observability.md)). |  |

The properties of the primary key and the unique key are required unless they say otherwise; an `autoIncrement` property is never required (the database gives its value).

#### Abstract and extends in Entity

In this example the abstract entity **Positions** is defined, and the entity **Countries** extends it: Countries gets the properties `latitude` and `longitude`.

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

An entity does not need to be abstract to be extended. See [Extend](SchemaExample-Extend.md).

#### Set Entity as view

This example defines the **Users** entity as a view, because its table is managed by an external system.
Push creates no table for a view entity, and the stage commands do not change it.
(This is a table or view of the database; the [views of the schema](Views.md), `infrastructure.views`, are something else.)

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

### Property

| Key           | Description                                                                         | Required | Default    |
|---------------|-------------------------------------------------------------------------------------|:--------:|:----------:|
| name          | Name of the property.                                                               | yes      |            |
| type          | Type of the property (see [Property types](#property-types)).                       |          | string     |
| length        | Length of a string property, or the dimensions of a `vector`.                       |          | see below  |
| required      | The property cannot be null.                                                        |          | false      |
| autoIncrement | The value is generated by the database (or by the API, on an Http source).          |          | false      |
| enum          | Name of the enum the value must belong to.                                          |          |            |
| view          | The property is not stored: its value comes from `readExp`.                         |          | false      |
| default       | Expression evaluated by λORM to set the value when a record is inserted.            |          |            |
| readExp       | Read expression, resolved in the source (database).                                 |          |            |
| readValue     | Expression evaluated by λORM on the value read from the source.                     |          |            |
| writeValue    | Expression evaluated by λORM on the value before it is written.                     |          |            |
| key           | Fixed value used to filter reads and updates, and set on insert.                    |          |            |
| pii           | The kind of personal data it holds (`email`, `phone`, `card`, `id`, `name` or another word), so a view can mask, hash or exclude it (see [Personal data](Views.md#personal-data-pii)). |  |  |

#### Property types

| Type      | Value in Node            | Column created by push (by default)                                                        |
|-----------|--------------------------|--------------------------------------------------------------------------------------------|
| string    | string                   | `VARCHAR(length)`; without `length`: `TEXT` on PostgreSQL, `VARCHAR(80)` on the other engines (Oracle `VARCHAR2`) |
| integer   | number                   | `INTEGER` (Oracle `NUMBER(10)`)                                                            |
| decimal   | number                   | `DECIMAL(10,4)` (Oracle `NUMBER(19,4)`)                                                    |
| boolean   | boolean                  | `BOOLEAN` (SqlServer `BIT`, Oracle `CHAR(1)`)                                              |
| dateTime  | Date                     | `TIMESTAMP` (PostgreSQL), `DATETIME` (MySQL, MariaDB, SqlServer, SQLite), `DATE` (Oracle)  |
| date      | Date                     | `DATE` (SqlServer `SMALLDATETIME`)                                                         |
| time      | Date                     | `TIME` (Oracle `DATE`)                                                                     |
| json      | object or list           | `JSONB` (PostgreSQL), `JSON` (MySQL, MariaDB, SQLite), `NVARCHAR(MAX)` (SqlServer), `CLOB` (Oracle) |
| point     | GeoJSON `Point`          | `geography(Point, 4326)` (PostgreSQL with PostGIS), `POINT SRID 4326` (MySQL), `POINT` (MariaDB), `geography` (SqlServer), `SDO_GEOMETRY` (Oracle with Spatial), `TEXT` (SQLite, without the geo functions) |
| vector    | number[]                 | `vector(length)` (PostgreSQL with pgvector), `VECTOR(length)` (MariaDB 11.7, SQL Server 2025), `VECTOR(length, FLOAT32)` (Oracle 23ai); not on MySQL, SQLite or MongoDB |

On MongoDB every value is stored as a field of the document (a `point` as GeoJSON).

- **json**: objects and lists are written and read as such (there is no need to call `JSON.stringify` or `JSON.parse`). A query can read and write a path inside it (`p.meta.address.city`); see [JSON, vectors and points](../queries/JsonVectorsPoints.md).
- **point**: a GeoJSON point, `{ "type": "Point", "coordinates": [longitude, latitude] }`, written and read as such; it is used with `distance`, `within` and `inside`.
- **vector**: a list of numbers whose dimensions are its `length` (for example the 1536 of an embedding); it is used with `cosineDistance`, `l2Distance` and `innerProduct`.
- **dateTime**: on PostgreSQL the value is written with milliseconds and its offset, so a `timestamptz` column (see `dbType` in [Property Mapping](#property-mapping)) keeps the exact instant.
- **string without length**: on PostgreSQL it is unbounded (`TEXT`); on the other engines it is `VARCHAR(80)`, so set `length` when a value can be longer.
- `''`, `0` and `false` are values, never NULL (Oracle is the exception: it stores `''` as NULL).

See also [Engines](Engines.md) for the differences between engines.

In this example `name` has no length, `settings` is a JSON object, `createdAt` a date and time, `location` a point and `embedding` a vector of 1536 dimensions:

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
        - name: location
          type: point               # { "type": "Point", "coordinates": [-58.38, -34.6] }
        - name: embedding
          type: vector
          length: 1536
```

#### Set Property as view and readExp

A view property is not stored in the database (push creates no column for it): its value is computed when reading, with the expression in **readExp**.
In this example `fullName` is built from `lastname` and `firstname`.

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

**readExp** can also be set on a stored property: the expression is applied when reading, and nothing changes when writing.
Since it is translated to the language of the source, it can only use functions that λORM translates (`concat`, `substring`, `upper`, `iif`…).

#### Default value in Property

When a record is inserted without a value for the property, the expression in **default** is evaluated by λORM (not by the database) and its result is written.
In this example the `id` of a group is built from its name.

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

A `default` can also read the [context](Context.md) of who runs the query, for example `default: context.tenant`.

#### Read and write value in Property

**readValue** and **writeValue** are evaluated by λORM: **writeValue** transforms the value before it is written, and **readValue** transforms the value read from the database.
In this example the email is stored encrypted and returned decrypted; the key comes from an environment variable.

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

#### Key value in Property

The value set in **key** is used as a filter in read, update and delete queries, and it is assigned to the property when a record is inserted.

This is useful to define several entities on the same table or collection.
In this example a **Locations** table stores countries, states and cities, and each one is worked with as a separate entity:

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

### Index

| Key      | Description                                                                                       | Required |
|----------|---------------------------------------------------------------------------------------------------|:--------:|
| name     | Name of the index.                                                                                | yes      |
| fields   | Properties of the index.                                                                          | yes      |
| type     | A kind of index of the engine: `hnsw` or `ivfflat` for a vector, `spatial` for a point.          |          |
| distance | The distance of a vector index: `cosine`, `l2` or `ip`.                                           |          |

Push creates each index with the template of the dialect for its `type` (and `distance`); a dialect without that template does not support it. Today `hnsw` exists on PostgreSQL, MariaDB and Oracle, `ivfflat` only on PostgreSQL, and `spatial` on PostgreSQL (GIST), MySQL, MariaDB and SQL Server.

```yaml
domain:
  entities:
    - name: Documents
      primaryKey: ["id"]
      indexes:
        - { name: ix_title, fields: [title] }
        - { name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }
      properties:
        - { name: id, type: integer, autoIncrement: true }
        - { name: title, length: 200 }
        - { name: embedding, type: vector, length: 1536 }
    - name: Stores
      primaryKey: ["id"]
      indexes:
        - { name: ix_location, fields: [location], type: spatial }
      properties:
        - { name: id, type: integer, autoIncrement: true }
        - { name: location, type: point, required: true }
```

### Relation

| Key       | Description                                                                                         | Required | Default   |
|-----------|-----------------------------------------------------------------------------------------------------|:--------:|:---------:|
| name      | Name of the relation.                                                                               | yes      |           |
| from      | Property of this entity, or a list of properties for a relation of several fields.                  | yes      |           |
| entity    | Related entity.                                                                                     | yes      |           |
| to        | Property of the related entity, or a list with as many properties as `from`.                        | yes      |           |
| type      | Type of the relation (see below).                                                                   |          | oneToMany |
| composite | The related records are part of this entity (see [Composite Entity](SchemaDefinition-Composite.md)). |         | false     |
| weak      | Push creates no foreign key for the relation (for example between entities in different sources).   |          | false     |
| target    | Name of the inverse relation created in the related entity.                                         |          |           |

The type of the relation determines what it returns:

| Type      | Meaning                                                              | Returns         |
|-----------|----------------------------------------------------------------------|-----------------|
| oneToMany | Many records of this entity reference one record of `entity`.        | one object      |
| manyToOne | Many records of `entity` reference this record.                      | a list          |
| oneToOne  | One record of this entity relates to one record of `entity`.         | one object      |

Note that the names say how many records of **this** entity there are for each record of `entity`: an order has a `oneToMany` relation to its customer (many orders, one customer), and the customer a `manyToOne` relation to its orders.
`manyToOne` relations are always weak.

#### Relation of several fields

When the key of the related entity has more than one field, `from` and `to` are lists of the same length, paired in order:

```yaml
relations:
  - name: area
    from: [locationId, areaId]
    entity: Areas
    to: [locationId, code]
```

#### Target relation

With **target**, the inverse relation is created in the related entity.
For example, if the entity **DeviceStatuses** has a relation with **Devices** with `target: statuses`, a relation called **statuses** is created in **Devices**.
The type of the target relation depends on the type of the source relation:

| Source    | Target    |
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

### Constraint

| Key       | Description                         | Required |
|-----------|-------------------------------------|:--------:|
| message   | Message returned when it fails.     | yes      |
| condition | Boolean expression to evaluate.     | yes      |

Constraints are expressions evaluated by λORM when a record is inserted or updated.
The ORM also creates constraints from other definitions, for example:

- A required property gets a constraint that checks that it is not null.
- A property whose type is an **enum** gets a constraint that checks that the value belongs to the enum.

You can add your own constraints with a **message** and a **condition**: when the condition is not met, the write fails with the message.
In this example the format of the email and the order of two dates are validated:

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

## Application

| Key       | Description                                                       |
|:----------|:------------------------------------------------------------------|
| start     | Tasks run when the ORM is initialized (`orm.init()`).             |
| end       | Tasks run when the ORM is closed (`orm.end()`).                   |
| listeners | Expressions run before or after a query, or when it fails.        |
| queries   | Named queries of the application, whose types and functions `lambdaorm build` generates. |

### Task

Each task of `start` and `end` has:

| Key        | Description                                         | Required |
|------------|-----------------------------------------------------|:--------:|
| name       | Name of the task.                                   | yes      |
| expression | Expression to run.                                  | yes      |
| condition  | The task only runs when this expression is true.    |          |

### Listener

| Key           | Description                                                                                   | Required | Default |
|---------------|-----------------------------------------------------------------------------------------------|:--------:|:-------:|
| name          | Name of the listener.                                                                         | yes      |         |
| on            | Categories of query that trigger it: `select`, `insert`, `upsert`, `update`, `delete`.        | yes      |         |
| condition     | The listener only runs when this expression is true.                                          |          |         |
| before        | Expression run before the query.                                                              |          |         |
| after         | Expression run after the query.                                                               |          |         |
| error         | Expression run when the query fails.                                                          |          |         |
| transactional | `false` runs the listener outside the query's transaction.                                    |          | true    |

See [Listener](SchemaExample-Listener.md) for how listeners run and the arguments they receive.

### Named query

| Key         | Description                                                      | Required |
|-------------|------------------------------------------------------------------|:--------:|
| name        | Name of the query: an identifier, unique in the schema.          | yes      |
| query       | The query expression; its variables are its parameters.          | yes      |
| description | What the query returns; it goes to the comment of its type.      |          |

The queries are validated when the schema loads (a query that does not compile is an error), and `lambdaorm build` writes `queries.ts` next to `model.ts`, with the type of the result of each query, the type of its parameters and a function that runs it. See [Typed queries](../usage/TypedQueries.md).

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

## Infrastructure

| Key           | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| mappings      | How the entities are mapped to the tables or collections of the databases (or the routes of an API). |
| sources       | The databases (or REST APIs) and their connections.                         |
| stages        | Scenarios that decide which source each entity is read from and written to, and the data they start with. |
| views         | Ways of seeing the domain: only some entities and properties, masked or computed properties, filtered rows. |
| paths         | Folders where generated files, the ORM state and the logs are written.      |
| outbox        | The changes of the data written in the same transaction, for a dispatcher to deliver them. |
| migrations    | The history of the migrations in the database, for `lambdaorm migrate`.     |
| crossSource   | The limit of rows of a query whose fields come from several sources.        |
| observability | Logs, metrics and traces with OpenTelemetry (see [Observability](Observability.md)). |
| queue         | Kafka queue, used by the [Data Gateway](../data-gateway/index.md).          |

When some of them are omitted, λORM completes them:

- Without `mappings`, an empty mapping is created (named after the source when there is only one source).
- A source without `mapping` uses the first mapping.
- Without `stages`, a stage called `default` with the first source is created.
- The view `default`, which is the domain without restrictions, always exists.

### Mapping

A mapping defines how the entities are stored in the tables or collections of a database.
Entities and properties that are not listed are mapped to a table or column with the same name.

| Key      | Description                                                | Required |
|----------|------------------------------------------------------------|:--------:|
| name     | Name of the mapping.                                       | yes      |
| entities | Entity mappings.                                           |          |
| extends  | Name of a mapping whose entity mappings this one inherits. |          |

#### Entity Mapping

| Key        | Description                                                  | Required | Default         |
|------------|--------------------------------------------------------------|:--------:|:---------------:|
| name       | Name of the entity.                                          | yes      |                 |
| mapping    | Name of the table or collection in the database; on an Http source, its route (`/invoices`). |  | the entity name |
| abstract   | The entity mapping is only used as a base for others.        |          |                 |
| extends    | Name of the entity mapping this one inherits from.           |          |                 |
| sequence   | Name of the sequence used to generate the values.            |          |                 |
| filter     | Expression that filters the records of the table, for every view. It can read the [context](Context.md). |  |  |
| http       | On an Http source, what differs from the REST convention (see [A REST API as a source](HttpSource.md)). |  |  |
| properties | Property mappings.                                           |          |                 |

##### Abstract and extends in Entity Mapping

Abstract entity mappings are useful as a base for other entity mappings.
This example defines the abstract entity mapping **Locations**, and the concrete entities extend it, so the three of them are stored in the table `TBL_LOCATIONS`.

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

##### Filter in Entity Mapping

The filter of an entity mapping is added to every select, update and delete of the entity, to the joins by a relation and to the includes.
This example reads the users of the **user_entity** table that belong to a given **realmId**.

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

`${REALM_ID}` is replaced once, when the schema loads. To filter by who runs each query, use `context` instead (`filter: realmId == context.realm`); see [Context and row filters](Context.md).

#### Property Mapping

| Key             | Description                                                                         | Required | Default           |
|-----------------|-------------------------------------------------------------------------------------|:--------:|:-----------------:|
| name            | Name of the property.                                                               | yes      |                   |
| mapping         | Name of the column in the database (or of the field in the API).                    |          | the property name |
| readMappingExp  | Read expression, resolved in the source.                                            |          |                   |
| dbType          | Column type used by push (DDL), instead of the one deduced from the property type.  |          |                   |
| previousMapping | Previous name of the column: push renames the column instead of adding a new one.   |          |                   |

##### Column type in Property Mapping

**dbType** sets the column type used by every DDL that creates or alters the column (`push`, `push -o`).
Use it to choose a type that the property type alone does not give, for example an instant with milliseconds or a binary JSON on PostgreSQL:

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

##### Rename a column with previousMapping

To rename a column without losing its data, set the new name in **mapping** and the current one in **previousMapping**.
Push then generates `ALTER TABLE … RENAME COLUMN icon TO icon_name` (SqlServer `sp_rename`) instead of adding a new column.

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

Remove **previousMapping** once the rename has been applied in every database. Renaming a table is not supported.

##### Read expression in Property Mapping

The expression in **readMappingExp** is resolved in the source, and its result is returned in read queries.
In this example the column `created_timestamp`, stored in milliseconds, is returned as a date:

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

### Source

A source is a database (or a REST API) and its connection.

| Key        | Description                                                              | Required | Default           |
|------------|--------------------------------------------------------------------------|:--------:|:-----------------:|
| name       | Name of the source.                                                      | yes      |                   |
| dialect    | Dialect: `MySQL`, `MariaDB`, `PostgreSQL`, `Oracle`, `SqlServer`, `MongoDB`, `SQLjs` (SQLite) or `Http` (a REST API). | yes |  |
| mapping    | Name of the mapping used by the source.                                  |          | the first mapping |
| connection | Connection: an object, a JSON text or an environment variable that holds it. | yes  |                   |

The connection is the one of the driver of each engine:

| Dialect          | Connection                                                                                       |
|------------------|--------------------------------------------------------------------------------------------------|
| MySQL, MariaDB   | `{ host, port, user, password, database }` (options of [mysql2](https://www.npmjs.com/package/mysql2), such as `multipleStatements`) |
| PostgreSQL       | `{ host, port, user, password, database }` (options of [pg](https://www.npmjs.com/package/pg))   |
| SqlServer        | `{ server, authentication: { type: default, options: { userName, password } }, options: { port, database, encrypt } }` ([tedious](https://www.npmjs.com/package/tedious)) |
| Oracle           | `{ connectString, user, password }` ([oracledb](https://www.npmjs.com/package/oracledb))          |
| MongoDB          | `{ url, database }`                                                                              |
| SQLjs (SQLite)   | The path of the file, or `{ file }`; `{}` or `":memory:"` for a database in memory               |
| Http             | `{ url, headers, timeout, auth, forward }` (see [A REST API as a source](HttpSource.md))         |

SQLite runs inside the process with [sql.js](https://www.npmjs.com/package/sql.js), without a server: the file is read when the first connection opens (a missing file starts empty) and written when the ORM ends (`orm.end()`).

#### Set connection in Source

The connection can be defined with an environment variable or directly in the schema.
Writing it in the schema is not recommended, because of security and because the connection usually changes from one environment to another; use it only for a temporary local test.

Using an environment variable:

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

In the schema:

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

A SQLite file:

```yaml
infrastructure:
  sources:
    - name: main
      dialect: SQLjs
      connection: data/shop.sqlite
```

### Stage

A stage is a scenario: its rules decide which source each entity uses.
A query runs on the stage given in its options; without one, it runs on the first stage.

| Key     | Description                                                                  | Required |
|---------|------------------------------------------------------------------------------|:--------:|
| name    | Name of the stage.                                                           | yes      |
| sources | Source rules.                                                                | yes      |
| seed    | Data files the stage starts with, relative to the schema, applied in order (see [Seed](SchemaSynchronization-Seed.md)). |  |

#### Source Rule

| Key       | Description                                    | Required | Default |
|-----------|------------------------------------------------|:--------:|:-------:|
| name      | Name of the source.                            | yes      |         |
| condition | Boolean expression that selects the source.    |          | true    |

#### Condition on Source Rule

**condition** decides on which source a query or a DDL sentence runs.
The variables available in the expression are:

| Variable | Description                                    | Value                                                                  |
|----------|------------------------------------------------|------------------------------------------------------------------------|
| entity   | Entity of the sentence                         | name of the entity                                                     |
| action   | Action of the sentence                         | `select`, `insert`, `bulkInsert`, `update`, `upsert`, `delete`, `createEntity`, … |
| category | Category of the sentence                       | `select`, `insert`, `upsert`, `update`, `delete`, `create`, `alter`, `drop`, … |
| type     | Type of the sentence                           | `dql`, `dml`, `ddl`                                                    |
| read     | The sentence reads                             | boolean                                                                |
| write    | The sentence writes                            | boolean                                                                |
| dml      | The sentence is a query (DQL or DML)           | boolean                                                                |
| ddl      | The sentence is DDL                            | boolean                                                                |

The rules are evaluated in the order they are defined, and the first source whose condition is true is used.
The condition cannot read the [context](Context.md): the route is decided when the query is compiled, and it is cached.

In the following example, the entity **Users** uses the source **keycloak**, and all the other entities use the source **main**.

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

#### Catch-all source

A source rule without **condition** is a catch-all: since the first matching source wins, it only receives the entities that no previous source took.
This applies to queries (DML) as well as to push and the other stage commands (DDL), so the catch-all source does not get the tables of the entities assigned to other sources.
Put it last.

```yaml
infrastructure:
  stages:
    - name: default
      sources:
        - name: keycloak
          condition: entity == "Users"
        - name: main
```

### View

A view is a way of seeing the domain: only some entities and properties, masked or computed properties, and filtered rows.
A query uses the view given in the `view` option; without it, it uses the view `default`, which is the domain and cannot be changed.
Entities that a view does not list are seen as they are in the domain.
[Views](Views.md) explains them in depth.

| Key      | Description                                                                 | Required |
|----------|-----------------------------------------------------------------------------|:--------:|
| name     | Name of the view.                                                           | yes      |
| pii      | What the view does with every property of the domain that has `pii`: `mask`, `hash` or `exclude`. |  |
| entities | Entity views.                                                               |          |

In the following example, the **support** view masks `apiKey`, shows `created` without the time and hides `email`, the **collector** view cannot access users and groups, and the **admin** view, without entities, sees the whole domain.

```yaml
infrastructure:
  views:
    - name: support
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
```

#### Entity View

| Key        | Description                                                                        | Required |
|------------|------------------------------------------------------------------------------------|:--------:|
| name       | Name of the entity.                                                                | yes      |
| exclude    | The entity does not exist in this view: any sentence on it is a `ViewError`.      |          |
| filter     | The rows of the entity in the view: a condition on its properties and the [context](Context.md), added to every sentence on it. |  |
| properties | Property views.                                                                    |          |

##### Exclude in Entity View

An entity with **exclude** cannot be accessed when this view is used.

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

#### Property View

| Key         | Description                                                                                 | Required |
|-------------|---------------------------------------------------------------------------------------------|:--------:|
| name        | Name of a property of the domain, or of a new property.                                     | yes      |
| exclude     | The property does not exist in this view.                                                   |          |
| default     | With `exclude`: the value every insert in the view writes in the hidden property.           |          |
| readExp     | Read expression, resolved in the source: masks a property of the domain, or computes a new one. |      |
| type        | Type of a new property (`string` by default).                                               |          |
| length      | Length of a new property.                                                                   |          |
| description | Description of a new property, for the metadata.                                            |          |

The primary key and the properties of the relations the view keeps cannot be excluded.

##### Exclude in Property View

A property with **exclude** cannot be accessed when this view is used.

```yaml
infrastructure:
  views:
    - name: support
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

##### Read expression in Property View

With **readExp**, the result of the expression is returned in read queries instead of the stored value, and filters and sorts use it too.
In this example `created` is returned as a date, without the time:

```yaml
infrastructure:
  views:
    - name: support
      entities:
        ...
        - name: Users
          properties:
            - name: created
              readExp: date(created)
      ...
```

### Paths

Folders, relative to the folder of the schema, where generated files, the ORM state and the logs are written.

| Key    | Description                                                                         | Default     |
|--------|-------------------------------------------------------------------------------------|:-----------:|
| src    | Source code folder.                                                                 | `src`       |
| domain | Folder, inside `src`, where `lambdaorm build` writes the model and repositories.   | `domain`    |
| state  | Folder of the ORM state (model of each stage, DDL scripts applied by push and their undo). | `orm_state` |
| logs   | Folder of the logs written to files, such as the history of the schema.             | `logs`      |

```yaml
infrastructure:
  paths:
    src: src
    domain: domain
    state: orm_state
    logs: logs
```

### Outbox

With `outbox`, every write it covers leaves an event (entity, action, keys, who and the transaction, without the written data) in the entity `LambdaOrmOutbox`, **in the same transaction** as the change, so a dispatcher can deliver it even if the process stops before notifying anyone.
λORM adds the entity to the domain and `push` creates its table.

| Key         | Description                                                                                     | Default |
|-------------|-------------------------------------------------------------------------------------------------|:-------:|
| entities    | The entities whose writes go to the outbox.                                                     | all     |
| actions     | The actions: `insert`, `update`, `delete`, `upsert`, `bulkInsert`, `bulkMerge`, `bulkDelete`.   | all     |
| condition   | A condition on the change (`entity`, `action`, `keys`, `source`, `actor`…).                     |         |
| maxAttempts | The attempts of a dispatcher before an event is marked `dead`.                                  | 10      |

```yaml
infrastructure:
  outbox:
    entities: [Orders, Customers]
    actions: [insert, update, delete]
    condition: 'action != "delete" || entity == "Orders"'
    maxAttempts: 10
```

The events are read and delivered with `orm.outbox` (`pending`, `done`, `failed`, `dispatch`); see [Changes of the data and outbox](../usage/DataEvents.md).

### Migrations

With `migrations: {}`, λORM adds the entity `LambdaOrmMigrations` to the domain, and each `push` records in it, per source, what it did and how to undo it. That history is what `lambdaorm migrate` uses to go back to a version. See [Migrations](SchemaSynchronization-Migrations.md).

```yaml
infrastructure:
  migrations: {}
```

### Cross source

A query whose `map`, `sort` or `having` reads fields of an entity in another source is solved partly in memory. To sort, group or page in memory it brings at most `maxRows` rows (10000 by default), and it fails with a `CrossSourceError` when there are more, instead of returning a partial result. `options.maxRows` changes it for one query. See [Queries across sources](../queries/CrossSource.md).

```yaml
infrastructure:
  crossSource:
    maxRows: 50000
```

### Observability

`observability` configures logs, metrics and traces with OpenTelemetry. See [Observability](Observability.md).

### Queue

`infrastructure.queue` configures a Kafka queue. It is not used by `@lambdaorm/lib` itself: it is read by the [Data Gateway](../data-gateway/index.md) for queued executions, and it adds the function `queue.send(topic, messages)` to the expressions.

| Key       | Description                                                                                  |
|-----------|----------------------------------------------------------------------------------------------|
| config    | Kafka client configuration ([kafkajs](https://kafka.js.org/docs/configuration)).             |
| consumers | Consumers: each one has a `name`, a consumer `config`, a `subscribe` (topic) and an `execute` expression run for every message, with the variables `message`, `topic` and `partition`. |

In this example every message of the topic `insights-sync` is executed on the `insights` stage:

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
