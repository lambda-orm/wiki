# Workbench

Was du von einem Schema aufbewahrst, unter **Workbench** im [Explorer](Explorer.md): Projekte, Ordner, Abfragen und
Diagramme. Ein Projekt ist ein Ordner auf oberster Ebene; Ordner lassen sich verschachteln, um das Gespeicherte zu
ordnen. Bewahre dort die Abfragen auf, die du wieder ausführst, die Diagramme, die die Domäne erklären, und die
[Diagramme der Stages](Administration.md#the-diagram-of-a-stage), jedes mit einem Namen und einer Beschreibung.

## Hinzufügen {#adding}

Das **+** von **Workbench** oder eines Ordners:

| Element | Was es abfragt |
| --- | --- |
| **Neues Projekt** (in **Workbench**) / **Neuer Ordner** (in einem Ordner): beide öffnen den Dialog **Neuer Ordner** | einen Namen, eine Beschreibung und den Ordner, in den es kommt |
| **Neue Abfrage** | öffnet einen Abfrage-Tab in diesem Ordner; ihr erstes **Speichern** fragt nach ihrem Namen |
| **Neues Diagramm** | einen Namen, eine Beschreibung, den Ordner und die Entitäten ([Diagramme](Diagrams.md#a-new-diagram)) |
| **Neues Panel** (IDE 1.3.0) | nichts: ein Panel namens **Neues Panel** öffnet sich sofort (im Explorer umbenannt) |

## Panels {#panels}

Seit IDE 1.3.0. Ein **Panel** ist ein Raster von Karten, jede eine Abfrage und wie ihr Ergebnis gezeigt wird: eine
**Zahl** (ihr erster Wert), eine **Tabelle**, **Balken** oder **Linien** (eine Spalte mit Beschriftungen und die der
Werte: keine, alle numerischen) oder ein **Kreis**. **+ Karte** fügt eine hinzu und öffnet ihr Formular (**Titel**,
**Abfrage**, **Daten**, **Angezeigt als**, ihre Spalten und **Breit**, zwei Spalten des Rasters); **✎** öffnet sie
wieder. **Aktualisieren** führt alle aus, **Automatisch aktualisieren** alle 30 s bis 15 min; **Speichern** legt das
Panel im Workbench ab (`<name>.panel.yaml`). Die Karten laufen mit den Anmeldedaten der Connection: ihre View und ihre
Berechtigungen.

## Eine Abfrage speichern {#saving-a-query}

**Speichern** (Strg+S) in einem Abfrage-Tab: Beim ersten Mal fragt es nach einem **Namen**, einer **Beschreibung** und
einem **Ordner**; danach speichert es an Ort und Stelle. **Speichern unter…** speichert eine Kopie mit einem anderen
Namen. Was gespeichert wird: der Modus, die Abfrage oder das Skript, die Daten, die Optionen und, wenn der
[Assistent](QueryWizard.md) sie geschrieben hat, der Assistent.

![Die Abfrage speichern](images/ide-save-query.png)

- Ein **•** im Tab markiert ungespeicherte Änderungen; nach dem Speichern steht dort **gespeichert**.
- Eine gespeicherte Abfrage, deren Schema in ihrem Tab geändert wird, wird als neue gespeichert.
- Eine gespeicherte Abfrage zu öffnen, die schon offen ist, wechselt zu ihrem Tab.

Ein Diagramm wird mit **Speichern** in seiner Leiste gespeichert ([Diagramme](Diagrams.md)); ein Diagramm eines Stage
fragt beim ersten Mal nach seinem Namen, seiner Beschreibung und seinem Ordner und hat auch **Speichern unter…**.

## Bearbeiten, verschieben, löschen {#editing-moving-deleting}

Jede Zeile hat ✎ **Bearbeiten** (ihr Name, ihre Beschreibung und ihr Ordner) und 🗑 **Löschen** (vorher gefragt; ein
Ordner nimmt mit, was er enthält). Elemente werden **durch Ziehen verschoben**: auf einen Ordner, oder auf
**Workbench**, um sie auf die oberste Ebene zu bringen, innerhalb desselben Schemas. Zwei Elemente derselben Art können
in einem Ordner nicht denselben Namen haben (`Hier gibt es schon eines mit diesem Namen.`). Die Beschreibung erscheint,
wenn der Mauszeiger über dem Element ist.

## Wo es gespeichert wird {#where-it-is-saved}

| Die Zugangsdaten haben | Das Gespeicherte geht in | Gesehen von |
| --- | --- | --- |
| `workbenchWrite` | den Ordner `workbench/` des Workspace des Schemas, im Gateway: eine Datei pro Element (`sales/German orders.query.yaml`, `model.diagram.yaml`) | allen, die dieses Schema nutzen, aus jedem Browser oder der Desktop-App |
| kein `workbenchWrite` | **diesen Browser**, in seinen Speicher, getrennt nach Gateway und Zugangsdaten | nur diesem Browser auf diesem Gerät, mit diesen Zugangsdaten |

Im Workspace wird erkannt, wenn zwei Personen dasselbe Element gleichzeitig speichern: Der zweiten wird gesagt, dass
jemand anderes es inzwischen geändert hat, und das Element wird neu gelesen. Was jemand anderes speichert, erscheint
sofort. Dateien von `workbench/`, die nicht gelesen werden können, werden unter der Verbindung aufgelistet, um sie von
Hand zu korrigieren.

Im Browser:

- was die einen Zugangsdaten speichern, ist mit anderen nicht zu sehen (dafür wird nur der Name der Zugangsdaten
  verwendet, nie ihr Geheimnis);
- es verschwindet, wenn die Daten der Website gelöscht werden; in einem Browser, der kein Speichern erlaubt (manche
  privaten Fenster), sagt der Explorer es, und es bleibt, bis die Seite geschlossen wird;
- wird `workbenchWrite` später erteilt, bietet der Explorer einmal an: **In den Workspace kopieren**.

## Export und Import {#export-and-import}

**Exportieren** (im Kopf von **Schemas**) lädt alles, was mit dieser Verbindung gespeichert ist, als JSON-Datei herunter
(`lambdaorm-workspace-2026-11-23.json`): eine Sicherung, oder ein Weg, es in einen anderen Browser oder zu jemand
anderem zu bringen. **Importieren** liest eine solche Datei: **Zum Vorhandenen hinzufügen** (ein Element mit derselben
id wird ersetzt) oder **Alles ersetzen** (nur im Browser: im Workspace fügt ein Import immer hinzu, da er geteilt ist).
