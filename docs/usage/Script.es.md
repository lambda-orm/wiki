# Script {#script}

Un **script** es un pequeño programa, escrito en [3xpr](https://www.npmjs.com/package/3xpr) (un lenguaje de expresiones
similar a JavaScript), que λORM ejecuta con `orm.executeScript(script, data, options)`. Dentro de él, `orm.execute(query, data,
options)` ejecuta consultas de λORM, y las variables, condiciones y bucles deciden cuáles y con qué datos.

## Para qué sirve {#what-it-is-for}

Muchos casos de uso son más de una consulta: registrar un pedido (el pedido, sus líneas, el saldo del cliente), mover
stock entre almacenes, registrar un pago y su auditoría. Sus escrituras deben ocurrir **por completo o no ocurrir en
absoluto**: un pedido sin sus líneas, o un saldo descontado por un pedido que no se guardó, es un estado corrupto.

[`orm.transaction(options, callback)`](Transaction.md) lo resuelve en código Node.js. Un script lo resuelve **en una sola
llamada que contiene todo el caso de uso**, venga de donde venga la llamada: Node.js (`orm.executeScript`), el
[Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), el cliente de Node.js (`@lambdaorm/client`) o la
[CLI](../cli/Commands/Script.md) (`lambdaorm script`). Un cliente en cualquier lenguaje puede ejecutar un caso de uso con
varias lecturas y escrituras en una sola transacción, algo que no podría hacer enviando una consulta por petición.

## Características {#features}

- **Todo o nada**: todo lo que ejecuta el script es una única transacción, que se confirma cuando termina y se revierte
  si algo falla (una consulta, un `throw`, el timeout). Ver [más abajo](#the-main-feature-all-or-nothing).
- **Entre fuentes y stages**: las consultas sobre varias bases de datos, y sobre otro stage con
  `orm.execute(query, data, { stage: "insights" })`, forman parte de la misma transacción.
- **Listeners incluidos**: lo que escriben los [listeners](../schema/SchemaExample-Listener.md) del esquema se confirma o
  se deshace junto con el script.
- **Un lenguaje, no solo consultas**: variables, `if`, `for`, `while`, `switch`, `try/catch`, `throw`, `return`,
  funciones de listas (`filter`, `map`, `sum`, …) y todas las funciones de 3xpr y de λORM.
- **Lee lo que escribe**: una sentencia ve lo que escribieron las anteriores, antes del commit.
- **Un resultado**: el valor de la última sentencia (o de `return`): un valor, una fila, un objeto construido por el script.
- **Seguro para scripts enviados por clientes**: sin acceso a variables de entorno, trabaja sobre una copia de `data`,
  `timeout` y `maxIterations` lo detienen (también un bucle que nunca termina), y el
  [Data Gateway](../data-gateway/index.md) solo ejecuta scripts cuando su configuración lo habilita (`scripts.enabled`)
  y la credencial tiene el permiso `script`.

Un primer vistazo; los [ejemplos](#examples) van paso a paso, desde una sola consulta hasta un caso de uso completo:

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

## La característica principal: todo o nada {#the-main-feature-all-or-nothing}

**Todo lo que ejecuta un script es una única transacción.** Cada `orm.execute` del script —en una fuente o en varias,
en el stage del script o en otro, y lo que escriben los [listeners](../schema/SchemaExample-Listener.md)— se ejecuta
sobre las mismas conexiones:

- cuando el script termina, **se confirma todo**;
- si **algo falla** —una consulta, una función, una regla que hace `throw`, el `timeout`—, **se revierte todo lo que
  hizo el script**, en todas las fuentes y stages, y la promesa se rechaza con ese error.

Para eso sirve un script: un caso de uso con varias lecturas y escrituras (un pedido con sus líneas, un movimiento de
stock, una transferencia) que debe ocurrir **por completo o no ocurrir en absoluto**, en una sola llamada; también desde
el [Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), el cliente o la [CLI](../cli/Commands/Script.md),
donde un cliente, de otro modo, solo podría enviar una consulta por petición y no podría deshacer las anteriores.

| Cuando el script… | Resultado |
| --- | --- |
| termina normalmente | commit de todo; se resuelve con el último valor (o `return`) |
| lanza un error (`throw`) | rollback de todo; se rechaza con ese error |
| ejecuta una consulta que falla (p. ej., una clave duplicada) | rollback de todo; se rechaza con el error de la base de datos |
| captura un error con `try/catch` | continúa; el error no deshace nada por sí mismo |
| supera `timeout` o `maxIterations` | se detiene, rollback de todo; se rechaza |

## Argumentos {#arguments}

| Argumento | Descripción                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| script    | El script 3xpr                                                                           |
| data      | Las variables del script. El script trabaja sobre una copia: `data` nunca se modifica    |
| options   | Las opciones de la consulta más los límites del script (`ScriptOptions`), ver abajo      |

| Opción        | Descripción                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| stage         | El stage de la transacción y de cada `orm.execute` sin stage                                        |
| timeout       | Tiempo máximo en ms: cuando se cumple, los bucles se detienen, la transacción se revierte y el script se rechaza |
| maxIterations | Máximo de iteraciones de bucle del script, sumando todos los bucles; al superarlo el script falla y se revierte |

Hasta @lambdaorm/lib 3.3.0 los límites eran un cuarto argumento (`executeScript(script, data, options, { timeout,
maxIterations })`); desde 3.4.0 todo va en `options`.

## Ejemplos {#examples}

Cada ejemplo indica qué hace y qué ocurre cuando falla.

### El modelo de los ejemplos {#the-model-of-the-examples}

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

Los ejemplos se ejecutan en el stage `default`; los ejemplos 11 y 13 también escriben en un stage `insights`. Son el
modelo del [lab de motores](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), donde los
mismos scripts se prueban en PostgreSQL, MySQL, MariaDB, SQL Server, Oracle y MongoDB.

### 1. Una sola consulta {#1-a-single-query}

El script más simple es un único `orm.execute`. El script devuelve el valor de su última sentencia; aquí, las filas
de la consulta. Incluso esto se ejecuta en una transacción (se abre, se ejecuta la consulta, se confirma).

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.filter(p => p.code == code)", { code: code })
`,
  { code },
  { stage: 'default' }
)
```

### 2. Varias sentencias, en orden {#2-several-statements-in-order}

Las sentencias se ejecutan una tras otra, y cada `orm.execute` se espera antes de la siguiente. Una sentencia ve lo
que escribieron las anteriores, antes del commit (comparten la conexión).

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.insert()", { code: code, name: name });
  orm.execute("Customers.filter(p => p.code == code).map(p => p.name)", { code: code })
`,
  { code, name: 'Ana' },
  { stage: 'default' }
)
```

**Resultado:** [{ name: "Ana" }].

### 3. Usar el resultado de una sentencia {#3-using-the-result-of-a-statement}

Se asigna un resultado a una variable y se usa más abajo. Un insert responde `{ data }` con los valores escritos,
incluidos los generados: `customer.data.id` es el id que generó la base de datos.

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

**Resultado:** el id generado para el cliente.

### 4. Filas afectadas: "no encontrado" como error {#4-affected-rows-not-found-as-an-error}

`update` y `delete` responden el número de filas afectadas. Un script puede convertir 0 en un error; el Data Gateway
responde a un `throw` con un `status` con ese código HTTP.

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

**Resultado:** se rechaza: customer missing not found (404).

### 5. Condiciones: crear solo lo que falta {#5-conditions-create-only-what-is-missing}

`if` con una consulta en la condición. Si se ejecuta dos veces con los mismos datos, la segunda vez no crea nada.

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

**Resultado:** 2 la primera vez, 0 la segunda.

### 6. Bucles: una fila por elemento {#6-loops-one-row-per-item}

`for (item in list)` sobre los datos. Todos los inserts del bucle están en la misma transacción: se escriben todas las
líneas, o ninguna. Las listas también tienen `filter`, `map`, `sum`, `count`…

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

**Resultado:** 25.

### 7. Agregados con include {#7-aggregates-with-include}

Una relación compuesta se puede escribir con `include`, como en `orm.execute` fuera de un script. Aquí, el pedido y sus
líneas en una sola sentencia, que luego se vuelve a leer con sus líneas.

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

**Resultado:** 2.

### 8. Una regla de negocio: throw, y todo se deshace {#8-a-business-rule-throw-and-everything-is-undone}

La regla se comprueba después de escribir: el pedido y sus líneas ya están en la base de datos (dentro de la
transacción). `throw` detiene el script y **revierte todo lo que escribió**: no queda ni el pedido ni ninguna línea.

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

**Resultado:** se rechaza: the order exceeds 20 (400); el pedido y sus líneas no están en la base de datos.

### 9. Manejar un error: try / catch {#9-handling-an-error-try-catch}

Un error capturado con `try/catch` no aborta el script: continúa y se confirma. Sirve para pasos opcionales; cualquier
error no capturado revierte todo.

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

**Resultado:** "vip customers are reviewed by hand" (y el cliente se escribe).

### 10. Los listeners se ejecutan dentro de la transacción del script {#10-listeners-run-inside-the-scripts-transaction}

Un listener del esquema (aquí, uno que escribe una fila en `AuditLogs` después de cada insert de un pedido) se ejecuta
en la transacción del script: se confirma con ella, y se deshace con ella si el script falla.

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

**Resultado:** se rechaza: cancel; ni el pedido ni su fila de auditoría están en la base de datos.

### 11. Otro stage en la misma transacción {#11-another-stage-in-the-same-transaction}

`orm.execute(query, data, { stage: "insights" })` se ejecuta en otro stage —otras fuentes, incluso otro motor de base
de datos— **en la misma transacción**: si algo falla después, la escritura en el otro stage también se deshace.

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

**Resultado:** se rechaza; el pedido (stage default) y la fila de auditoría (stage insights) se deshacen ambos.

### 12. Límites: timeout y maxIterations {#12-limits-timeout-and-maxiterations}

Opciones del script, junto con el stage: `timeout` (ms) lo detiene —también un bucle que nunca termina— y revierte;
`maxIterations` limita las iteraciones de bucle de todo el script. Conviene indicar ambos cuando los scripts vienen de
clientes.

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.insert()", { code: code, name: "never kept" });
  while (true) { x = 1; }
`,
  { code },
  { stage: 'default', timeout: 2000, maxIterations: 10000 }
)
```

**Resultado:** se rechaza (por maxIterations, o antes por el timeout); el cliente no se escribe.

### 13. Un caso de uso completo: registrar un pedido {#13-a-complete-use-case-place-an-order}

Todo junto: validar, escribir un agregado, aplicar una regla, escribir en otro stage y responder un resumen.
Una llamada, una transacción: **si algún paso falla, no queda nada del pedido en ninguna parte**.

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

**Resultado:** { orderId, total: 25, balance: 75 } con un saldo de 100; con un saldo de 20 se rechaza (409) y el pedido, sus líneas, el saldo y la fila de auditoría quedan como estaban.

### 14. Otro caso de uso: un presupuesto con su total en insights {#14-another-use-case-a-quote-with-its-total-on-insights}

Un presupuesto con sus líneas en el stage principal y su total en el stage `insights` (otras fuentes, posiblemente otra
base de datos), en una sola transacción. La cuenta debe existir; si algún paso falla, no quedan en ninguna parte ni el
presupuesto, ni sus líneas, ni el total. (Un modelo con `Accounts`, `Quotes`, `QuoteLines` y `QuoteTotals`).

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

## El mismo script desde un cliente {#the-same-script-from-a-client}

El script y sus datos son los mismos en todas partes; solo cambia la llamada. La URL del Data Gateway incluye la ruta
del esquema, salvo que el gateway sirva un único esquema en la raíz, como en estos ejemplos.

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

## El lenguaje {#the-language}

Todo lo que tiene 3xpr:

- Variables: `total = 0;`, objetos `{ id: id, name: "x" }`, listas `[1, 2]`, `items[0].name`.
- `if` / `else if` / `else`, `while`, `for (i = 0; i < n; i += 1)`, `for (item in items)`, `switch`/`case`, `break`,
  `continue`, `return`.
- `throw "message"`; `try { … } catch (e) { e.message }`. `throw { status: 404, message: "…" }` hace que el Data
  Gateway responda con ese código; en Node, el `message` del error es ese objeto como JSON.
- Funciones flecha como argumentos: `items.filter(p => p.qty > 1).map(p => p.name)`, `items.sum(p => p.qty)`,
  `items.each(p => …)`.
- Las funciones de 3xpr: cadenas (`upper`, `concat`, …), números, fechas (`now()`, …), listas, `nvl`, `iif`, … (ver
  [Operadores y funciones](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)).
- No disponible: el operador `? :` (`iif(c, a, b)` evalúa ambos lados), `++`/`--` (se usa `i += 1`) y la declaración
  de funciones.

Las sentencias se ejecutan en orden, y cada `orm.execute` se espera antes de la siguiente sentencia.

Además, las funciones que añade λORM:

| Función                                 | Descripción                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `orm.execute(query, data, options)`     | Ejecuta una consulta en la transacción del script; `options.stage` puede indicar otro stage (misma transacción) |
| `orm.plan(query, options)`              | El plan de una consulta (`.sentence`, …)                                      |
| `orm.parameters(query)`                 | Los parámetros de una consulta                                                |
| `orm.metadata(query)`                   | Los metadatos de una consulta                                                 |
| `orm.model(query)`                      | El modelo (campos) que devuelve una consulta                                  |
| `orm.constraints(query)`                | Las restricciones que comprueba una consulta                                  |
| `toBase64(value)` / `getBase64(value)`  | `"abc"` → `"YWJj"` y a la inversa                                             |
| `encrypt(value, key)` / `decrypt(value, key)` | AES                                                                     |

### Escribir scripts: algunas reglas {#writing-scripts-a-few-rules}

- Las sentencias terminan con `;`; la última (sin `;`) es el resultado. `return value;` termina el script antes.
- Las variables no necesitan declaración: `total = 0;`. `data` se copia: el script nunca modifica el objeto de quien lo llama.
- Se cuenta con `i += 1` (no existe `++`); se usa `iif(condition, a, b)` (no existe `? :`).
- El resultado de una consulta se puede indexar directamente: `orm.execute("Customers.filter(p => p.code == code)", { code: code })[0].name`;
  una lista vacía es `[]` (ambas cosas requieren 3xpr 5.3.1, desde @lambdaorm/lib 3.4.1).
- Un script no puede leer variables de entorno (`$VAR`).

## Transacción y stages {#transaction-and-stages}

- Una sola transacción para todo el script, también entre fuentes y stages: commit al final; rollback y rechazo ante
  cualquier error.
- `orm.execute(query, data)` sin stage se ejecuta en el stage de `options`; con `{ stage: "insights" }` se ejecuta en
  ese stage, en la misma transacción (desde @lambdaorm/lib 3.3.0).
- Una sentencia ve lo que escribieron las anteriores (misma conexión), antes del commit.
- No hay commit en dos fases: con varias bases de datos, el commit se hace fuente por fuente.

## Seguridad y límites {#security-and-limits}

- El script **no puede leer variables de entorno** (`$VAR` falla), por lo que no puede leer las cadenas de conexión.
- `timeout`: cuando se cumple, los bucles del script se detienen, la transacción se revierte y el script se rechaza; lo
  que todavía ejecute después falla sin llegar a la base de datos.
- `maxIterations`: las iteraciones de bucle del script, sumando todos los bucles; al superarlo el script falla y se
  revierte. El Data Gateway usa `scripts.maxIterations` (por defecto 100000).
- Desde @lambdaorm/lib 3.3.0 (3xpr 5.3.0), un `while (true) {}` ya no bloquea el proceso: el timeout y
  `maxIterations` lo detienen. En el Data Gateway los scripts están desactivados por defecto (`scripts.enabled`) y
  requieren el permiso `script`.
