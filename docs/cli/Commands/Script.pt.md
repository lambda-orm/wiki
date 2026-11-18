# Script {#script}

Executa um [script](../../usage/Script.md): várias consultas em **uma transação**. O script é escrito em
[3xpr](https://www.npmjs.com/package/3xpr), e todas as suas chamadas `orm.execute(query, data, options)` são executadas
na mesma transação, inclusive entre fontes diferentes. A transação é confirmada (commit) quando o script termina e
revertida (rollback) em qualquer erro (uma consulta que falha ou um `throw`). O resultado é o valor da última instrução
(ou de `return`).

É executado localmente com o workspace (`-w`) ou em um [Data Gateway](../../data-gateway/index.md) (`-u`, por meio de
[`POST /script`](../../data-gateway/Rest.md#script)); o gateway deve ter `scripts.enabled` e a credencial deve ter a
permissão `script`.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage (padrão: o primeiro stage do esquema). |
| script | `-x` | Script (instruções 3xpr que chamam `orm.execute(query, data, options)`). |
| file | `-f` | Arquivo com o script (em vez de `-x`). |
| data | `-d` | Variáveis do script: JSON, ou o caminho de um arquivo JSON. |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| output | `-o` | Formato de saída: `json`, `beautiful`, `light` ou `yaml`. |
| url | `-u` | URL do esquema em um Data Gateway (`POST /script`). |

## Exemplos {#examples}

### Em linha {#inline}

```sh
lambdaorm script -w lab/northwind -e lab/northwind/.env -o beautiful \
  -x 'orm.execute("Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", { id: id, freight: freight }); orm.execute("Orders.filter(p => p.id == id)", { id: id })' \
  -d '{"id": 10248, "freight": 40}'
```

### A partir de um arquivo {#from-a-file}

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

`orm.execute(…, { stage: "insights" })` é executado em outro stage e participa da mesma transação (desde `@lambdaorm/lib`
3.3.0).

### Em um Data Gateway {#on-a-data-gateway}

A URL inclui a rota do esquema (aqui `crm`):

```sh
lambdaorm script -u http://localhost:8080/crm -f create-quote.3xpr -d '{"quoteId": 10, "accountId": 1, "lines": []}'
```

## Notas {#notes}

- Linguagem: variáveis, `if` / `else`, `for`, `for … in`, `while`, `switch`, `try` / `catch`, `throw`, `return`; não
  há operador `? :`, nem `++` / `--` (use `i += 1`), nem funções definidas pelo usuário. Veja [Script](../../usage/Script.md#the-language).
- O script trabalha sobre uma cópia dos dados e não pode ler variáveis de ambiente (`$VAR` falha).
- Os erros são impressos como `error: …`, e nada do que o script escreveu é mantido.
- Com `-u`, um Data Gateway com autenticação bearer precisa do token na variável de ambiente `SERVICE_TOKEN` da
  CLI (enviado como `Authorization: Bearer`; desde @lambdaorm/cli 1.6.3).
- O comando termina com código 1 quando o script falha (desde @lambdaorm/cli 1.6.3).
