# Funcionalidades {#features}

Uma visão geral do que o λORM faz hoje, com links para as páginas que descrevem cada funcionalidade.

## Fontes {#sources}

- Bancos de dados: MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB e SQLite (com sql.js, dialeto `SQLjs`).
- [Uma API REST como fonte](schema/HttpSource.md): o dialeto `Http`, com OAuth2 client credentials e headers
  repassados a partir do contexto de quem chama.
- Uma consulta pode envolver várias fontes, mesmo de mecanismos diferentes; os
  [stages](schema/SchemaExample-MultiplesStages.md) decidem onde cada entidade é armazenada.
- [Mecanismos](schema/Engines.md): no que eles diferem (tipos, strings vazias, `upsert`, …).

## Linguagem de consulta {#query-language}

- Uma [linguagem de consulta](queries/Query-Language.md) baseada em expressões lambda de JavaScript, escrita como
  código TypeScript ou como string.
- [Select](queries/Select.md), [insert](queries/Insert.md), [bulk insert](queries/BulkInsert.md),
  [update](queries/Update.md) e [delete](queries/Delete.md).
- [Joins](queries/Join.md) implícitos e [agrupamento](queries/Grouping.md).
- Carregamento antecipado de relações com [include](queries/Include.md), também entre bancos de dados: uma consulta
  por relação, nunca uma por linha.
- [Consultas entre fontes](queries/CrossSource.md): filtrar, projetar, agrupar e ordenar por campos de relações
  armazenadas em outras fontes.
- [Caminhos JSON, vetores e pontos](queries/JsonVectorsPoints.md): `p.meta.address.zip` e `jsonSet`;
  `cosineDistance`, `l2Distance` e `innerProduct` para a busca por similaridade (RAG); `distance` em metros, `within`
  e `inside` (um polígono) para geografia.
- [Operadores e funções](queries/operatorsAndFunctions/OperatorsAndFunctions.md).
- [Metadados de consultas](queries/Metadata.md): os parâmetros, o modelo, as restrições e o plano de execução de uma
  consulta, sem executá-la.

## Escritas {#writes}

- Inserções com seus filhos (`Orders.insert().include(p => p.details)`), [bulk insert](queries/BulkInsert.md),
  `upsert`, `bulkMerge` e `bulkDelete`.
- `update` e `delete` retornam o número de linhas afetadas: 0 significa não encontrado, ou um conflito com o bloqueio
  otimista.
- `update().include()` de uma relação composta salva o agregado inteiro.

## Uso {#usage}

- [Exemplos de uso](usage/Usage.md): uma única fonte, várias fontes, CQRS e o cliente Node.js.
- [Repositórios](usage/Repository.md), gerados por `lambdaorm build` e estendidos com métodos próprios.
- [Transações](usage/Transaction.md) entre fontes e stages.
- [Scripts](usage/Script.md): um caso de uso inteiro (variáveis, condições, laços e várias consultas) em uma única
  transação, também através do Data Gateway.
- [Mudanças dos dados e outbox](usage/DataEvents.md): `orm.onDataChange` após cada commit, e um outbox escrito na mesma
  transação.
- [Consultas tipadas](usage/TypedQueries.md): consultas com nome no esquema e os tipos de seus resultados.

## Esquema {#schema}

- Um [esquema](schema/Schema.md) em YAML ou JSON que desacopla o domínio da infraestrutura.
- [Mapeamentos](schema/SchemaDefinition.md) entre o domínio e os bancos de dados, e
  [herança de entidades](schema/SchemaExample-Extend.md) (`extends`).
- [Variáveis de ambiente](schema/SchemaDefinition-EnvironmentVariables.md) para as conexões e os segredos.
- Índices, chaves únicas, restrições, valores padrão e propriedades calculadas, escritos como
  [expressões](schema/SchemaDefinition-Expressions.md) do [3xpr](https://www.npmjs.com/package/3xpr).
- [Stages](schema/SchemaExample-MultiplesStages.md): várias infraestruturas para o mesmo domínio (desenvolvimento,
  produção, CQRS).
- [Listeners e subscribers](schema/SchemaExample-Listener.md): aguardados (await) e executados na transação da
  sentença que os dispara.

## Controle de acesso {#access-control}

- [Views](schema/Views.md): restringem entidades e propriedades, as mascaram, adicionam calculadas e marcam os dados
  pessoais (PII).
- [Contexto e filtros de linhas](schema/Context.md): quem executa uma consulta e as linhas que cada view vê.
- O [Data Gateway](data-gateway/Security.md): credenciais com permissões e uma auditoria de cada escrita.

## Sincronização e migrações {#synchronization-and-migrations}

- [Sincronização](schema/SchemaSynchronization.md) entre o esquema e os bancos de dados:
  [push](schema/SchemaSynchronization-Push.md), [pull](schema/SchemaSynchronization-Pull.md),
  [fetch](schema/SchemaSynchronization-Fetch.md) (as diferenças, com código de saída 1 para CI),
  [introspect](schema/SchemaSynchronization-Introspect.md) e
  [incorporate](schema/SchemaSynchronization-Incorporate.md).
- [Migrações](schema/SchemaSynchronization-Migrations.md): as mudanças que podem perder dados param o `push` a menos
  que sejam permitidas, cada mudança é escrita com o seu desfazer, e `migrate` volta a uma versão.
- [Seed](schema/SchemaSynchronization-Seed.md): os dados com que um stage começa, inseridos apenas onde faltam.

## Desempenho e operação {#performance-and-operations}

- [Inserção em massa](queries/BulkInsert.md), e includes que leem as chaves de cada nível com `IN`, em lotes
  executados em paralelo.
- Pool de conexões.
- [Observabilidade](schema/Observability.md): logs, métricas e traces com OpenTelemetry.

## Ferramentas e clientes {#tools-and-clients}

- A [CLI](cli/index.md) (`npm i -g @lambdaorm/cli`, comando `lambdaorm`): projetos, geração de código, sincronização,
  importação e exportação, consultas e scripts.
- O [Data Gateway](data-gateway/index.md) (imagem Docker `flaviorita/data-gateway`):
    - [REST](data-gateway/Rest.md), [WebSocket](data-gateway/WebSocket.md) e [MCP](data-gateway/Mcp.md) para agentes
      de IA, com vários esquemas por instância;
    - [credenciais com permissões](data-gateway/Security.md), auditoria de escritas, métricas e health checks.
- A [IDE](ide/index.md) do Data Gateway (Docker ou desktop): conexões, explorador, formulários de entidades, consultas
  com autocompletar, diagramas e administração; seus componentes React são [`@lambdaorm/ui`](ide/Embedding.md).
- [Clientes](data-gateway/Clients.md):
    - o cliente Node.js (`@lambdaorm/client`, REST ou WebSocket), com a interface da biblioteca;
    - outras linguagens: gerar um cliente a partir do documento OpenAPI 3 do Data Gateway.
