# Fetch {#fetch}

Mostra a divergência entre os bancos de dados de um stage e o modelo: por mapeamento, as entidades que diferem
(ausentes em um dos lados, com colunas, tipos, tamanhos, nulabilidade ou chave primária diferentes), cada uma com suas
`differences`. A lista de entidades fica vazia quando os bancos de dados estão em sincronia com o modelo. Relações e
índices não são comparados.

O comando **termina com código 1 quando há diferenças**, de modo que pode ser usado em CI.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage (padrão: o primeiro stage do esquema). |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| output | `-o` | Formato de saída: `json`, `beautiful`, `light` ou `yaml`. |
| url | `-u` | URL do esquema em um [Data Gateway](../../data-gateway/index.md), para executar o comando nele. |

## Exemplo {#example}

```sh
lambdaorm fetch -w lab/countries -e lab/countries/.env -o beautiful || echo "the database differs from the model"
```

Resultado:

```json
[
  {
    "name": "default",
    "entities": [
      {
        "name": "Countries",
        "mapping": "Countries",
        "differences": ["column phone missing in the database"],
        "properties": [ ... ]
      }
    ]
  }
]
```

Em sincronia:

```json
[
  {
    "name": "default",
    "entities": []
  }
]
```
