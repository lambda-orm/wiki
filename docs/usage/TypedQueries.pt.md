# Consultas tipadas {#typed-queries}

As consultas de uma aplicação podem ser declaradas no esquema, com um nome:

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

Elas são compiladas quando o esquema é carregado, e `lambdaorm build` grava `src/domain/queries.ts` ao lado de
`model.ts`:

```ts
export interface DeviceWithType {
  code: string
  brand: string | null
  deviceType: { code: string; category: { code: string; name: string } | null } | null
}
const rows = await new Queries(orm).deviceWithType({ code: 'd1' })   // Promise<DeviceWithType[]>
```

Os tipos vêm de `orm.model(query)`, que diz, de cada campo, o seu tipo, se ele sempre tem um valor (`required`) e o seu
`enum`, e aninha os includes (uma lista com `[]`).
