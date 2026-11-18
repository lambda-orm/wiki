# Lambda expressions

This page summarizes the building blocks of a λORM query: the methods you chain on an entity, and the operators and functions you can use inside the lambdas. Use it as a quick reference; each method links to the page with its examples.

Queries are [lambda expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) written in the programming language itself. They refer to the entities and properties of the domain, so they are independent of the database language and of how the data is stored.

## Example

The following query reads the products whose name starts with "A", with the name of their category, sorted by category (ascending) and product (descending), and returns the first page of 10 records:

```typescript
Products
	.filter(p => upper(substr(p.name, 1, 1)) == "A")
	.map(p => ({ category: p.category.name, product: p.name }))
	.sort(p => [p.category, desc(p.product)])
	.page(1, 10)
```

On Oracle, λORM translates it into:

```sql
SELECT c.CategoryName AS "category", p.ProductName AS "product"
FROM Products p
INNER JOIN Categories c ON c.CategoryID = p.CategoryID
WHERE UPPER(SUBSTR(p.ProductName,1,1)) = 'A'
ORDER BY "category" asc, "product" desc
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

The same query runs on any other engine: on MySQL, for example, the pagination becomes `LIMIT 0,10`.

## Advantages

- Queries are written in the same programming language as the application.
- There is no new language to learn.
- Expressions are easy to write and to read.
- The IDE's IntelliSense helps you write the expressions.
- Syntax errors are caught while you write.

## Query methods

| Method | Description | SQL equivalent | Examples |
|:--|:--|:--|:--|
| filter | Filters the records. | WHERE | [Select](Select.md) |
| having | Filters the groups. | HAVING | [Grouping](Grouping.md) |
| map | Specifies the properties to return. | SELECT | [Select](Select.md) |
| distinct | Specifies the properties to return, removing duplicate records. | SELECT DISTINCT | [Select](Select.md) |
| first | Returns the first record. | SELECT + ORDER BY + LIMIT | [Select](Select.md) |
| last | Returns the last record. | SELECT + ORDER BY DESC + LIMIT | [Select](Select.md) |
| sort | Specifies the order of the records. | ORDER BY | [Select](Select.md) |
| page | Paginates the records. | LIMIT / OFFSET (depends on the dialect) | [Select](Select.md) |
| include | Loads the records of related entities. | | [Include](Include.md) |
| insert | Inserts a record. | INSERT | [Insert](Insert.md) |
| upsert | Inserts a record, or updates it if one with the same primary key exists. | INSERT … ON CONFLICT / MERGE | [Insert](Insert.md#upsert) |
| bulkInsert | Inserts many records at once. | INSERT | [Bulk Insert](BulkInsert.md) |
| update | Updates records; it always has a filter. | UPDATE with WHERE | [Update](Update.md) |
| updateAll | Updates all the records of an entity. | UPDATE without WHERE | [Update](Update.md) |
| delete | Deletes records; it always has a filter. | DELETE with WHERE | [Delete](Delete.md) |
| deleteAll | Deletes all the records of an entity. | DELETE without WHERE | [Delete](Delete.md) |

- There is no method for joins: an INNER JOIN is deduced when the query navigates a relation, as in `p.category.name` (see [Join](Join.md)).
- There is no method for GROUP BY: it is deduced when an aggregate function is used (see [Grouping](Grouping.md)).

## Operators

The operators are the same as in JavaScript.

| Category | Operators | More info |
|:--|:--|:--|
| Arithmetic | `-`, `+`, `*`, `/`, `**`, `//`, `%` | [Numeric](operatorsAndFunctions/Numeric.md) |
| Bitwise | `~`, `&`, `\|`, `^`, `<<`, `>>` | [Bitwise](operatorsAndFunctions/Bitwise.md) |
| Comparison | `==`, `===`, `!=`, `!==`, `>`, `<`, `>=`, `<=` | [Comparison](operatorsAndFunctions/Comparison.md) |
| Logical | `!`, `&&`, `\|\|` | [Logical](operatorsAndFunctions/Logical.md) |
| Array | `[]` | |

## Functions

| Category | Functions | More info |
|:--|:--|:--|
| Numeric | abs, ceil, cos, exp, ln, log, remainder, round, sign, sin, tan, trunc… | [Numeric](operatorsAndFunctions/Numeric.md) |
| String | chr, lower, lpad, ltrim, replace, rpad, rtrim, substr, trim, upper, concat… | [String](operatorsAndFunctions/String.md) |
| Datetime | curTime, today, now, time, date, dateTime, year, month, day, weekday, hours… | [Datetime](operatorsAndFunctions/Datetime.md) |
| Convert | toString, toJson, toNumber | [String](operatorsAndFunctions/String.md) |
| Nullable | nvl, nvl2, isNull, isNotNull | [Nullable](operatorsAndFunctions/Nullable.md) |
| General | as, distinct | |
| Sort | asc, desc | [Sort](operatorsAndFunctions/Sort.md) |
| Condition | between, includes | [Comparison](operatorsAndFunctions/Comparison.md) |
| Group | avg, count, first, last, max, min, sum | [Group](operatorsAndFunctions/Group.md) |
| Metadata | user, source | |

See [Operators & Functions](operatorsAndFunctions/OperatorsAndFunctions.md) for the full reference.
