# Migrações {#migrations}

Esta página explica como o λORM protege os dados quando o esquema muda e como um banco de dados volta a uma versão
anterior: as mudanças que podem perder dados, o script de desfazer de cada push e o histórico que o `lambdaorm migrate`
usa. O [push](SchemaSynchronization-Push.md) compara o modelo com o próprio banco de dados, então não há arquivos de
migração para escrever à mão: essas ferramentas servem para aplicar uma mudança com segurança e para desfazê-la.

## Mudanças que podem perder dados {#changes-that-can-lose-data}

O `push` nunca remove o que existe apenas no banco de dados; o que pode perder dados é alterar uma coluna: um tipo que
não é mais amplo (`decimal` para `integer`, texto para data) ou um texto mais curto (`string(50)` para `string(20)`, um
texto sem comprimento para `string(n)`). O `push` para com um `DestructiveChangeError` que as lista, e só as aplica com
`lambdaorm push --allow-destructive` (`options.allowDestructive` no Node). Tornar um tipo ou um comprimento mais amplo
não é destrutivo.

## Desfazer {#undo}

Ao lado de cada `orm_state/<source>/V<version>__push.sql`, o `push` grava `U<version>__push.sql`, o seu desfazer,
calculado ao mesmo tempo: remove as tabelas e colunas que o push criou, desfaz as renomeações e devolve o tipo, o
comprimento e a nulabilidade que as colunas tinham no banco de dados. O que foi gravado no que ele remove não volta (o
arquivo o avisa).

## O histórico e o migrate {#the-history-and-migrate}

Com `infrastructure.migrations: {}` no esquema, o λORM adiciona a entidade `LambdaOrmMigrations` (versão, stage, fonte,
ação, arquivo, desfazer, status, data e quem), e cada `push` registra nela, por fonte, o que fez e o seu desfazer. Cada
banco de dados conhece a sua própria versão:

```yaml
infrastructure:
  migrations: {}
```

```sh
lambdaorm migrate -s dev --list                  # the versions, the newest first, applied or undone
lambdaorm migrate -s dev --to 261125014929       # goes back: the undo of each later version, the newest first
lambdaorm push -s dev                             # goes forward again
```

| Opção | Descrição |
|--------|-------------|
| `-w`, `--workspace` | Pasta do projeto (padrão: a pasta atual). |
| `-s`, `--stage` | Nome do stage (padrão: o primeiro stage). |
| `-e`, `--envfile` | Arquivo de variáveis de ambiente a ser lido. |
| `--list` | As migrações do stage, as mais recentes primeiro. |
| `--to` | A versão para a qual voltar, como `--list` a mostra. |
| `--allow-destructive` | Aplica também um desfazer que pode perder dados (reduzir o que o push ampliou). |

O `migrate` executa o desfazer guardado no histórico, então não precisa da pasta `orm_state` daquele ambiente e também
funciona no MongoDB; as versões que ele desfaz são marcadas como `undone`. Sem `infrastructure.migrations`, o `migrate`
o informa; o `push` continua gravando os arquivos `V` e `U` e interrompendo as mudanças destrutivas.

No Node, `orm.stage.migrate(version, { stage })` volta a uma versão, e `orm.stage.migrations` lê o histórico.
Veja também o [comando migrate](../cli/Commands/Migrate.md).
