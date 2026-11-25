# Seed {#seed}

Esta página explica seed: los datos con los que empieza un stage (catálogos, un primer usuario, datos de prueba),
declarados en el esquema y aplicados sin duplicarlos. Úsalo para preparar una base de datos nueva, un entorno de
desarrollo o una prueba.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]   # relative to the schema, applied in order
```

- **Formato:** cada archivo es como los de `stage export` (`{ entities: [{ entity, rows }] }`). Los stages pueden
  compartir archivos (`base.json`) y añadir los suyos.
- **Idempotente:** de cada entidad, inserta solo las filas cuya clave (la primaria, o la única cuando las filas no traen
  la primaria, como con una clave autoincremental) todavía no está en la base de datos. **Una fila que ya está no se
  toca**, así que lo que alguien cambió en la base de datos se mantiene. Las filas sin su clave son un error.
- **Cuándo:** solo cuando se pide, nunca por sí solo (así nadie lo aplica en producción por accidente):

```sh
lambdaorm seed -s dev             # the rows that are not there yet
lambdaorm push -s dev --seed      # after creating or updating the tables
```

```typescript
await orm.stage.seed({ stage: 'dev' }).execute()
```

- **Qué responde:** por archivo y entidad, las filas insertadas y las que ya estaban. Con
  [observabilidad](Observability.md), deja un evento `schema.change` de tipo `stage.seed`.

Ver también el [comando seed](../cli/Commands/Seed.md).
