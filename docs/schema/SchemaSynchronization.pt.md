# Sincronização {#synchronization}

Esta página resume os comandos que mantêm o esquema e os bancos de dados de um stage sincronizados.

A sincronização funciona nas duas direções: do esquema para as fontes (bancos de dados) e das fontes para o arquivo do esquema.
Cada operação está disponível como um comando da CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)) e como um método de `orm.stage` em [@lambdaorm/lib](https://www.npmjs.com/package/@lambdaorm/lib).

| Operação    | Direção                      | Altera o esquema   | Altera os bancos de dados |
|-------------|------------------------------|:------------------:|:---------------------:|
| push        | esquema → bancos de dados    | não                | sim                   |
| pull        | bancos de dados → esquema    | sim                | não                   |
| fetch       | compara os dois              | não                | não                   |
| introspect  | arquivo de dados → esquema → bancos de dados | sim | sim               |
| incorporate | arquivo de dados → esquema → bancos de dados, depois importa os dados | sim | sim |

## Push {#push}

O push atualiza as fontes (bancos de dados) com o esquema, por meio do comando `lambdaorm push`.

O push compara o modelo com os próprios bancos de dados: cria as tabelas que faltam, adiciona e altera colunas, renomeia as colunas declaradas com `previousMapping` e nunca remove o que existe apenas no banco de dados. `lambdaorm push -o <dir>` grava o DDL como um script por fonte (`<stage>.<source>.sql`) sem aplicá-lo.

[Mais informações](SchemaSynchronization-Push.md)

## Pull {#pull}

O pull atualiza o esquema com a estrutura das fontes (bancos de dados), por meio do comando `lambdaorm pull`. O que foi escrito à mão no esquema (relações, listeners, stages) é mantido.

[Mais informações](SchemaSynchronization-Pull.md)

## Fetch {#fetch}

O fetch mostra as diferenças entre as fontes e o esquema, sem aplicar nenhuma alteração, por meio do comando `lambdaorm fetch`. O resultado é vazio quando os bancos de dados estão sincronizados com o modelo, e o comando termina com código 1 quando há diferenças (útil em CI).

[Mais informações](SchemaSynchronization-Fetch.md)

## Introspect {#introspect}

O introspect atualiza o esquema a partir da estrutura de um arquivo de dados JSON e depois envia as alterações para as fontes (bancos de dados), por meio do comando `lambdaorm introspect`.

[Mais informações](SchemaSynchronization-Introspect.md)

## Incorporate {#incorporate}

O incorporate faz o mesmo que o introspect e depois importa os dados do arquivo para as fontes (bancos de dados), por meio do comando `lambdaorm incorporate`.

[Mais informações](SchemaSynchronization-Incorporate.md)
