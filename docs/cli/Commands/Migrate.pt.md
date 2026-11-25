# Migrate {#migrate}

O histórico das migrações de um stage, e voltar a uma versão. Precisa de `infrastructure.migrations`; veja
[Migrações](../../schema/SchemaSynchronization-Migrations.md).

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage. |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| list | | As migrações do stage, a mais nova primeiro. |
| to | | A versão para a qual voltar: o desfazer de cada versão posterior, a mais nova primeiro. |
| allow-destructive | | Aplicar também as mudanças que podem perder dados. |

## Exemplos {#examples}

```sh
lambdaorm migrate -s dev --list
lambdaorm migrate -s dev --to 261125014929
```
