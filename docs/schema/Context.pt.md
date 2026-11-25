# Contexto e filtros de linhas {#context-and-row-filters}

O **contexto** é quem executa uma expressão: usuário, tenant, região, papéis, claims. A aplicação (ou o Data Gateway, a
partir da identidade de quem chama) o fornece, e as expressões do esquema o leem como `context`. Use-o quando o mesmo
processo atende vários usuários, tenants ou regiões e as regras do esquema (quais linhas cada um vê, o que um insert
grava) dependem de quem chama.

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1', roles: ['seller'] } })
```

- Os dados de uma consulta **não podem substituí-lo**: uma chave `context` nos dados não é o contexto.
- Ele viaja como um **parâmetro**: uma sentença compilada serve a todos que chamam, e o cache não guarda os valores de
  ninguém.
- Uma transação, seus scripts e listeners o herdam, assim como herdam a visão e o stage.
- `actor` fica à parte: é o que a observabilidade registra; `context` é aquilo com que as regras decidem.

## Onde ele é lido {#where-it-is-read}

| Expressão | Lê o contexto |
| --- | --- |
| `filter` de uma visão e de um mapeamento | sim; um valor ausente é um erro |
| `default` de uma propriedade que uma visão oculta | sim |
| `default`, `writeValue` e `constraints` do domínio | sim; um valor ausente é `null` |
| `readExp` (domínio e visão) | sim, como um parâmetro |
| condições dos listeners (`context`) | sim |
| cabeçalhos `forward` de uma [fonte Http](HttpSource.md) | sim |
| condições das fontes de um stage | **não**: elas decidem a rota quando a consulta é compilada, e a rota fica em cache |

`context` é um nome reservado nas expressões do esquema (`context.region`, `context.roles.includes("admin")`).

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

- Ele é adicionado a cada select, update e delete sobre a entidade, aos joins por uma relação e aos includes, e ao
  filtro do mapeamento quando existem os dois.
- Ele usa as propriedades do domínio, também as que a visão oculta (`tenantId` acima).
- **Uma escrita não pode sair dele**: um insert, ou um update que altera uma propriedade do filtro, fora dele é um
  `ViewError` (como `WITH CHECK` no PostgreSQL). Para que um insert o cumpra sem que quem chama saiba, oculte a
  propriedade com um `default` tirado do contexto, como `tenantId` acima.
- Um valor do contexto de que um filtro precisa e que a execução não traz é um `ContextError`
  (`context.region is required by the view seller`), não zero linhas em silêncio.
- Ele é validado quando o esquema é carregado: deve compilar e usar apenas propriedades da entidade e `context`.

A visão `default` é o domínio e não tem filtro. O `filter` de um mapeamento (`mappings[].entities[].filter`) funciona
da mesma forma, para todas as visões, e também pode ler `context`:

```yaml
mappings:
  - name: keycloak
    entities:
      - name: Users
        mapping: user_entity
        filter: 'realmId == context.realm'
```

## Segurança {#security}

Assim como a visão, o contexto é escolhido por quem chama a biblioteca; o λORM garante que uma consulta não pode
alterá-lo nem ignorá-lo. No [Data Gateway](../data-gateway/index.md), o gateway o constrói a partir da identidade de quem
chama e descarta qualquer `context` que um cliente envie: ali ele é uma fronteira de segurança. Veja [Visões](Views.md).
