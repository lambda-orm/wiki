# Context and row filters

The **context** is who runs an expression: user, tenant, region, roles, claims. The application (or the Data Gateway,
from the identity of who calls) gives it, and the expressions of the schema read it as `context`:

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1' } })
```

- The data of a query **can't replace it**: a `context` key in the data is not the context.
- It travels as a **parameter**: a compiled sentence serves every caller.
- A transaction, its scripts and listeners inherit it. `actor` stays apart: it is what observability records.

It is read in the filters of views and mappings, `default`, `writeValue`, `constraints`, `readExp` and the conditions
of the listeners (`args.context`); not in the conditions of the sources of a stage.

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

- It is added to every select, update and delete on the entity, to the joins by a relation and to the includes.
- **A write can't leave it**: an insert, or an update that changes a property of the filter, out of it is a
  `ViewError` (like `WITH CHECK`).
- A value of the context a filter needs and the execution doesn't bring is a `ContextError`, not zero rows in silence.

The `filter` of a mapping (`mappings[].entities[].filter`) works the same way, for every view, and can read `context`
too.
