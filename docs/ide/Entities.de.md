# Entitäten

Jede Entität der Domäne hat eine Ansicht, wie eine Tabelle in einer Datenbank-IDE: ihre Eigenschaften, ihre
Beziehungen, ihre Schlüssel, ihre Einschränkungen, ihre Zeilen, ihr Diagramm und der Verlauf ihrer Änderungen. Ein
Klick auf ihre Zeile im [Explorer](Explorer.md) öffnet sie in einem eigenen Tab; ein Link zu einer anderen Entität
(eine Beziehung, ein Verweis) öffnet jene.

Ihre Kopfzeile hat den Namen der Entität, ihr Schema und **abstrakt**, **Sicht** oder **erweitert Entity**, wenn sie
das ist. Ihre Schaltflächen:

| Schaltfläche | Tut | Braucht |
| --- | --- | --- |
| **Traces anzeigen** | öffnet die Traces dieser Entität in Grafana (Tempo, gefiltert nach `lambdaorm.entity`) | `observability.explore` des Gateways ([Observability](Connections.md#observability); vor IDE 1.5.0 der Verbindung) |
| **Entfernen** | sagt, was die Entität verwendet, und entfernt sie nach Bestätigung aus dem Schema | `schemaWrite` |
| **Bearbeiten** | öffnet ihr [Formular](Administration.md#forms), schon im Bearbeitungsmodus: **Abbrechen** oder **Speichern** kehren zu dieser Ansicht zurück | `schemaWrite` |
| **Abfragen** | öffnet einen Abfrage-Tab mit `Entity.page(1, 10)` (nicht bei einer abstrakten Entität) | |

Unter der Kopfzeile ihre Tabs: **Eigenschaften (n)**, **Beziehungen (n)**, **Schlüssel und Indizes**,
**Einschränkungen (n)**, **Daten**, **Diagramm** und **Verlauf** (eine abstrakte Entität: **Erweitert von (n)** statt **Daten**, **Diagramm** und **Abfrage**).
Die Anzahl bei **Relationen** zählt auch die Relationen anderer Entitäten mit, die auf diese zeigen (**Referenziert von**), daher kann sie höher sein als im Explorer.

## Abstrakte Entitäten und was eine Entität erbt {#abstract}

**Seit IDE 1.5.0** (aus der `lambdaORM.yaml` gelesen, mit `schemaRead`). Eine abstrakte Entität (`abstract: true`) ist
die Basis, die andere Entitäten erweitern (`extends: Audited`): ihre Eigenschaften und Beziehungen erreichen sie.

- **Im Explorer** steht sie unter **Abstrakte**, und ihre Ansicht ist die einer Entität, mit **Bearbeiten** und
  **Entfernen**, plus dem Tab **Erweitert von (n)**: jede Entität, die sie erweitert, auch über eine andere abstrakte
  (`Areas → LocatedCatalog → Located`), mit der Basis, die jede erweitert; ein Klick öffnet ihre Ansicht.
- **Eine erweiternde Entität** sagt `erweitert <base>` in ihrer Kopfzeile (die ganze Kette in ihrem Titel; ein Klick
  öffnet die Basis), und ihre **Eigenschaften** und **Beziehungen** haben die Spalte **Geerbt** mit der Herkunft jeder.
- **In ihrem Formular** stehen die geerbten Eigenschaften und Beziehungen getrennt, nach der Basis, die sie deklariert,
  nur lesbar, mit einem Link zu dieser Basis (in einem eigenen Tab geöffnet, das Bearbeitete bleibt); eine eigene, die
  eine geerbte neu definiert, sagt es.
- **In den Diagrammen** wird eine abstrakte Entität abgesetzt gezeichnet: ein gestrichelter Rand, eine Kopfzeile in
  eigener Farbe und ihr Name kursiv mit «abstract»; eine Vererbung ist eine gestrichelte Linie ([Diagramme](Diagrams.md)).

## Eigenschaften {#properties}

| Spalte | Was sie ist |
| --- | --- |
| **#** | ihre Position |
| **Name** | fett: der Primärschlüssel |
| **Typ** | `string`, `integer`, `decimal`, `dateTime`…, oder das Enum, aus dem sie ihre Werte nimmt (`Status (enum)`) |
| **Länge** | eines Strings |
| **Pflicht** | ✓, wenn sie nicht null sein kann |
| **PK** | ✓ im Primärschlüssel (`U`, wenn sie auch im eindeutigen Schlüssel ist) |
| **Auto** | ✓, wenn die Datenbank ihren Wert vergibt |
| **Standard** | ihr Standardwert |
| **Verweist auf** | bei einem Fremdschlüssel die Entität und die Eigenschaft, auf die er verweist: ein Link zu dieser Entität |
| **Ausdrücke** | **ƒ Ausdruck**, wenn sie Ausdrücke hat oder Einschränkungen sie verwenden |

![Eigenschaften](images/ide-entity-properties.png)

Ein Klick auf **ƒ Ausdruck** zeigt unter der Tabelle die Ausdrücke dieser Eigenschaft in den Farben des Editors, jeden
mit dem, was er tut, und die Einschränkungen, deren Bedingung sie verwendet:

| Ausdruck | Was er tut |
| --- | --- |
| `readExp` | ersetzt die Spalte beim Lesen: λORM übersetzt ihn in die Abfrage (`mask(email)`) |
| `writeExp` | gedacht für das, was in die Spalte geschrieben wird (λORM wendet ihn noch nicht an: nutze `writeValue`) |
| `readValue` | wandelt jeden Wert nach dem Lesen um, im Gateway (`decrypt(email, $DATA_SECRET_KEY)`) |
| `writeValue` | wandelt jeden Wert vor dem Schreiben um, im Gateway (`encrypt(email, $DATA_SECRET_KEY)`) |

## Beziehungen {#relations}

**Beziehungen** listet ihre Beziehungen: Name, Typ (`oneToMany`: zu einer, wie eine Bestellung zu ihrem Kunden;
`manyToOne`: zu vielen, wie eine Bestellung zu ihren Positionen; `oneToOne`; λORM benennt sie von der Seite der anderen
Entität), die Entität, die sie erreichen, die Felder, die sie verbinden (**Von**, **Nach**), die Kardinalität
(`N — 1`, `1 — N`) und ob sie schwach ist. **Referenziert von** listet die Beziehungen anderer Entitäten, die diese
erreichen. Jede Entität ist ein Link zu ihrer Ansicht. Die Zahl des Tabs zählt beide zusammen.

![Beziehungen](images/ide-entity-relations.png)

## Schlüssel und Indizes {#keys-and-indexes}

Der Primärschlüssel, der eindeutige Schlüssel und die Indizes mit ihren Feldern.

## Einschränkungen {#constraints}

Die Bedingungen, die λORM vor jedem Insert und Update prüft (nach `writeValue`): Eine falsche Bedingung weist die
Anweisung mit ihrer Meldung ab. Jede mit ihrer **Meldung**, ihrer **Bedingung** in den Farben des Editors und den
**Verwendeten Eigenschaften**.

## Daten {#data}

Ihre Zeilen, 50 pro Seite, **◀ Zurück** und **Weiter ▶**. Eine abstrakte Entität hat keine Daten.

- **Sortieren** nach einer Spalte: ein Klick auf ihre Überschrift (aufsteigend ▲, absteigend ▼, keine). **Filtern**
  mit einer Bedingung auf `p` (`p.price > 18`) und **Anwenden** (oder Enter).
- **Exportieren** der Seite (**CSV**, **JSON**, **XLSX**) oder von allem (**CSV ∀**, **JSON ∀**, **XLSX ∀**): alle
  Seiten, mit ihrer Sortierung und ihrem Filter, bis zu 100 000 Zeilen, mit den bisher gelesenen Zeilen und
  **Abbrechen**. Die `.xlsx` ist eine echte Excel-Datei (`Orders.xlsx`, `Orders-page-1.csv`).

Mit einer Berechtigung, die `write` hat, und einer Entität mit Primärschlüssel ist die Tabelle auch ein
**Backoffice** (seit IDE 1.2.0):

- **Eine Zelle ändern:** Doppelklick, der neue Wert, Enter (Escape verlässt sie). Sie ändert sich nur, solange die
  Zelle noch hat, was gelesen wurde: Hat sie inzwischen jemand geändert, wird nichts geändert, und die Tabelle sagt es
  und zeigt sie jetzt. Der Schlüssel, Berechnetes (`view`, `readExp`) und `autoIncrement` werden nicht bearbeitet; ein
  Wert, der nicht zu seinem Typ passt (`x` in einer Zahl), wird nicht gesendet.
- **+ Zeile hinzufügen:** ein Formular mit den Eigenschaften der Entität (die erforderlichen mit `*` markiert).
- **✕** am Ende einer Zeile löscht sie, nachdem ihr Schlüssel gezeigt und nachgefragt wurde.

Alles läuft über das Gateway mit der Berechtigung der Connection: ihre Berechtigungen, ihre
[View](../data-gateway/Security.md#views) und das Audit. Ohne `write` ist die Tabelle nur lesbar.

Seit IDE 1.3.0:

- **Punkte** (`point`) werden als Längengrad, Breitengrad mit **↗** zu einer Karte gezeigt und in zwei Feldern
  bearbeitet; **Vektoren** (`vector`) zeigen ihre ersten Zahlen und wie viele (`[0.12, -0.03, 0.5, …] (1536)`) und
  werden im Formular der Zeile als JSON geschrieben, gegen ihre Dimensionen geprüft.
- Eine Eigenschaft, die [Dateien](../data-gateway/Configuration.md#files) hält (data-gateway 4.3.0), zeigt ihre Datei:
  ein Klick öffnet sie (eine kurzlebige URL); mit `write` lädt **⤒** eine andere direkt in den Speicher hoch, und **✕**
  entfernt sie aus der Zeile.

![Daten](images/ide-entity-data.png)

## Diagramm {#diagram}

Die Entität und ihre Nachbarn, nur lesen. Das Feld **Entität** zentriert das Diagramm auf eine andere, und die Tiefe
geht von **Nachbarn** zu **2 Ebenen** oder **ganzes Modell**. Ihre **Optionen** (IDE 1.5.0), mehrere zugleich: die **Namen der Beziehungen**, ihre **verbundenen Entitäten**
(ohne sie nur die Entität) und die **Entitäten, die sie erweitert** (die abstrakten Basen ihrer Kette, nie die anderen
Entitäten derselben Basis); anfangs sind nur die Entitäten angekreuzt, die sie erweitert. Ein Klick auf eine Box zentriert sie; ein Doppelklick
öffnet ihre Ansicht. Der Rest des Diagramms (Zoom, anzeigen, Übersicht, exportieren) ist wie in
[Diagramme](Diagrams.md).

![Diagramm](images/ide-entity-diagram.png)

## Verlauf {#history}

Mit `schemaRead` (das Gateway speichert den Verlauf seiner Schemas seit data-gateway 4.1.0): die Änderungen dieser
Entität, die neuesten zuerst, mit **Wann**, **Wer** (die Zugangsdaten und ihr Client: die IDE, die CLI) und **Was**.
Ein Klick auf eine Änderung zeigt ihre **Änderungen** (`+` hinzugefügt, `-` entfernt, `~` ersetzt) und die Entität
**Vorher** und **Nachher**; **Ältere Änderungen** liest weitere. Auch das ganze Schema hat seinen Verlauf
([Verwaltung](Administration.md#history)).
