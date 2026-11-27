# Entities

Each entity of the domain has a view, like a table in a database IDE: its properties, its relations, its keys, its
constraints, its rows, its diagram and the history of its changes. A click on its row in the [explorer](Explorer.md)
opens it in its own tab; a link to another entity (a relation, a reference) opens that one.

Its header has the name of the entity, its schema, and **abstract**, **view** or **extends Entity** when it is one.
Its buttons:

| Button | Does | Needs |
| --- | --- | --- |
| **View traces** | opens the traces of this entity in Grafana (Tempo, filtered by `lambdaorm.entity`) | `observability.explore` of the gateway ([Observability](Connections.md#observability); before IDE 1.5.0, of the connection) |
| **Remove** | says what uses the entity and, confirmed, removes it from the schema | `schemaWrite` |
| **Edit** | opens its [form](Administration.md#forms), already in edit: **Cancel** or **Save** come back to this view | `schemaWrite` |
| **Query** | opens a query tab with `Entity.page(1, 10)` (not on an abstract entity) | |

Under the header, its tabs: **Properties (n)**, **Relations (n)**, **Keys and indexes**, **Constraints (n)**, **Data**,
**Diagram** and **History** (an abstract entity: **Extended by (n)** in place of **Data**, **Diagram** and **Query**). The count of **Relations** includes the relations of other entities that point to this one
(**Referenced by**), so it can be higher than the one in the explorer.

## Abstract entities and what an entity inherits {#abstract}

**Since IDE 1.5.0** (read from the `lambdaORM.yaml`, with `schemaRead`). An abstract entity (`abstract: true`) is the
base other entities extend (`extends: Audited`): its properties and relations reach them.

- **In the explorer** it is in **Abstracts**, and its view is the one of an entity, with **Edit** and **Remove**, plus
  the tab **Extended by (n)**: every entity that extends it, also through another abstract one (`Areas → LocatedCatalog
  → Located`), with the base each one extends; a click opens its view.
- **An entity that extends** says `extends <base>` in its header (the whole chain in its title; a click opens the
  base), and its **Properties** and **Relations** have the column **Inherited** with where each one comes from.
- **In its form**, the inherited properties and relations are apart, by the base that declares them, read only, with a
  link to that base (opened in a tab of its own, keeping what is being edited); an own one that redefines an inherited
  one says so.
- **In the diagrams** an abstract entity is drawn apart: a dashed border, a header of its own colour and its name in
  italics with «abstract»; an inheritance is a dashed line ([Diagrams](Diagrams.md)).

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

Its rows, 50 per page, **◀ Previous** and **Next ▶**. An abstract entity has no data.

- **Sort** by a column: a click on its header (ascending ▲, descending ▼, none). **Filter** with a condition on `p`
  (`p.price > 18`) and **Apply** (or Enter).
- **Export** the page (**CSV**, **JSON**, **XLSX**) or everything (**CSV ∀**, **JSON ∀**, **XLSX ∀**): every page, with
  its sort and its filter, up to 100 000 rows, with the rows read so far and **Cancel**. The `.xlsx` is a real Excel
  file (`Orders.xlsx`, `Orders-page-1.csv`).

With a credential that has `write` and an entity with a primary key, the table is also a **backoffice** (since IDE
1.2.0):

- **Change a cell:** a double click, the new value, Enter (Escape leaves it). It changes only while the cell still has
  what was read: if someone changed it meanwhile, nothing is changed and the table says so and shows it now. The key,
  what is calculated (`view`, `readExp`) and what is `autoIncrement` are not edited; a value that is not of its type
  (`x` in a number) is not sent.
- **+ Add a row:** a form with the properties of the entity (the required ones marked `*`).
- **✕** at the end of a row deletes it, after showing its key and asking.

Everything goes through the gateway with the credential of the connection: its permissions, its
[view](../data-gateway/Security.md#views) and the audit. Without `write`, the table is read only.

Since IDE 1.3.0:

- **Points** (`point`) show as longitude, latitude with **↗** to a map, and are edited in two fields; **vectors**
  (`vector`) show their first numbers and how many (`[0.12, -0.03, 0.5, …] (1536)`), and are written as JSON in the form
  of a row, checked against their dimensions.
- A property that keeps [files](../data-gateway/Configuration.md#files) (data-gateway 4.3.0) shows its file: a click
  opens it (a URL of short life); with `write`, **⤒** uploads another, straight to the storage, and **✕** removes it
  from the row.

![Data](images/ide-entity-data.png)

## Diagram {#diagram}

The entity and its neighbours, read only. The **entity** box centres the diagram on another one, and the depth goes
from **neighbours** to **2 levels** or the **whole model**. Its **options** (IDE 1.5.0), several at once: the **names
of the relations**, its **related entities** (without them, only the entity) and the **entities it extends** (the
abstract bases up its chain, never the other entities of the same base); at first only the entities it extends are
checked. A click on a box centres it; a double click opens its view.
The rest of the diagram (zoom, show, outline, export) is as in [Diagrams](Diagrams.md).

![Diagram](images/ide-entity-diagram.png)

## History

With `schemaRead` (the gateway keeps the history of its schemas since data-gateway 4.1.0): the changes of this entity, the newest first, with **When**, **Who** (the credential and its client: the IDE, the CLI) and **What**.
A click on a change shows its **Changes** (`+` added, `-` removed, `~` replaced) and the entity **Before** and
**After**; **Older changes** reads more. The whole schema has its history too
([Administration](Administration.md#history)).
