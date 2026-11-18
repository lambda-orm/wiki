# Execute {#execute}

Executa uma expressão de consulta e imprime o seu resultado.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage (padrão: o primeiro stage do esquema). |
| query | `-q` | Expressão da consulta. |
| data | `-d` | Dados (parâmetros) da consulta: JSON, ou o caminho de um arquivo JSON. |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| output | `-o` | Formato de saída: `json`, `beautiful`, `light` ou `yaml`. |
| url | `-u` | URL do esquema em um [Data Gateway](../../data-gateway/index.md), para executar o comando nele. |

## Exemplos {#examples}

### Inserção em massa {#bulk-insert}

Insere os países de um arquivo JSON, com seus estados:

```sh
lambdaorm execute -w lab/countries -e lab/countries/.env -q "Countries.bulkInsert().include(p => p.states)" -d ./lab/countries/countries.json
```

### Consulta {#query}

```sh
lambdaorm execute -e ".env" -o beautiful -q "Products.distinct(p => ({ quantity: p.quantity, category: p.category.name })).sort(p => p.category).page(1,3)"
```

Resultado:

```json
[
  {
    "quantity": "10 boxes x 20 bags",
    "category": "Beverages"
  },
  {
    "quantity": "24 - 12 oz bottles",
    "category": "Beverages"
  },
  {
    "quantity": "12 - 355 ml cans",
    "category": "Beverages"
  }
]
```

### Em um Data Gateway {#on-a-data-gateway}

```sh
lambdaorm execute -u http://gateway:8080/iot/v1 -o beautiful -q "Devices.filter(p => p.status == status)" -d '{"status": "active"}'
```

Com autenticação bearer, defina o token na variável de ambiente `SERVICE_TOKEN` (veja a [CLI](../index.md#exit-code-and-data-gateway)).
