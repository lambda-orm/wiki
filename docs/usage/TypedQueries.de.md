# Typisierte Abfragen {#typed-queries}

Die Abfragen einer Anwendung können im Schema mit einem Namen deklariert werden:

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

Sie werden beim Laden des Schemas kompiliert, und `lambdaorm build` schreibt `src/domain/queries.ts` neben `model.ts`:

```ts
export interface DeviceWithType {
  code: string
  brand: string | null
  deviceType: { code: string; category: { code: string; name: string } | null } | null
}
const rows = await new Queries(orm).deviceWithType({ code: 'd1' })   // Promise<DeviceWithType[]>
```

Die Typen stammen aus `orm.model(query)`, das für jedes Feld seinen Typ angibt, ob es immer einen Wert hat (`required`)
und sein `enum`, und die Includes verschachtelt (eine Liste mit `[]`).
