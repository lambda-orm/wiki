# Seed {#seed}

Los datos con los que empieza un stage: archivos como los de `stage export`, relativos al esquema, aplicados en orden.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]
```

`lambdaorm seed -s dev`, `lambdaorm push -s dev --seed` u `orm.stage.seed({ stage }).execute()` insertan, de cada
entidad, las filas cuya clave (la primaria, o la única cuando las filas no la traen) todavía no está en la base de
datos. Ejecutado de nuevo, no inserta nada; una fila cambiada en la base de datos queda como está.
