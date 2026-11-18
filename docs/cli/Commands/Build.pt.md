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

## Exemplo {#example}

```sh
lambdaorm build -w lab/countries
```
