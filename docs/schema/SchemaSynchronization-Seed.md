# Seed

This page explains seed: the data a stage starts with (catalogs, a first user, test data), declared in the schema and
applied without duplicating it. Use it to set up a new database, a development environment or a test.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]   # relative to the schema, applied in order
```

- **Format:** each file is like the ones of `stage export` (`{ entities: [{ entity, rows }] }`). Stages can share
  files (`base.json`) and add their own.
- **Idempotent:** of each entity, it inserts only the rows whose key (the primary one, or the unique one when the rows
  don't bring the primary one, as with an autoincrement key) isn't in the database yet. **A row that is already there
  is not touched**, so what someone changed in the database stays. Rows without their key are an error.
- **When:** only when it is asked for, never on its own (so no one applies it in production by accident):

```sh
lambdaorm seed -s dev             # the rows that are not there yet
lambdaorm push -s dev --seed      # after creating or updating the tables
```

```typescript
await orm.stage.seed({ stage: 'dev' }).execute()
```

- **What it answers:** per file and entity, the rows inserted and the ones that were already there. With
  [observability](Observability.md), it leaves a `schema.change` event of type `stage.seed`.

See also the [seed command](../cli/Commands/Seed.md).
