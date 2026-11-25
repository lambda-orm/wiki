# Context and row filters

The **context** is who runs an expression: user, tenant, region, roles, claims. The application (or the Data Gateway,
from the identity of who calls) gives it, and the expressions of the schema read it as `context`. Use it when the same
process serves several users, tenants or regions and the rules of the schema (which rows each one sees, what an insert
writes) depend on who calls.

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1', roles: ['seller'] } })
```

- The data of a query **can't replace it**: a `context` key in the data is not the context.
- It travels as a **parameter**: a compiled sentence serves every caller, and the cache keeps no one's values.
- A transaction, its scripts and listeners inherit it, as they inherit the view and the stage.
- `actor` stays apart: it is what observability records; `context` is what the rules decide with.

## Where it is read

| Expression | Reads the context |
| --- | --- |
| `filter` of a view and of a mapping | yes; a missing value is an error |
| `default` of a property a view hides | yes |
| `default`, `writeValue` and `constraints` of the domain | yes; a missing value is `null` |
| `readExp` (domain and view) | yes, as a parameter |
| conditions of the listeners (`context`) | yes |
| `forward` headers of an [Http source](HttpSource.md) | yes |
| conditions of the sources of a stage | **no**: they decide the route when the query is compiled, and the route is cached |

`context` is a reserved name in the expressions of the schema (`context.region`, `context.roles.includes("admin")`).

## The filter of the rows of a view

```yaml
views:
  - name: seller
    entities:
      - name: Orders
        filter: 'regionId == context.region'                               # its rows
        properties:
          - { name: tenantId, exclude: true, default: 'context.tenant' }   # an insert writes its tenant
```

- It is added to every select, update and delete on the entity, to the joins by a relation and to the includes, and
  to the filter of the mapping when there are both.
- It uses the properties of the domain, also the ones the view hides (`tenantId` above).
- **A write can't leave it**: an insert, or an update that changes a property of the filter, out of it is a
  `ViewError` (like `WITH CHECK` in PostgreSQL). To make an insert meet it without the caller knowing, hide the
  property with a `default` from the context, as `tenantId` above.
- A value of the context a filter needs and the execution doesn't bring is a `ContextError`
  (`context.region is required by the view seller`), not zero rows in silence.
- It is validated when the schema loads: it must compile and use only properties of the entity and `context`.

The view `default` is the domain and has no filter. The `filter` of a mapping (`mappings[].entities[].filter`) works
the same way, for every view, and can read `context` too:

```yaml
mappings:
  - name: keycloak
    entities:
      - name: Users
        mapping: user_entity
        filter: 'realmId == context.realm'
```

## Security

Like the view, the context is chosen by whoever calls the library; λORM guarantees that a query can't change it or
skip it. In the [Data Gateway](../data-gateway/index.md), the gateway builds it from the identity of the caller and
discards any `context` a client sends: there it is a security boundary. See [Views](Views.md).
