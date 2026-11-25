# Consultas entre fontes {#queries-across-sources}

Uma consulta pode ler campos de uma relação cuja entidade vive em **outra fonte**, até de outro banco de dados (pedidos
no PostgreSQL, clientes no MongoDB):

```ts
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

O λORM traz a raiz com seus filtros e um `include` da outra fonte (cada fonte a sua própria sentença), e depois mapeia,
agrupa, ordena e pagina **em memória**:

- uma ordenação por campos da raiz vai para o seu banco de dados com a página;
- para ordenar ou agrupar em memória ele traz no máximo `maxRows` linhas (10.000; `infrastructure.crossSource.maxRows`
  ou `options.maxRows`): além disso, um `CrossSourceError`;
- `orm.plan` mostra a sentença de cada fonte e `inMemory: ['map', 'sort', …]`.

Um filtro por um campo da outra fonte (`Orders.filter(p => p.customer.name == "Ann")`) primeiro busca as chaves nessa
fonte.
