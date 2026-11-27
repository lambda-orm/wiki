# Administração {#administration}

Com sua porta `management`, a gateway e sua [UI](../ide/index.md) deixam de ser somente leitura: os esquemas são **criados, editados e
removidos** a partir delas, como YAML ou elemento por elemento, o que é salvo (consultas, scripts, diagramas) é
compartilhado nos workspaces, e os **comandos da [CLI](../cli/index.md)** rodam pela UI. Tudo fica no volume da
gateway, um workspace por esquema; a gateway percebe o que muda e serve sem reiniciar.

Ative-a onde as pessoas modelam os esquemas (desenvolvimento, um ambiente de modelagem compartilhado). Em produção,
quando os esquemas já vêm prontos no volume, deixe o `management` de fora: os transportes de dados funcionam igual, e
nada pode alterar os esquemas nem a estrutura dos bancos pela gateway.

## Ativação {#turning-it-on}

```yaml
transports:
  management:
    port: 9090               # without a port, no administration (and no IDE)
admin:
  commandTimeoutMs: 600000   # how long a command may take
  maxFileBytes: 2MB          # the largest file that can be written
authorization:
  roles:
    modeler: { permissions: [ read, schemaRead, schemaWrite, schemaAdmin, workbenchWrite, ddl, build ] }
    analyst: { permissions: [ read, workbenchWrite ] }
    admin:   { permissions: [ read, roles, observability, persist, sessionAdmin ] }
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: modeler, value: $MODELER_KEY, roles: [ modeler ] }
    - { name: analyst, value: $ANALYST_KEY, roles: [ analyst ] }
    - { name: ops,     value: $OPS_KEY,     roles: [ admin ] }
```

A administração responde em `/admin` do [transporte `management`](Transports.md#management), com sua autenticação; o
`http` não a tem. Suas permissões **nunca são dadas por padrão**: uma credencial as tem só quando um dos seus [papéis](Security.md#roles) as dá.

| Permissão | Permite |
| --- | --- |
| `schemaRead` | ler o `lambdaORM.yaml` de cada workspace e validá-lo |
| `schemaWrite` | alterá-lo (como YAML ou elemento por elemento), `pull`, `introspect` |
| `schemaAdmin` | criar e remover workspaces; definir as variáveis das conexões |
| `workbenchWrite` | salvar consultas, scripts e diagramas nos workspaces, sem tocar no esquema |
| `ddl` | alterar a estrutura dos bancos de um stage (`push`, `drop`) |
| `build` | gerar o código do domínio em `src/` do workspace |
| `sessionAdmin` | ver todas as [sessões](Transports.md#sessions) de `management` (quem está conectado) e revogá-las |
| `roles` | os [papéis](#roles) do estado, e quem pode entrar (`/admin/access`, `/admin/scopes`) |
| `observability` | (5.0.0) a [observabilidade](#observability) do gateway |
| `persist` | (5.0.0) [onde o estado é guardado](#persist) |

Com `authentication: none` ninguém administra, salvo com `admin.allowAnonymous: true` (só desenvolvimento local).

## Workspaces no volume {#workspaces-in-the-volume}

Cada pasta sob `orm.workspacePath` com um `lambdaORM.yaml` é um esquema, e sua rota é seu caminho (`iot/v1`):

```text
/workspaces/iot/v1/
  lambdaORM.yaml     o esquema
  .env               as variáveis das suas conexões
  workbench/         o que é salvo: pastas, *.query.yaml, *.script.yaml, *.diagram.yaml
  data/              exports
  src/domain/        o código do build (depois da 4.0.0: src/<language>/domain/)
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
| `version` | — (as versões da gateway e do esquema) | `read` |
| `fetch` | — (compara os bancos com o modelo) | `read` |
| `export` | — (baixado, ou salvo em `data/`) | `read` |
| `push` | as sentenças por source, e as que podem perder dados (4.1.0: só rodam com `allowDestructive`) | `ddl` |
| `drop` | as sentenças; o stage é digitado de novo | `ddl` |
| `import` | as linhas de cada entidade | `stageImport` |
| `pull` | o diff do `lambdaORM.yaml` | `schemaWrite` |
| `introspect` | o diff e as linhas dos dados | `schemaWrite` |
| `incorporate` | o diff e as linhas; depois o esquema recarrega, `push` cria suas tabelas e as linhas são importadas | `schemaWrite`, `ddl`, `stageImport` |
| `build` | — (gravado em `src/`, ou baixado como `.zip`) | `build` |
| `migrations` (4.1.0) | — (o [histórico das migrations](../schema/SchemaSynchronization-Migrations.md) do stage) | `read` |
| `migrate` (4.1.0) | o desfazer de cada migration posterior à `version`, e o que dele pode perder dados | `ddl` |
| `seed` (4.1.0) | os arquivos do [seed](../schema/SchemaSynchronization-Seed.md) do stage | `stageImport` |

Um comando que altera os bancos ou o esquema executa **exatamente a prévia que foi mostrada**, uma vez, dentro de 10
minutos, e só enquanto o `lambdaORM.yaml` for o mesmo com que ela foi feita (caso contrário, `409
PreviewRequiredError`); outro comando do mesmo esquema enquanto um está rodando responde `409 BusyError`. Cada job deixa
seu registro em `orm_state/jobs/`; `push`, `drop`, `import`, `migrate` e `seed` são [auditados](Security.md#audit). Um
`push` ou um `migrate` cuja prévia lista alterações que podem perder dados (um tipo mais estreito, um comprimento menor)
só as executa com `"allowDestructive": true`; sem isso o job falha com `DestructiveChangeError`.
`admin.commandTimeoutMs` (10 minutos) limita quanto um pode demorar.

Pela API, um comando é uma prévia e depois um job:

```sh
S="X-Data-Gateway-Session: $TOKEN"
curl -X POST http://data-gateway:9090/admin/workspaces/~/commands/push/preview -H "$S" -H "Content-Type: application/json" -d '{"stage": "default"}'
# {"previewId":"…","stage":"default","sentences":[…],"expiresAt":"…"}
curl -X POST http://data-gateway:9090/admin/workspaces/~/commands/push -H "$S" -H "Content-Type: application/json" -d '{"stage": "default", "previewId": "…"}'
# 202 {"id":"…","command":"push","status":"running",…}
curl http://data-gateway:9090/admin/workspaces/~/jobs/<id> -H "$S"
```

## O que é salvo {#what-is-saved}

Com `workbenchWrite`, as pastas, consultas, scripts e diagramas do explorador são salvos em `workbench/` de cada
workspace, um arquivo por item, e todos com acesso ao esquema os veem (podem ser versionados com git junto ao
esquema). Sem ela, ficam no navegador como antes. Um arquivo escrito à mão também é um item; um que não é YAML válido é
mostrado como tal e nunca é sobrescrito.

## Stages e suas sources {#stages-and-their-sources}

Em um stage, cada source tem uma `condition`, uma expressão que decide quais sentenças vão para ela (a primeira source
cuja condição é verdadeira; uma última sem condição fica com o resto). A IDE a escreve com sugestões e a gateway a
verifica enquanto é digitada (`/admin/expressions/check`): uma condição que não faz parse é um erro do esquema, uma
variável que não é de uma sentença (`entity`, `action`, `category`, `type`, `read`, `write`, `dml`, `ddl`) é um aviso.

## Arquivos e onde cada um estava {#files-and-where-each-one-was}

- Os arquivos de `data/` e `src/` podem ser listados e lidos (`/admin/workspaces/{route}/files`), nunca o `.env`,
  `orm_state/` ou um arquivo oculto.
- Onde a IDE de cada credencial estava (suas abas e seus rascunhos, o que estava expandido) é guardado pela gateway em
  `<orm.workspacePath>/.data-gateway/state.sqlite` (`/admin/session`), de modo que um recarregamento ou outro navegador
  começa ali.

## Desde a 4.1.0 {#since-4-1-0}

Desde o data-gateway 4.1.0: os comandos `migrations`, `migrate` e `seed`, e as alterações que podem perder dados em `push`
(acima); o **histórico de um esquema** (cada alteração feita pela administração, com quem, antes,
depois e o diff, em `logs/changes.jsonl` do workspace e em `GET /admin/workspaces/{route}/history`), o **roteamento de
um stage** (para onde vai cada entidade, `…/stages/{stage}/routing`), e o `build` por linguagem
(`src/<language>/domain/`), com apenas o modelo ou apenas os repositórios, e um código gerado baixado como zip ou
removido.

## Desde a 4.2.0 {#since-4-2-0}

Os eventos do [outbox](Changes.md#retries-and-dead-events) de um schema: `GET /admin/workspaces/{route}/outbox?status=dead`
lista os que falharam vezes demais, com o seu erro (`schemaRead`), e `POST …/outbox/{id}/retry` devolve um para
pendente (`schemaRead` e `ddl`).

## Desde a 4.3.0 {#since-4-3-0}

As [escritas que aguardam uma pessoa](Security.md#approvals): `GET /admin/workspaces/{route}/approvals?status=pending`
as lista, cada uma com quem pediu, sua consulta ou script, seus dados e as sentenças que rodaria; `POST
…/approvals/{id}/approve` a roda como quem pediu, `…/reject { reason }` a descarta. As duas precisam de `approve`, e
nunca por quem pediu.

## Os papéis {#roles}

**Desde data-gateway 4.4.0** (<span id="since-4-4-0"></span>um papel do gateway com seus `schemas` desde a 5.0.0). Os
[papéis](Security.md#roles), com a permissão `roles`: `GET /admin/roles` lista os da configuração (só leitura) e os
guardados no [estado do gateway](Configuration.md#state); `PUT /admin/roles/{name}` `{ config: { permissions, schemas,
views, stages, maxRows, approval, scope }, reason? }` adiciona um papel ou estende um da configuração;
`DELETE /admin/roles/{name}` remove um do estado; `GET /admin/roles/changes` diz quem mudou o quê, quando, antes e
depois.

- Ninguém dá uma permissão que não tem, ninguém tira de si `roles` se é o último, e um papel `locked` na configuração
  não é estendido.
- **Um papel diz seus esquemas** (5.0.0): um `PUT` com `schema` é `400`. Um papel que a 4.4 guardou para um esquema já
  não vale: é listado como ignorado, para removê-lo (`DELETE /admin/roles/{name}?schema=`) e adicioná-lo de novo com
  seus `schemas`. `GET /admin/scopes` diz as views e stages de cada esquema servido, para escolhê-los.
- Uma mudança vale na hora na réplica que a salva, e nas outras dentro de `state.refresh`.

## Quem entra {#access}

**Desde data-gateway 5.0.0.**

- **`GET /admin/me`** (qualquer credencial, sobre si mesma): seu nome, seu contexto e cada um dos seus papéis como vale
  aqui, com suas permissões, esquemas, views e stages (a primeira de cada um, a de quem não escolhe). A página de uma
  conexão do [IDE](../ide/Connections.md) o mostra.
- **`GET /admin/access`** (permissão `roles`): quem pode entrar, como a configuração o diz: as autenticações de cada
  nível (global, transporte, esquema), cada chave, token ou usuário com seu nome, seus papéis e seu contexto, o emissor
  e as claims de um método `jwt`, e todas as permissões que existem. **Nunca um segredo.**

## A observabilidade {#observability}

**Desde data-gateway 5.0.0,** com a permissão `observability`: `GET /admin/observability` dá a
[observabilidade](Configuration.md#observability) vigente e de onde vem; `PUT /admin/observability` `{ config, reason }`
substitui seções inteiras (`exporter`, `traces`, `metrics`, `logs`, `explore`), verificadas como o YAML (o exporter
nunca leva headers: vão em `OTEL_EXPORTER_OTLP_HEADERS`); `DELETE` volta ao YAML.

- É guardada no estado do gateway, sobre o YAML, com quem a mudou e por quê.
- **Aplicada na hora:** o edge reinicia e os workers dos esquemas cujo SDK muda são recarregados blue-green (as
  requisições em curso terminam no antigo), em todas as réplicas.

## Onde o estado é guardado {#persist}

**Desde data-gateway 5.0.0.** `GET /admin/state` (permissão `roles` ou `persist`) diz onde o gateway guarda seu
[estado](Configuration.md#state) (o SQLite do volume, um banco pelo λORM, memória), como é lido, a cada quanto as réplicas
o releem, se pode ser lido agora, e o `lambdaORM.yaml` do seu esquema de sistema; a conexão sem seus segredos. Com a
permissão `persist` é mudado:

- `PUT /admin/persist/connection` `{ dialect, connection, reason }`: outro banco (`SQLite`, `PostgreSQL`, `MySQL`,
  `MariaDB`, `SqlServer`, `Oracle`; a conexão pode nomear variáveis, `$STATE_DB`).
- `PUT /admin/persist/schema` `{ text, reason }`: o `lambdaORM.yaml` do estado editado, do qual só muda o mapping (a
  tabela de cada entidade e suas colunas).
- `DELETE /admin/persist`: voltar a `state` do YAML.
- É guardado em `.data-gateway/persist.yaml` do volume (precisa de `orm.workspacePath`), que substitui `state.source` e
  `state.mapping` do YAML ao iniciar.
- **O estado é copiado com o λORM:** `push` das tabelas no lugar novo, `export` do atual e `import` no novo. Um banco novo
  que já tem estado é recusado (`409`); um SQLite que tinha um é guardado à parte (`.bak-<hora>`); se a cópia falha, nada
  muda. Depois o gateway reinicia seu edge e recarrega os esquemas com a fonte nova; as sessões continuam (foram
  copiadas) e as tabelas antigas não são apagadas.

## Por MCP {#over-mcp}

O servidor MCP de cada esquema adiciona `admin_schema_get`, `admin_schema_validate` e `admin_stage_fetch` para
credenciais com `schemaRead`: um agente lê o esquema, verifica uma alteração e vê se os bancos estão de acordo.
Escrever não é oferecido por MCP: um modelo faria isso sem a prévia nem a confirmação da UI.

## A API {#the-api}

As rotas REST estão na [API REST](Rest.md#administration); um workspace é nomeado pela sua rota em um segmento da URL
(`iot%2Fv1`).
