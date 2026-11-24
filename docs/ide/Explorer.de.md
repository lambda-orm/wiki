# Explorer

Links die Verbindungen und die Schemas jeder einzelnen: ihre Metadaten, ihre Domäne und was in ihnen gespeichert ist.
Alles öffnet sich in einem Tab auf der rechten Seite.

## Sein Baum {#its-tree}

```text
Connections                          + New connection
└─ northwind  http://localhost:9090  ✎ Edit the connection · 🗑 Remove
   Schemas                           New schema · Export · Import
   └─ northwind                      its tab: commands and about
      ├─ Metadata
      │  ├─ config                   the lambdaORM.yaml                 (schemaRead)
      │  ├─ domain                   the domain as YAML, read only
      │  │  ├─ Entities              filter · each entity: Properties, Relations
      │  │  └─ Enums
      │  ├─ application              its start tasks and listeners       (schemaRead)
      │  ├─ infrastructure           Mappings · Sources · Stages · Variables (.env)  (schemaRead)
      │  ├─ data                     the files of data/                  (schemaRead)
      │  └─ src                      the files of the model              (schemaRead)
      └─ projects                    folders, queries and diagrams
```

![Der Explorer, mit geöffnetem Orders](images/ide-entity-properties.png)

Was eine Berechtigung braucht, erscheint ohne sie nicht: nur mit `read` hat ein Schema seine **domain** und seine
**Projekte**.

| Zeile | Ein Klick | Ihre Schaltflächen |
| --- | --- | --- |
| ein Schema | klappt es auf und öffnet seinen Tab ([Verwaltung](Administration.md#the-schema-tab)) | 🗑 es entfernen (`schemaAdmin`) |
| **domain** | klappt sie auf; ein Doppelklick öffnet die Domäne als YAML (nur die Domäne: nie die Quellen, die Verbindungen oder den Rest der Konfiguration) | |
| eine Entität | klappt sie auf und öffnet ihr [Formular](Entities.md) | ✎ sie bearbeiten (`schemaWrite`), ↗ sie öffnen |
| eine Beziehung einer Entität | öffnet die Entität, die sie erreicht (`customer → Customers · N — 1`) | |
| **config**, ein Element von infrastructure | öffnet es ([Verwaltung](Administration.md)) | |
| ein Ordner, eine Abfrage, ein Diagramm | öffnet ihn/sie ([Projekte](Projects.md)) | ✎ bearbeiten, 🗑 löschen, **+** in einem Ordner |

Ein Schema, das nicht gestartet ist, erscheint abgeblendet, mit seinem Zustand und seinem Grund (oder `Das Gateway nennt
keinen Grund: siehe sein Log`); eines, dessen neue Version nicht gestartet ist, zeigt ⚠, während die vorherige antwortet.

## Der Filter der Entitäten {#the-filter-of-the-entities}

Das Feld über den Entitäten (`Filtern: Entität, Eigenschaft, Entität.Feld`) behält die, deren Name, oder der Name einer
ihrer Eigenschaften oder Beziehungen, den Text enthält: `21 von 192`, oder `Keine Treffer`. Die passenden Eigenschaften
und Beziehungen erscheinen unter ihrer Entität, auch zugeklappt. `Orders.customer` sucht die Beziehung `customer` von
`Orders`. Escape leert ihn.

## Tastatur {#keyboard}

| Taste | Tut |
| --- | --- |
| Tab | wechselt zwischen Zeilen |
| → / ← | klappt auf / zu |
| Enter | öffnet die Zeile (oder klappt sie auf) |

## Seine Breite {#its-width}

Ziehe seinen Rand, um die Breite zu ändern (zwischen 180 und 720 px); ein Doppelklick auf den Rand passt sie an die
Namen an. Über die Tastatur, auf dem Rand: ← und → ändern sie um 20 px (mit Umschalt um 60), Enter passt sie an. Die
Schaltfläche ◫ links von den Tabs blendet ihn aus und ein. Die Breite wird gemerkt.

## Die Tabs {#the-tabs}

| Tab | Geöffnet von | Titel |
| --- | --- | --- |
| eine Abfrage | **+** der Tabs, **Abfragen** einer Entität, eine gespeicherte Abfrage | `Abfrage 1`, die Entität, der Name der gespeicherten Abfrage |
| eine Entität | eine Zeile einer Entität | ihr Name |
| ein Diagramm | ein gespeichertes Diagramm | sein Name |
| die Domäne | Doppelklick auf **domain** | `Domäne (YAML) schema` |
| ein Schema, sein YAML, ein Element | die Zeilen der [Verwaltung](Administration.md) | `Schema northwind`, `lambdaORM.yaml northwind`… |
| eine Verbindung, Einstellungen, Werkzeuge | die Verbindung, das Menü ☰ | `Verbindung: northwind`, `Einstellungen`, `REST API · northwind`… |

- **+** öffnet einen Abfrage-Tab auf der aktiven Verbindung; **×** schließt einen Tab; bis zu 20 Tabs.
- Ein Rechtsklick auf einen Tab, oder **⋯**: **Schließen**, **Andere schließen**, **Alle schließen**.
- Ein **•** nach dem Titel markiert ungespeicherte Änderungen.
- Mit mehreren Verbindungen sagt der Titel, welche: `Orders · production`.

**Wo es war.** Die offenen Tabs (mit dem Text jeder Abfrage, wie er getippt wurde, und den noch nicht gespeicherten
Diagrammen), der aktive und was im Explorer aufgeklappt war, werden im Browser aufbewahrt: ein Neuladen, oder der
nächste Tag, beginnt dort, wo es war.
