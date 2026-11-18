# Script

Runs a script: several queries in **one transaction**. The script is a [3xpr](https://www.npmjs.com/package/3xpr)
script whose `orm.execute(query, data, options)` calls all run in the same transaction, also across sources; it commits
when the script ends and rolls back on any error (a query or a `throw`). The result is the value of the last statement
(or of `return`).

It runs locally with the workspace (`-w`) or on a [Data Gateway](../../data-gateway/index.md) (`-u`,
[`POST /script`](../../data-gateway/Rest.md#script); the gateway must have `scripts.enabled` and the credential the
`script` permission).

## Params

| parameter | short | describe |
|-----------|-------|----------|
| workspace | -w | Project path. |
| stage | -s | Name of stage. |
| script | -x | Script (3xpr statements calling `orm.execute(query, data, options)`). |
| file | -f | File with the script (instead of `-x`). |
| data | -d | Variables of the script: JSON, or the path of a JSON file. |
| envfile | -e | Read in a file of environment variables. |
| output | -o | Generates an output according to the following possible values [json\|beautiful\|light\|yaml] |
| url | -u | URL of the schema on a Data Gateway (`POST /script`). |

## Examples

### Inline

```sh
lambdaorm script -w lab/northwind -e lab/northwind/.env -o beautiful \
  -x 'orm.execute("Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", { id: id, freight: freight }); orm.execute("Orders.filter(p => p.id == id)", { id: id })' \
  -d '{"id": 10248, "freight": 40}'
```

### From a file

`create-quote.3xpr`:

```js
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

`orm.execute(…, { stage: "insights" })` runs on another stage and joins the same transaction (from `@lambdaorm/lib`
3.3.0).

### On a Data Gateway

```sh
lambdaorm script -u http://localhost:8080 -f create-quote.3xpr -d '{"quoteId": 10, "accountId": 1, "lines": []}'
```

## Notes

- Language: variables, `if` / `else`, `for`, `for … in`, `while`, `switch`, `try` / `catch`, `throw`, `return`; no
  `? :` operator, no `++` / `--` (use `i += 1`), no user-defined functions.
- The script works on a copy of the data and can't read environment variables (`$VAR` fails).
- Errors are printed as `error: …` and nothing of the script is written.
- With `-u`, a Data Gateway with bearer authentication needs the token in `SERVICE_TOKEN` in the CLI's environment
  (sent as `Authorization: Bearer`; @lambdaorm/cli 1.6.3).
- The command exits with code 1 when the script fails (@lambdaorm/cli 1.6.3).
