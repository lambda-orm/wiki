# Seed {#seed}

Insere os dados com que um stage começa (`stages[].seed`): de cada arquivo, as linhas cuja chave ainda não está no banco
de dados. Veja [Seed](../../schema/SchemaSynchronization-Seed.md).

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage. |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |

## Exemplo {#example}

```sh
lambdaorm seed -s dev
```

```text
data/seed/base.json: Categories +2
data/seed/dev.json: Products +0 (2 already there)
```
