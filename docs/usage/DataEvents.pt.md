# Mudanças dos dados e outbox {#changes-of-the-data-and-outbox}

## Escutar as mudanças {#listening-to-the-changes}

```ts
const off = orm.onDataChange(changes => {
  // [{ id, entity: 'Orders', action: 'update', keys: [{ id: 7 }], count: 1, source, stage, view, actor, transaction, time }]
})
```

Uma mudança por sentença que escreve, **depois do seu commit** (um rollback não emite nada); as de uma transação chegam
juntas com o seu id. As chaves quando são conhecidas, nunca os valores gravados. Os listeners não são aguardados: não
deixam uma escrita mais lenta nem a fazem falhar.

## Outbox {#outbox}

Para entregar as mudanças mesmo que o processo pare antes, grave-as na mesma transação:

```yaml
infrastructure:
  outbox: { entities: [Orders], actions: [insert, update], condition: 'action != "delete"', maxAttempts: 10 }
```

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// or: orm.outbox.pending(), done(ids), failed(id, error)
```

Os eventos vão para a entidade `LambdaOrmOutbox` (criada pelo `push`) antes do commit; um que falhou é tentado de novo
com uma espera crescente, e fica morto depois de `maxAttempts`.
