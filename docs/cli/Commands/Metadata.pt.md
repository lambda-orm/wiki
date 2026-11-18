# Metadata {#metadata}

Retorna os metadados de uma expressão de consulta: a sua estrutura analisada.

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
lambdaorm metadata -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Resultado:

```json
{
  "classtype": "Sentence",
  "pos": {
    "ln": 0,
    "col": 35
  },
  "name": "select",
  "children": [
    {
      "classtype": "Sentence",
      "pos": {
        "ln": 0,
        "col": 38
      },
      "name": "select",
      "children": [],
      "type": "any",
      "entity": "Orders.details",
      "columns": [
        {
          "name": "orderId",
          "type": "integer"
        },
        {
          "name": "productId",
          "type": "integer"
        },
        {
          "name": "unitPrice",
          "type": "decimal"
        },
        {
          "name": "quantity",
          "type": "decimal"
        },
        {
          "name": "discount",
          "type": "decimal"
        },
        {
          "name": "LambdaOrmParentId",
          "type": "integer"
        }
      ],
      "parameters": [
        {
          "name": "LambdaOrmParentId",
          "type": "[integer]"
        }
      ],
      "constraints": [],
      "values": [],
      "defaults": [],
      "clause": "select",
      "alias": "o1"
    }
  ],
  "type": "any",
  "entity": "Orders",
  "columns": [
    {
      "name": "id",
      "type": "integer"
    },
    {
      "name": "customerId",
      "type": "string"
    },
    {
      "name": "employeeId",
      "type": "integer"
    },
    {
      "name": "orderDate",
      "type": "dateTime"
    },
    {
      "name": "requiredDate",
      "type": "date"
    },
    {
      "name": "shippedDate",
      "type": "date"
    },
    {
      "name": "shipViaId",
      "type": "integer"
    },
    {
      "name": "freight",
      "type": "decimal"
    },
    {
      "name": "name",
      "type": "string"
    },
    {
      "name": "address",
      "type": "string"
    },
    {
      "name": "city",
      "type": "string"
    },
    {
      "name": "region",
      "type": "string"
    },
    {
      "name": "postalCode",
      "type": "string"
    },
    {
      "name": "country",
      "type": "string"
    },
    {
      "name": "__id",
      "type": "integer"
    }
  ],
  "parameters": [
    {
      "name": "id",
      "type": "integer"
    }
  ],
  "constraints": [],
  "values": [],
  "defaults": [],
  "clause": "select",
  "alias": "o"
}
```
