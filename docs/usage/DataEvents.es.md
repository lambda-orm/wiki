# Cambios de los datos y outbox {#changes-of-the-data-and-outbox}

## Escuchar los cambios {#listening-to-the-changes}

```ts
const off = orm.onDataChange(changes => {
  // [{ id, entity: 'Orders', action: 'update', keys: [{ id: 7 }], count: 1, source, stage, view, actor, transaction, time }]
})
```

Un cambio por cada sentencia que escribe, **después de su commit** (un rollback no emite nada); los de una transacción
llegan juntos con su id. Las claves cuando se conocen, nunca los valores escritos. Los listeners no se esperan: no
frenan ni hacen fallar una escritura.

## Outbox {#outbox}

Para entregar los cambios aunque el proceso se detenga antes, se escriben en la misma transacción:

```yaml
infrastructure:
  outbox: { entities: [Orders], actions: [insert, update], condition: 'action != "delete"', maxAttempts: 10 }
```

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// or: orm.outbox.pending(), done(ids), failed(id, error)
```

Los eventos van a la entidad `LambdaOrmOutbox` (creada por `push`) antes del commit; uno fallido se reintenta con una
espera creciente, y queda muerto después de `maxAttempts`.
