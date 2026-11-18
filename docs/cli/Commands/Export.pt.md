# Export {#export}

Exporta os dados dos bancos de dados de um stage para um arquivo JSON, `<stage>-export.json`, na pasta de destino. O arquivo pode ser carregado com [import](Import.md).

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage (padrão: o primeiro stage do esquema). |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| target | `-t` | Pasta onde o arquivo de exportação é escrito (padrão: o diretório atual). |
| force | `-f` | Se uma instrução falhar, continua com as instruções seguintes. |
| url | `-u` | URL do esquema em um [Data Gateway](../../data-gateway/index.md), para executar o comando nele. |

## Exemplo {#example}

```sh
lambdaorm export -w lab/countries -e lab/countries/.env -t ./lab/countries/data
```
