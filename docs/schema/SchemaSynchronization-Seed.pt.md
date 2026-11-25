# Seed {#seed}

Esta página explica o seed: os dados com que um stage começa (catálogos, um primeiro usuário, dados de teste),
declarados no esquema e aplicados sem duplicá-los. Use-o para preparar um banco de dados novo, um ambiente de
desenvolvimento ou um teste.

```yaml
infrastructure:
  stages:
    - name: dev
      sources: [{ name: db }]
      seed: [data/seed/base.json, data/seed/dev.json]   # relative to the schema, applied in order
```

- **Formato:** cada arquivo é como os do `stage export` (`{ entities: [{ entity, rows }] }`). Os stages podem
  compartilhar arquivos (`base.json`) e adicionar os seus próprios.
- **Idempotente:** de cada entidade, insere apenas as linhas cuja chave (a primária, ou a única quando as linhas não
  trazem a primária, como com uma chave autoincremental) ainda não está no banco de dados. **Uma linha que já está lá
  não é tocada**, de modo que o que alguém alterou no banco de dados permanece. Linhas sem a sua chave são um erro.
- **Quando:** apenas quando é pedido, nunca por conta própria (para que ninguém o aplique em produção por acidente):

```sh
lambdaorm seed -s dev             # the rows that are not there yet
lambdaorm push -s dev --seed      # after creating or updating the tables
```

```typescript
await orm.stage.seed({ stage: 'dev' }).execute()
```

- **O que responde:** por arquivo e entidade, as linhas inseridas e as que já estavam lá. Com
  [observabilidade](Observability.md), deixa um evento `schema.change` do tipo `stage.seed`.

Veja também o [comando seed](../cli/Commands/Seed.md).
