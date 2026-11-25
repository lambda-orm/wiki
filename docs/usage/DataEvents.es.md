# Cambios de los datos y outbox {#changes-of-the-data-and-outbox}

Cada escritura que pasa por λORM puede anunciarse como un **cambio de los datos**: qué entidad cambió, cómo y las
claves de las filas. Sirve para invalidar una caché, avisar a otros servicios o alimentar un índice de búsqueda sin
escribir un [listener](../schema/SchemaExample-Listener.md) por entidad. Cuando los cambios deben entregarse aunque el
proceso se detenga, se declara un **outbox**: entonces se escriben en la misma transacción que los datos.

## Escuchar los cambios {#listening-to-the-changes}

```ts
const off = orm.onDataChange(async changes => {
  for (const change of changes) {
    console.log(change.entity, change.action, change.keys)   // Orders update [ { id: 7 } ]
  }
})
// más tarde: dejar de escuchar
off()
```

El listener recibe una lista de cambios:

| Campo | Descripción |
| :-- | :-- |
| `id` | Id del cambio (un ULID). |
| `entity` | La entidad escrita, por ejemplo `Orders`. |
| `action` | `insert`, `update`, `delete`, `upsert`, `bulkInsert`, `bulkMerge` o `bulkDelete`. |
| `keys` | Las claves primarias de las filas, cuando se conocen. |
| `count` | Las filas afectadas, cuando el motor las informa. |
| `source`, `stage`, `view` | Dónde se escribió y con qué [vista](../schema/Views.md). |
| `actor` | Quién lo hizo (`actor` de las opciones de la consulta, ver [Contexto](../schema/Context.md)). |
| `transaction` | El id de la transacción: los cambios de un mismo commit lo comparten. |
| `time` | Cuándo, en ISO 8601. |

- **Un cambio por cada sentencia que escribe**: insertar un pedido con sus detalles da un cambio de `Orders` y uno de
  `Orders.details`.
- **Después del commit.** Los cambios de una [transacción](Transaction.md) o de un [script](Script.md) llegan juntos,
  en orden, cuando el commit terminó; un rollback no emite nada. Fuera de una transacción, cada uno llega cuando su
  sentencia termina bien.
- **Las claves, nunca los valores escritos** (pueden ser datos personales; quien los necesita los lee, con su vista).
  Un insert, un upsert o una escritura por clave (`update(entity)`, `filter(p => p.id == id)`) da las claves; un update
  o delete con otro filtro da solo la entidad y su `count`.
- **Los listeners no se esperan**: no frenan ni hacen fallar una escritura, y sus errores van al log.
- **Por proceso**: cada instancia de λORM anuncia lo que escribió ella. Varias instancias (por ejemplo varios
  gateways) deben compartir los cambios mediante algo externo, como Redis o Kafka.

## Outbox {#outbox}

`onDataChange` se pierde si el proceso se detiene entre el commit y la entrega. Para entregar los cambios con garantía,
se declara un outbox: cada cambio se escribe, **antes del commit y en la misma transacción**, en la entidad
`LambdaOrmOutbox`, y un despachador lo entrega después.

```yaml
infrastructure:
  outbox:
    entities: [Orders, Customers]                            # sin entities: todas
    actions: [insert, update, delete]                        # sin actions: todas
    condition: 'action != "delete" || entity == "Orders"'    # una expresión sobre el cambio
    maxAttempts: 10                                          # por defecto: 10
```

`LambdaOrmOutbox` se agrega al dominio y la crea [push](../cli/Commands/Push.md); el stage la enruta como a cualquier
otra entidad. Un evento tiene el contenido de un cambio (sin los valores escritos) más su entrega: `status`
(`pending`, `done` o `dead`), `attempts`, `nextAttempt` y `error`.

Entregar los eventos con una función:

```ts
const dispatcher = orm.outbox.dispatch(async event => { await webhook(event) }, { interval: 1000 })
// ...
await dispatcher.stop()
```

Cada evento que la función resuelve queda hecho; uno que rechaza se reintenta más tarde, con una espera que crece (1,
2, 4… segundos, una hora como máximo), y queda `dead` después de `maxAttempts`. Para entregarlos uno mismo:

```ts
const events = await orm.outbox.pending({ limit: 100 })   // pendientes, y cuyo próximo intento llegó
await orm.outbox.done(events.map(p => p.id))
await orm.outbox.failed(id, error)                         // se reintenta más tarde, o queda muerto
```

!!! note "Nota"
    Con una sola base de datos, el cambio y su evento son atómicos. Con varias fuentes, se confirman como cualquier
    transacción de λORM entre fuentes: una después de otra. Debe haber un solo despachador por outbox: dos podrían tomar el
    mismo evento.
