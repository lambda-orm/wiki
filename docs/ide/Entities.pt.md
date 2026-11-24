# Entidades {#entities}

Cada entidade do domínio tem um formulário, como uma tabela em uma IDE de bancos de dados: um clique na sua linha no
[explorador](Explorer.md) o abre em uma aba própria.

Seu cabeçalho tem o nome da entidade, o seu esquema, e **abstrata**, **visão** ou **estende Entidade** quando ela o é;
**Editar** (com `schemaWrite`, o seu formulário de [administração](Administration.md#forms)) e **Consultar**, que abre
uma aba de consulta com `Entity.page(1, 10)`.

## Propriedades {#properties}

| Coluna | O que é |
| --- | --- |
| **#** | a sua posição |
| **Nome** | em negrito, a chave primária |
| **Tipo** | `string`, `integer`, `decimal`, `dateTime`…, ou o enum de onde ela tira os seus valores (`Status (enum)`) |
| **Tamanho** | de uma string |
| **Obrigatória** | ✓ quando não pode ser nula |
| **PK** | ✓ na chave primária (`U` quando também é única) |
| **Auto** | ✓ quando o banco de dados dá o seu valor |
| **Padrão** | o seu valor padrão |
| **Referencia** | para uma chave estrangeira, a entidade e a propriedade que ela referencia: um link para essa entidade |
| **Expressões** | as expressões que a leem ou a escrevem |

![Propriedades](images/ide-entity-properties.png)

## Relações {#relations}

**Relações** lista as suas relações: nome, tipo (`oneToMany`: para uma, como um pedido para o seu cliente; `manyToOne`: para muitas, como um pedido para as suas linhas; `oneToOne`; o λORM as nomeia a partir do lado da outra entidade), a
entidade que alcançam, os campos que unem (**De**, **Para**), a cardinalidade (`N — 1`, `1 — N`) e se é fraca.
**Referenciada por** lista as relações de outras entidades que alcançam esta. Cada entidade é um link para o seu
formulário.

![Relações](images/ide-entity-relations.png)

## Chaves e índices {#keys-and-indexes}

A chave primária, a chave única, os índices com os seus campos, e as restrições com a sua mensagem e a sua condição.

## Dados {#data}

Suas linhas, 50 por página, **◀ Anterior** e **Próxima ▶**: somente leitura (nenhuma linha é alterada aqui). Elas
aparecem como a tabela de um [resultado](Queries.md#the-result): podem ser copiadas e exportadas
(`Orders-page-1.json`). Uma entidade abstrata não tem dados.

![Dados](images/ide-entity-data.png)

## Diagrama {#diagram}

A entidade e as suas vizinhas, somente leitura. A caixa **entidade** centraliza o diagrama em outra, e a profundidade
vai de **vizinhas** a **2 níveis** ou ao **modelo inteiro**. Um clique em uma caixa a centraliza; um duplo clique abre
o seu formulário. O resto do diagrama (zoom, mostrar, exportar) é como em [Diagramas](Diagrams.md).

![Diagrama](images/ide-entity-diagram.png)
