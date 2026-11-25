# Entitäten

Jede Entität der Domäne hat eine Ansicht, wie eine Tabelle in einer Datenbank-IDE: ihre Eigenschaften, ihre
Beziehungen, ihre Schlüssel, ihre Einschränkungen, ihre Zeilen, ihr Diagramm und der Verlauf ihrer Änderungen. Ein
Klick auf ihre Zeile im [Explorer](Explorer.md) öffnet sie in einem eigenen Tab; ein Link zu einer anderen Entität
(eine Beziehung, ein Verweis) öffnet jene.

Ihre Kopfzeile hat den Namen der Entität, ihr Schema und **abstrakt**, **Sicht** oder **erweitert Entity**, wenn sie
das ist. Ihre Schaltflächen:

| Schaltfläche | Tut | Braucht |
| --- | --- | --- |
| **Traces anzeigen** | öffnet die Traces dieser Entität in Grafana (Tempo, gefiltert nach `lambdaorm.entity`) | die **Beobachtbarkeit** der [Verbindung](Connections.md#a-new-connection) |
| **Entfernen** | sagt, was die Entität verwendet, und entfernt sie nach Bestätigung aus dem Schema | `schemaWrite` |
| **Bearbeiten** | öffnet ihr [Formular](Administration.md#forms), schon im Bearbeitungsmodus: **Abbrechen** oder **Speichern** kehren zu dieser Ansicht zurück | `schemaWrite` |
| **Abfragen** | öffnet einen Abfrage-Tab mit `Entity.page(1, 10)` (nicht bei einer abstrakten Entität) | |

Unter der Kopfzeile ihre Tabs: **Eigenschaften (n)**, **Beziehungen (n)**, **Schlüssel und Indizes**,
**Einschränkungen (n)**, **Daten**, **Diagramm** und **Verlauf**.
Die Anzahl bei **Relationen** zählt auch die Relationen anderer Entitäten mit, die auf diese zeigen (**Referenziert von**), daher kann sie höher sein als im Explorer.

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

Ihre Zeilen, 50 pro Seite, **◀ Zurück** und **Weiter ▶**: nur lesen (hier wird keine Zeile geändert). Sie werden wie
die Tabelle eines [Ergebnisses](Queries.md#the-result) angezeigt: Sie können kopiert und exportiert werden
(`Orders-page-1.json`). Eine abstrakte Entität hat keine Daten.

![Daten](images/ide-entity-data.png)

## Diagramm {#diagram}

Die Entität und ihre Nachbarn, nur lesen. Das Feld **Entität** zentriert das Diagramm auf eine andere, und die Tiefe
geht von **Nachbarn** zu **2 Ebenen** oder **ganzes Modell**. Ein Klick auf eine Box zentriert sie; ein Doppelklick
öffnet ihre Ansicht. Der Rest des Diagramms (Zoom, anzeigen, Übersicht, exportieren) ist wie in
[Diagramme](Diagrams.md).

![Diagramm](images/ide-entity-diagram.png)

## Verlauf {#history}

Mit `schemaRead` (das Gateway speichert den Verlauf seiner Schemas seit data-gateway 4.1.0): die Änderungen dieser
Entität, die neuesten zuerst, mit **Wann**, **Wer** (die Zugangsdaten und ihr Client: die IDE, die CLI) und **Was**.
Ein Klick auf eine Änderung zeigt ihre **Änderungen** (`+` hinzugefügt, `-` entfernt, `~` ersetzt) und die Entität
**Vorher** und **Nachher**; **Ältere Änderungen** liest weitere. Auch das ganze Schema hat seinen Verlauf
([Verwaltung](Administration.md#history)).
