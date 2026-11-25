# Administração {#administration}

Pela porta `management`, uma credencial com as permissões de administração edita os esquemas a partir da IDE: o seu
`lambdaORM.yaml` como YAML ou como formulários, as variáveis das suas conexões, os comandos da CLI sobre os seus
stages (push, pull, import…), o código do seu domínio, e novos esquemas. É a forma de modelar um esquema e aplicá-lo
aos bancos de dados sem um terminal nem um deploy. O que o gateway faz com cada alteração está explicado em
[Administração](../data-gateway/Admin.md).

| Permissão | Permite, na IDE |
| --- | --- |
| `schemaRead` | as linhas **config**, **application**, **infrastructure**, **Estado** e **Código-fonte** do explorador; as **Informações** e o **Histórico** de um esquema |
| `schemaWrite` | **Editar** no YAML e nos formulários; **+** novas entidades, enums, sources, mappings, stages; **Editar** e **Remover** de uma entidade |
| `schemaAdmin` | **Novo esquema**, **Remover** um esquema; definir e remover as variáveis do `.env` |
| `ddl` | **push**, **pull**, **drop** |
| `stageImport` | **import**, **incorporate** |
| `build` | **build**, e gerar de novo ou excluir um código de **Código-fonte** |
| `workbenchWrite` | **export → data/** |

Os esquemas são lidos de novo a cada 5 segundos (a cada 60 enquanto chegam os eventos do gateway): um adicionado,
removido ou recarregado aparece sem recarregar a página, e uma versão nova que não iniciou mostra ⚠ com o seu motivo
enquanto a anterior atende. Uma alteração feita por outra pessoa é anunciada com quem a fez e **Atualizar**
([Sessões](Connections.md#sessions)).

## A aba do esquema {#the-schema-tab}

Um clique em um esquema abre **Esquema nome**: uma barra de ferramentas com o **Stage** e os comandos, depois as suas
**Informações**, o seu **Histórico** e os **Últimos comandos**.

Os comandos são ícones; o ponteiro sobre um diz o que ele faz. Um comando que a credencial não pode executar fica
desativado.

| Comando | O que faz | Antes de executar |
| --- | --- | --- |
| **fetch** | compara o modelo com os bancos de dados do stage | executa na hora: `Sem diferenças: os bancos estão de acordo com o modelo` |
| **export** | os dados do stage, para baixar (`northwind-default.json`, **Baixar**) | executa na hora |
| **export → data/** | os dados do stage, para `data/` do workspace | executa na hora |
| **import…** | um arquivo exportado no stage | pede o arquivo, depois mostra as linhas que vai gravar |
| **push…** | aplica o modelo aos bancos de dados (cria e altera tabelas) | mostra as sentenças, por source |
| **pull…** | traz os bancos de dados para o modelo | mostra como o `lambdaORM.yaml` vai mudar |
| **drop…** | remove as tabelas do stage | mostra as sentenças; você digita o nome do stage para confirmar |
| **introspect…** | cria uma entidade a partir de um arquivo de dados | pede o arquivo e a entidade, depois mostra como o `lambdaORM.yaml` vai mudar |
| **incorporate…** | cria uma entidade a partir de um arquivo de dados e importa as suas linhas | pede o arquivo e a entidade, depois mostra a alteração e as linhas |
| **build…** | gera o código do domínio ([abaixo](#source-code)) | a linguagem e o que gera |
| **version** | as versões do λORM no gateway | executa na hora |

Para executar um comando que mostra antes o que vai fazer:

1. Escolha o **Stage**.
2. Clique no comando (e, para import, introspect e incorporate, escolha o arquivo e **Ver o que vai fazer**).
3. Leia a prévia: as sentenças por source, a alteração do `lambdaORM.yaml` (`+3 −0 linhas`) ou as linhas de cada
   entidade. Push e drop têm **continuar se uma sentença falhar (tryAllCan)**; drop pede o nome do stage.
4. **Executar push** (vermelho) executa exatamente isso; **Cancelar** não.

Cada comando roda como um job: o seu estado (**em andamento**, **concluído**, **falhou**) e o seu resultado aparecem
abaixo dele, e **Últimos comandos** os lista com o stage, a credencial e quando (um clique mostra um de novo).

![A prévia do push](images/ide-schema-push.png)

**Informações** tem o **Nome**, a **Descrição** e a **Versão** do esquema (as chaves no topo do seu
`lambdaORM.yaml`), com **Editar** e, com `schemaAdmin`, **Remover** ([abaixo](#new-schema-remove-a-schema)).

## Histórico {#history}

O **Histórico** da aba do esquema (recolhido) lista as suas alterações, as mais novas primeiro: **Quando**, **Quem** (a
credencial e o seu cliente: a IDE, a CLI, o gateway) e **O quê** (`schema set`, `ddl push`…). Um clique em uma
alteração mostra as suas **Alterações** (`+` adicionado, `-` removido, `~` substituído), o elemento **Antes** e
**Depois**, e os arquivos de DDL que um push gravou. **Alterações anteriores** lê mais. Cada entidade tem o seu na sua
aba **Histórico** ([Entidades](Entities.md#history)). O gateway o guarda desde o data-gateway 4.1.0.

![O histórico de um esquema](images/ide-schema-history.png)

## O YAML {#the-yaml}

**config** abre o `lambdaORM.yaml` do esquema em um editor que o verifica enquanto você digita (`3 erros`,
`2 avisos`, `Válido`), com as sugestões do seu esquema. **Editar**, depois **Salvar** (Ctrl+S): `Salvo: a gateway
recarrega o esquema`; **Cancelar** descarta as alterações. Um esquema com erros não é salvo. Os segredos nunca são
mostrados: as conexões estão nas variáveis ([abaixo](#variables)).

Se outra pessoa salvou uma versão nova enquanto você editava, as duas são mostradas lado a lado, **Na gateway** e
**O seu**, com quem a alterou e quando: **Salvar o meu por cima**, ou **Usar o da gateway**.

![O YAML do esquema](images/ide-schema-yaml.png)

## Formulários {#forms}

Cada elemento do esquema tem o seu próprio formulário, na sua própria aba: uma entidade, um enum, uma source, um
mapping, um stage. Ele abre somente leitura, com **Editar** → **Salvar** ou **Cancelar**; **Renomear**; **Remover**
(antes, diz o que o usa: `Customers é usado por: …`). O **+** de **Entidades**, **Enums**, **Sources**, **Mappings** e
**Stages** no explorador abre um novo (`Novo em Entidades`). Salvar altera só esse elemento, e mantém os comentários
do arquivo. Se outra pessoa alterou o elemento enquanto isso, o formulário diz quem e mostra o que ele tem agora.

| Formulário | Campos |
| --- | --- |
| **Entidade** | extends, abstract, view, primaryKey, uniqueKey; depois as abas **Propriedades** (name, type, length, required, autoIncrement, default, enum, expressions), **Relações** (name, type, from, entity, to, target, weak), **Índices** (name, fields) e **Restrições** (message, condition), cada uma com quantos tem |
| **Enum** | os seus valores (name, value) |
| **Source** | dialect (PostgreSQL, MySQL, MariaDB, SqlServer, Oracle, MongoDB, SQLjs), mapping, connection (`${NORTHWIND_DB}`) |
| **Mapping** | extends; o nome de cada entidade no banco de dados |
| **Stage** | as suas sources em ordem, cada uma com uma condição: a primeira cuja condição é verdadeira fica com a sentença; uma última sem condição fica com o resto |

![O formulário de uma entidade](images/ide-schema-entity.png)

As **expressões** de uma propriedade (`readExp`, `writeExp`, `readValue`, `writeValue`) e a **condição** de uma
restrição são editadas sob a sua tabela, cada uma em um editor com as propriedades da entidade e as funções como
sugestões ([Entidades](Entities.md#properties)).

Em um stage, ✎ edita a condição de uma source no seu próprio diálogo: uma expressão (`entity.in(["Products","Orders"])
&& read`) com sugestões (Ctrl+Espaço), verificada pelo gateway enquanto você digita, e as **Variáveis da sentença** para
inserir com um clique; **Aplicar** a mantém. ↑ e ↓ mudam a ordem das sources, × tira uma, **Adicionar source**
adiciona uma.

![Um stage](images/ide-schema-stage.png)

**application** é editado como YAML (as suas tarefas de início e listeners).

## O diagrama de um stage {#the-diagram-of-a-stage}

O ◇ de um stage no explorador abre **Stage nome**: o **Data Gateway** e, abaixo dele, cada source do stage na sua
ordem, com o seu dialeto, o seu mapping e as tabelas que vivem nela (nomeadas pelo seu mapping), e as tabelas cujas
leituras ou escritas ela recebe enquanto vivem em outra source (uma réplica para leitura). Um clique na seta de uma
source mostra a sua condição abaixo, com as cores do editor; uma entidade que nenhuma source recebe é indicada acima do
desenho.

Sua barra: as ferramentas **selecionar** e **mover**, o zoom e **ajustar**, o **outline**, **mostrar** (as tabelas de
cada source, ou só o nome de cada source), o gateway em cima ou à esquerda, e **reorganizar**. As caixas são
arrastadas para onde você quiser (várias selecionadas de uma vez). **Salvar** o guarda, como foi deixado, no
[workbench](Projects.md) (na primeira vez pede um nome, uma descrição e uma pasta; **Salvar como…** faz uma cópia); o
◇ do seu stage então abre o salvo. Precisa do data-gateway 4.1.0 ou posterior.

![O diagrama de um stage](images/ide-stage-diagram.png)

## Variáveis (.env) {#variables}

**infrastructure → Variáveis (.env)**: as variáveis do `.env` do workspace, cada uma **definida** ou **não está no
.env**, e onde é usada. Os seus valores nunca são mostrados. Com `schemaAdmin`, **Valor novo** e **Definir**,
**Remover**, e **Adicionar** uma nova; alterá-las recarrega o esquema. Uma variável também pode vir da configuração ou
do ambiente do gateway.

![Variáveis](images/ide-schema-variables.png)

## Estado {#state}

**Estado → data** lista os arquivos de `data/` do workspace (os exports salvos ali, os dados dos stages): cada um abre
somente leitura, com as cores do seu tipo.

## Código-fonte {#source-code}

**Código-fonte** lista o código gerado a partir do domínio, um nó para cada código em `src/`, nomeado pela sua
linguagem e, para um build do gateway, a sua pasta (`TypeScript · node`, `TypeScript · client-node`); os seus arquivos
abrem somente leitura. Cada nó tem ⤓ **Baixar como .zip**, ↻ **Gerar de novo** e 🗑 **Excluir** (com confirmação: os
seus arquivos se vão, também os repositórios escritos à mão).

**build** (o </> de **Código-fonte**, ou **build…** na aba do esquema) pede:

- a linguagem: `node` (`@lambdaorm/lib`) ou `client-node` (`@lambdaorm/client`);
- **O que gera**: o **modelo** (`-m`, reescrito) e os **repositórios** (`-r`; um que já existe fica), pelo menos um;
- depois **Baixar .zip**, ou **Gravar em src/ do workspace**, que lista os arquivos criados e atualizados.

## Novo esquema, remover um esquema {#new-schema-remove-a-schema}

Com `schemaAdmin`, **Novo esquema** (no cabeçalho de **Esquemas**): a sua **Rota** (`sales/v1`), **Nome** e
**Descrição**, partindo de **um esquema vazio** ou de **uma cópia de** outro: `Esquema sales/v1 criado: inicia em um
momento`. Um gateway cujo esquema está na raiz (`/`) serve só esse.

**Remover** nas **Informações** de um esquema (ou o 🗑 de um esquema que não iniciou) o remove, depois de digitar a sua
rota: o seu workspace vai para `.trash` do volume, nada é apagado, e as suas abas se fecham.
