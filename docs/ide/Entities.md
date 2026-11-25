# Entities

Each entity of the domain has a view, like a table in a database IDE: its properties, its relations, its keys, its
constraints, its rows, its diagram and the history of its changes. A click on its row in the [explorer](Explorer.md)
opens it in its own tab; a link to another entity (a relation, a reference) opens that one.

Its header has the name of the entity, its schema, and **abstract**, **view** or **extends Entity** when it is one.
Its buttons:

| Button | Does | Needs |
| --- | --- | --- |
| **View traces** | opens the traces of this entity in Grafana (Tempo, filtered by `lambdaorm.entity`) | the **Observability** of the [connection](Connections.md#a-new-connection) |
| **Remove** | says what uses the entity and, confirmed, removes it from the schema | `schemaWrite` |
| **Edit** | opens its [form](Administration.md#forms), already in edit: **Cancel** or **Save** come back to this view | `schemaWrite` |
| **Query** | opens a query tab with `Entity.page(1, 10)` (not on an abstract entity) | |

Under the header, its tabs: **Properties (n)**, **Relations (n)**, **Keys and indexes**, **Constraints (n)**, **Data**,
**Diagram** and **History**. The count of **Relations** includes the relations of other entities that point to this one
(**Referenced by**), so it can be higher than the one in the explorer.

## Properties

| Column | What it is |
| --- | --- |
| **#** | its position |
| **Name** | in bold, the primary key |
| **Type** | `string`, `integer`, `decimal`, `dateTime`…, or the enum it takes its values from (`Status (enum)`) |
| **Length** | of a string |
| **Required** | ✓ when it can't be null |
| **PK** | ✓ in the primary key (`U` when it is also in the unique key) |
| **Auto** | ✓ when the database gives its value |
| **Default** | its default value |
| **References** | for a foreign key, the entity and the property it references: a link to that entity |
| **Expressions** | **ƒ Expression** when it has expressions or constraints use it |

![Properties](images/ide-entity-properties.png)

A click on **ƒ Expression** shows, under the table, the expressions of that property in the colours of the editor,
each with what it does, and the constraints whose condition uses it:

| Expression | What it does |
| --- | --- |
| `readExp` | replaces the column when reading: λORM translates it into the query (`mask(email)`) |
| `writeExp` | meant for what is written in the column (λORM doesn't apply it yet: use `writeValue`) |
| `readValue` | transforms each value after reading it, in the gateway (`decrypt(email, $DATA_SECRET_KEY)`) |
| `writeValue` | transforms each value before writing it, in the gateway (`encrypt(email, $DATA_SECRET_KEY)`) |

## Relations

**Relations** lists its relations: name, type (`oneToMany`: to one, as an order to its customer; `manyToOne`: to many,
as an order to its lines; `oneToOne`; λORM names them from the side of the other entity), the entity they reach, the
fields they join (**From**, **To**), the cardinality (`N — 1`, `1 — N`) and whether it is weak. **Referenced by** lists
the relations of other entities that reach this one. Each entity is a link to its view. The count of the tab adds
both.

![Relations](images/ide-entity-relations.png)

## Keys and indexes

The primary key, the unique key, and the indexes with their fields.

## Constraints

The conditions λORM checks before each insert and update (after `writeValue`): a condition that is false rejects the
sentence with its message. Each one with its **Message**, its **Condition** in the colours of the editor and the
**Properties it uses**.

## Data

Its rows, 50 per page, **◀ Previous** and **Next ▶**: read only (no row is changed here). They are shown as the table
of a [result](Queries.md#the-result): they can be copied and exported (`Orders-page-1.json`). An abstract entity has no
data.

![Data](images/ide-entity-data.png)

## Diagram {#diagram}

The entity and its neighbours, read only. The **entity** box centres the diagram on another one, and the depth goes
from **neighbours** to **2 levels** or the **whole model**. A click on a box centres it; a double click opens its view.
The rest of the diagram (zoom, show, outline, export) is as in [Diagrams](Diagrams.md).

![Diagram](images/ide-entity-diagram.png)

## History

With `schemaRead` (the gateway keeps the history of its schemas since data-gateway 4.1.0): the changes of this entity, the newest first, with **When**, **Who** (the credential and its client: the IDE, the CLI) and **What**.
A click on a change shows its **Changes** (`+` added, `-` removed, `~` replaced) and the entity **Before** and
**After**; **Older changes** reads more. The whole schema has its history too
([Administration](Administration.md#history)).
