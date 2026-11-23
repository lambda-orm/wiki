# Explorador {#explorer}

À esquerda, as conexões e os esquemas de cada uma: seus metadados, seu domínio e o que está salvo neles. Tudo abre em
uma aba à direita.

## Sua árvore {#its-tree}

```text
Conexões                             + Nova conexão
└─ northwind  http://localhost:9090  ✎ Editar a conexão · 🗑 Remover
   Esquemas                          Novo esquema · Exportar · Importar
   └─ northwind                      sua aba: comandos e informações
      ├─ Metadados
      │  ├─ config                   o lambdaORM.yaml                   (schemaRead)
      │  ├─ domain                   o domínio como YAML, somente leitura
      │  │  ├─ Entidades             filtro · cada entidade: Propriedades, Relações
      │  │  └─ Enums
      │  ├─ application              suas tarefas de início e listeners  (schemaRead)
      │  ├─ infrastructure           Mappings · Sources · Stages · Variáveis (.env)  (schemaRead)
      │  ├─ data                     os arquivos de data/                (schemaRead)
      │  └─ src                      os arquivos do modelo               (schemaRead)
      └─ projetos                    pastas, consultas e diagramas
```

![O explorador, com Orders aberta](images/ide-entity-properties.png)

O que precisa de uma permissão não aparece sem ela: só com `read`, um esquema tem o seu **domain** e os seus
**projetos**.

| Linha | Um clique | Seus botões |
| --- | --- | --- |
| um esquema | o expande e abre a sua aba ([Administração](Administration.md#the-schema-tab)) | 🗑 removê-lo (`schemaAdmin`) |
| **domain** | o expande; um duplo clique abre o domínio como YAML (só o domínio: nunca as sources, as conexões ou o resto da configuração) | |
| uma entidade | a expande e abre o seu [formulário](Entities.md) | ✎ editá-la (`schemaWrite`), ↗ abri-la |
| uma relação de uma entidade | abre a entidade que ela alcança (`customer → Customers · N — 1`) | |
| **config**, um elemento de infrastructure | o abre ([Administração](Administration.md)) | |
| uma pasta, uma consulta, um diagrama | o abre ([Projetos](Projects.md)) | ✎ editar, 🗑 excluir, **+** em uma pasta |

Um esquema que não iniciou aparece esmaecido, com o seu estado e o seu motivo (ou `A gateway não informa o motivo: veja
o log.`); um cuja versão nova não iniciou mostra ⚠ enquanto a anterior atende.

## O filtro das entidades {#the-filter-of-the-entities}

A caixa sobre as entidades (`Filtrar: entidade, propriedade, Entidade.campo`) mantém aquelas cujo nome, ou o nome de
uma das suas propriedades ou relações, contém o texto: `21 de 192`, ou `Nada corresponde`. As propriedades e relações
que corresponderam aparecem sob a sua entidade, mesmo recolhida. `Orders.customer` procura a relação `customer` de
`Orders`. Escape o limpa.

## Teclado {#keyboard}

| Tecla | Faz |
| --- | --- |
| Tab | move entre as linhas |
| → / ← | expande / recolhe |
| Enter | abre a linha (ou a expande) |

## Sua largura {#its-width}

Arraste a sua borda para mudar a largura (entre 180 e 720 px); um duplo clique na borda a ajusta aos nomes. Pelo
teclado, na borda: ← e → a mudam em 20 px (com Shift, 60), Enter a ajusta. O botão ◫ à esquerda das abas o oculta e o
mostra. A largura é lembrada.

## As abas {#the-tabs}

| Aba | Aberta a partir de | Título |
| --- | --- | --- |
| uma consulta | **+** das abas, **Consultar** de uma entidade, uma consulta salva | `Consulta 1`, a entidade, o nome da consulta salva |
| uma entidade | uma linha de uma entidade | o seu nome |
| um diagrama | um diagrama salvo | o seu nome |
| o domínio | duplo clique em **domain** | `Domínio (YAML) schema` |
| um esquema, o seu YAML, um elemento | as linhas da [administração](Administration.md) | `Esquema northwind`, `lambdaORM.yaml northwind`… |
| uma conexão, as preferências, as ferramentas | a conexão, o menu ☰ | `Conexão: northwind`, `Preferências`, `REST API · northwind`… |

- **+** abre uma aba de consulta na conexão ativa; **×** fecha uma aba; até 20 abas.
- Um clique direito em uma aba, ou **⋯**: **Fechar**, **Fechar os outros**, **Fechar todos**.
- Um **•** depois do título marca alterações não salvas.
- Com várias conexões, o título diz qual: `Orders · production`.

**Onde estava.** As abas abertas (com o texto de cada consulta como foi digitado, e os diagramas ainda não salvos), a
ativa e o que estava expandido no explorador são guardados no navegador: um recarregamento, ou o dia seguinte, começa
onde estava.
