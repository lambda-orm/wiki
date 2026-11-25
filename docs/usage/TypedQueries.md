# Typed queries

The queries of an application can be declared in the schema, with a name:

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

They are compiled when the schema loads, and `lambdaorm build` writes `src/domain/queries.ts` next to `model.ts`:

```ts
export interface DeviceWithType {
  code: string
  brand: string | null
  deviceType: { code: string; category: { code: string; name: string } | null } | null
}
const rows = await new Queries(orm).deviceWithType({ code: 'd1' })   // Promise<DeviceWithType[]>
```

The types come from `orm.model(query)`, which says, for each field, its type, whether it always has a value
(`required`) and its `enum`, and nests the includes (a list with `[]`).
