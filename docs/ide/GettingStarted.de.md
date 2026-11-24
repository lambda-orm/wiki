# Erste Schritte

Von nichts zu einer Abfrage, einer vom Assistenten geschriebenen Abfrage und einem Diagramm, mit Northwind. Etwa 10
Minuten.

## 1. Ein Gateway mit Northwind {#1-a-gateway-with-northwind}

Folge den Schritten 1 bis 4 der [Ersten Schritte](../data-gateway/GettingStarted.md) des Data Gateway: Sein Compose
startet Postgres, ein Gateway mit Northwind und die Web-IDE, legt die Tabellen an und importiert die Daten. Das Gateway
hat seinen Port `management` auf 9090, den Port der IDE, den im Compose nur die IDE erreicht.

Mit der [Desktop-App](Download.md) statt der Web-IDE veröffentlichst du diesen Port nur auf deinem Rechner, im Dienst
`data-gateway` des Compose:

```yaml
    ports:
      - "127.0.0.1:9090:9090"   # management, für die Desktop-IDE
```

## 2. Die Verbindung {#2-the-connection}

Öffne die IDE: die Web-IDE unter `http://localhost:8090` oder die Desktop-App. Beim ersten Mal öffnet sie sich mit einer
**Neuen Verbindung**:

| Feld | Wert |
| --- | --- |
| **Name** | `northwind` |
| **Protokoll** | `REST · http` |
| **Management-Adresse** | `data-gateway:9090` in der Web-IDE (so wie die IDE es im Compose erreicht); `localhost:9090` in der Desktop-App |
| **Authentifizierung** | API-Schlüssel, Header `X-Api-Key`, Schlüssel `reader-demo-key` |
| **Schlüssel in diesem Browser merken** | angehakt, damit er nicht erneut abgefragt wird |

**Testen** sagt, wer der Schlüssel ist, und die Version des Gateways; **Verbinden** fügt die Verbindung hinzu.

![Neue Verbindung](images/ide-new-connection.png)

Die Seite der Verbindung öffnet sich. Ihr Tab **Rollen** zeigt, was `reader` darf: `read`, nichts weiter. Damit liest
und fragst du ab; was du speicherst, bleibt in deinem Browser ([Projekte](Projects.md#where-it-is-saved)).

## 3. Der Explorer {#3-the-explorer}

Links die Verbindung und ihr Schema (`/`, das einzige dieses Gateways). Klappe **Metadaten → domain → Entitäten** auf:
die Entitäten von Northwind. Ein Klick auf `Orders` öffnet sein Formular: seine Eigenschaften, seine Beziehungen, seine
Schlüssel, seine Zeilen und sein Diagramm ([Entitäten](Entities.md)).

![Das Formular von Orders](images/ide-entity-properties.png)

## 4. Eine Abfrage {#4-a-query}

Die Schaltfläche **Abfragen** von `Orders` öffnet einen Abfrage-Tab mit `Orders.page(1, 10)`. Ersetze sie durch:

```ts
Customers
	.filter(p => p.country == 'Germany')
	.map(p => ({ id: p.id, name: p.name, city: p.city, country: p.country }))
	.sort(p => p.name)
	.page(1, 10)
```

Der Editor macht beim Tippen Vorschläge: nach `Customers.` die Klauseln, nach `p.` die Felder und Beziehungen.
**execute** (Strg+Enter) führt sie aus; **table** zeigt die Zeilen als Tabelle.

![Eine Abfrage und ihr Ergebnis](images/ide-query.png)

## 5. Eine Abfrage des Assistenten {#5-a-query-of-the-wizard}

Ein neuer Tab (**+**), dann **Assistent**:

1. **ausgehend von** `Orders`;
2. das **+** von `Orders`: hake `Customers` und `Orders.details` an, **hinzufügen (2)**; das **+** von
   `Orders.details`: `Products`;
3. hake `id` und `orderDate` von `Orders` an, `name` und `country` von `Customers`, `quantity` und `unitPrice` der
   Positionen, `name` von `Products`;
4. **Filter:** `p.customer.country == 'Germany'`;
5. **+ Reihenfolge hinzufügen:** `orderDate`, **absteigend**; **Zeilen pro Seite:** `20`;
6. **Abfrage erstellen**, dann **execute**.

Jede Bestellung kommt mit ihrem Kunden und ihren Positionen, jede Position mit ihrem Produkt. Die Seite
[Abfrage-Assistent](QueryWizard.md) erklärt jeden Schritt.

![Der Assistent](images/ide-wizard.png)

## 6. Speichere sie {#6-save-it}

**Speichern** (Strg+S) fragt nach einem Namen, einer Beschreibung und einem Ordner. Ein Ordner wird zuerst mit dem
**+** von **Projekte** → **Neues Projekt** angelegt. Die gespeicherte Abfrage behält ihren Assistenten: Ihre
Schaltfläche **Assistent** öffnet ihn so, wie er verlassen wurde.

![Die Abfrage speichern](images/ide-save-query.png)

## 7. Ein Diagramm {#7-a-diagram}

Das **+** des Ordners → **Neues Diagramm**: ein Name, hake `Orders` an und **Nachbarn hinzufügen** (sein Kunde und
seine Positionen), **Erstellen**. Die Boxen ordnen sich von selbst an; ziehe sie, und **Speichern** behält sie dort, wo
sie gelassen wurden ([Diagramme](Diagrams.md)).

![Ein Diagramm](images/ide-diagram.png)

## Weiter {#next}

- Die Seite der Verbindung: ihre Sitzungen und die REST API, WebSocket und MCP des Gateways in Tabs
  ([Verbindungen](Connections.md)).
- Die Verwaltung der Schemas aus der IDE braucht Zugangsdaten mit `schemaRead` und `schemaWrite`
  ([Verwaltung](Administration.md)).
- Eine Web-IDE für ein Team, neben den Gateways ([Bereitstellen](Deploying.md)).
