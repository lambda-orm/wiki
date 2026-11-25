# Consultas tipadas {#typed-queries}

Se declaran las consultas de una aplicación en el esquema, con un nombre, y λORM le da a cada una el tipo TypeScript
de su resultado y una función tipada que la ejecuta. Conviene usarlas cuando el código debe saber en tiempo de
compilación qué devuelve una consulta, incluidos los includes y los enums.

## Declarar las consultas {#declaring-the-queries}

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

Se validan al cargar el esquema: el nombre debe ser un identificador y único, y la consulta debe compilar. Un error
nombra la consulta: `Invalid application.queries: deviceWithType: …`.

## Generar los tipos {#generating-the-types}

[`lambdaorm build`](../cli/Commands/Build.md) escribe `queries.ts` en la ruta del dominio (por defecto `src/domain`),
junto a `model.ts`. λORM gestiona el archivo y lo reescribe en cada build; con `--view`, los tipos son los que ve la
[vista](../schema/Views.md).

```ts
/** a device with its type and category */
export interface DeviceWithType {
  code: string
  brand: string | null          // sin required: puede no tener valor
  status: Status                // el enum de model.ts
  deviceType: {                 // un include de una fila: puede faltar
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

Uso:

```ts
import { orm } from '@lambdaorm/lib'
import { Queries } from './domain/queries'

await orm.init()
const queries = new Queries(orm, { stage: 'default' })
const devices = await queries.deviceWithType({ code: 'd1' })   // DeviceWithType[]
```

Cómo se construyen los tipos:

- Una propiedad `required` o que forma parte de la clave primaria nunca es `null`; cualquier otro campo, incluidos los
  calculados, puede ser `null`.
- Una propiedad con un enum del dominio tiene el tipo del enum de `model.ts`.
- Un include de una fila puede ser `null`; un include de una lista es un arreglo, nunca `null`.
- `json` es `any` y `vector` es `number[]`.

## Con el cliente de Node.js {#with-the-nodejs-client}

`lambdaorm build -l client-node` escribe el mismo `queries.ts`, importando de `@lambdaorm/client`, para las
`application.queries` del `lambdaORM.yaml` del proyecto cliente. Los tipos vienen del
[Data Gateway](../data-gateway/index.md), que compila cada consulta con la vista de quien llama; una consulta que el
gateway rechaza es un error que la nombra. `required` y `enum` necesitan un gateway que ejecute `@lambdaorm/lib` 3.13 o
posterior.

## De dónde vienen los tipos {#where-the-types-come-from}

Los tipos vienen de `orm.model(query)` (también [`lambdaorm model`](../cli/Commands/Model.md)), que describe el
resultado de una consulta: de cada campo su `name` y su `type`, si siempre tiene valor (`required`), su `enum`, y los
campos de los includes en `children` (el tipo de una lista termina en `[]`). Los parámetros vienen de
`orm.parameters(query)`. Ver [Metadatos de consultas](../queries/Metadata.md).
