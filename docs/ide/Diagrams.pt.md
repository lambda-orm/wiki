# Diagramas {#diagrams}

Um diagrama do domínio desenha as entidades escolhidas como caixas, com as suas propriedades, tipos, **PK** e **FK**
(as obrigatórias em negrito, uma entidade abstrata em itálico), e as suas relações como linhas com a sua cardinalidade
(**1 — N**, **1 — 1**); uma herança é uma linha tracejada com um triângulo vazado. Os diagramas são salvos em um
[projeto](Projects.md), como as consultas.

![Um diagrama](images/ide-diagram.png)

## Um novo diagrama {#a-new-diagram}

O **+** de uma pasta (ou de **projetos**) → **Novo diagrama**: um **Nome**, uma **Descrição**, a sua **Pasta** e **as
entidades**, buscadas, marcadas uma a uma, ou completadas com **Adicionar as vizinhas** (as entidades relacionadas às
marcadas); **Limpar** desmarca todas. **Criar** o abre.

![Novo diagrama](images/ide-new-diagram.png)

## Em um diagrama {#in-a-diagram}

| Para | Faça |
| --- | --- |
| organizá-lo | ele é organizado quando abre ([ELK](https://eclipse.dev/elk/)); **reorganizar** volta a isso depois de mover caixas |
| mover uma caixa ou uma linha | arraste-a; uma linha mantém as suas pontas nas linhas dos campos que une; um duplo clique em uma linha a recoloca |
| selecionar várias | Shift ou Ctrl e clique, ou Shift e arrastar o fundo (a ferramenta **selecionar**: arrastar o fundo seleciona); Ctrl+A todas, Esc nenhuma |
| adicionar entidades | o **+** de uma caixa: as suas tabelas relacionadas que não estão no diagrama; ou **Entidades…** |
| remover uma entidade | o seu **×**, ou selecioná-la e Delete; **remover as selecionadas (n)** |
| dar zoom e mover | a roda; arrastar o fundo (a ferramenta **mover**); **aproximar**, **afastar** (5 % a 300 %), **ajustar** mostra tudo |
| abrir uma entidade | duplo clique na sua caixa: o seu [formulário](Entities.md) |
| consultar os seus dados | **consulta do diagrama**: uma aba de consulta que lê o que ele mostra, a partir da caixa selecionada ou da mais relacionada |
| ver menos | **mostrar**: todas as propriedades, chaves (PK e FK), chave primária, ou só o nome da tabela; **nomes das relações** nas linhas |
| exportá-lo | **exportar**: **PDF**, **PNG** ou **SVG**, o diagrama inteiro, com as cores do tema |

**Salvar** (Ctrl+S) guarda as entidades, a posição de cada caixa e linha, o que ele mostra e os nomes das relações;
**salvo** diz que ele não tem alterações. Um diagrama ainda não salvo fica na sua aba depois de um recarregamento.

## O diagrama de uma entidade {#the-diagram-of-an-entity}

A aba **Diagrama** de uma [entidade](Entities.md#diagram) a desenha com as suas vizinhas, somente leitura: **entidade**
o centraliza em outra, e a profundidade vai até **2 níveis** ou o **modelo inteiro**.

## O diagrama do assistente {#the-diagram-of-the-wizard}

O [assistente de consultas](QueryWizard.md) usa o mesmo diagrama, com uma marca em cada campo das suas tabelas.
