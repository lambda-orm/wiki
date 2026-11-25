# Build {#build}

Gera o código-fonte do domínio para a linguagem de desenvolvimento: o modelo (`model.ts`, com as entidades e as
enumerações) e um repositório por entidade (`repository<Entity>.ts`). Veja [Repositórios](../../usage/Repository.md).

Um arquivo de repositório só é gerado se ainda não existir, de modo que o código personalizado adicionado a ele é
mantido; o modelo é regenerado todas as vezes.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto. |
| language | `-l` | Linguagem de desenvolvimento: `node` (padrão, usa `@lambdaorm/lib`) ou `client-node` (usa `@lambdaorm/client`; o domínio é lido do Data Gateway em `infrastructure.service.url` do esquema, conforme escrito por [`init -u`](Init.md)). |
| model | `-m` | Gera o modelo. |
| repositories | `-r` | Gera os repositórios. |
| all | `-a` | Gera o modelo e os repositórios (o padrão quando nenhuma das opções `-m`, `-r`, `-a` é informada). |
| src-path | | Caminho relativo do código-fonte no workspace (`--src-path`). |
| data-path | | Caminho relativo da pasta de dados no workspace (`--data-path`). |
| domain-path | | Caminho relativo do domínio dentro do caminho do código-fonte (`--domain-path`). |
| url | `-u` | URL do esquema em um Data Gateway. |
| view | | Gera o modelo e os repositórios de uma [view](../../schema/Views.md): apenas as suas entidades e propriedades; os seus repositórios a usam. |

Com `application.queries` no schema, o modelo também escreve `queries.ts`: o tipo do resultado de cada consulta e um método tipado que a executa ([Consultas tipadas](../../usage/TypedQueries.md)).

Também prepara o projeto: cria `package.json` e `tsconfig.json` se não existirem, e instala `typescript`, a biblioteca
(`@lambdaorm/lib`, ou `@lambdaorm/client` com `client-node`) e, com `node`, o driver do dialeto de cada fonte
(`mysql2`, `pg`, `tedious`, …) quando faltam. O caminho do código-fonte é por padrão `src` e o do domínio `domain` (ou
os de `infrastructure.paths` do esquema, se definidos). `--view` é só para `node`: com o cliente, o Data Gateway escolhe
a view de quem chama.

## Exemplos {#examples}

```sh
lambdaorm build -w lab/countries
```

Um projeto que usa um Data Gateway (criado com `lambdaorm init -u <url>`):

```sh
lambdaorm build -w lab/client -l client-node
```
