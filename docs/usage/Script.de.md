# Skript {#script}

Ein **Skript** ist ein kleines Programm, geschrieben in [3xpr](https://www.npmjs.com/package/3xpr) (einer JavaScript-ähnlichen
Ausdruckssprache), das λORM mit `orm.executeScript(script, data, options)` ausführt. Darin führt `orm.execute(query, data,
options)` λORM-Abfragen aus, und Variablen, Bedingungen und Schleifen entscheiden, welche und mit welchen Daten.

## Wofür es gedacht ist {#what-it-is-for}

Viele Anwendungsfälle bestehen aus mehr als einer Abfrage: eine Bestellung aufgeben (die Bestellung, ihre Positionen, der Saldo des Kunden), Bestand
zwischen Lagern umbuchen, eine Zahlung samt Audit erfassen. Ihre Schreibvorgänge müssen **vollständig oder gar nicht** erfolgen: Eine Bestellung
ohne ihre Positionen oder ein Saldo, der für eine nicht gespeicherte Bestellung abgezogen wurde, ist ein inkonsistenter Zustand.

[`orm.transaction(options, callback)`](Transaction.md) löst das in Node.js-Code. Ein Skript löst es **in einem einzigen
Aufruf, der den gesamten Anwendungsfall enthält**, unabhängig davon, woher der Aufruf kommt: Node.js (`orm.executeScript`), das
[Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), der Node.js-Client (`@lambdaorm/client`) oder die
[CLI](../cli/Commands/Script.md) (`lambdaorm script`). Ein Client in jeder beliebigen Sprache kann einen Anwendungsfall mit mehreren Lese-
und Schreibvorgängen in einer Transaktion ausführen, was ihm nicht möglich wäre, wenn er eine Abfrage pro Anfrage sendet.

## Funktionsumfang {#features}

- **Alles oder nichts**: Alles, was das Skript ausführt, ist eine Transaktion — bestätigt, wenn es endet, zurückgerollt, wenn
  irgendetwas fehlschlägt (eine Abfrage, ein `throw`, das Timeout). Siehe [unten](#the-main-feature-all-or-nothing).
- **Über Quellen und Stages hinweg**: Abfragen auf mehreren Datenbanken und auf einem anderen Stage mit
  `orm.execute(query, data, { stage: "insights" })` sind Teil derselben Transaktion.
- **Listener eingeschlossen**: Was die [Listener](../schema/SchemaExample-Listener.md) des Schemas schreiben, wird mit dem
  Skript bestätigt oder rückgängig gemacht.
- **Eine Sprache, nicht nur Abfragen**: Variablen, `if`, `for`, `while`, `switch`, `try/catch`, `throw`, `return`,
  Listenfunktionen (`filter`, `map`, `sum`, …) und alle Funktionen von 3xpr und λORM.
- **Eigene Schreibvorgänge lesen**: Eine Anweisung sieht, was die vorherigen geschrieben haben, noch vor dem Commit.
- **Ein Ergebnis**: der Wert der letzten Anweisung (oder von `return`) — ein Wert, eine Zeile, ein vom Skript erstelltes Objekt.
- **Sicher für von Clients gesendete Skripte**: kein Zugriff auf Umgebungsvariablen, arbeitet auf einer Kopie von `data`, `timeout` und
  `maxIterations` stoppen es (auch eine Endlosschleife), und das [Data Gateway](../data-gateway/index.md) führt
  Skripte nur aus, wenn seine Konfiguration sie aktiviert (`scripts.enabled`) und die Zugangsdaten die Berechtigung `script` haben.

Ein erster Eindruck — die [Beispiele](#examples) gehen Schritt für Schritt vor, von einer einzelnen Abfrage bis zu einem vollständigen Anwendungsfall:

```typescript
const total = await orm.executeScript(`
  orm.execute("Orders.insert()", { id: orderId, status: "new", version: 1 });
  for (l in lines) {
    orm.execute("OrderLines.insert()", {
      orderId:  orderId,
      line:     l.line,
      product:  l.product,
      quantity: l.qty
    });
  }
  lines.sum(p => p.qty * p.price)
`,
  { orderId, lines },
  { stage: 'default' }
)
```

## Die Hauptfunktion: alles oder nichts {#the-main-feature-all-or-nothing}

**Alles, was ein Skript ausführt, ist eine Transaktion.** Jedes `orm.execute` des Skripts — auf einer Quelle oder auf mehreren,
auf dem Stage des Skripts oder auf einem anderen, und was die [Listener](../schema/SchemaExample-Listener.md) schreiben — läuft auf
denselben Verbindungen:

- Wenn das Skript endet, **wird alles bestätigt**;
- wenn **irgendetwas fehlschlägt** — eine Abfrage, eine Funktion, eine Regel, die `throw` auslöst, das `timeout` —, **wird alles, was das Skript getan hat,
  zurückgerollt**, in jeder Quelle und jedem Stage, und das Promise wird mit diesem Fehler abgelehnt.

Genau dafür ist ein Skript da: ein Anwendungsfall mit mehreren Lese- und Schreibvorgängen (eine Bestellung mit ihren Positionen, eine Bestandsbewegung, eine
Überweisung), der **vollständig oder gar nicht** erfolgen muss, in einem einzigen Aufruf — auch über das
[Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), den Client oder die [CLI](../cli/Commands/Script.md),
wo ein Client sonst nur eine Abfrage pro Anfrage senden und die vorherigen nicht rückgängig machen könnte.

| Wenn das Skript … | Ergebnis |
| --- | --- |
| normal endet | Commit von allem; wird mit dem letzten Wert (oder `return`) erfüllt |
| einen Fehler wirft (`throw`) | Rollback von allem; wird mit diesem Fehler abgelehnt |
| eine Abfrage ausführt, die fehlschlägt (z. B. ein doppelter Schlüssel) | Rollback von allem; wird mit dem Fehler der Datenbank abgelehnt |
| einen Fehler mit `try/catch` abfängt | es läuft weiter; der Fehler macht von sich aus nichts rückgängig |
| `timeout` oder `maxIterations` überschreitet | es stoppt, Rollback von allem; wird abgelehnt |

## Argumente {#arguments}

| Argument | Beschreibung                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| script   | Das 3xpr-Skript                                                                          |
| data     | Die Variablen des Skripts. Das Skript arbeitet auf einer Kopie: `data` wird nie verändert         |
| options  | Die Abfrageoptionen plus die Limits des Skripts (`ScriptOptions`), siehe unten                  |

| Option        | Beschreibung                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| stage         | Der Stage der Transaktion und jedes `orm.execute` ohne Stage                            |
| timeout       | Maximale Zeit in ms: Ist sie überschritten, stoppen die Schleifen, die Transaktion wird zurückgerollt und das Skript abgelehnt   |
| maxIterations | Maximale Anzahl an Schleifendurchläufen des Skripts, alle Schleifen zusammen; darüber hinaus schlägt das Skript fehl und wird zurückgerollt      |

Bis @lambdaorm/lib 3.3.0 waren die Limits ein viertes Argument (`executeScript(script, data, options, { timeout,
maxIterations })`); seit 3.4.0 gehört alles in `options`.

## Beispiele {#examples}

Jedes Beispiel beschreibt, was es tut und was passiert, wenn es fehlschlägt.

### Das Modell der Beispiele {#the-model-of-the-examples}

```yaml
domain:
  entities:
    - name: Customers
      primaryKey: [id]
      uniqueKey: [code]
      properties:
        - { name: id, type: integer, required: true, autoIncrement: true }
        - { name: code, length: 20, required: true }
        - { name: name, required: true }
        - { name: notes }
        - { name: balance, type: decimal }
    - name: Orders
      primaryKey: [id]
      properties:
        - { name: id, length: 36, required: true }
        - { name: customerId, type: integer }
        - { name: status, length: 20, required: true }
        - { name: version, type: integer, required: true }
      relations:
        - { name: lines, type: manyToOne, composite: true, from: id, entity: OrderLines, to: orderId }
    - name: OrderLines
      primaryKey: [orderId, line]
      properties:
        - { name: orderId, length: 36, required: true }
        - { name: line, type: integer, required: true }
        - { name: product, length: 40, required: true }
        - { name: quantity, type: integer }
    - name: AuditLogs
      primaryKey: [id]
      properties:
        - { name: id, type: integer, required: true, autoIncrement: true }
        - { name: entityName, length: 40 }
        - { name: refId, length: 36 }
```

Die Beispiele laufen auf dem Stage `default`; die Beispiele 11 und 13 schreiben zusätzlich auf einen Stage `insights`. Es handelt sich um das Modell des
[Engines-Labs](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), in dem dieselben
Skripte auf PostgreSQL, MySQL, MariaDB, SQL Server, Oracle und MongoDB getestet werden.

### 1. Eine einzelne Abfrage {#1-a-single-query}

Das einfachste Skript ist ein einziges `orm.execute`. Das Skript gibt den Wert seiner letzten Anweisung zurück — hier die Zeilen
der Abfrage. Selbst das läuft in einer Transaktion (sie wird geöffnet, die Abfrage läuft, es folgt der Commit).

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.filter(p => p.code == code)", { code: code })
`,
  { code },
  { stage: 'default' }
)
```

### 2. Mehrere Anweisungen nacheinander {#2-several-statements-in-order}

Anweisungen laufen nacheinander, wobei auf jedes `orm.execute` gewartet wird, bevor das nächste beginnt. Eine Anweisung sieht, was die
vorherigen geschrieben haben, noch vor dem Commit (sie teilen sich die Verbindung).

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.insert()", { code: code, name: name });
  orm.execute("Customers.filter(p => p.code == code).map(p => p.name)", { code: code })
`,
  { code, name: 'Ana' },
  { stage: 'default' }
)
```

**Ergebnis:** [{ name: "Ana" }].

### 3. Das Ergebnis einer Anweisung verwenden {#3-using-the-result-of-a-statement}

Weisen Sie ein Ergebnis einer Variablen zu und verwenden Sie es weiter unten. Ein Insert antwortet mit `{ data }` und den geschriebenen Werten,
einschließlich der generierten: `customer.data.id` ist die von der Datenbank generierte ID.

```typescript
const result = await orm.executeScript(`
  customer = orm.execute("Customers.insert()", { code: code, name: name });
  orm.execute("Orders.insert()", { id: orderId, customerId: customer.data.id, status: "new", version: 1 });
  customer.data.id
`,
  { code, name: 'Ana', orderId },
  { stage: 'default' }
)
```

**Ergebnis:** die für den Kunden generierte ID.

### 4. Betroffene Zeilen: „nicht gefunden“ als Fehler {#4-affected-rows-not-found-as-an-error}

`update` und `delete` antworten mit der Anzahl der betroffenen Zeilen. Ein Skript kann 0 in einen Fehler umwandeln; ein `throw` mit
einem `status` wird vom Data Gateway mit diesem HTTP-Status beantwortet.

```typescript
const result = await orm.executeScript(`
  updated = orm.execute("Customers.update(p => ({ name: name })).filter(p => p.code == code)", { code: code, name: name });
  if (updated == 0) {
    throw { status: 404, message: "customer " + code + " not found" };
  }
  updated
`,
  { code: 'missing', name: 'Bob' },
  { stage: 'default' }
)
```

**Ergebnis:** wird abgelehnt: customer missing not found (404).

### 5. Bedingungen: nur Fehlendes anlegen {#5-conditions-create-only-what-is-missing}

`if` mit einer Abfrage in der Bedingung. Führen Sie es zweimal mit denselben Daten aus: Beim zweiten Mal wird nichts angelegt.

```typescript
const result = await orm.executeScript(`
  created = 0;
  for (c in customers) {
    if (orm.execute("Customers.filter(p => p.code == code)", { code: c.code }).length() == 0) {
      orm.execute("Customers.insert()", c);
      created += 1;
    }
  }
  created
`,
  { customers: [{ code: 'c1', name: 'Ana' }, { code: 'c2', name: 'Bob' }] },
  { stage: 'default' }
)
```

**Ergebnis:** 2 beim ersten Mal, 0 beim zweiten.

### 6. Schleifen: eine Zeile pro Element {#6-loops-one-row-per-item}

`for (item in list)` über die Daten. Jeder Insert der Schleife liegt in derselben Transaktion: Entweder werden alle Positionen
geschrieben oder keine. Listen bieten außerdem `filter`, `map`, `sum`, `count` …

```typescript
const result = await orm.executeScript(`
  orm.execute("Orders.insert()", { id: orderId, status: "new", version: 1 });
  for (l in lines) {
    orm.execute("OrderLines.insert()", { orderId: orderId, line: l.line, product: l.product, quantity: l.qty });
  }
  lines.sum(p => p.qty * p.price)
`,
  { orderId, lines: [{ line: 1, product: 'camera', qty: 2, price: 10 }, { line: 2, product: 'hub', qty: 1, price: 5 }] },
  { stage: 'default' }
)
```

**Ergebnis:** 25.

### 7. Aggregate mit include {#7-aggregates-with-include}

Eine zusammengesetzte Beziehung kann mit `include` geschrieben werden, wie bei `orm.execute` außerhalb eines Skripts. Hier die Bestellung
und ihre Positionen in einer Anweisung, die anschließend mit ihren Positionen zurückgelesen wird.

```typescript
const result = await orm.executeScript(`
  orm.execute("Orders.insert().include(p => p.lines)", {
    id: orderId, status: "new", version: 1,
    lines: lines.map(l => ({ orderId: orderId, line: l.line, product: l.product, quantity: l.qty }))
  });
  orders = orm.execute("Orders.filter(p => p.id == orderId).include(p => p.lines)", { orderId: orderId });
  orders[0].lines.length()
`,
  { orderId, lines: [{ line: 1, product: 'camera', qty: 2 }, { line: 2, product: 'hub', qty: 1 }] },
  { stage: 'default' }
)
```

**Ergebnis:** 2.

### 8. Eine Geschäftsregel: throw, und alles wird rückgängig gemacht {#8-a-business-rule-throw-and-everything-is-undone}

Die Regel wird nach dem Schreiben geprüft: Die Bestellung und ihre Positionen sind bereits in der Datenbank (innerhalb der
Transaktion). `throw` stoppt das Skript und **rollt alles zurück, was es geschrieben hat**: Es bleibt weder eine Bestellung noch eine Position übrig.

```typescript
const result = await orm.executeScript(`
  orm.execute("Orders.insert()", { id: orderId, status: "new", version: 1 });
  for (l in lines) {
    orm.execute("OrderLines.insert()", { orderId: orderId, line: l.line, product: l.product, quantity: l.qty });
  }
  total = lines.sum(p => p.qty * p.price);
  if (total > maxTotal) {
    throw { status: 400, message: "the order exceeds " + maxTotal };
  }
  total
`,
  { orderId, maxTotal: 20, lines: [ …total 25… ] },
  { stage: 'default' }
)
```

**Ergebnis:** wird abgelehnt: the order exceeds 20 (400); die Bestellung und ihre Positionen sind nicht in der Datenbank.

### 9. Einen Fehler behandeln: try / catch {#9-handling-an-error-try-catch}

Ein mit `try/catch` abgefangener Fehler bricht das Skript nicht ab: Es läuft weiter und führt den Commit aus. Verwenden Sie dies für optionale
Schritte; jeder nicht abgefangene Fehler rollt alles zurück.

```typescript
const result = await orm.executeScript(`
  try {
    if (vip) { throw "vip customers are reviewed by hand"; }
    note = "ok";
  } catch (e) {
    note = e.message;
  }
  orm.execute("Customers.insert()", { code: code, name: name, notes: note });
  note
`,
  { code, name: 'Ana', vip: true },
  { stage: 'default' }
)
```

**Ergebnis:** "vip customers are reviewed by hand" (und der Kunde wird geschrieben).

### 10. Listener laufen in der Transaktion des Skripts {#10-listeners-run-inside-the-scripts-transaction}

Ein Listener des Schemas (hier einer, der nach jedem Insert einer Bestellung eine Zeile in `AuditLogs` schreibt) läuft in der
Transaktion des Skripts: Er wird mit ihr bestätigt und mit ihr rückgängig gemacht, wenn das Skript fehlschlägt.

```yaml
application:
  listeners:
    - name: auditOrders
      on: [insert]
      condition: entity == "Orders"
      after: orm.execute("AuditLogs.insert()", { entityName: "Orders", refId: data.id })
```

```typescript
const result = await orm.executeScript(`
  orm.execute("Orders.insert()", { id: orderId, status: "new", version: 1 });
  throw "cancel";
`,
  { orderId },
  { stage: 'default' }
)
```

**Ergebnis:** wird abgelehnt: cancel; weder die Bestellung noch ihre Audit-Zeile sind in der Datenbank.

### 11. Ein anderer Stage in derselben Transaktion {#11-another-stage-in-the-same-transaction}

`orm.execute(query, data, { stage: "insights" })` läuft auf einem anderen Stage — andere Quellen, sogar eine andere
Datenbank-Engine — **in derselben Transaktion**: Schlägt danach irgendetwas fehl, wird auch der Schreibvorgang auf dem anderen Stage rückgängig gemacht.

```typescript
const result = await orm.executeScript(`
  orm.execute("Orders.insert()", { id: orderId, status: "new", version: 1 });
  orm.execute("AuditLogs.insert()", { entityName: "new order", refId: orderId }, { stage: insights });
  if (fail) { throw "something failed after both writes"; }
  "done"
`,
  { orderId, insights: 'insights', fail: true },
  { stage: 'default' }
)
```

**Ergebnis:** wird abgelehnt; die Bestellung (Stage default) und die Audit-Zeile (Stage insights) werden beide rückgängig gemacht.

### 12. Limits: timeout und maxIterations {#12-limits-timeout-and-maxiterations}

Optionen des Skripts, zusammen mit dem Stage: `timeout` (ms) stoppt es — auch eine Endlosschleife — und rollt
zurück; `maxIterations` begrenzt die Schleifendurchläufe des gesamten Skripts. Beide sollten gesetzt werden, wenn Skripte von
Clients kommen.

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.insert()", { code: code, name: "never kept" });
  while (true) { x = 1; }
`,
  { code },
  { stage: 'default', timeout: 2000, maxIterations: 10000 }
)
```

**Ergebnis:** wird abgelehnt (maxIterations oder zuerst das Timeout); der Kunde wird nicht geschrieben.

### 13. Ein vollständiger Anwendungsfall: eine Bestellung aufgeben {#13-a-complete-use-case-place-an-order}

Alles zusammen: validieren, ein Aggregat schreiben, eine Regel anwenden, auf einen anderen Stage schreiben und eine Zusammenfassung zurückgeben.
Ein Aufruf, eine Transaktion — **schlägt irgendein Schritt fehl, existiert nirgendwo etwas von der Bestellung**.

```typescript
const result = await orm.executeScript(`
  customers = orm.execute("Customers.filter(p => p.code == customerCode)", { customerCode: customerCode });
  if (customers.length() == 0) {
    throw { status: 404, message: "customer " + customerCode + " not found" };
  }
  customer = customers[0];
  
  orm.execute("Orders.insert()", { id: orderId, customerId: customer.id, status: "new", version: 1 });
  
  for (l in lines) {
    orm.execute("OrderLines.insert()", {
      orderId:  orderId,
      line:     l.line,
      product:  l.product,
      quantity: l.qty
    });
  }
  
  total = lines.sum(p => p.qty * p.price);
  if (total > customer.balance) {
    throw { status: 409, message: "insufficient balance" };
  }
  
  orm.execute("Customers.update(p => ({ balance: balance })).filter(p => p.id == id)", {
    id:      customer.id,
    balance: customer.balance - total
  });
  orm.execute("AuditLogs.insert()", { entityName: "order total " + total, refId: orderId }, { stage: insights });
  
  { orderId: orderId, total: total, balance: customer.balance - total }
`,
  { customerCode: 'c1', orderId, insights: 'insights', lines: [{ line: 1, product: 'camera', qty: 2, price: 10 }, { line: 2, product: 'hub', qty: 1, price: 5 }] },
  { stage: 'default', timeout: 10000, maxIterations: 10000 }
)
```

**Ergebnis:** { orderId, total: 25, balance: 75 } bei einem Saldo von 100; bei einem Saldo von 20 wird es abgelehnt (409), und die Bestellung, ihre Positionen, der Saldo und die Audit-Zeile bleiben unverändert.

### 14. Ein weiterer Anwendungsfall: ein Angebot mit seiner Summe auf insights {#14-another-use-case-a-quote-with-its-total-on-insights}

Ein Angebot mit seinen Positionen auf dem Haupt-Stage und seiner Summe auf dem Stage `insights` (andere Quellen, möglicherweise eine andere
Datenbank), in einer Transaktion. Das Konto muss existieren; schlägt irgendein Schritt fehl, bleiben weder das Angebot noch seine Positionen noch die
Summe irgendwo erhalten. (Ein Modell mit `Accounts`, `Quotes`, `QuoteLines` und `QuoteTotals`.)

```typescript
const quoteId = await orm.executeScript(`
  account = orm.execute("Accounts.filter(p => p.id == accountId)", { accountId: accountId });
  if (account.length() == 0) {
    throw { status: 404, message: "account not found" };
  }

  orm.execute("Quotes.insert()", { id: quoteId, accountId: accountId, status: "draft" });

  for (line in lines) {
    orm.execute("QuoteLines.insert()", {
      id:        line.id,
      quoteId:   quoteId,
      productId: line.productId,
      quantity:  line.qty
    });
  }

  total = lines.sum(p => p.qty * p.price);
  orm.execute("QuoteTotals.insert()", { quoteId: quoteId, total: total }, { stage: "insights" });

  quoteId
`,
  { quoteId, accountId, lines },
  { stage: 'default', timeout: 10000, maxIterations: 10000 }
)
```

## Dasselbe Skript von einem Client {#the-same-script-from-a-client}

Das Skript und seine Daten sind überall gleich; nur der Aufruf ändert sich. Die URL des Data Gateway enthält die Route
des Schemas, es sei denn, das Gateway stellt wie in diesen Beispielen ein einziges Schema im Stammpfad bereit.

```typescript
// @lambdaorm/client, against a Data Gateway
import { orm } from '@lambdaorm/client'
await orm.init('http://localhost:8080', { headers: { 'X-Api-Key': process.env.BACKEND_KEY } })
const result = await orm.executeScript(script, data, { stage: 'default', timeout: 10000 })
```

```sh
# REST: a Data Gateway with scripts.enabled and a credential with the script permission
curl -X POST http://localhost:8080/script -H 'Content-Type: application/json' -H "X-Api-Key: $BACKEND_KEY" \
  -d '{ "script": "orm.execute(\"Customers.filter(p => p.code == code)\", { code: code })", "data": { "code": "c1" }, "options": { "stage": "default" } }'

# CLI: a script file, data as JSON
lambdaorm script -f place-order.3xpr -d '{ "customerCode": "c1", "orderId": "o-1", "lines": [] }' -s default
```

## Die Sprache {#the-language}

Alles, was 3xpr bietet:

- Variablen: `total = 0;`, Objekte `{ id: id, name: "x" }`, Listen `[1, 2]`, `items[0].name`.
- `if` / `else if` / `else`, `while`, `for (i = 0; i < n; i += 1)`, `for (item in items)`, `switch`/`case`, `break`,
  `continue`, `return`.
- `throw "message"`; `try { … } catch (e) { e.message }`. `throw { status: 404, message: "…" }` lässt das Data
  Gateway mit diesem Status antworten; in Node ist die `message` des Fehlers dieses Objekt als JSON.
- Pfeilfunktionen als Argumente: `items.filter(p => p.qty > 1).map(p => p.name)`, `items.sum(p => p.qty)`,
  `items.each(p => …)`.
- Die Funktionen von 3xpr: Zeichenketten (`upper`, `concat`, …), Zahlen, Datumswerte (`now()`, …), Listen, `nvl`, `iif`, … (siehe
  [Operatoren & Funktionen](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)).
- Nicht verfügbar: der Operator `? :` (`iif(c, a, b)` wertet beide Seiten aus), `++`/`--` (verwenden Sie `i += 1`) und das Deklarieren
  von Funktionen.

Anweisungen laufen der Reihe nach, und auf jedes `orm.execute` wird gewartet, bevor die nächste Anweisung beginnt.

Hinzu kommen die Funktionen, die λORM ergänzt:

| Funktion                                | Beschreibung                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `orm.execute(query, data, options)`     | Führt eine Abfrage in der Transaktion des Skripts aus; `options.stage` kann einen anderen Stage angeben (dieselbe Transaktion) |
| `orm.plan(query, options)`              | Der Plan einer Abfrage (`.sentence`, …)                                          |
| `orm.parameters(query)`                 | Die Parameter einer Abfrage                                                     |
| `orm.metadata(query)`                   | Die Metadaten einer Abfrage                                                       |
| `orm.model(query)`                      | Das Modell (Felder), das eine Abfrage zurückgibt                                            |
| `orm.constraints(query)`                | Die Constraints, die eine Abfrage prüft                                                |
| `toBase64(value)` / `getBase64(value)`  | `"abc"` → `"YWJj"` und zurück                                                   |
| `encrypt(value, key)` / `decrypt(value, key)` | AES                                                                     |

### Skripte schreiben: einige Regeln {#writing-scripts-a-few-rules}

- Anweisungen enden mit `;`; die letzte (ohne `;`) ist das Ergebnis. `return value;` beendet das Skript vorzeitig.
- Variablen müssen nicht deklariert werden: `total = 0;`. `data` wird kopiert: Das Skript verändert nie das Objekt des Aufrufers.
- Zählen Sie mit `i += 1` (es gibt kein `++`); verwenden Sie `iif(condition, a, b)` (es gibt kein `? :`).
- Das Ergebnis einer Abfrage kann direkt indiziert werden: `orm.execute("Customers.filter(p => p.code == code)", { code: code })[0].name`;
  eine leere Liste ist `[]` (beides erfordert 3xpr 5.3.1, ab @lambdaorm/lib 3.4.1).
- Ein Skript kann keine Umgebungsvariablen lesen (`$VAR`).

## Transaktion und Stages {#transaction-and-stages}

- Eine Transaktion für das gesamte Skript, auch über Quellen und Stages hinweg: Commit am Ende; Rollback und Ablehnung bei jedem
  Fehler.
- `orm.execute(query, data)` ohne Stage läuft auf dem Stage aus `options`; mit `{ stage: "insights" }` läuft es auf diesem
  Stage, in derselben Transaktion (seit @lambdaorm/lib 3.3.0).
- Eine Anweisung sieht, was die vorherigen geschrieben haben (dieselbe Verbindung), noch vor dem Commit.
- Es gibt keinen Zwei-Phasen-Commit: Bei mehreren Datenbanken erfolgt der Commit Quelle für Quelle.

## Sicherheit und Limits {#security-and-limits}

- Das Skript **kann keine Umgebungsvariablen lesen** (`$VAR` schlägt fehl) und daher auch keine Verbindungszeichenfolgen.
- `timeout`: Ist es überschritten, stoppen die Schleifen des Skripts, die Transaktion wird zurückgerollt und das Skript abgelehnt; alles, was es
  danach noch ausführt, schlägt fehl, ohne die Datenbank zu erreichen.
- `maxIterations`: die Schleifendurchläufe des Skripts, alle Schleifen zusammen; darüber hinaus schlägt das Skript fehl und wird zurückgerollt.
  Das Data Gateway verwendet `scripts.maxIterations` (Standard 100000).
- Seit @lambdaorm/lib 3.3.0 (3xpr 5.3.0) blockiert ein `while (true) {}` den Prozess nicht mehr: Das Timeout und
  `maxIterations` stoppen es. Im Data Gateway sind Skripte standardmäßig deaktiviert (`scripts.enabled`) und erfordern die Berechtigung `script`.
