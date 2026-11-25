# Seed

The data a stage starts with: files as the ones of `stage export`, relative to the schema, applied in order.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]
```

`lambdaorm seed -s dev`, `lambdaorm push -s dev --seed` or `orm.stage.seed({ stage }).execute()` insert, of each
entity, the rows whose key (the primary one, or the unique one when the rows don't bring it) isn't in the database
yet. Run again, it inserts nothing; a row changed in the database stays as it is.
