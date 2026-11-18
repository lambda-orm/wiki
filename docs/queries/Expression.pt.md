# Expressões lambda {#lambda-expressions}

Esta página resume os elementos de uma consulta λORM: os métodos encadeados sobre uma entidade e os operadores e funções que podem ser usados dentro das lambdas. Use-a como referência rápida; cada método tem um link para a página com seus exemplos.

As consultas são [expressões lambda](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) escritas na própria linguagem de programação. Elas se referem às entidades e propriedades do domínio, por isso são independentes da linguagem do banco de dados e da forma como os dados são armazenados.

## Exemplo {#example}

A consulta a seguir lê os produtos cujo nome começa com "A", com o nome da sua categoria, ordenados por categoria (ascendente) e produto (descendente), e retorna a primeira página de 10 registros:

```typescript
Products
	.filter(p => upper(substr(p.name, 1, 1)) == "A")
	.map(p => ({ category: p.category.name, product: p.name }))
	.sort(p => [p.category, desc(p.product)])
	.page(1, 10)
```

No Oracle, o λORM a traduz para:

```sql
SELECT c.CategoryName AS "category", p.ProductName AS "product"
FROM Products p
INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE UPPER(SUBSTR(p.ProductName,1,1)) = 'A'
ORDER BY "category" asc, "product" desc
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

A mesma consulta é executada em qualquer outro mecanismo de banco de dados: no MySQL, por exemplo, a paginação se torna `LIMIT 0,10`.

## Vantagens {#advantages}

- As consultas são escritas na mesma linguagem de programação da aplicação.
- Não há uma nova linguagem para aprender.
- As expressões são fáceis de escrever e de ler.
- O IntelliSense da IDE ajuda a escrever as expressões.
- Os erros de sintaxe são detectados enquanto você escreve.

## Métodos de consulta {#query-methods}

| Método | Descrição | Equivalente em SQL | Exemplos |
|:--|:--|:--|:--|
| filter | Filtra os registros. | WHERE | [Select](Select.md) |
| having | Filtra os grupos. | HAVING | [Agrupamento](Grouping.md) |
| map | Especifica as propriedades a retornar. | SELECT | [Select](Select.md) |
| distinct | Especifica as propriedades a retornar, removendo os registros duplicados. | SELECT DISTINCT | [Select](Select.md) |
| first | Retorna o primeiro registro. | SELECT + ORDER BY + LIMIT | [Select](Select.md) |
| last | Retorna o último registro. | SELECT + ORDER BY DESC + LIMIT | [Select](Select.md) |
| sort | Especifica a ordem dos registros. | ORDER BY | [Select](Select.md) |
| page | Pagina os registros. | LIMIT / OFFSET (depende do dialeto) | [Select](Select.md) |
| include | Carrega os registros de entidades relacionadas. | | [Include](Include.md) |
| insert | Insere um registro. | INSERT | [Insert](Insert.md) |
| upsert | Insere um registro, ou o atualiza se já existir um com a mesma chave primária. | INSERT … ON CONFLICT / MERGE | [Insert](Insert.md#upsert) |
| bulkInsert | Insere muitos registros de uma só vez. | INSERT | [Inserção em massa](BulkInsert.md) |
| update | Atualiza registros; sempre tem um filtro. | UPDATE com WHERE | [Update](Update.md) |
| updateAll | Atualiza todos os registros de uma entidade. | UPDATE sem WHERE | [Update](Update.md) |
| delete | Exclui registros; sempre tem um filtro. | DELETE com WHERE | [Delete](Delete.md) |
| deleteAll | Exclui todos os registros de uma entidade. | DELETE sem WHERE | [Delete](Delete.md) |

- Não há método para joins: um INNER JOIN é deduzido quando a consulta navega por uma relação, como em `p.category.name` (veja [Join](Join.md)).
- Não há método para GROUP BY: ele é deduzido quando uma função de agregação é usada (veja [Agrupamento](Grouping.md)).

## Operadores {#operators}

Os operadores são os mesmos do JavaScript.

| Categoria | Operadores | Mais informações |
|:--|:--|:--|
| Aritméticos | `-`, `+`, `*`, `/`, `**`, `//`, `%` | [Numéricos](operatorsAndFunctions/Numeric.md) |
| Bit a bit | `~`, `&`, `\|`, `^`, `<<`, `>>` | [Bit a bit](operatorsAndFunctions/Bitwise.md) |
| Comparação | `==`, `===`, `!=`, `!==`, `>`, `<`, `>=`, `<=` | [Comparação](operatorsAndFunctions/Comparison.md) |
| Lógicos | `!`, `&&`, `\|\|` | [Lógicos](operatorsAndFunctions/Logical.md) |
| Array | `[]` | |

## Funções {#functions}

| Categoria | Funções | Mais informações |
|:--|:--|:--|
| Numéricas | abs, ceil, cos, exp, ln, log, remainder, round, sign, sin, tan, trunc… | [Numéricas](operatorsAndFunctions/Numeric.md) |
| String | chr, lower, lpad, ltrim, replace, rpad, rtrim, substr, trim, upper, concat… | [String](operatorsAndFunctions/String.md) |
| Data e hora | curTime, today, now, time, date, dateTime, year, month, day, weekday, hours… | [Data e hora](operatorsAndFunctions/Datetime.md) |
| Conversão | toString, toJson, toNumber | [String](operatorsAndFunctions/String.md) |
| Nulos | nvl, nvl2, isNull, isNotNull | [Nulos](operatorsAndFunctions/Nullable.md) |
| Gerais | as, distinct | |
| Ordenação | asc, desc | [Ordenação](operatorsAndFunctions/Sort.md) |
| Condição | between, includes | [Comparação](operatorsAndFunctions/Comparison.md) |
| Agrupamento | avg, count, first, last, max, min, sum | [Agrupamento](operatorsAndFunctions/Group.md) |
| Metadados | user, source | |

Veja [Operadores e funções](operatorsAndFunctions/OperatorsAndFunctions.md) para a referência completa.
