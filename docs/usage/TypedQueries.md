# Typed queries

Declare the queries of an application in the schema, with a name, and λORM gives each one the TypeScript type of its
result and a typed function that runs it. Use them when the code must know at compile time what a query returns,
includes and enumerations included.

## Declaring the queries

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

They are checked when the schema loads: the name must be an identifier and unique, and the query must compile. An
error names the query: `Invalid application.queries: deviceWithType: …`.

## Generating the types

[`lambdaorm build`](../cli/Commands/Build.md) writes `queries.ts` in the domain path (by default `src/domain`), next to
`model.ts`. λORM manages the file and rewrites it on every build; with `--view`, the types are the ones the
[view](../schema/Views.md) sees.

```ts
/** a device with its type and category */
export interface DeviceWithType {
  code: string
  brand: string | null          // not required: it may have no value
  status: Status                // the enum of model.ts
  deviceType: {                 // an include of one row: it may be missing
    code: string
    category: { code: string; name: string } | null
  } | null
}
export interface DeviceWithTypeParams { code?: string }
export class Queries {
  constructor (orm?: IOrm, options?: QueryOptions)
  deviceWithType (params?: DeviceWithTypeParams): Promise<DeviceWithType[]>
}
```

Use it:

```ts
import { orm } from '@lambdaorm/lib'
import { Queries } from './domain/queries'

await orm.init()
const queries = new Queries(orm, { stage: 'default' })
const devices = await queries.deviceWithType({ code: 'd1' })   // DeviceWithType[]
```

How the types are built:

- A property that is `required` or part of the primary key is never `null`; any other field, computed ones included,
  can be `null`.
- A property with an enumeration of the domain has the enum type of `model.ts`.
- An include of one row can be `null`; an include of a list is an array, never `null`.
- `json` is `any` and `vector` is `number[]`.

## With the Node.js client

`lambdaorm build -l client-node` writes the same `queries.ts`, importing from `@lambdaorm/client`, for the
`application.queries` of the client project's `lambdaORM.yaml`. The types come from the
[Data Gateway](../data-gateway/index.md), which compiles each query with the view of the caller; a query the gateway
rejects is an error that names it. `required` and `enum` need a gateway that runs `@lambdaorm/lib` 3.13 or later.

## Where the types come from

The types come from `orm.model(query)` (also [`lambdaorm model`](../cli/Commands/Model.md)), which describes the result
of a query: for each field its `name` and `type`, whether it always has a value (`required`), its `enum`, and the
fields of the includes in `children` (the type of a list ends in `[]`). The parameters come from
`orm.parameters(query)`. See [Query metadata](../queries/Metadata.md).
