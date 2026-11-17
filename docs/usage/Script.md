# Script

`orm.executeScript(script, data, options)` evaluates a [3xpr](https://www.npmjs.com/package/3xpr)
script in **one transaction**: every `orm.execute` it calls runs on the same connections (one per source, also across
stages). When the script ends the orm commits; on any error (a query, a function, a `throw`) it rolls back and the
promise rejects with that error. The result is the value of the last statement, or of `return`.

**That is the main feature of a script: all or nothing.** Everything it executes — on every source and stage it
touches, listeners included — is committed together when it ends, or rolled back together if anything fails.

It is the way to run a whole use case — reads, conditions, loops and several writes — in a single call, also from the
[REST service](../api/index.md) (`POST /script`), the client and the [CLI](../cli/index.md) (`lambdaorm script`).
See [Script examples](ScriptExamples.md), from a single query to a complete use case.

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

## Arguments

| Argument | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| script   | The 3xpr script                                                                          |
| data     | The variables of the script. The script works on a copy: `data` is never changed         |
| options  | The query options plus the script's limits (`ScriptOptions`), see below                  |

| Option        | Description                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| stage         | The stage of the transaction and of every `orm.execute` without a stage                            |
| timeout       | Max time in ms: when it passes, the loops stop, the transaction rolls back and the script rejects   |
| maxIterations | Max loop iterations of the script, all loops together; past it the script fails and rolls back      |

Up to @lambdaorm/lib 3.3.0 the limits were a fourth argument (`executeScript(script, data, options, { timeout,
maxIterations })`); since 3.4.0 everything goes in `options`.

## The language

Everything 3xpr has:

- Variables: `total = 0;`, objects `{ id: id, name: "x" }`, lists `[1, 2]`, `items[0].name`.
- `if` / `else if` / `else`, `while`, `for (i = 0; i < n; i += 1)`, `for (item in items)`, `switch`/`case`, `break`,
  `continue`, `return`.
- `throw "message"`; `try { … } catch (e) { e.message }`. `throw { status: 404, message: "…" }` makes the REST
  service answer with that status; in Node the error's `message` is that object as JSON.
- Arrow functions as arguments: `items.filter(p => p.qty > 1).map(p => p.name)`, `items.sum(p => p.qty)`,
  `items.each(p => …)`.
- 3xpr's functions: strings (`upper`, `concat`, …), numbers, dates (`now()`, …), lists, `nvl`, `iif`, … (see
  [Operators & Functions](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)).
- Not available: the `? :` operator (`iif(c, a, b)` evaluates both sides), `++`/`--` (use `i += 1`) and declaring
  functions.

Statements run in order, and each `orm.execute` is awaited before the next statement.

Plus the functions λORM adds:

| Function                                | Description                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `orm.execute(query, data, options)`     | Executes a query in the script's transaction; `options.stage` may name another stage (same transaction) |
| `orm.plan(query, options)`              | The plan of a query (`.sentence`, …)                                          |
| `orm.parameters(query)`                 | The parameters of a query                                                     |
| `orm.metadata(query)`                   | The metadata of a query                                                       |
| `orm.model(query)`                      | The model (fields) a query returns                                            |
| `orm.constraints(query)`                | The constraints a query checks                                                |
| `toBase64(value)` / `getBase64(value)`  | `"abc"` → `"YWJj"` and back                                                   |
| `encrypt(value, key)` / `decrypt(value, key)` | AES                                                                     |

## Transaction and stages

- One transaction for the whole script, also across sources and stages: commit at the end; rollback and reject on any
  error.
- `orm.execute(query, data)` without stage runs on the stage of `options`; with `{ stage: "insights" }` it runs on that
  stage, in the same transaction (since @lambdaorm/lib 3.3.0).
- A statement sees what the previous ones wrote (same connection), before the commit.
- There is no two-phase commit: with several databases the commit goes source by source.

## Security and limits

- The script **cannot read environment variables** (`$VAR` fails), so it can't read connection strings.
- `timeout`: when it passes, the script's loops stop, the transaction rolls back and the script rejects; whatever it
  still executes afterwards fails without reaching the database.
- `maxIterations`: the loop iterations of the script, all loops together; past it the script fails and rolls back.
  The REST service uses `SCRIPT_MAX_ITERATIONS` (default 100000).
- Since @lambdaorm/lib 3.3.0 (3xpr 5.3.0) a `while (true) {}` no longer blocks the process: the timeout and
  `maxIterations` stop it. The REST endpoint is still off by default (`SCRIPT_ENABLED`); enable it for internal clients.
