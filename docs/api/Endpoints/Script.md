# Script Endpoint

`POST /script` runs several queries in **one transaction** with a single request.

The body is `{ script, data, options }`:

| Field | Description |
| --- | --- |
| `script` | A [3xpr](https://www.npmjs.com/package/3xpr) script. Each `orm.execute(query, data, options)` call in it is awaited and runs in the script's transaction. |
| `data` | The script's variables, as a JSON object. The script works on a copy of it. |
| `options` | Query options, e.g. `{ "stage": "default" }`. |

The endpoint is **off by default**. Start the service with `SCRIPT_ENABLED=true` to turn it on (see [Configuration](../Use/Configuration.md)).

## Example

```sh
curl -X POST "http://localhost:9291/script" -H "Content-Type: application/json" -d '{
  "script": "account = orm.execute(\"Accounts.filter(p => p.id == accountId)\", { accountId: accountId }); if (account.length() == 0) { throw { status: 404, message: \"account not found\" }; } orm.execute(\"Quotes.insert()\", { id: quoteId, accountId: accountId, status: \"draft\" }); for (line in lines) { orm.execute(\"QuoteLines.insert()\", { id: line.id, quoteId: quoteId, quantity: line.qty }); } quoteId",
  "data": { "quoteId": 10, "accountId": 1, "lines": [{ "id": 1, "qty": 2 }, { "id": 2, "qty": 5 }] },
  "options": { "stage": "default" }
}'
```

Response (the value of the last statement):

```json
10
```

The same script, formatted:

```js
account = orm.execute("Accounts.filter(p => p.id == accountId)", { accountId: accountId });
if (account.length() == 0) { throw { status: 404, message: "account not found" }; }
orm.execute("Quotes.insert()", { id: quoteId, accountId: accountId, status: "draft" });
for (line in lines) {
  orm.execute("QuoteLines.insert()", { id: line.id, quoteId: quoteId, quantity: line.qty });
}
quoteId
```

## Behavior

- **One transaction** for the whole script, also when the queries go to several sources. It commits when the script ends
  and rolls back on any error: a failed query, a failed function or a `throw`.
- **Result**: the value of the last statement, or of `return`. A script that ends without a value answers `null`.
- **Another stage**: `orm.execute(query, data, { stage: "insights" })` runs on that stage and joins the same
  transaction; every stage commits or rolls back together (from `@lambdaorm/lib` 3.3.0; with an earlier lib in the
  image, use a single stage per script).
- **Language**: variables, `if` / `else if` / `else`, `for`, `for … in`, `while`, `switch`, `try` / `catch`, `throw`,
  `return`, `break`, `continue`, and arrow functions as arguments (`lines.filter(p => p.qty > 1)`). There is no `? :`
  operator (`iif(c, a, b)` evaluates both sides), no `++` / `--` (use `i += 1`) and no user-defined functions.
- **Functions**: the 3xpr functions plus `orm.execute`, `orm.plan`, `orm.parameters`, `orm.metadata`, `orm.model`,
  `orm.constraints`, `toBase64`, `getBase64`, `encrypt(value, key)` and `decrypt(value, key)`.
- **No environment variables**: `$VAR` fails in a script, so a request can't read the service's secrets.
- **No two-phase commit**: with several databases the commit goes source by source.

## Limits and errors

| Status | When |
| --- | --- |
| 200 | The script committed. Body: its result. |
| 400 | No `script`, an invalid script or query, invalid values (not null, check, invalid data). |
| 403 | Scripts are disabled (`SCRIPT_ENABLED` is not `true`). |
| 409 | Unique or foreign key violation. |
| 413 | The script is longer than `SCRIPT_MAX_LENGTH` characters (default 20000). |
| *n* | The script ran `throw { status: n, message: "…" }`. |
| 500 | Anything else, e.g. the script took longer than `SCRIPT_TIMEOUT_MS` (default 30000 ms). |

Every error rolls the transaction back and answers `{ error, code, message }` (see [Errors](../Use/Errors.md)):

```json
{ "error": "Error", "message": "account not found" }
```

When `SCRIPT_TIMEOUT_MS` passes, the script's loops stop, the transaction rolls back and what the script still runs
fails without reaching the database. `SCRIPT_MAX_ITERATIONS` (default 100000) limits the loop iterations of a script,
all its loops together; past it the script fails (500) and rolls back (service 2.3.2). Before service 2.3.2, a loop
without async calls (`while (true) {}`) blocked the service.

## Clients

- Node: `@lambdaorm/client` → `await orm.executeScript(script, data, options)`.
- CLI: `lambdaorm script -u http://localhost:9291 -f script.3xpr -d '{"quoteId": 10}'` (see
  [script command](../../cli/Commands/Script.md)).
