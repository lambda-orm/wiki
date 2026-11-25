# Consultas entre fontes {#queries-across-sources}

Esta página explica o que acontece quando uma consulta lê campos de uma relação cuja entidade vive em **outra fonte** do stage, até mesmo de outro motor (pedidos no PostgreSQL, clientes no MongoDB). Você escreve a consulta como se tudo estivesse em um único banco de dados; o λORM a divide, executa uma sentença em cada fonte e termina o trabalho em memória.

Uma relação entre duas entidades da mesma fonte continua sendo um join SQL (veja [Join](Join.md)). O que esta página descreve só se aplica quando a relação cruza fontes.

## Ler, ordenar e agrupar por campos de outra fonte {#read-sort-and-group-by-fields-of-another-source}

```ts
// Orders in PostgreSQL, Customers in MongoDB
Orders.map(p => [p.id, p.customer.name])
Orders.map(p => ({ id: p.id, who: p.customer.name })).sort(p => desc(p.who)).page(1, 20)
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

O λORM executa essas consultas em duas partes:

1. **Nos bancos de dados:** a entidade raiz com seus filtros e um [include](Include.md) das relações lidas, cada fonte com sua própria sentença em seu próprio dialeto.
2. **Em memória:** o `map` (agrupando pelos demais campos quando tem `count`, `sum`, `avg`, `min` ou `max`), o `having`, o `sort` e o `page`.

As relações podem estar em qualquer nível: `p.customer.country.name` (`Customers` e `Countries` em outra fonte) traz `include(p => [p.customer.include(p1 => [p1.country])])`, e cada relação vem da sua própria fonte.

```ts
Orders.map(p => ({ country: p.customer.country.name, orders: count(p.id) })).sort(p => p.country)
```

## Limites {#limits}

- **Ordenar e paginar no banco de dados quando possível.** Se o `sort` lê apenas campos da raiz e nada é agrupado, o `sort` e o `page` vão para o banco de dados da raiz (`ORDER BY … LIMIT`) e em memória roda só o `map`, de modo que uma consulta paginada não traz a tabela inteira.
- **No máximo `maxRows` linhas em memória.** Para ordenar, agrupar ou paginar em memória, o λORM traz no máximo `maxRows` linhas (10.000 por padrão; configurável em `infrastructure.crossSource.maxRows` do esquema ou em `options.maxRows` de `orm.execute`). Se houver mais, a consulta falha com `CrossSourceError: Orders brings more than 10000 rows to sort in memory: filter it or raise maxRows`. Nunca corta em silêncio, porque um resultado ordenado sobre uma parte das linhas estaria errado.
- **Não suportado:** `include`, `distinct` ou `first` na mesma consulta geram um `CrossSourceError`.

## Ver o plano {#see-the-plan}

[`orm.plan`](Metadata.md) mostra a sentença de cada fonte e, em `inMemory`, o que roda em memória:

```ts
orm.plan('Orders.map(p => ({ who: p.customer.name, orders: count(p.id) })).sort(p => p.who)')
```

```json
{
  "entity": "Orders",
  "dialect": "PostgreSQL",
  "source": "sales",
  "sentence": "SELECT o.id AS \"id\", …, o.customerId AS \"__customerId\" FROM orders o ORDER BY o.id asc OFFSET 0 LIMIT 10001",
  "children": [
    {
      "entity": "Customers",
      "dialect": "MongoDB",
      "source": "crm",
      "sentence": "…"
    }
  ],
  "inMemory": ["map", "sort"]
}
```

## Filtrar por um campo de outra fonte {#filter-by-a-field-of-another-source}

Um filtro por um campo de uma relação em outra fonte (`Orders.filter(p => p.customer.name == "Ann")`) primeiro busca as chaves nessa fonte e depois filtra a raiz com `in`. Suporta um nível de relação e comparações com valores; veja [Filtrar por um campo de uma relação em outra fonte](Include.md#filter-by-a-field-of-a-relation-in-another-source).
