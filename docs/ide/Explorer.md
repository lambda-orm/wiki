# Explorer

On the left, the connections and the schemas of each one: their metadata, their state, their source code and what is
saved in them. It is where everything starts: a click opens an entity, a query, a diagram or a form in a tab on the
right.

## Its tree

```text
λORM Data Gateway ▾   Connections 1         ⟳ · + New connection
northwind  http://data-gateway:9090         ⟳ Refresh
├─ Administration                           Roles · Access · Persist · Sessions · Writes that wait · Tools · Observability
└─ Schemas                                  New schema · Export · Import
└─ /                                        its tab: commands, about, history   ⟳
   ├─ Metadata
   │  ├─ config                             the lambdaORM.yaml                  (schemaRead)
   │  ├─ domain                             double click: the domain as YAML, read only
   │  │  ├─ Abstracts  +                    the abstract entities the others extend   (schemaRead)
   │  │  ├─ Entities  +                     filter · each entity: Properties (n), Relations (n)
   │  │  └─ Enums  +
   │  ├─ application                        its start tasks and listeners       (schemaRead)
   │  └─ infrastructure                                                         (schemaRead)
   │     ├─ Mappings  +
   │     ├─ Sources  +
   │     ├─ Stages  +                       each stage: ◇ its diagram
   │     └─ Variables (.env)
   ├─ State                                                                     (schemaRead)
   │  └─ data                               the files of data/
   ├─ Source code  </>                      the code built, by language          (schemaRead)
   │  └─ TypeScript · node                  ⤓ .zip · ↻ build again · 🗑 delete
   └─ Workbench  +                          projects, folders, queries and diagrams
```

![The explorer](images/ide-explorer.png)

Since IDE 1.5.0 each connection is one tree: its **Administration** (data-gateway 5.0) and its **Schemas**. The
**Abstracts** of a domain (IDE 1.5.0, read from the `lambdaORM.yaml`, so with `schemaRead`) come first, by name; their
**+** opens a new entity that starts abstract. What needs a permission doesn't show without it: with only `read`, a schema has its **Metadata → domain** and its
**Workbench**. The **+** of **Entities**, **Enums**, **Mappings**, **Sources** and **Stages** (with `schemaWrite`)
opens the form of a new one ([Administration](Administration.md#forms)).

| Row | A click | Its buttons |
| --- | --- | --- |
| a connection | its name opens its page ([Connections](Connections.md)) | ⟳ refresh |
| **Administration** | unfolds what its credential may administer of the gateway ([Connections](Connections.md#administration)) | |
| a schema | unfolds it and opens its tab ([Administration](Administration.md#the-schema-tab)) | ⟳ refresh it |
| **config** | opens the `lambdaORM.yaml` ([Administration](Administration.md#the-yaml)) | |
| **domain** | unfolds it; a double click opens the domain as YAML (only the domain: never the sources, the connections or the rest of the configuration) | |
| an entity | unfolds it and opens its [view](Entities.md) | |
| an abstract entity (**Abstracts**) | unfolds it (its properties and relations) and opens its view, as an entity's ([Entities](Entities.md#abstract)) | |
| a property of an entity | nothing: its name, in bold for the primary key, and its type | |
| a relation of an entity | opens the entity it reaches (`customer → Customers · N — 1`) | ↗ open it |
| an enum, a mapping, a source, a stage | opens its form ([Administration](Administration.md#forms)) | a stage: ◇ its [diagram](Administration.md#the-diagram-of-a-stage) |
| **application**, **Variables (.env)** | opens it ([Administration](Administration.md)) | |
| a file of **data** or of a code | opens it, read only | |
| a code of **Source code** | unfolds its files | ⤓, ↻, 🗑 ([Administration](Administration.md#source-code)) |
| a folder, a query, a diagram | opens it ([Workbench](Projects.md)) | **+** in a folder, ✎ edit, 🗑 delete |

A schema that didn't start shows muted, with its state and its reason (or `The gateway gives no reason: see its log`),
its **config** to fix it and, with `schemaAdmin`, 🗑 to remove it; one whose new version didn't start shows ⚠ while
the previous one serves.

**Refresh.** The schemas are read again by themselves, and at once when the gateway announces a change. ⟳ reads again
what changed elsewhere (by another IDE, the CLI, someone editing the files): on the root, every connection; on a
connection, its schemas, their domains and what is saved; on a schema, only that one.

## The filter of the entities

The box over the entities (`Filter: entity, property, Entity.field`) keeps those whose name, or the name of one of their
properties or relations, has the text: `21 of 192`, or `Nothing matches`. The properties and relations that matched
show under their entity, even folded. `Orders.customer` looks for the relation `customer` of `Orders`. Escape clears
it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | moves between rows |
| → / ← | unfolds / folds |
| Enter | opens the row (or unfolds it) |

## Its width

Drag its edge to resize it (between 180 and 720 px); a double click on the edge fits it to the names. From the keyboard,
on the edge: ← and → change it by 20 px (with Shift, 60), Enter fits it. The button ◫ at the left of the tabs hides and
shows it. The width is remembered.

## The tabs

| Tab | Opened from | Title |
| --- | --- | --- |
| a query | **+** of the tabs, **Query** of an entity, a saved query, the wizard | `Query 1`, the entity, the name of the saved query |
| an entity | a row of an entity | its name |
| a diagram | a saved diagram | its name |
| the domain | double click on **domain** | `Domain (YAML) /` |
| a schema | a row of a schema | `Schema /` |
| its YAML, an element, a stage diagram | the [administration](Administration.md) rows | `lambdaORM.yaml /`, `Orders`, `New in Entities`, `Stage default`… |
| a file | a file of data or of a code | its name |
| a connection, preferences, tools | the connection, the menu | `Connection: northwind`, `Preferences`, `REST API · northwind`… |

- **+** opens a query tab on the connection of the active tab, on its first schema that is ready; **×** closes a tab;
  up to 20 tabs.
- A right click on a tab, or **⋯** at the end of the bar: **Close**, **Close others**, **Close all**.
- A **•** after the title marks changes not saved.
- With several connections, the title says which one: `Orders · production`.
- With no tab open: `Open a query, an entity or a diagram from the explorer, or start a query with +.`

**Where it was.** The open tabs (with the text of each query as it was typed, and the diagrams not saved yet), the
active one and what was unfolded in the explorer are kept in the browser: a reload, or the next day, starts where it
was.
