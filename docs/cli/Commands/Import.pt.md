# Import {#import}

Importa dados de um arquivo para os bancos de dados de um stage. O arquivo tem o formato escrito por [export](Export.md).

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage (padrão: o primeiro stage do esquema). |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| data | `-d` | Dados a importar: o caminho de um arquivo JSON, ou JSON. |
| url | `-u` | URL do esquema em um [Data Gateway](../../data-gateway/index.md), para executar o comando nele. |

## Exemplo {#example}

```sh
lambdaorm import -w lab/countries -e lab/countries/.env -d ./lab/countries/data/default-export.json
```
