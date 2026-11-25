# Contexto e filtros de linhas {#context-and-row-filters}

O **contexto** é quem executa uma expressão: usuário, tenant, região, papéis, claims. A aplicação (ou o Data Gateway, a
partir da identidade de quem chama) o fornece, e as expressões do esquema o leem como `context`:

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1' } })
```

- Os dados de uma consulta **não podem substituí-lo**: uma chave `context` nos dados não é o contexto.
- Ele viaja como um **parâmetro**: uma sentença compilada serve a todos que chamam.
- Uma transação, seus scripts e listeners o herdam. `actor` fica à parte: é o que a observabilidade registra.

Ele é lido nos filtros das visões e dos mapeamentos, `default`, `writeValue`, `constraints`, `readExp` e nas condições
dos listeners (`args.context`); não nas condições das fontes de um stage.

## O filtro das linhas de uma visão {#the-filter-of-the-rows-of-a-view}

```yaml
views:
  - name: seller
    entities:
      - name: Orders
        filter: 'regionId == context.region'                               # its rows
        properties:
          - { name: tenantId, exclude: true, default: 'context.tenant' }   # an insert writes its tenant
```

- Ele é adicionado a cada select, update e delete sobre a entidade, aos joins por uma relação e aos includes.
- **Uma escrita não pode sair dele**: um insert, ou um update que altera uma propriedade do filtro, fora dele é um
  `ViewError` (como `WITH CHECK`).
- Um valor do contexto de que um filtro precisa e que a execução não traz é um `ContextError`, não zero linhas em
  silêncio.

O `filter` de um mapeamento (`mappings[].entities[].filter`) funciona da mesma forma, para todas as visões, e também
pode ler `context`.
