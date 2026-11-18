# λORM {#orm}

[![versão no npm](https://img.shields.io/npm/v/@lambdaorm/lib.svg)](https://www.npmjs.com/package/@lambdaorm/lib)
[![linguagem typescript](https://img.shields.io/badge/language-typescript-blue)](https://www.npmjs.com/package/@lambdaorm/lib)
[![Licença: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Participe da comunidade no GitHub Discussions](https://img.shields.io/badge/Join%20the%20community-on%20GitHub%20Discussions-blue.svg)](https://github.com/lambda-orm/wiki/discussions)
[![Slack](https://img.shields.io/badge/chat-on%20slack-orange)](https://join.slack.com/t/nuevoespaciod-xo58767/shared_invite/zt-29ix7pc2r-Wd_ZBWnWRDv_5DM4NPtVhQ)
[![Gitter](https://badges.gitter.im/lambdaorm/community.svg)](https://app.gitter.im/#/room/#lambdaorm-how-to-contribute:gitter.im)
[![Discord](https://img.shields.io/badge/chat-on%20discord-orange)](https://discord.com/invite/yXT6XBX2)

O λORM (LambdaORM) é um ORM em TypeScript que executa **consultas distribuídas** entre diferentes mecanismos de banco de dados: MySQL,
MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB e SQLite.

As consultas são escritas como **expressões lambda** sobre um **modelo de domínio** independente da infraestrutura. Uma
única consulta pode ler ou gravar entidades armazenadas em bancos de dados diferentes — por exemplo, algumas em MySQL, outras em
PostgreSQL e outras em MongoDB — e o λORM a divide em uma sentença por fonte e une os resultados.

O mesmo domínio pode ter vários **stages** (cenários de infraestrutura). Em um stage os dados podem estar distribuídos entre SQL
Server, MongoDB e Oracle; em outro, tudo pode estar em um único banco de dados PostgreSQL. Isso permite
implementar padrões como [CQRS](https://microservices.io/patterns/data/cqrs.html) por meio de configuração, sem
alterar o código.

Veja as [funcionalidades](Features.md) para uma lista completa.

## Como usar {#how-to-use-it}

| Forma | Pacote | Quando usar |
| --- | --- | --- |
| Biblioteca Node.js | [`@lambdaorm/lib`](https://www.npmjs.com/package/@lambdaorm/lib) | Executar consultas a partir de uma aplicação Node.js / TypeScript. Veja [Uso](usage/Usage.md). |
| Linha de comando | [`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli) (comando `lambdaorm`) | Criar um projeto, sincronizar os bancos de dados, importar e exportar dados e executar consultas em um terminal ou em CI. Veja [CLI](cli/index.md). |
| Data Gateway | Imagem Docker [`flaviorita/data-gateway`](https://hub.docker.com/r/flaviorita/data-gateway) | Expor esquemas do λORM pela rede: uma API REST, MCP para agentes de IA, uma API WebSocket e uma UI web. Veja [Data Gateway](data-gateway/index.md). |
| Cliente Node.js | [`@lambdaorm/client`](https://www.npmjs.com/package/@lambdaorm/client) | Executar as mesmas consultas a partir do Node.js em um Data Gateway. Veja [Clientes](data-gateway/Clients.md). |

```sh
npm install @lambdaorm/lib      # the library
npm install -g @lambdaorm/cli   # the lambdaorm command
```

!!! note "Nota"
    Os pacotes sem escopo `lambdaorm`, `lambdaorm-cli` e `lambdaorm-client-node` não são mais mantidos: use os
    pacotes `@lambdaorm/*`.

## Linguagem de consulta {#query-language}

A consulta a seguir retorna o maior preço de cada categoria de produto, considerando apenas os produtos que atendem ao
filtro e as categorias cujo maior preço é superior a 50:

```typescript
import { orm } from '@lambdaorm/lib'
import { Products } from './northwind/domain/model'

const query = (country: string) => Products
  .filter(p => (p.price > 5 && p.supplier.country == country) || (p.inStock < 3))
  .having(p => max(p.price) > 50)
  .map(p => ({ category: p.category.name, largestPrice: max(p.price) }))
  .sort(p => desc(p.largestPrice))

await orm.init('./lambdaORM.yaml')
// run the query, passing the value of the country parameter
const result = await orm.execute(query, { country: 'ARG' })
await orm.end()
```

Nesta consulta:

- `filter` mantém os produtos cujo preço é maior que 5 e cujo fornecedor está no país informado, assim como
  aqueles com menos de 3 unidades em estoque.
- `map` retorna o nome da categoria e o maior preço. O agrupamento é implícito: os produtos são agrupados por categoria
  porque `max` é uma função de agregação.
- `having` mantém apenas as categorias cujo maior preço é maior que 50.
- `sort` ordena o resultado pelo maior preço, em ordem decrescente.
- `supplier` e `category` são relações: os joins são implícitos.

**Veja também:** [linguagem de consulta](queries/Query-Language.md) |
[select](queries/Select.md) |
[join](queries/Join.md) |
[agrupamento](queries/Grouping.md) |
[include](queries/Include.md) |
[insert](queries/Insert.md) |
[bulk insert](queries/BulkInsert.md) |
[update](queries/Update.md) |
[delete](queries/Delete.md) |
[metadados](queries/Metadata.md) |
[repositório](usage/Repository.md) |
[uso](usage/Usage.md)

### Include {#include}

`include` retorna uma entidade junto com suas relações na mesma consulta, mesmo quando estão armazenadas em bancos de dados
diferentes. Neste exemplo a consulta é escrita como string, uma alternativa à expressão lambda:

```typescript
import { orm } from '@lambdaorm/lib'

(async () => {
  try {
    await orm.init('./config/northwind.yaml')
    const query = `Orders
      .filter(p => p.id === id)
      .include(p => [
        p.customer.map(p => p.name),
        p.details
          .include(p => p.product
            .include(p => p.category.map(p => p.name))
            .map(p => p.name))
          .map(p => [p.quantity, p.unitPrice])
      ])`
    const result = await orm.execute(query, { id: 102 }, { stage: 'PostgreSQL' })
    console.log(JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error(error.message)
  } finally {
    await orm.end()
  }
})()
```

**Resultado:**

```json
[
  {
    "id": 102,
    "customerId": "SPLIR",
    "employeeId": 7,
    "orderDate": "1996-11-07T23:00:00.000Z",
    "requiredDate": "1996-12-05T23:00:00.000Z",
    "shippedDate": "1996-11-14T23:00:00.000Z",
    "shipViaId": 1,
    "freight": 8.63,
    "name": "Split Rail Beer & Ale",
    "address": "P.O. Box 555",
    "city": "Lander",
    "region": "WY",
    "postalCode": "82520",
    "country": "USA",
    "customer": {
      "name": "Split Rail Beer & Ale"
    },
    "details": [
      {
        "quantity": 24,
        "unitPrice": 5.9,
        "product": {
          "name": "Tourtire",
          "category": {
            "name": "Meat/Poultry"
          }
        }
      }
    ]
  }
]
```

**Mais informações:** [include](queries/Include.md)

## Esquema {#schema}

O esquema define entidades, enumerações, índices, chaves únicas, valores padrão, restrições, mapeamentos, fontes,
stages, listeners e muito mais. Ele é escrito em YAML ou JSON. Condições e ações usam a mesma
[linguagem de expressões](https://www.npmjs.com/package/3xpr) das consultas.

**Veja também:** [esquema](schema/Schema.md) |
[definição](schema/SchemaDefinition.md) |
[uso](schema/Schema-Use.md) |
[expressões](schema/SchemaDefinition-Expressions.md) |
[variáveis de ambiente](schema/SchemaDefinition-EnvironmentVariables.md) |
[composição](schema/SchemaDefinition-Composite.md) |
[listeners](schema/SchemaExample-Listener.md) |
[múltiplos stages](schema/SchemaExample-MultiplesStages.md) |
[múltiplas fontes](schema/SchemaExample-StageMultiplesSources.md) |
[mecanismos de banco de dados](schema/Engines.md)

### Sincronização {#synchronization}

O λORM mantém os bancos de dados e o esquema em sincronia, nas duas direções:
[sincronização](schema/SchemaSynchronization.md) |
[push](schema/SchemaSynchronization-Push.md) |
[pull](schema/SchemaSynchronization-Pull.md) |
[fetch](schema/SchemaSynchronization-Fetch.md) |
[introspect](schema/SchemaSynchronization-Introspect.md) |
[incorporate](schema/SchemaSynchronization-Incorporate.md)

## Transações e scripts {#transactions-and-scripts}

- [Transações](usage/Transaction.md): `orm.transaction` executa várias consultas em uma só transação, inclusive entre fontes
  e stages.
- [Scripts](usage/Script.md): um caso de uso inteiro (variáveis, condições, laços e várias consultas) em uma só transação
  e em uma única chamada — a partir do Node.js, da CLI ou do Data Gateway.

## Labs {#labs}

Exemplos completos estão disponíveis nos [labs do λORM](labs/index.md).

## Projetos relacionados {#related-projects}

- [CLI do λORM](https://www.npmjs.com/package/@lambdaorm/cli): interface de linha de comando do λORM.
- [Data Gateway](data-gateway/index.md): esquemas do λORM por REST, MCP e WebSocket, com uma UI web.
- [Cliente do λORM](https://www.npmjs.com/package/@lambdaorm/client): cliente Node.js para o Data Gateway.
- [3xpr](https://www.npmjs.com/package/3xpr): mecanismo de expressões extensível que avalia expressões matemáticas e lógicas;
  as consultas e os scripts do λORM são construídos sobre ele.
