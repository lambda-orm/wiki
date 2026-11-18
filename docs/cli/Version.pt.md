# Version {#version}

Imprime a versão da CLI em execução e a versão de `@lambdaorm/lib` que o projeto usa.

## Opções {#options}

| Opção | Abreviação | Descrição |
| :-- | :-- | :-- |
| workspace | `-w` | Caminho do projeto (padrão: o diretório atual). |
| language | `-l` | Linguagem de desenvolvimento (padrão: `node`). |

## Exemplo {#example}

```sh
lambdaorm version
```

Resultado (as versões dependem da sua instalação):

```text
lambdaorm cli version: 1.6.10
Local lambdaorm version: 3.5.3
```

Quando o projeto não depende de `@lambdaorm/lib`, a segunda linha é `Local lambdaorm not found.`

Para imprimir apenas a versão da CLI:

```sh
lambdaorm --version   # or lambdaorm -v
```

```text
1.6.10
```
