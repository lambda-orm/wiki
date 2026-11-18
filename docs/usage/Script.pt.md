# Script {#script}

Um **script** é um pequeno programa, escrito em [3xpr](https://www.npmjs.com/package/3xpr) (uma linguagem de expressões
semelhante a JavaScript), que o λORM executa com `orm.executeScript(script, data, options)`. Dentro dele,
`orm.execute(query, data, options)` executa consultas λORM, e variáveis, condições e laços decidem quais e com quais
dados.

## Para que serve {#what-it-is-for}

Muitos casos de uso envolvem mais de uma consulta: registrar um pedido (o pedido, suas linhas, o saldo do cliente),
movimentar estoque entre depósitos, registrar um pagamento e sua auditoria. Suas escritas devem acontecer **por
completo ou não acontecer**: um pedido sem suas linhas, ou um saldo descontado por um pedido que não foi salvo, é um
estado corrompido.

[`orm.transaction(options, callback)`](Transaction.md) resolve isso em código Node.js. Um script resolve **em uma única
chamada que carrega o caso de uso inteiro**, venha a chamada de onde vier: Node.js (`orm.executeScript`), o
[Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), o cliente Node.js (`@lambdaorm/client`) ou a
[CLI](../cli/Commands/Script.md) (`lambdaorm script`). Um cliente em qualquer linguagem pode executar um caso de uso com
várias leituras e escritas em uma transação, o que não conseguiria fazer enviando uma consulta por requisição.

## Características {#features}

- **Tudo ou nada**: tudo o que o script executa é uma única transação — confirmada quando ele termina, revertida se
  algo falhar (uma consulta, um `throw`, o timeout). Veja [abaixo](#the-main-feature-all-or-nothing).
- **Entre fontes e stages**: as consultas em vários bancos de dados, e em outro stage com
  `orm.execute(query, data, { stage: "insights" })`, fazem parte da mesma transação.
- **Listeners incluídos**: o que os [listeners](../schema/SchemaExample-Listener.md) do esquema escrevem é confirmado
  ou desfeito junto com o script.
- **Uma linguagem, não apenas consultas**: variáveis, `if`, `for`, `while`, `switch`, `try/catch`, `throw`, `return`,
  funções de listas (`filter`, `map`, `sum`, …) e todas as funções do 3xpr e do λORM.
- **Leia o que você escreveu**: uma instrução vê o que as anteriores escreveram, antes do commit.
- **Um resultado**: o valor da última instrução (ou de `return`) — um valor, uma linha, um objeto montado pelo script.
- **Seguro para scripts enviados por clientes**: sem acesso a variáveis de ambiente, trabalha sobre uma cópia de
  `data`, e `timeout` e `maxIterations` o interrompem (inclusive um laço que nunca termina); além disso, o
  [Data Gateway](../data-gateway/index.md) só executa scripts quando sua configuração os habilita (`scripts.enabled`)
  e a credencial tem a permissão `script`.

Uma primeira olhada — os [exemplos](#examples) vão passo a passo, de uma única consulta até um caso de uso completo:

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

## A principal característica: tudo ou nada {#the-main-feature-all-or-nothing}

**Tudo o que um script executa é uma única transação.** Cada `orm.execute` do script — em uma fonte ou em várias, no
stage do script ou em outro, e o que os [listeners](../schema/SchemaExample-Listener.md) escrevem — é executado nas
mesmas conexões:

- quando o script termina, **tudo é confirmado (commit)**;
- se **algo falhar** — uma consulta, uma função, uma regra que faz `throw`, o `timeout` — **tudo o que o script fez é
  revertido (rollback)**, em todas as fontes e stages, e a promise é rejeitada com esse erro.

É para isso que serve um script: um caso de uso com várias leituras e escritas (um pedido com suas linhas, uma
movimentação de estoque, uma transferência) que deve acontecer **por completo ou não acontecer**, em uma única
chamada — também a partir do [Data Gateway](../data-gateway/Rest.md#script) (`POST /script`), do cliente ou da
[CLI](../cli/Commands/Script.md), onde, de outro modo, um cliente só poderia enviar uma consulta por requisição e não
poderia desfazer as anteriores.

| Quando o script… | Resultado |
| --- | --- |
| termina normalmente | commit de tudo; resolve com o último valor (ou `return`) |
| lança um erro (`throw`) | rollback de tudo; rejeita com esse erro |
| executa uma consulta que falha (p. ex., uma chave duplicada) | rollback de tudo; rejeita com o erro do banco de dados |
| captura um erro com `try/catch` | continua; o erro não desfaz nada por si só |
| ultrapassa `timeout` ou `maxIterations` | é interrompido, rollback de tudo; rejeita |

## Argumentos {#arguments}

| Argumento | Descrição                                                                                |
| -------- | ---------------------------------------------------------------------------------------- |
| script   | O script 3xpr                                                                            |
| data     | As variáveis do script. O script trabalha sobre uma cópia: `data` nunca é alterado       |
| options  | As opções da consulta mais os limites do script (`ScriptOptions`), veja abaixo           |

| Opção         | Descrição                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------- |
| stage         | O stage da transação e de cada `orm.execute` sem stage                                              |
| timeout       | Tempo máximo em ms: quando é ultrapassado, os laços param, a transação é revertida e o script rejeita |
| maxIterations | Máximo de iterações de laço do script, somando todos os laços; ao ultrapassá-lo, o script falha e é revertido |

Até @lambdaorm/lib 3.3.0, os limites eram um quarto argumento (`executeScript(script, data, options, { timeout,
maxIterations })`); desde a 3.4.0, tudo vai em `options`.

## Exemplos {#examples}

Cada exemplo diz o que faz e o que acontece quando falha.

### O modelo dos exemplos {#the-model-of-the-examples}

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

Os exemplos são executados no stage `default`; os exemplos 11 e 13 também escrevem em um stage `insights`. Eles usam o
modelo do [lab de mecanismos](https://github.com/lambda-orm/core/tree/main/packages/lib/src/dev/labs/engines), onde os
mesmos scripts são testados em PostgreSQL, MySQL, MariaDB, SQL Server, Oracle e MongoDB.

### 1. Uma única consulta {#1-a-single-query}

O script mais simples é um único `orm.execute`. O script retorna o valor da sua última instrução — aqui, as linhas
da consulta. Até isso é executado em uma transação (ela é aberta, a consulta é executada, é feito o commit).

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.filter(p => p.code == code)", { code: code })
`,
  { code },
  { stage: 'default' }
)
```

### 2. Várias instruções, em ordem {#2-several-statements-in-order}

As instruções são executadas uma após a outra, e cada `orm.execute` é aguardado antes do próximo. Uma instrução vê o
que as anteriores escreveram, antes do commit (elas compartilham a conexão).

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

### 3. Usar o resultado de uma instrução {#3-using-the-result-of-a-statement}

Atribua um resultado a uma variável e use-o em seguida. Um insert responde `{ data }` com os valores escritos,
incluindo os gerados: `customer.data.id` é o id que o banco de dados gerou.

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

**Resultado:** o id gerado para o cliente.

### 4. Linhas afetadas: "não encontrado" como erro {#4-affected-rows-not-found-as-an-error}

`update` e `delete` respondem o número de linhas afetadas. Um script pode transformar 0 em um erro; um `throw` com
um `status` é respondido pelo Data Gateway com esse status HTTP.

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

**Resultado:** rejeita: customer missing not found (404).

### 5. Condições: criar apenas o que falta {#5-conditions-create-only-what-is-missing}

`if` com uma consulta na condição. Execute-o duas vezes com os mesmos dados: na segunda vez, não cria nada.

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

**Resultado:** 2 na primeira vez, 0 na segunda.

### 6. Laços: uma linha por item {#6-loops-one-row-per-item}

`for (item in list)` sobre os dados. Todos os inserts do laço estão na mesma transação: todas as linhas são escritas,
ou nenhuma. As listas também têm `filter`, `map`, `sum`, `count`…

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

### 7. Agregados com include {#7-aggregates-with-include}

Uma relação composta pode ser escrita com `include`, como em `orm.execute` fora de um script. Aqui, o pedido e suas
linhas em uma única sentença, e depois lidos de volta com suas linhas.

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

### 8. Uma regra de negócio: throw, e tudo é desfeito {#8-a-business-rule-throw-and-everything-is-undone}

A regra é verificada depois de escrever: o pedido e suas linhas já estão no banco de dados (dentro da transação).
`throw` interrompe o script e **reverte tudo o que ele escreveu**: não sobra nenhum pedido nem nenhuma linha.

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

**Resultado:** rejeita: the order exceeds 20 (400); o pedido e suas linhas não estão no banco de dados.

### 9. Tratar um erro: try / catch {#9-handling-an-error-try-catch}

Um erro capturado com `try/catch` não aborta o script: ele continua e faz o commit. Use-o para passos opcionais;
qualquer erro não capturado reverte tudo.

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

**Resultado:** "vip customers are reviewed by hand" (e o cliente é escrito).

### 10. Os listeners são executados dentro da transação do script {#10-listeners-run-inside-the-scripts-transaction}

Um listener do esquema (aqui, um que escreve uma linha em `AuditLogs` após cada insert de pedido) é executado na
transação do script: é confirmado com ela e desfeito com ela se o script falhar.

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

**Resultado:** rejeita: cancel; nem o pedido nem sua linha de auditoria estão no banco de dados.

### 11. Outro stage na mesma transação {#11-another-stage-in-the-same-transaction}

`orm.execute(query, data, { stage: "insights" })` é executado em outro stage — outras fontes, até outro mecanismo de
banco de dados — **na mesma transação**: se algo falhar depois, a escrita no outro stage também é desfeita.

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

**Resultado:** rejeita; o pedido (stage default) e a linha de auditoria (stage insights) são ambos desfeitos.

### 12. Limites: timeout e maxIterations {#12-limits-timeout-and-maxiterations}

Opções do script, junto com o stage: `timeout` (ms) o interrompe — inclusive um laço que nunca termina — e faz o
rollback; `maxIterations` limita as iterações de laço do script inteiro. Vale a pena definir ambos quando os scripts
vêm de clientes.

```typescript
const result = await orm.executeScript(`
  orm.execute("Customers.insert()", { code: code, name: "never kept" });
  while (true) { x = 1; }
`,
  { code },
  { stage: 'default', timeout: 2000, maxIterations: 10000 }
)
```

**Resultado:** rejeita (por maxIterations, ou antes pelo timeout); o cliente não é escrito.

### 13. Um caso de uso completo: registrar um pedido {#13-a-complete-use-case-place-an-order}

Tudo junto: validar, escrever um agregado, aplicar uma regra, escrever em outro stage e responder um resumo.
Uma chamada, uma transação — **se qualquer passo falhar, nada do pedido existe em lugar nenhum**.

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

**Resultado:** { orderId, total: 25, balance: 75 } com um saldo de 100; com um saldo de 20, rejeita (409) e o pedido, suas linhas, o saldo e a linha de auditoria ficam como estavam.

### 14. Outro caso de uso: um orçamento com seu total em insights {#14-another-use-case-a-quote-with-its-total-on-insights}

Um orçamento com suas linhas no stage principal e seu total no stage `insights` (outras fontes, possivelmente outro
banco de dados), em uma transação. A conta deve existir; se qualquer passo falhar, não sobra em lugar nenhum nem o
orçamento, nem suas linhas, nem o total. (Um modelo com `Accounts`, `Quotes`, `QuoteLines` e `QuoteTotals`.)

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

## O mesmo script a partir de um cliente {#the-same-script-from-a-client}

O script e seus dados são os mesmos em todos os lugares; só a chamada muda. A URL do Data Gateway inclui a rota do
esquema, a menos que o gateway sirva um único esquema na raiz, como nestes exemplos.

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

## A linguagem {#the-language}

Tudo o que o 3xpr tem:

- Variáveis: `total = 0;`, objetos `{ id: id, name: "x" }`, listas `[1, 2]`, `items[0].name`.
- `if` / `else if` / `else`, `while`, `for (i = 0; i < n; i += 1)`, `for (item in items)`, `switch`/`case`, `break`,
  `continue`, `return`.
- `throw "message"`; `try { … } catch (e) { e.message }`. `throw { status: 404, message: "…" }` faz o Data Gateway
  responder com esse status; no Node, a `message` do erro é esse objeto como JSON.
- Arrow functions como argumentos: `items.filter(p => p.qty > 1).map(p => p.name)`, `items.sum(p => p.qty)`,
  `items.each(p => …)`.
- As funções do 3xpr: strings (`upper`, `concat`, …), números, datas (`now()`, …), listas, `nvl`, `iif`, … (veja
  [Operadores e funções](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)).
- Não disponível: o operador `? :` (`iif(c, a, b)` avalia os dois lados), `++`/`--` (use `i += 1`) e declarar
  funções.

As instruções são executadas em ordem, e cada `orm.execute` é aguardado antes da instrução seguinte.

Além das funções que o λORM acrescenta:

| Função                                  | Descrição                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `orm.execute(query, data, options)`     | Executa uma consulta na transação do script; `options.stage` pode indicar outro stage (mesma transação) |
| `orm.plan(query, options)`              | O plano de uma consulta (`.sentence`, …)                                      |
| `orm.parameters(query)`                 | Os parâmetros de uma consulta                                                 |
| `orm.metadata(query)`                   | Os metadados de uma consulta                                                  |
| `orm.model(query)`                      | O modelo (campos) que uma consulta retorna                                    |
| `orm.constraints(query)`                | As restrições (constraints) que uma consulta verifica                         |
| `toBase64(value)` / `getBase64(value)`  | `"abc"` → `"YWJj"` e de volta                                                 |
| `encrypt(value, key)` / `decrypt(value, key)` | AES                                                                     |

### Escrever scripts: algumas regras {#writing-scripts-a-few-rules}

- As instruções terminam com `;`; a última (sem `;`) é o resultado. `return value;` encerra o script antes.
- As variáveis não precisam de declaração: `total = 0;`. `data` é copiado: o script nunca altera o objeto de quem o
  chama.
- Conte com `i += 1` (não há `++`); use `iif(condition, a, b)` (não há `? :`).
- O resultado de uma consulta pode ser indexado diretamente: `orm.execute("Customers.filter(p => p.code == code)", { code: code })[0].name`;
  uma lista vazia é `[]` (ambos exigem 3xpr 5.3.1, a partir de @lambdaorm/lib 3.4.1).
- Um script não pode ler variáveis de ambiente (`$VAR`).

## Transação e stages {#transaction-and-stages}

- Uma transação para o script inteiro, inclusive entre fontes e stages: commit no final; rollback e rejeição em
  qualquer erro.
- `orm.execute(query, data)` sem stage é executado no stage de `options`; com `{ stage: "insights" }`, é executado
  nesse stage, na mesma transação (desde @lambdaorm/lib 3.3.0).
- Uma instrução vê o que as anteriores escreveram (mesma conexão), antes do commit.
- Não há commit em duas fases: com vários bancos de dados, o commit é feito fonte por fonte.

## Segurança e limites {#security-and-limits}

- O script **não pode ler variáveis de ambiente** (`$VAR` falha), portanto não pode ler strings de conexão.
- `timeout`: quando é ultrapassado, os laços do script param, a transação é revertida e o script rejeita; o que ele
  ainda executar depois falha sem chegar ao banco de dados.
- `maxIterations`: as iterações de laço do script, somando todos os laços; ao ultrapassá-lo, o script falha e é
  revertido. O Data Gateway usa `scripts.maxIterations` (padrão 100000).
- Desde @lambdaorm/lib 3.3.0 (3xpr 5.3.0), um `while (true) {}` não bloqueia mais o processo: o timeout e
  `maxIterations` o interrompem. No Data Gateway, os scripts vêm desabilitados por padrão (`scripts.enabled`) e exigem a
  permissão `script`.
