# Script

A **script** is a small program, written in [3xpr](https://www.npmjs.com/package/3xpr) (a JavaScript-like expression
language), that λORM runs with `orm.executeScript(script, data, options)`. Inside it, `orm.execute(query, data,
options)` runs λORM queries, and variables, conditions and loops decide which ones and with what data.

## What it is for

Many use cases are more than one query: place an order (the order, its lines, the customer's balance), move stock
between warehouses, register a payment and its audit. Their writes must happen **completely or not at all**: an order
without its lines, or a balance discounted for an order that was not saved, is a corrupt state.

[`orm.transaction(options, callback)`](Transaction.md) solves it in Node.js code. A script solves it **in a single
call that carries the whole use case**, wherever the call comes from: Node.js (`orm.executeScript`), the
[Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), the Node.js client (`@lambdaorm/client`) or the
[CLI](../cli/Commands/Script.md) (`lambdaorm script`). A client in any language can run a use case with several reads
and writes in one transaction, which it could not do by sending one query per request.

## Features

- **All or nothing**: everything the script executes is one transaction — committed when it ends, rolled back if
  anything fails (a query, a `throw`, the timeout). See [below](#the-main-feature-all-or-nothing).
- **Across sources and stages**: queries on several databases, and on another stage with
  `orm.execute(query, data, { stage: "insights" })`, are part of the same transaction.
- **Listeners included**: what the schema's [listeners](../schema/SchemaExample-Listener.md) write is committed or
  undone with the script.
- **A language, not only queries**: variables, `if`, `for`, `while`, `switch`, `try/catch`, `throw`, `return`, list
  functions (`filter`, `map`, `sum`, …) and every function of 3xpr and λORM.
- **Read your writes**: a statement sees what the previous ones wrote, before the commit.
- **A result**: the value of the last statement (or of `return`) — a value, a row, an object built by the script.
- **Safe for scripts sent by clients**: no access to environment variables, works on a copy of `data`, `timeout` and
  `maxIterations` stop it (also a loop that never ends), and the [Data Gateway](../data-gateway/index.md) runs
  scripts only when its configuration enables them (`scripts.enabled`) and the credential has the `script` permission.

A first look — the [examples](#examples) go step by step, from a single query to a complete use case:

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

## The main feature: all or nothing

**Everything a script executes is one transaction.** Every `orm.execute` of the script — on one source or on several,
on the script's stage or on another one, and what the [listeners](../schema/SchemaExample-Listener.md) write — runs on
the same connections:

- when the script ends, **everything is committed**;
- if **anything fails** — a query, a function, a rule that `throw`s, the `timeout` — **everything the script did is
  rolled back**, in every source and stage, and the promise rejects with that error.

That is what a script is for: a use case with several reads and writes (an order with its lines, a stock movement, a
transfer) that must happen **completely or not at all**, in a single call — also from the
[Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), the client or the [CLI](../cli/Commands/Script.md),
where a client could otherwise only send one query per request and could not undo the previous ones.

| When the script… | Result |
| --- | --- |
| ends normally | commit of everything; resolves with the last value (or `return`) |
| throws (`throw`) | rollback of everything; rejects with that error |
| runs a query that fails (e.g. a duplicate key) | rollback of everything; rejects with the database's error |
| catches an error with `try/catch` | it goes on; the error does not undo anything by itself |
| passes `timeout` or `maxIterations` | it stops, rollback of everything; rejects |

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

## Examples

Each example says what it does and what happens when it fails.

### The model of the examples

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

The examples run on the stage `default`; examples 11 and 13 also write on a stage `insights`. They are the
[engines lab](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines) model, where the same
scripts are tested on PostgreSQL, MySQL, MariaDB, SQL Server, Oracle and MongoDB.

### 1. A single query

The simplest script is one `orm.execute`. The script returns the value of its last statement — here the rows
of the query. Even this runs in a transaction (it opens, the query runs, it commits).

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.filter(p => p.code == code)", { code: code })
`,
  { code },
  { stage: 'default' }
)
```

### 2. Several statements, in order

Statements run one after the other, each `orm.execute` awaited before the next. A statement sees what the
previous ones wrote, before the commit (they share the connection).

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.insert()", { code: code, name: name });
  orm.execute("Customers.filter(p => p.code == code).map(p => p.name)", { code: code })
`,
  { code, name: 'Ana' },
  { stage: 'default' }
)
```

**Result:** [{ name: "Ana" }].

### 3. Using the result of a statement

Assign a result to a variable and use it below. An insert answers `{ data }` with the values written,
generated ones included: `customer.data.id` is the id the database generated.

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

**Result:** the id generated for the customer.

### 4. Affected rows: "not found" as an error

`update` and `delete` answer the number of affected rows. A script can turn 0 into an error; `throw` with
a `status` is answered with that HTTP status by the Data Gateway.

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

**Result:** rejects: customer missing not found (404).

### 5. Conditions: create only what is missing

`if` with a query in the condition. Run it twice with the same data: the second time it creates nothing.

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

**Result:** 2 the first time, 0 the second.

### 6. Loops: one row per item

`for (item in list)` over the data. Every insert of the loop is in the same transaction: all the lines are
written, or none. Lists also have `filter`, `map`, `sum`, `count`…

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

**Result:** 25.

### 7. Aggregates with include

A composite relation can be written with `include`, as in `orm.execute` outside a script. Here the order
and its lines in one sentence, then read back with its lines.

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

**Result:** 2.

### 8. A business rule: throw, and everything is undone

The rule is checked after writing: the order and its lines are already in the database (inside the
transaction). `throw` stops the script and **rolls back everything it wrote**: no order and no line is left.

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

**Result:** rejects: the order exceeds 20 (400); the order and its lines are not in the database.

### 9. Handling an error: try / catch

An error caught with `try/catch` does not abort the script: it goes on and commits. Use it for optional
steps; any error not caught rolls everything back.

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

**Result:** "vip customers are reviewed by hand" (and the customer is written).

### 10. Listeners run inside the script's transaction

A schema listener (here, one that writes an `AuditLogs` row after each order insert) runs in the
script's transaction: committed with it, and undone with it if the script fails.

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

**Result:** rejects: cancel; neither the order nor its audit row are in the database.

### 11. Another stage in the same transaction

`orm.execute(query, data, { stage: "insights" })` runs on another stage — other sources, even another
database engine — **in the same transaction**: if anything fails afterwards, the write on the other stage is undone too.

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

**Result:** rejects; the order (default stage) and the audit row (insights stage) are both undone.

### 12. Limits: timeout and maxIterations

Options of the script, with the stage: `timeout` (ms) stops it — also a loop that never ends — and rolls
back; `maxIterations` caps the loop iterations of the whole script. Both are worth setting when scripts come from
clients.

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.insert()", { code: code, name: "never kept" });
  while (true) { x = 1; }
`,
  { code },
  { stage: 'default', timeout: 2000, maxIterations: 10000 }
)
```

**Result:** rejects (maxIterations, or the timeout first); the customer is not written.

### 13. A complete use case: place an order

Everything together: validate, write an aggregate, apply a rule, write on another stage and answer a summary.
One call, one transaction — **if any step fails, nothing of the order exists anywhere**.

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

**Result:** { orderId, total: 25, balance: 75 } with a balance of 100; with a balance of 20 it rejects (409) and the order, its lines, the balance and the audit row are left as they were.

### 14. Another use case: a quote with its total on insights

A quote with its lines on the main stage and its total on the `insights` stage (other sources, possibly another
database), in one transaction. The account must exist; if any step fails, neither the quote, nor its lines, nor the
total are left anywhere. (A model with `Accounts`, `Quotes`, `QuoteLines` and `QuoteTotals`.)

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

## The same script from a client

The script and its data are the same everywhere; only the call changes. The URL of the Data Gateway includes the route
of the schema, unless the gateway serves a single schema at the root, as in these examples.

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

## The language

Everything 3xpr has:

- Variables: `total = 0;`, objects `{ id: id, name: "x" }`, lists `[1, 2]`, `items[0].name`.
- `if` / `else if` / `else`, `while`, `for (i = 0; i < n; i += 1)`, `for (item in items)`, `switch`/`case`, `break`,
  `continue`, `return`.
- `throw "message"`; `try { … } catch (e) { e.message }`. `throw { status: 404, message: "…" }` makes the Data
  Gateway answer with that status; in Node the error's `message` is that object as JSON.
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

### Writing scripts: a few rules

- Statements end with `;`; the last one (without `;`) is the result. `return value;` ends the script early.
- Variables need no declaration: `total = 0;`. `data` is copied: the script never changes the caller's object.
- Count with `i += 1` (there is no `++`); use `iif(condition, a, b)` (there is no `? :`).
- A query's result can be indexed directly: `orm.execute("Customers.filter(p => p.code == code)", { code: code })[0].name`;
  an empty list is `[]` (both need 3xpr 5.3.1, from @lambdaorm/lib 3.4.1).
- A script can't read environment variables (`$VAR`).

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
  The Data Gateway uses `scripts.maxIterations` (default 100000).
- Since @lambdaorm/lib 3.3.0 (3xpr 5.3.0) a `while (true) {}` no longer blocks the process: the timeout and
  `maxIterations` stop it. In the Data Gateway scripts are off by default (`scripts.enabled`) and need the `script` permission.
