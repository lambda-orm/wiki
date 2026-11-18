# Script {#script}

Führt ein [Skript](../../usage/Script.md) aus: mehrere Abfragen in **einer Transaktion**. Das Skript ist in
[3xpr](https://www.npmjs.com/package/3xpr) geschrieben, und alle seine Aufrufe von `orm.execute(query, data, options)` laufen in derselben
Transaktion, auch über Quellen hinweg. Die Transaktion wird bestätigt (Commit), wenn das Skript endet, und bei jedem Fehler zurückgerollt (eine
fehlgeschlagene Abfrage oder ein `throw`). Das Ergebnis ist der Wert der letzten Anweisung (oder von `return`).

Es läuft lokal mit dem Workspace (`-w`) oder auf einem [Data Gateway](../../data-gateway/index.md) (`-u`, über
[`POST /script`](../../data-gateway/Rest.md#script)); das Gateway muss `scripts.enabled` haben, und die Zugangsdaten müssen
die Berechtigung `script` besitzen.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages (Standard: der erste Stage des Schemas). |
| script | `-x` | Skript (3xpr-Anweisungen, die `orm.execute(query, data, options)` aufrufen). |
| file | `-f` | Datei mit dem Skript (anstelle von `-x`). |
| data | `-d` | Variablen des Skripts: JSON oder der Pfad einer JSON-Datei. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Ausgabeformat: `json`, `beautiful`, `light` oder `yaml`. |
| url | `-u` | URL des Schemas auf einem Data Gateway (`POST /script`). |

## Beispiele {#examples}

### Inline {#inline}

```sh
lambdaorm script -w lab/northwind -e lab/northwind/.env -o beautiful \
  -x 'orm.execute("Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", { id: id, freight: freight }); orm.execute("Orders.filter(p => p.id == id)", { id: id })' \
  -d '{"id": 10248, "freight": 40}'
```

### Aus einer Datei {#from-a-file}

`create-quote.3xpr`:

```text
account = orm.execute("Accounts.filter(p => p.id == accountId)", { accountId: accountId });
if (account.length() == 0) { throw { status: 404, message: "account not found" }; }
orm.execute("Quotes.insert()", { id: quoteId, accountId: accountId, status: "draft" });
for (line in lines) {
  orm.execute("QuoteLines.insert()", { id: line.id, quoteId: quoteId, quantity: line.qty });
}
orm.execute("QuoteEvents.insert()", { quoteId: quoteId, event: "created" }, { stage: "insights" });
quoteId
```

```sh
lambdaorm script -w . -f create-quote.3xpr -d quote.json
```

`orm.execute(…, { stage: "insights" })` läuft auf einem anderen Stage und nimmt an derselben Transaktion teil (seit `@lambdaorm/lib`
3.3.0).

### Auf einem Data Gateway {#on-a-data-gateway}

Die URL enthält die Route des Schemas (hier `crm`):

```sh
lambdaorm script -u http://localhost:8080/crm -f create-quote.3xpr -d '{"quoteId": 10, "accountId": 1, "lines": []}'
```

## Hinweise {#notes}

- Sprache: Variablen, `if` / `else`, `for`, `for … in`, `while`, `switch`, `try` / `catch`, `throw`, `return`; es gibt
  keinen Operator `? :`, kein `++` / `--` (verwenden Sie `i += 1`) und keine benutzerdefinierten Funktionen. Siehe [Skript](../../usage/Script.md#the-language).
- Das Skript arbeitet auf einer Kopie der Daten und kann keine Umgebungsvariablen lesen (`$VAR` schlägt fehl).
- Fehler werden als `error: …` ausgegeben, und nichts, was das Skript geschrieben hat, bleibt erhalten.
- Mit `-u` benötigt ein Data Gateway mit Bearer-Authentifizierung das Token in der Umgebungsvariablen `SERVICE_TOKEN` der
  CLI (gesendet als `Authorization: Bearer`; seit @lambdaorm/cli 1.6.3).
- Der Befehl endet mit Exit-Code 1, wenn das Skript fehlschlägt (seit @lambdaorm/cli 1.6.3).
