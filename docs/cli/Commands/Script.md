# Script

Runs a [script](../../usage/Script.md): several queries in **one transaction**. The script is written in
[3xpr](https://www.npmjs.com/package/3xpr), and all its `orm.execute(query, data, options)` calls run in the same
transaction, also across sources. The transaction is committed when the script ends and rolled back on any error (a
failed query or a `throw`). The result is the value of the last statement (or of `return`).

It runs locally with the workspace (`-w`) or on a [Data Gateway](../../data-gateway/index.md) (`-u`, through
[`POST /script`](../../data-gateway/Rest.md#script)); the gateway must have `scripts.enabled` and the credential must have
the `script` permission.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| stage | `-s` | Name of the stage (default: the first stage of the schema). |
| script | `-x` | Script (3xpr statements calling `orm.execute(query, data, options)`). |
| file | `-f` | File with the script (instead of `-x`). |
| data | `-d` | Variables of the script: JSON, or the path of a JSON file. |
| envfile | `-e` | Reads a file of environment variables. |
| output | `-o` | Output format: `json`, `beautiful`, `light` or `yaml`. |
| url | `-u` | URL of the schema on a Data Gateway (`POST /script`). |

## Examples

### Inline

```sh
lambdaorm script -w lab/northwind -e lab/northwind/.env -o beautiful \
  -x 'orm.execute("Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", { id: id, freight: freight }); orm.execute("Orders.filter(p => p.id == id)", { id: id })' \
  -d '{"id": 10248, "freight": 40}'
```

### From a file

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

`orm.execute(…, { stage: "insights" })` runs on another stage and joins the same transaction (since `@lambdaorm/lib`
3.3.0).

### On a Data Gateway

The URL includes the route of the schema (here `crm`):

```sh
lambdaorm script -u http://localhost:8080/crm -f create-quote.3xpr -d '{"quoteId": 10, "accountId": 1, "lines": []}'
```

## Notes

- Language: variables, `if` / `else`, `for`, `for … in`, `while`, `switch`, `try` / `catch`, `throw`, `return`; there
  is no `? :` operator, no `++` / `--` (use `i += 1`) and no user-defined functions. See [Script](../../usage/Script.md#the-language).
- The script works on a copy of the data and cannot read environment variables (`$VAR` fails).
- Errors are printed as `error: …`, and nothing the script wrote is kept.
- With `-u`, a Data Gateway with bearer authentication needs the token in the `SERVICE_TOKEN` environment variable of
  the CLI (sent as `Authorization: Bearer`; since @lambdaorm/cli 1.6.3).
- The command exits with code 1 when the script fails (since @lambdaorm/cli 1.6.3).
