# Parameters {#parameters}

Retorna os parâmetros de uma expressão de consulta, com seus tipos.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| query | `-q` | Expressão da consulta. |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| output | `-o` | Formato de saída: `json`, `beautiful`, `light` ou `yaml`. |
| url | `-u` | URL do esquema em um [Data Gateway](../../data-gateway/index.md), para executar o comando nele. |

## Exemplo {#example}

```sh
lambdaorm parameters -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Resultado:

```json
[
  {
    "name": "id",
    "type": "integer"
  },
  {
    "name": "details",
    "type": "Orders.details",
    "children": [
      {
        "name": "LambdaOrmParentId",
        "type": "any"
      }
    ]
  }
]
```
