# Drop {#drop}

Remove todos os objetos de banco de dados de um stage, mas não o próprio banco de dados. Com `-o`, imprime as instruções em vez de executá-las.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage (padrão: o primeiro stage do esquema). |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| output | `-o` | Gera as instruções, mas não as aplica. |
| force | `-f` | Se uma instrução falhar, continua com as instruções seguintes. |
| url | `-u` | URL do esquema em um [Data Gateway](../../data-gateway/index.md), para executar o comando nele. |

## Exemplo {#example}

```sh
lambdaorm drop -w lab/countries -e lab/countries/.env
```
