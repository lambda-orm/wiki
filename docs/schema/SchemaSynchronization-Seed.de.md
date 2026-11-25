# Seed {#seed}

Die Daten, mit denen ein Stage beginnt: Dateien wie die von `stage export`, relativ zum Schema, der Reihe nach
angewendet.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]
```

`lambdaorm seed -s dev`, `lambdaorm push -s dev --seed` oder `orm.stage.seed({ stage }).execute()` fügen von jeder
Entität die Zeilen ein, deren Schlüssel (der Primärschlüssel oder der eindeutige, wenn die Zeilen ihn nicht mitbringen)
noch nicht in der Datenbank ist. Erneut ausgeführt, fügt es nichts ein; eine in der Datenbank geänderte Zeile bleibt,
wie sie ist.
