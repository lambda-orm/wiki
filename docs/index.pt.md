# λORM {#orm}

[![npm version](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Escreva uma consulta uma vez. Execute-a em qualquer banco de dados: a partir do seu código, de um terminal, de uma API ou de um agente de IA.**

λORM é uma linguagem de consulta e um ambiente de execução para os seus dados. Você descreve o seu **domínio** uma vez
(entidades, relações, regras) em um esquema e escreve as consultas como **expressões lambda** sobre ele:

```typescript
Orders
  .filter(p => p.customer.country == country && p.orderDate >= since)
  .include(p => [p.customer.map(c => c.name), p.details.include(d => d.product.map(p => p.name))])
```

λORM converte essa consulta em SQL para **MySQL, MariaDB, PostgreSQL, SQL Server, Oracle e SQLite**, ou em um pipeline
de agregação para **MongoDB**, mesmo quando as entidades de uma consulta estão em **bancos de dados diferentes**. E a
mesma consulta é executada a partir de uma biblioteca Node.js, da linha de comando, de uma API REST ou WebSocket, ou de
um agente de IA via MCP.

## Por que λORM {#why-orm}

- **Um domínio, qualquer banco de dados.** As consultas falam de `Orders` e `Customers`, não de tabelas, dialetos ou de
  onde cada entidade está armazenada.
- **Uma consulta sobre vários bancos de dados.** Pedidos no MongoDB, clientes no PostgreSQL, produtos no MySQL: uma
  consulta, um resultado. λORM a divide por fonte e junta os resultados.
- **Stages.** O mesmo domínio em um SQLite no desenvolvimento e distribuído em três mecanismos na produção, ou um lado
  de escrita e um de leitura ([CQRS](https://microservices.io/patterns/data/cqrs.html)), por configuração, não por
  código.
- **Todos os canais.** TypeScript (tipado), um texto, a CLI, REST, WebSocket, MCP: a mesma linguagem em todo lugar.
- **Acesso governado.** O [Data Gateway](data-gateway/index.md) publica os seus esquemas com credenciais, permissões
  (`read`, `write`, …) e uma auditoria de cada alteração, para aplicações, pessoas e agentes de IA.
- **Schema-first, nos dois sentidos.** De um YAML para as tabelas (`push`), dos bancos de dados para o YAML (`pull`),
  ou de um arquivo JSON com dados para um esquema, suas tabelas e linhas (`incorporate`).

Veja as [funcionalidades](Features.md) para uma lista completa.

## A mesma consulta, de qualquer lugar {#the-same-query-from-everywhere}

A expressão `Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])` é a mesma em todos os canais.

### Node.js / TypeScript {#nodejs-typescript}

A biblioteca, [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib). Veja [Uso](usage/Usage.md).

```typescript
import { orm } from '@lambdaorm/lib'

await orm.init('./lambdaORM.yaml')
const products = await orm.execute(
  (minPrice: number) => Products.filter(p => p.price > minPrice).map(p => [p.name, p.price]),
  { minPrice: 50 })
```

### Linha de comando {#command-line}

O comando `lambdaorm`, [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli). Veja [CLI](cli/index.md).

```sh
lambdaorm execute -q "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])" -d '{"minPrice": 50}'
```

### API REST, de qualquer linguagem {#rest-api-from-any-language}

O [Data Gateway](data-gateway/index.md) publica o esquema via HTTP. Veja [API REST](data-gateway/Rest.md).

```sh
curl -X POST http://gateway:8080/northwind/execute -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])", "data": {"minPrice": 50}}'
```

```python
import requests

products = requests.post("http://gateway:8080/northwind/execute", headers={"X-Api-Key": key}, json={
    "query": "Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])",
    "data": {"minPrice": 50},
}).json()
```

### Cliente Node.js {#nodejs-client}

[`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client): a interface da biblioteca, executada em um
Data Gateway via REST ou WebSocket. Veja [Clientes](data-gateway/Clients.md) e [API WebSocket](data-gateway/WebSocket.md).

```typescript
import { orm } from '@lambdaorm/client'

await orm.init('ws://gateway:8083/northwind', { headers: { 'X-Api-Key': key } })
const products = await orm.execute('Products.filter(p => p.price > minPrice).map(p => [p.name, p.price])', { minPrice: 50 })
orm.on('schema.statusChanged', ({ status }) => console.log(status))
```

### Agentes de IA {#ai-agents}

O Data Gateway fala [MCP](data-gateway/Mcp.md): um agente explora o domínio e o consulta com as permissões da sua
credencial, nunca mais.

```sh
claude mcp add --transport http northwind http://gateway:8081/northwind/mcp --header "X-Api-Key: $KEY"
```

> *"Quais produtos custam mais de 50?"*: o agente lê o domínio do esquema a partir das ferramentas e chama
> `orm_execute` com `Products.filter(p => p.price > 50).map(p => [p.name, p.price])`. Com uma credencial `read`, ele
> não pode alterar nada.

### O navegador {#the-browser}

A [IDE](ide/Guide.md) do Data Gateway, construída com [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui):
conecte-se a gateways, percorra os esquemas, leia cada entidade como um formulário, escreva consultas com autocompletar e desenhe diagramas.

![A UI do Data Gateway](data-gateway/images/ui-query.png)

## Uma consulta, três bancos de dados {#one-query-three-databases}

Um stage do [lab northwind](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
guarda o catálogo no MySQL, os clientes no PostgreSQL e os pedidos no MongoDB:

```yaml
stages:
  - name: default
    sources:
      - name: Catalog                                   # MySQL
        condition: entity.in(["Categories","Products"])
      - name: Crm                                       # PostgreSQL
        condition: entity.in(["Address","Customers"])
      - name: Ordering                                  # MongoDB
        condition: entity.in(["Orders","Orders.details"])
```

A aplicação não sabe disso. Ela pede os pedidos de um cliente com o nome do cliente e, para cada linha, o produto e
a sua categoria:

```typescript
Orders
  .filter(p => p.customerId == customerId)
  .include(p => [
    p.customer.map(c => c.name),
    p.details
      .include(d => d.product.include(pr => pr.category.map(c => c.name)).map(pr => pr.name))
      .map(d => [d.quantity, d.unitPrice])
  ])
```

e `orm.plan` mostra o que λORM vai executar (resumido):

```text
Orders            MongoDB     Ordering   aggregate [{ $match: { CustomerID: … } }, { $project: … }]
├─ Customers      PostgreSQL  Crm        SELECT c.CompanyName AS "name", … FROM Customers c WHERE c.CustomerID IN ($1)
└─ Orders.details MongoDB     Ordering   aggregate [{ $unwind: … }, { $match: { OrderID: { $in: … } } }, …]
   └─ Products    MySQL       Catalog    SELECT p.ProductName AS name, … FROM Products p WHERE p.ProductID IN (?)
      └─ Categories MySQL     Catalog    SELECT c1.CategoryName AS name, … FROM Categories c1 WHERE c1.CategoryID IN (?)
```

**Uma consulta por relação, nunca uma por linha:** cada nível lê as chaves do nível acima com um `IN`. Quando são
muitas, as chaves são divididas em blocos (no máximo 999 no Oracle, 7000 nos demais) que são executados em paralelo.
O resultado é uma única árvore JSON, como se tudo estivesse em um só banco de dados. Veja
[include](queries/Include.md).

## Uma consulta, o dialeto de cada mecanismo {#one-query-each-engines-dialect}

```typescript
Products
  .filter(p => p.price > minPrice && p.category.name == category)
  .map(p => ({ name: p.name, price: p.price }))
  .sort(p => desc(p.price))
  .page(1, 10)
```

```sql
-- MySQL
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > ? AND c.CategoryName = ?) ORDER BY p.UnitPrice desc LIMIT 0,10

-- PostgreSQL
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > $1 AND c.CategoryName = $2) ORDER BY p.UnitPrice desc OFFSET 0 LIMIT 10

-- SQL Server
SELECT p.ProductName AS name, p.UnitPrice AS price FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > @minPrice AND c.CategoryName = @category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY

-- Oracle
SELECT p.ProductName AS "name", p.UnitPrice AS "price" FROM Products p INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE (p.UnitPrice > :minPrice AND c.CategoryName = :category) ORDER BY p.UnitPrice desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

O join é implícito (`p.category.name`), os parâmetros são sempre vinculados e os nomes das propriedades são os do
domínio (`price`), não os das colunas (`UnitPrice`): o [mapeamento](schema/SchemaDefinition.md) está no esquema. Veja
os [mecanismos](schema/Engines.md) e a [linguagem de consulta](queries/Query-Language.md).

## Stages: o mesmo código, outra infraestrutura {#stages-the-same-code-another-infrastructure}

```yaml
infrastructure:
  stages:
    - name: dev                  # everything in one database
      sources: [ { name: Local } ]
    - name: prod                 # the same domain, spread over three engines
      sources:
        - { name: Catalog,  condition: 'entity.in(["Categories","Products"])' }
        - { name: Crm,      condition: 'entity.in(["Address","Customers"])' }
        - { name: Ordering, condition: 'entity.in(["Orders","Orders.details"])' }
```

```typescript
await orm.execute(query, data, { stage: 'prod' })
```

Um stage de escrita e um de leitura sobre bancos de dados diferentes é
[CQRS por configuração](schema/SchemaExample-MultiplesStages.md).

## Acesso governado: o Data Gateway {#governed-access-the-data-gateway}

O [Data Gateway](data-gateway/index.md) (Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway))
publica um ou vários esquemas via REST, WebSocket e MCP, com uma UI web, sem escrever um backend:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: agent,   value: $AGENT_KEY,   permissions: [ read ] }
    - { name: backend, value: $BACKEND_KEY, permissions: [ read, write, script ] }
transports:
  http:       { port: 8080 }    # REST, OpenAPI
  mcpHttp:    { port: 8081 }    # agentes de IA
  management: { port: 9090 }    # a IDE (apenas rede interna; omitido em produção)
```

- As mesmas permissões em todos os transportes: um agente com `read` pode consultar, nunca escrever.
- Cada escrita deixa uma linha de auditoria: quem, o quê, quais entidades, quantas linhas.
- Cada esquema no seu próprio worker; métricas do Prometheus, probes de saúde para Kubernetes, limites de taxa e de
  tamanho.

**Experimente em dez minutos:** [Primeiros passos](data-gateway/GettingStarted.md), de uma pasta vazia até a API REST,
a IDE, MCP e WebSocket.

## O ecossistema {#the-ecosystem}

| Projeto | Publicado como | O que é |
| --- | --- | --- |
| [Biblioteca](usage/Usage.md) | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | o ORM: executa as consultas nos bancos de dados |
| [CLI](cli/index.md) | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) | o comando `lambdaorm`: projetos, sincronização, importação / exportação, consultas, scripts |
| [Data Gateway](data-gateway/index.md) | Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | os esquemas via REST, MCP e WebSocket |
| [IDE do Data Gateway](ide/index.md) | Docker [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide) · [desktop: Linux, Windows, macOS](ide/Download.md) | a IDE dos gateways: conexões, explorador, consultas, diagramas, administração |
| [Cliente Node.js](data-gateway/Clients.md) | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | a interface da biblioteca, executada em um Data Gateway |
| [Componentes de UI](ide/Guide.md) | [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui) | componentes React: o editor de consultas, os resultados, o explorador e os diagramas |
| [3xpr](https://www.npmjs.com/package/3xpr) | [`3xpr`](https://www.npmjs.com/package/3xpr) | o mecanismo de expressões sobre o qual as consultas, os scripts e as regras do esquema são construídos |

O código-fonte está em [github.com/lambda-orm/core](https://github.com/lambda-orm/core).

!!! note "Nota"
    Os pacotes sem escopo `lambdaorm`, `lambdaorm-cli` e `lambdaorm-client-node` não são mais mantidos: use os pacotes
    `@lambdaorm/*`.

## Primeiros passos {#get-started}

| Eu quero… | Comece aqui |
| --- | --- |
| consultar os meus bancos de dados a partir de Node.js / TypeScript | [Uso](usage/Usage.md) |
| criar um projeto, sincronizar os bancos de dados, importar dados | [CLI](cli/index.md) |
| dar acesso aos meus dados a aplicações em qualquer linguagem, ou a agentes de IA | [Data Gateway: primeiros passos](data-gateway/GettingStarted.md) |
| aprender a linguagem de consulta | [Linguagem de consulta](queries/Query-Language.md) |
| definir o domínio, as fontes e os stages | [Esquema](schema/Schema.md) |
| ver exemplos completos | [Labs](labs/index.md) |

## Saiba mais {#learn-more}

- **Consultas:** [linguagem de consulta](queries/Query-Language.md) | [select](queries/Select.md) |
  [join](queries/Join.md) | [agrupamento](queries/Grouping.md) | [include](queries/Include.md) |
  [insert](queries/Insert.md) | [bulk insert](queries/BulkInsert.md) | [update](queries/Update.md) |
  [delete](queries/Delete.md) | [metadados](queries/Metadata.md) |
  [operadores e funções](queries/operatorsAndFunctions/OperatorsAndFunctions.md)
- **Esquema:** [esquema](schema/Schema.md) | [definição](schema/SchemaDefinition.md) |
  [expressões](schema/SchemaDefinition-Expressions.md) |
  [variáveis de ambiente](schema/SchemaDefinition-EnvironmentVariables.md) |
  [composição](schema/SchemaDefinition-Composite.md) | [listeners](schema/SchemaExample-Listener.md) |
  [vários stages](schema/SchemaExample-MultiplesStages.md) |
  [várias fontes](schema/SchemaExample-StageMultiplesSources.md) | [mecanismos](schema/Engines.md)
- **Sincronização:** [visão geral](schema/SchemaSynchronization.md) | [push](schema/SchemaSynchronization-Push.md) |
  [pull](schema/SchemaSynchronization-Pull.md) | [fetch](schema/SchemaSynchronization-Fetch.md) |
  [introspect](schema/SchemaSynchronization-Introspect.md) | [incorporate](schema/SchemaSynchronization-Incorporate.md)
- **Uso:** [uso](usage/Usage.md) | [repositório](usage/Repository.md) | [transações](usage/Transaction.md) |
  [scripts](usage/Script.md)

## Comunidade {#community}

Perguntas, ideias e comentários são bem-vindos no [GitHub Discussions](https://github.com/lambda-orm/wiki/discussions)
e no [Discord](https://discord.com/invite/yXT6XBX2); issues e pull requests em
[github.com/lambda-orm/core](https://github.com/lambda-orm/core).
