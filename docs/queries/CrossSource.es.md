# Consultas entre fuentes {#queries-across-sources}

Una consulta puede leer campos de una relación cuya entidad vive en **otra fuente**, incluso de otro motor (pedidos en
PostgreSQL, clientes en MongoDB):

```ts
Orders.map(p => ({ country: p.customer.country, orders: count(p.id), amount: sum(p.total) })).sort(p => p.country)
```

λORM trae la raíz con sus filtros y un `include` de la otra fuente (cada fuente su propia sentencia), y luego mapea,
agrupa, ordena y pagina **en memoria**:

- un ordenamiento por campos de la raíz va a su base de datos con la página;
- para ordenar o agrupar en memoria trae como máximo `maxRows` filas (10.000; `infrastructure.crossSource.maxRows` u
  `options.maxRows`): más allá, un `CrossSourceError`;
- `orm.plan` muestra la sentencia de cada fuente e `inMemory: ['map', 'sort', …]`.

Un filtro por un campo de la otra fuente (`Orders.filter(p => p.customer.name == "Ann")`) primero busca las claves en
esa fuente.
