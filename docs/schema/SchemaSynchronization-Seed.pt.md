# Seed {#seed}

Os dados com que um stage começa: arquivos como os do `stage export`, relativos ao esquema, aplicados em ordem.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]
```

`lambdaorm seed -s dev`, `lambdaorm push -s dev --seed` ou `orm.stage.seed({ stage }).execute()` inserem, de cada
entidade, as linhas cuja chave (a primária, ou a única quando as linhas não a trazem) ainda não está no banco de dados.
Executado de novo, não insere nada; uma linha alterada no banco de dados fica como está.
