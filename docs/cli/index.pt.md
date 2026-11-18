# λORM CLI {#orm-cli}

A λORM CLI ([`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli)) é uma aplicação de linha de comando para
usar o [λORM](https://www.npmjs.com/package/@lambdaorm/lib): cria projetos, sincroniza os bancos de dados com o esquema,
importa e exporta dados e executa consultas e scripts. Seus comandos são executados localmente com um workspace (`-w`),
e a maioria deles também pode ser executada em um [Data Gateway](../data-gateway/index.md) (`-u <url>`).

## Instalação {#installation}

Instale o pacote globalmente; ele adiciona o comando `lambdaorm`:

```sh
npm i -g @lambdaorm/cli
lambdaorm --version
```

Requer Node.js 20 ou posterior. A imagem Docker do Data Gateway
([flaviorita/data-gateway](https://hub.docker.com/r/flaviorita/data-gateway)) já inclui a CLI.

!!! note "Nota"
    O pacote sem escopo `lambdaorm-cli` é o antigo e não é mais mantido.

## Comandos {#commands}

| Comando | Descrição |
| :-- | :-- |
| [version](Version.md) | Imprime a versão da CLI e a versão de `@lambdaorm/lib` que o projeto usa. |
| [init](Commands/Init.md) | Gera a estrutura de um projeto λORM. |
| [build](Commands/Build.md) | Gera o modelo e os repositórios para a linguagem. |
| schema | Retorna informações sobre o esquema. |
| [push](Commands/Push.md) | Sincroniza os bancos de dados com o modelo (`-o` escreve os scripts em vez disso). |
| [pull](../schema/SchemaSynchronization-Pull.md) | Atualiza o esquema com a estrutura dos bancos de dados de um stage. |
| [fetch](Commands/Fetch.md) | Mostra as diferenças entre os bancos de dados e o modelo; termina com código 1 quando há alguma. |
| [introspect](../schema/SchemaSynchronization-Introspect.md) | Lê e analisa um arquivo de dados e atualiza o esquema. |
| [incorporate](../schema/SchemaSynchronization-Incorporate.md) | Atualiza o esquema a partir de um arquivo de dados, envia as alterações aos bancos de dados e importa os dados. |
| [drop](Commands/Drop.md) | Remove todos os objetos de banco de dados, mas não o próprio banco de dados. |
| [import](Commands/Import.md) | Importa dados de um arquivo para os bancos de dados. |
| [export](Commands/Export.md) | Exporta dados dos bancos de dados. |
| [execute](Commands/Execute.md) | Executa uma consulta. |
| [script](Commands/Script.md) | Executa um script: várias consultas em uma transação. |
| [plan](Commands/Plan.md) | Retorna o plano de execução de uma consulta. |
| [metadata](Commands/Metadata.md) | Retorna os metadados de uma consulta. |
| [parameters](Commands/Parameters.md) | Retorna os parâmetros de uma consulta. |
| [model](Commands/Model.md) | Retorna o modelo do resultado de uma consulta. |
| [constraints](Commands/Constraints.md) | Retorna as restrições (constraints) de uma consulta. |

`lambdaorm <command> -h` lista as opções de um comando; `lambdaorm -h` lista os comandos.

O comando `sync` não existe mais: foi substituído por [push](Commands/Push.md).

## Opções comuns {#common-options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (a pasta com `lambdaORM.yaml`). Padrão: o diretório atual. |
| stage | `-s` | Nome do stage. Padrão: o primeiro stage do esquema. |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente (por exemplo, as strings de conexão). |
| output | `-o` | Formato de saída do resultado: `json`, `beautiful`, `light` ou `yaml`. |
| url | `-u` | URL do esquema em um Data Gateway, para executar o comando nele em vez de localmente. |

A página de cada comando lista as opções que esse comando aceita.

## Código de saída e Data Gateway {#exit-code-and-data-gateway}

Todo comando termina com código 1 quando falha (a partir de @lambdaorm/cli 1.6.3).

Os comandos são executados em um Data Gateway com `-u` e a URL do esquema, por exemplo `http://gateway:8080/iot/v1`.
Quando a variável de ambiente `SERVICE_TOKEN` está definida, ela é enviada como `Authorization: Bearer <token>` (para um
gateway com [autenticação bearer](../data-gateway/Security.md#authentication)). Veja também [Clientes](../data-gateway/Clients.md#cli).

## Mais {#more}

- [Referência do código-fonte](source/README.md)
- [Registro de alterações](CHANGELOG.md)
- [Labs da CLI](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli)
