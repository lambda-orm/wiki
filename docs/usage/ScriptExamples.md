# Script examples

Examples of [`orm.executeScript`](Script.md), from the simplest to a complete use case. Each one says what it does and
what happens when it fails.

## The main feature: all or nothing

**Everything a script executes is one transaction.** Every `orm.execute` of the script — on one source or on several,
on the script's stage or on another one, and what the [listeners](../schema/SchemaExample-Listener.md) write — runs on
the same connections:

- when the script ends, **everything is committed**;
- if **anything fails** — a query, a function, a rule that `throw`s, the `timeout` — **everything the script did is
  rolled back**, in every source and stage, and the promise rejects with that error.

That is what a script is for: a use case with several reads and writes (an order with its lines, a stock movement, a
transfer) that must happen **completely or not at all**, in a single call — also from the
[REST service](../api/Endpoints/Script.md) (`POST /script`), the client or the [CLI](../cli/Commands/Script.md),
where a client could otherwise only send one query per request and could not undo the previous ones.

| When the script… | Result |
| --- | --- |
| ends normally | commit of everything; the promise resolves with the value of the last statement (or of `return`) |
| throws (`throw`) | rollback of everything; rejects with that error |
| runs a query that fails (e.g. a duplicate key) | rollback of everything; rejects with the database's error |
| catches an error with `try/catch` | it goes on; the error does not undo anything by itself |
| passes `timeout` or `maxIterations` | it stops, rollback of everything; rejects |

## The model of the examples

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

## 1. A single query

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

## 2. Several statements, in order

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

## 3. Using the result of a statement

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

## 4. Affected rows: "not found" as an error

`update` and `delete` answer the number of affected rows. A script can turn 0 into an error; `throw` with
a `status` is answered with that HTTP status by the REST service.

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

## 5. Conditions: create only what is missing

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

## 6. Loops: one row per item

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

## 7. Aggregates with include

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

## 8. A business rule: throw, and everything is undone

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

## 9. Handling an error: try / catch

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

## 10. Listeners run inside the script's transaction

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

## 11. Another stage in the same transaction

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

## 12. Limits: timeout and maxIterations

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

## 13. A complete use case: place an order

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

## The same script from a client

The script and its data are the same everywhere; only the call changes.

```typescript
// @lambdaorm/client, against the REST service
import { orm } from '@lambdaorm/client'
await orm.init('http://localhost:9291', { token: process.env.SERVICE_TOKEN })
const result = await orm.executeScript(script, data, { stage: 'default', timeout: 10000 })
```

```bash
# REST (the service runs with SCRIPT_ENABLED=true)
curl -X POST http://localhost:9291/script -H 'Content-Type: application/json' \
  -d '{ "script": "orm.execute(\"Customers.filter(p => p.code == code)\", { code: code })", "data": { "code": "c1" }, "options": { "stage": "default" } }'

# CLI: a script file, data as JSON
lambdaorm script -f place-order.3xpr -d '{ "customerCode": "c1", "orderId": "o-1", "lines": [] }' -s default
```

## Writing scripts: a few rules

- Statements end with `;`; the last one (without `;`) is the result. `return value;` ends the script early.
- Variables need no declaration: `total = 0;`. `data` is copied: the script never changes the caller's object.
- Count with `i += 1` (there is no `++`); use `iif(condition, a, b)` (there is no `? :`).
- Keep a query's result in a variable before indexing it: `rows = orm.execute(…); rows[0].name`.
- Write an empty list from the data (`items` sent as `[]`), not as a literal in the script.
- A script can't read environment variables (`$VAR`).
