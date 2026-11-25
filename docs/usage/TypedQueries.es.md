# Consultas tipadas {#typed-queries}

Las consultas de una aplicación se pueden declarar en el esquema, con un nombre:

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

Se compilan al cargar el esquema, y `lambdaorm build` escribe `src/domain/queries.ts` junto a `model.ts`:

```ts
export interface DeviceWithType {
  code: string
  brand: string | null
  deviceType: { code: string; category: { code: string; name: string } | null } | null
}
const rows = await new Queries(orm).deviceWithType({ code: 'd1' })   // Promise<DeviceWithType[]>
```

Los tipos salen de `orm.model(query)`, que dice, de cada campo, su tipo, si siempre tiene un valor (`required`) y su
`enum`, y anida los includes (una lista con `[]`).
