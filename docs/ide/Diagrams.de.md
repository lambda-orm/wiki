# Diagramme

Ein Diagramm der Domäne zeichnet die gewählten Entitäten als Boxen, mit ihren Eigenschaften, Typen, **PK** und **FK**
(die erforderlichen fett, eine abstrakte Entität kursiv), und ihre Beziehungen als Linien mit ihrer Kardinalität
(**1 — N**, **1 — 1**); eine Vererbung ist eine gestrichelte Linie mit einem hohlen Dreieck. Diagramme werden wie die
Abfragen in einem [Projekt](Projects.md) gespeichert.

![Ein Diagramm](images/ide-diagram.png)

## Ein neues Diagramm {#a-new-diagram}

Das **+** eines Ordners (oder von **Projekte**) → **Neues Diagramm**: ein **Name**, eine **Beschreibung**, sein
**Ordner** und **die Entitäten**, gesucht, einzeln angehakt oder mit **Nachbarn hinzufügen** ergänzt (die Entitäten,
die mit den angehakten verwandt sind); **Leeren** hakt sie alle ab. **Erstellen** öffnet es.

![Neues Diagramm](images/ide-new-diagram.png)

## In einem Diagramm {#in-a-diagram}

| Um | Tu |
| --- | --- |
| es anzuordnen | es wird beim Öffnen angeordnet ([ELK](https://eclipse.dev/elk/)); **neu anordnen** kehrt dahin zurück, nachdem Boxen verschoben wurden |
| eine Box oder eine Linie zu verschieben | ziehe sie; eine Linie hält ihre Enden an den Zeilen der Felder, die sie verbindet; ein Doppelklick auf eine Linie setzt sie zurück |
| mehrere auszuwählen | Umschalt oder Strg und Klick, oder Umschalt und den Hintergrund ziehen (das Werkzeug **auswählen**: das Ziehen des Hintergrunds wählt aus); Strg+A alle, Esc keine |
| Entitäten hinzuzufügen | das **+** einer Box: ihre verwandten Tabellen, die nicht im Diagramm sind; oder **Entitäten…** |
| eine Entität zu entfernen | ihr **×**, oder sie auswählen und Entf; **ausgewählte entfernen (n)** |
| zu zoomen und zu verschieben | das Mausrad; den Hintergrund ziehen (das Werkzeug **verschieben**); **vergrößern**, **verkleinern** (5 % bis 300 %), **einpassen** zeigt es ganz |
| eine Entität zu öffnen | Doppelklick auf ihre Box: ihr [Formular](Entities.md) |
| seine Daten abzufragen | **Abfrage des Diagramms**: ein Abfrage-Tab, der liest, was es zeigt, ausgehend von der ausgewählten Box oder der mit den meisten Beziehungen |
| weniger zu sehen | **anzeigen**: alle Eigenschaften, Schlüssel (PK und FK), Primärschlüssel oder nur der Tabellenname; **Beziehungsnamen** auf den Linien |
| es zu exportieren | **exportieren**: **PDF**, **PNG** oder **SVG**, das ganze Diagramm, mit den Farben des Designs |

**Speichern** (Strg+S) bewahrt die Entitäten auf, den Platz jeder Box und Linie, was es zeigt und die Namen der
Beziehungen; **gespeichert** sagt, dass es keine Änderungen hat. Ein noch nicht gespeichertes Diagramm bleibt nach einem
Neuladen in seinem Tab.

## Das Diagramm einer Entität {#the-diagram-of-an-entity}

Der Tab **Diagramm** einer [Entität](Entities.md#diagram) zeichnet sie mit ihren Nachbarn, nur lesen: **Entität**
zentriert es auf eine andere, und die Tiefe geht zu **2 Ebenen** oder **ganzes Modell**.

## Das Diagramm des Assistenten {#the-diagram-of-the-wizard}

Der [Abfrage-Assistent](QueryWizard.md) verwendet dasselbe Diagramm, mit einem Häkchen an jedem Feld seiner Tabellen.
