# Seed {#seed}

Diese Seite erklärt seed: die Daten, mit denen ein Stage beginnt (Kataloge, ein erster Benutzer, Testdaten), im Schema
deklariert und angewendet, ohne sie zu duplizieren. Verwenden Sie es, um eine neue Datenbank, eine
Entwicklungsumgebung oder einen Test einzurichten.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]   # relative to the schema, applied in order
```

- **Format:** Jede Datei ist wie die von `stage export` (`{ entities: [{ entity, rows }] }`). Stages können Dateien
  gemeinsam nutzen (`base.json`) und eigene hinzufügen.
- **Idempotent:** Von jeder Entität fügt es nur die Zeilen ein, deren Schlüssel (der Primärschlüssel oder der
  eindeutige, wenn die Zeilen den Primärschlüssel nicht mitbringen, wie bei einem Autoincrement-Schlüssel) noch nicht
  in der Datenbank ist. **Eine bereits vorhandene Zeile wird nicht angetastet**, sodass erhalten bleibt, was jemand in
  der Datenbank geändert hat. Zeilen ohne ihren Schlüssel sind ein Fehler.
- **Wann:** nur, wenn es angefordert wird, niemals von selbst (damit niemand es versehentlich in der Produktion
  anwendet):

```sh
lambdaorm seed -s dev             # the rows that are not there yet
lambdaorm push -s dev --seed      # after creating or updating the tables
```

```typescript
await orm.stage.seed({ stage: 'dev' }).execute()
```

- **Was es zurückgibt:** pro Datei und Entität die eingefügten Zeilen und diejenigen, die bereits vorhanden waren. Mit
  [Observability](Observability.md) hinterlässt es ein Ereignis `schema.change` vom Typ `stage.seed`.

Siehe auch den [Befehl seed](../cli/Commands/Seed.md).
