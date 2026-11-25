# Init {#init}

Gera a estrutura de um projeto λORM: a pasta do workspace e o seu arquivo de esquema (`lambdaORM.yaml`), com uma
fonte, um mapeamento e um stage.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: `my-project`). |
| source | `-s` | Nome da fonte de dados. |
| dialect | `-d` | Mecanismo de banco de dados do projeto (`MySQL`, `MariaDB`, `PostgreSQL`, `SqlServer`, `Oracle`, `MongoDB`, `SQLjs`). Padrão: `MySQL`. |
| connection | `-c` | String de conexão do banco de dados. |
| data-path | | Caminho relativo da pasta de dados no workspace (`--data-path`). |
| url | `-u` | URL de um esquema em um Data Gateway: o projeto é criado com o domínio desse esquema, para ser usado com o [cliente Node.js](../../data-gateway/Clients.md). |

Sem `-c`, a fonte recebe uma conexão local para o dialeto (por exemplo `localhost:5432` para PostgreSQL, ou o arquivo
`data.sqlite` para `SQLjs`), que deve ser substituída pela sua, de preferência com uma
[variável de ambiente](../../schema/SchemaDefinition-EnvironmentVariables.md). Se o arquivo do esquema já existir,
`init` o completa em vez de substituí-lo. Também adiciona a pasta de logs do λORM ao `.gitignore`. Depois,
[build](Build.md) gera o código e [push](Push.md) cria as tabelas.

## Exemplo {#example}

```sh
lambdaorm init -w lab/countries -d PostgreSQL
```
