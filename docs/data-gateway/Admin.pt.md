# Administração {#administration}

Com sua porta `management`, a gateway e sua [UI](../ide/Guide.md) deixam de ser somente leitura: os esquemas são **criados, editados e
removidos** a partir delas, como YAML ou elemento por elemento, o que é salvo (consultas, scripts, diagramas) é
compartilhado nos workspaces, e os **comandos da [CLI](../cli/index.md)** rodam pela UI. Tudo fica no volume da
gateway, um workspace por esquema; a gateway percebe o que muda e serve sem reiniciar.

## Ativação {#turning-it-on}

```yaml
transports:
  management:
    port: 9090               # sem porta, nenhuma administração (e nenhuma IDE)
admin:
  commandTimeoutMs: 600000   # quanto um comando pode demorar
  maxFileBytes: 2MB          # o maior arquivo que pode ser gravado
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: modeler, value: $MODELER_KEY, permissions: [ read, schemaRead, schemaWrite, schemaAdmin, workbenchWrite, ddl, build ] }
    - { name: analyst, value: $ANALYST_KEY, permissions: [ read, workbenchWrite ] }
```

A administração responde em `/admin` do [transporte `management`](Transports.md#management), com sua autenticação; o
`http` não a tem. Suas permissões **nunca são dadas por padrão**: uma credencial sem lista de permissões tem só as dos dados.

| Permissão | Permite |
| --- | --- |
| `schemaRead` | ler o `lambdaORM.yaml` de cada workspace e validá-lo |
| `schemaWrite` | alterá-lo (como YAML ou elemento por elemento), `pull`, `introspect` |
| `schemaAdmin` | criar e remover workspaces; definir as variáveis das conexões |
| `workbenchWrite` | salvar consultas, scripts e diagramas nos workspaces, sem tocar no esquema |
| `ddl` | alterar a estrutura dos bancos de um stage (`push`, `drop`) |
| `build` | gerar o código do domínio em `src/` do workspace |
| `sessionAdmin` | ver todas as [sessões](Transports.md#sessions) de `management` (quem está conectado) e revogá-las |

Com `authentication: none` ninguém administra, salvo com `admin.allowAnonymous: true` (só desenvolvimento local).

## Workspaces no volume {#workspaces-in-the-volume}

Cada pasta sob `orm.workspacePath` com um `lambdaORM.yaml` é um esquema, e sua rota é seu caminho (`iot/v1`):

```text
/workspaces/iot/v1/
  lambdaORM.yaml     o esquema
  .env               as variáveis das suas conexões
  workbench/         o que é salvo: pastas, *.query.yaml, *.script.yaml, *.diagram.yaml
  data/              exports
  src/domain/        o código do build
  orm_state/         o estado do λORM e o registro de cada comando
```

Enquanto a gateway roda (`orm.watch`, ativo por padrão), ela os vigia:

- uma pasta com um `lambdaORM.yaml` que aparece é um **esquema novo**, servido em todos os transportes;
- um `lambdaORM.yaml` ou `.env` cujo conteúdo mudou **recarrega seu esquema blue-green**: a versão nova inicia ao lado
  da atual, que continua atendendo até a nova estar pronta. Se a nova não inicia (um YAML inválido), **continua a
  última que iniciou**, e o estado do esquema diz por quê (`pending`);
- uma pasta que sai leva seu esquema;
- os outros arquivos (`workbench/`, `data/`) só são notificados ([`workspace.changed`](WebSocket.md#notifications)).

Os eventos do sistema de arquivos são o caminho rápido; uma varredura a cada `orm.watch.intervalMs` (5 s) vê o que
não chega em alguns volumes montados. O que mudou é decidido pelo conteúdo, não pelo evento. Um arquivo também pode ser
editado fora da gateway (um editor, `git pull`): acontece o mesmo.

## Concorrência {#concurrency}

Duas pessoas, ou uma pessoa e um agente, não se sobrescrevem:

- cada leitura devolve a **versão** do que leu e cada escrita diz qual altera; outra versão é um `412` com o que há
  agora, e a UI mostra as duas para escolher;
- um formulário altera **um elemento** (uma entidade, uma propriedade, uma source…): a alteração de outra pessoa em
  outro elemento não colide; no mesmo elemento, o formulário mostra o que ele tem agora;
- as escritas em um workspace vão uma de cada vez (um arquivo de trava, também entre réplicas no mesmo volume) e cada
  arquivo é gravado de forma atômica;
- os comandos rodam um de cada vez por esquema.

## O esquema {#the-schema}

- **Como YAML:** o `lambdaORM.yaml` inteiro em um editor, validado enquanto é digitado (cada erro na sua linha), com o
  autocompletar das chaves de cada lugar e dos valores conhecidos (tipos, dialetos, entidades, enums, mappings), salvo
  com Ctrl+S.
- **Como formulários:** cada seção (entidades, enums, sources, mappings, stages) e cada elemento em um formulário; as
  propriedades, relações, índices e valores em tabelas. **Renomear** renomeia também o que nomeia o elemento (relações,
  chaves, índices, mappings, stages); **Remover** mostra antes quem o usa.
- O que a gateway grava mantém **os comentários, a ordem e o estilo** do arquivo: só é novo o que mudou.
- Um esquema inválido não é gravado: a validação verifica o YAML, a forma, um nome repetido em uma lista, os tipos (um
  que o λORM não conhece é um aviso) e o λORM completando o esquema, sem conectar e sem executar nada dele.

## As conexões {#the-connections}

As variáveis que um esquema nomeia (`connection: ${SHOP_CNX}`) são definidas no `.env` do seu workspace pela UI (ou
pela API), que mostra quais o esquema nomeia, quais o `.env` define e as sources que as usam. **Um valor nunca é
mostrado** depois de definido. Alterá-las recarrega o esquema. Uma variável também pode vir da configuração da gateway
(`orm.schemas[].env`) ou do seu ambiente.

## Os comandos {#the-commands}

Os comandos da [CLI](../cli/index.md) rodam no worker do esquema, com suas conexões, como **jobs** (um de cada vez por
esquema), pelo painel **Comandos** da UI:

| Comando | Antes de executá-lo, a UI mostra | Permissão |
| --- | --- | --- |
| `fetch` | — (compara os bancos com o modelo) | `read` |
| `export` | — (baixado, ou salvo em `data/`) | `read` |
| `push` | as sentenças por source | `ddl` |
| `drop` | as sentenças; o stage é digitado de novo | `ddl` |
| `import` | as linhas de cada entidade | `stageImport` |
| `pull` | o diff do `lambdaORM.yaml` | `schemaWrite` |
| `introspect` | o diff e as linhas dos dados | `schemaWrite` |
| `incorporate` | o diff e as linhas; depois o esquema recarrega, `push` cria suas tabelas e as linhas são importadas | `schemaWrite`, `ddl`, `stageImport` |
| `build` | — (gravado em `src/`, ou baixado como `.zip`) | `build` |

Um comando que altera os bancos ou o esquema executa **exatamente a prévia que foi mostrada**, uma vez, dentro de 10
minutos, e só enquanto o `lambdaORM.yaml` for o mesmo com que ela foi feita. Cada job deixa seu registro em
`orm_state/jobs/`; `push`, `drop` e `import` são [auditados](Security.md#audit).

## O que é salvo {#what-is-saved}

Com `workbenchWrite`, as pastas, consultas, scripts e diagramas do explorador são salvos em `workbench/` de cada
workspace, um arquivo por item, e todos com acesso ao esquema os veem (podem ser versionados com git junto ao
esquema). Sem ela, ficam no navegador como antes. Um arquivo escrito à mão também é um item; um que não é YAML válido é
mostrado como tal e nunca é sobrescrito.

## Por MCP {#over-mcp}

O servidor MCP de cada esquema adiciona `admin_schema_get`, `admin_schema_validate` e `admin_stage_fetch` para
credenciais com `schemaRead`: um agente lê o esquema, verifica uma alteração e vê se os bancos estão de acordo.
Escrever não é oferecido por MCP: um modelo faria isso sem a prévia nem a confirmação da UI.

## A API {#the-api}

As rotas REST estão na [API REST](Rest.md#administration); um workspace é nomeado pela sua rota em um segmento da URL
(`iot%2Fv1`).
