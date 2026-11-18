# Push {#push}

Sincroniza os bancos de dados de um stage com o modelo. Compara o modelo com os **bancos de dados** (o que
[fetch](Fetch.md) lê), não com o arquivo `orm_state`: as tabelas novas são criadas com chaves, chaves estrangeiras e
índices; nas tabelas existentes, as colunas ausentes são adicionadas e as colunas com outro tipo, tamanho ou
nulabilidade são alteradas. **Nunca remove** o que existe apenas no banco de dados (`fetch` informa isso). O
`orm_state` continua sendo escrito como registro.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| stage | `-s` | Nome do stage (padrão: o primeiro stage do esquema). |
| envfile | `-e` | Lê um arquivo de variáveis de ambiente. |
| output | `-o` | Gera as instruções, mas não as aplica. Sem valor, imprime-as por fonte; com uma pasta, escreve um script por fonte que muda, `<stage>.<source>.sql`. |
| force | `-f` | Se uma instrução falhar, continua com as instruções seguintes. |

!!! note "Nota"
    `push` é executado apenas localmente: não tem a opção `-u`.

## Exemplos {#examples}

Aplicar as alterações:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env
```

Escrever os scripts em vez disso (por exemplo, para mantê-los como migrações versionadas):

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -s default -o migrations
```

```text
/home/user/lab/countries/migrations/default.default.sql
```

Imprimir as instruções, por fonte, sem aplicá-las:

```sh
lambdaorm push -w lab/countries -e lab/countries/.env -o
```

```json
[
  {
    "source": "default",
    "sentences": [
      "ALTER TABLE Countries ADD phone VARCHAR(20)"
    ]
  }
]
```

## Renomear uma coluna {#renaming-a-column}

Para renomear uma coluna, defina `previousMapping` no mapeamento da propriedade
(`{ name: icon, mapping: icon_name, previousMapping: icon }`) e remova-o depois que a alteração for aplicada. Renomear
tabelas não é suportado.
