# Schema {#schema}

Retorna uma parte do esquema do projeto, ou de um esquema servido por um [Data Gateway](../../data-gateway/index.md)
com `-u`: o esquema inteiro, o domínio, uma entidade, um mapeamento, um stage ou as views. Serve para inspecionar o que
o λORM carregou, com as variáveis de ambiente resolvidas e as entidades herdadas completas.

## Opções {#options}

| Opção | Curta | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| path | `-p` | A parte do esquema a retornar (obrigatória); veja abaixo. |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| output | `-o` | Formato de saída: `json`, `beautiful`, `light` ou `yaml`. |
| url | `-u` | URL do esquema em um [Data Gateway](../../data-gateway/index.md), para executar o comando lá. |

| Caminho | Retorna |
| :-- | :-- |
| `schema` | O esquema inteiro. |
| `schema/version` | A versão do esquema. |
| `domain` | O domínio: entidades e enumerações. |
| `entities`, `entities/<nome>` | As entidades, ou uma delas. |
| `enums`, `enums/<nome>` | As enumerações, ou uma delas. |
| `sources/<nome>` | Uma fonte. |
| `mappings`, `mappings/<nome>`, `mappings/<nome>/<entidade>` | Os mapeamentos, um deles, ou o mapeamento de uma entidade. |
| `stages`, `stages/<nome>` | Os stages, ou um deles. |
| `views` | As views. |

Um caminho desconhecido imprime `the path … is not valid` e termina com código 1.

## Exemplos {#examples}

```sh
lambdaorm schema -w lab/northwind -p entities/Orders -o yaml
lambdaorm schema -u http://gateway:8080/northwind -p mappings/default/Customers -o beautiful
```
