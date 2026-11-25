# Explorer

Links die Verbindungen und die Schemas jeder einzelnen: ihre Metadaten, ihr Zustand, ihr Quellcode und was in ihnen
gespeichert ist. Hier beginnt alles: Ein Klick öffnet eine Entität, eine Abfrage, ein Diagramm oder ein Formular in
einem Tab auf der rechten Seite.

## Sein Baum {#its-tree}

```text
λORM Data Gateway ▾   Verbindungen 1        ⟳ · + Neue Verbindung
northwind  http://data-gateway:9090         ⟳ Aktualisieren
Schemas                                     Neues Schema · Exportieren · Importieren
└─ /                                        sein Tab: Befehle, Informationen, Verlauf   ⟳
   ├─ Metadaten
   │  ├─ config                             die lambdaORM.yaml                  (schemaRead)
   │  ├─ domain                             Doppelklick: die Domäne als YAML, schreibgeschützt
   │  │  ├─ Entitäten  +                    Filter · jede Entität: Eigenschaften (n), Beziehungen (n)
   │  │  └─ Enums  +
   │  ├─ application                        ihre Start-Tasks und Listener       (schemaRead)
   │  └─ infrastructure                                                         (schemaRead)
   │     ├─ Mappings  +
   │     ├─ Quellen  +
   │     ├─ Stages  +                       jeder Stage: ◇ sein Diagramm
   │     └─ Variablen (.env)
   ├─ Zustand                                                                   (schemaRead)
   │  └─ data                               die Dateien von data/
   ├─ Quellcode  </>                        der erzeugte Code, nach Sprache     (schemaRead)
   │  └─ TypeScript · node                  ⤓ .zip · ↻ neu erzeugen · 🗑 löschen
   └─ Workbench  +                          Projekte, Ordner, Abfragen und Diagramme
```

![Der Explorer](images/ide-explorer.png)

Was eine Berechtigung braucht, erscheint ohne sie nicht: Nur mit `read` hat ein Schema seine **Metadaten → domain** und
seine **Workbench**. Das **+** von **Entitäten**, **Enums**, **Mappings**, **Quellen** und **Stages** (mit
`schemaWrite`) öffnet das Formular eines neuen Elements ([Verwaltung](Administration.md#forms)).

| Zeile | Ein Klick | Ihre Schaltflächen |
| --- | --- | --- |
| eine Verbindung | ihr Name öffnet ihre Seite ([Verbindungen](Connections.md)) | ⟳ aktualisieren |
| ein Schema | klappt es auf und öffnet seinen Tab ([Verwaltung](Administration.md#the-schema-tab)) | ⟳ es aktualisieren |
| **config** | öffnet die `lambdaORM.yaml` ([Verwaltung](Administration.md#the-yaml)) | |
| **domain** | klappt sie auf; ein Doppelklick öffnet die Domäne als YAML (nur die Domäne: nie die Quellen, die Verbindungen oder den Rest der Konfiguration) | |
| eine Entität | klappt sie auf und öffnet ihre [Ansicht](Entities.md) | |
| eine Eigenschaft einer Entität | nichts: ihr Name, fett für den Primärschlüssel, und ihr Typ | |
| eine Beziehung einer Entität | öffnet die Entität, die sie erreicht (`customer → Customers · N — 1`) | ↗ sie öffnen |
| ein Enum, ein Mapping, eine Source, ein Stage | öffnet sein Formular ([Verwaltung](Administration.md#forms)) | ein Stage: ◇ sein [Diagramm](Administration.md#the-diagram-of-a-stage) |
| **application**, **Variablen (.env)** | öffnet es ([Verwaltung](Administration.md)) | |
| eine Datei von **data** oder eines Codes | öffnet sie, schreibgeschützt | |
| ein Code von **Quellcode** | klappt seine Dateien auf | ⤓, ↻, 🗑 ([Verwaltung](Administration.md#source-code)) |
| ein Ordner, eine Abfrage, ein Diagramm | öffnet ihn/sie ([Workbench](Projects.md)) | **+** in einem Ordner, ✎ bearbeiten, 🗑 löschen |

Ein Schema, das nicht gestartet ist, erscheint abgeblendet, mit seinem Zustand und seinem Grund (oder `Das Gateway nennt
keinen Grund: siehe sein Log`), seiner **config**, um es zu korrigieren, und, mit `schemaAdmin`, 🗑, um es zu
entfernen; eines, dessen neue Version nicht gestartet ist, zeigt ⚠, während die vorherige antwortet.

**Aktualisieren.** Die Schemas werden von selbst neu gelesen, und sofort, wenn das Gateway eine Änderung ankündigt. ⟳
liest neu, was sich anderswo geändert hat (durch eine andere IDE, die CLI, jemanden, der die Dateien bearbeitet): an der
Wurzel jede Verbindung; an einer Verbindung ihre Schemas, deren Domänen und das Gespeicherte; an einem Schema nur
dieses.

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
| eine Abfrage | **+** der Tabs, **Abfragen** einer Entität, eine gespeicherte Abfrage, der Assistent | `Abfrage 1`, die Entität, der Name der gespeicherten Abfrage |
| eine Entität | eine Zeile einer Entität | ihr Name |
| ein Diagramm | ein gespeichertes Diagramm | sein Name |
| die Domäne | Doppelklick auf **domain** | `Domäne (YAML) /` |
| ein Schema | eine Zeile eines Schemas | `Schema /` |
| sein YAML, ein Element, ein Stage-Diagramm | die Zeilen der [Verwaltung](Administration.md) | `lambdaORM.yaml /`, `Orders`, `Neu in Entitäten`, `Stage default`… |
| eine Datei | eine Datei von data oder eines Codes | ihr Name |
| eine Verbindung, Einstellungen, Werkzeuge | die Verbindung, das Menü | `Verbindung: northwind`, `Einstellungen`, `REST API · northwind`… |

- **+** öffnet einen Abfrage-Tab auf der Verbindung des aktiven Tabs, auf ihrem ersten Schema, das bereit ist; **×**
  schließt einen Tab; bis zu 20 Tabs.
- Ein Rechtsklick auf einen Tab, oder **⋯** am Ende der Leiste: **Schließen**, **Andere schließen**, **Alle
  schließen**.
- Ein **•** nach dem Titel markiert ungespeicherte Änderungen.
- Mit mehreren Verbindungen sagt der Titel, welche: `Orders · production`.
- Ohne offenen Tab: `Öffne eine Abfrage, eine Entität oder ein Diagramm im Explorer oder beginne eine Abfrage mit +.`

**Wo es war.** Die offenen Tabs (mit dem Text jeder Abfrage, wie er getippt wurde, und den noch nicht gespeicherten
Diagrammen), der aktive und was im Explorer aufgeklappt war, werden im Browser aufbewahrt: Ein Neuladen, oder der
nächste Tag, beginnt dort, wo es war.
