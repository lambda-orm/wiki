# Funcionalidades {#features}

Uma visão geral do que o λORM oferece, com links para as páginas que descrevem cada funcionalidade.

## Mecanismos de banco de dados {#database-engines}

- MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB e SQLite (SQLjs).
- Uma única consulta pode envolver vários bancos de dados, inclusive de mecanismos diferentes.
- [Mecanismos de banco de dados](schema/Engines.md): as diferenças entre os mecanismos (tipos, strings vazias, `upsert`, …).

## Linguagem de consulta {#query-language}

- [Linguagem de consulta](queries/Query-Language.md) baseada em expressões lambda de JavaScript.
- As consultas podem ser escritas como código JavaScript/TypeScript ou como string.
- Cláusulas [select](queries/Select.md), [insert](queries/Insert.md), [bulk insert](queries/BulkInsert.md),
  [update](queries/Update.md) e [delete](queries/Delete.md).
- [Joins](queries/Join.md) e [agrupamentos](queries/Grouping.md) implícitos.
- Carregamento antecipado (eager loading) de relações com [include](queries/Include.md), inclusive entre bancos de dados.
- [Consultas entre fontes](queries/CrossSource.md): map, agrupamento e ordenação com campos de vários bancos de dados.
- [Caminhos JSON, vetores e pontos](queries/JsonVectorsPoints.md): `p.meta.address.zip`, `cosineDistance` (RAG),
  `distance` em metros.
- [Operadores e funções](queries/operatorsAndFunctions/OperatorsAndFunctions.md).
- [Metadados da consulta](queries/Metadata.md): os parâmetros, o modelo, as restrições e o plano de execução de uma consulta.

## Uso {#usage}

- [Repositórios e repositórios personalizados](usage/Repository.md).
- [Transações e transações distribuídas](usage/Transaction.md), entre fontes e stages.
- [Scripts](usage/Script.md): um caso de uso inteiro (variáveis, condições, laços e várias consultas) em uma só transação,
  também pelo Data Gateway.
- [Exemplos de uso](usage/Usage.md): uma única fonte, várias fontes, CQRS e o cliente Node.js.
- [Mudanças dos dados e outbox](usage/DataEvents.md): `orm.onDataChange` depois de cada commit, e um outbox escrito
  na mesma transação.
- [Consultas tipadas](usage/TypedQueries.md): consultas com nome no schema e os tipos dos seus resultados.

## Esquema {#schema}

- Configuração do [esquema](schema/Schema.md) que desacopla o modelo de domínio da infraestrutura.
- Configuração em JSON ou YAML.
- [Mapeamentos](schema/SchemaDefinition.md) entre o domínio e a infraestrutura.
- [Herança de entidades](schema/SchemaExample-Extend.md) (`extends`).
- [Variáveis de ambiente](schema/SchemaDefinition-EnvironmentVariables.md).
- Índices, chaves únicas e restrições.
- Condições e ações baseadas no mecanismo de expressões [3xpr](https://www.npmjs.com/package/3xpr)
  ([expressões](schema/SchemaDefinition-Expressions.md)).
- [Stages](schema/SchemaExample-MultiplesStages.md): vários cenários de infraestrutura para o mesmo domínio.
- [Sincronização](schema/SchemaSynchronization.md) entre o esquema e os bancos de dados:
  [push](schema/SchemaSynchronization-Push.md), [pull](schema/SchemaSynchronization-Pull.md),
  [fetch](schema/SchemaSynchronization-Fetch.md), [introspect](schema/SchemaSynchronization-Introspect.md) e
  [incorporate](schema/SchemaSynchronization-Incorporate.md).
- [Listeners e subscribers](schema/SchemaExample-Listener.md): aguardados e executados na transação da sentença
  que os dispara.
- [Views](schema/Views.md): restringem entidades e propriedades, as mascaram, adicionam calculadas, dados pessoais (PII).
- [Contexto e filtros de linhas](schema/Context.md): quem executa uma consulta e as linhas que uma view vê.
- [Observabilidade](schema/Observability.md): logs, métricas e traces com OpenTelemetry.
- [Uma API REST como fonte](schema/HttpSource.md): o dialeto `Http`.
- [Migrações](schema/SchemaSynchronization-Migrations.md) (mudanças que podem perder dados, desfazer, `migrate`) e
  [seed](schema/SchemaSynchronization-Seed.md).

## Desempenho {#performance}

- [Bulk insert](queries/BulkInsert.md).
- Consultas de alto desempenho.
- Pool de conexões.

## Ferramentas e clientes {#tools-and-clients}

- Suporte a TypeScript e JavaScript.
- [CLI](cli/index.md) (`npm i -g @lambdaorm/cli`, comando `lambdaorm`).
- [Data Gateway](data-gateway/index.md) (imagem Docker `flaviorita/data-gateway`):
    - uma API REST, MCP para agentes de IA e uma API WebSocket, com vários esquemas por instância;
    - credenciais com permissões, auditoria das escritas, métricas e health checks;
    - uma UI web: explorador, formulários de entidades, consultas salvas e diagramas do domínio.
- [Clientes](data-gateway/Clients.md):
    - [cliente Node.js](https://www.npmjs.com/package/@lambdaorm/client) (`@lambdaorm/client`, REST ou WebSocket);
    - outras linguagens: gere um cliente a partir do documento OpenAPI 3 do Data Gateway.
