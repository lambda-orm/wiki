# Diagrams

A diagram of the domain draws the chosen entities as boxes, with their properties, types, **PK** and **FK** (the
required ones in bold, an abstract entity in italics), and their relations as lines with their cardinality
(**1 — N**, **1 — 1**); an inheritance is a dashed line with a hollow triangle. Use one to explain a part of the
domain, to see what an entity reaches before writing a query, or to export it for a document. Diagrams are saved in
the [workbench](Projects.md), like the queries.

![A diagram](images/ide-diagram.png)

## A new diagram {#a-new-diagram}

1. The **+** of a folder (or of **Workbench**) → **New diagram**.
2. A **Name**, a **Description** and its **Folder**.
3. **The entities**: searched, ticked one by one, or completed with **Add their neighbours** (the entities related to
   the ones ticked); **Clear** unticks them all.
4. **Create** saves it and opens it.

![New diagram](images/ide-new-diagram.png)

## In a diagram

| To | Do |
| --- | --- |
| lay it out | it is laid out when it opens ([ELK](https://eclipse.dev/elk/)); **lay out again** returns to it after moving boxes |
| move a box or a line | drag it; a line keeps its ends on the rows of the fields it joins; a double click on a line puts it back |
| select several | Shift or Ctrl and click, or Shift and drag the background (with the **select** tool, dragging the background selects); Ctrl+A all, Esc none; dragging one moves them all |
| add entities | the **+** of a box: its related tables not in the diagram, to tick, then **add**; or **Entities…** |
| remove an entity | its **×**, or select it and Delete; **remove the selected (n)** |
| zoom and move | the wheel; drag the background (the **move** tool); **zoom out** and **zoom in**, with the zoom between them (5 % to 300 %); **fit** shows it all |
| see where you are | **outline**: the whole drawing small on the right, with a frame on what the view shows; a click or a drag on it moves the view there |
| open an entity | double click its box: its [view](Entities.md) |
| query its data | **query of the diagram**: a query tab that reads what it shows, from the box selected or the most related one |
| see less | **show**: all properties, keys (PK and FK), primary key, or the table name only; **relation names** on the lines |
| export it | **export**: **PDF**, **PNG** or **SVG**, the whole diagram, with the colours of the theme |

The bar ends with how many entities and relations it shows (`entities: 6 · relations: 5`).

**Save** (Ctrl+S) keeps the entities, the place of every box and line, what it shows and the names of the relations;
**saved** says it has no changes. A diagram not saved yet stays in its tab after a reload.

## The diagram of an entity

The **Diagram** tab of an [entity](Entities.md#diagram) draws it with its neighbours, read only: **entity** centres it
on another one, and the depth goes to **2 levels** or the **whole model**.

## The diagram of a stage

Each stage of a schema has a diagram of where its sources take each entity: the gateway, its sources in order and the
tables of each one ([Administration](Administration.md#the-diagram-of-a-stage)). It is saved in the workbench like
the others.

## The diagram of the wizard

The [query wizard](QueryWizard.md) uses the same diagram, with a check on each field of its tables.
