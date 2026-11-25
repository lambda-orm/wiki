# Consultas tipadas {#typed-queries}

Declare as consultas de uma aplicação no esquema, com um nome, e o λORM dá a cada uma o tipo TypeScript do seu
resultado e uma função tipada que a executa. Use-as quando o código precisa saber em tempo de compilação o que uma
consulta retorna, incluindo os includes e os enums.

## Declarar as consultas {#declaring-the-queries}

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

Elas são validadas quando o esquema é carregado: o nome deve ser um identificador e único, e a consulta deve compilar.
Um erro nomeia a consulta: `Invalid application.queries: deviceWithType: …`.

## Gerar os tipos {#generating-the-types}

[`lambdaorm build`](../cli/Commands/Build.md) escreve `queries.ts` no caminho do domínio (por padrão `src/domain`), ao
lado de `model.ts`. O λORM gerencia o arquivo e o reescreve a cada build; com `--view`, os tipos são os que a
[view](../schema/Views.md) vê.

```ts
/** a device with its type and category */
export interface DeviceWithType {
  code: string
  brand: string | null          // sem required: pode não ter valor
  status: Status                // o enum de model.ts
  deviceType: {                 // um include de uma linha: pode faltar
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

Como os tipos são construídos:

- Uma propriedade `required` ou que faz parte da chave primária nunca é `null`; qualquer outro campo, incluindo os
  calculados, pode ser `null`.
- Uma propriedade com um enum do domínio tem o tipo do enum de `model.ts`.
- Um include de uma linha pode ser `null`; um include de uma lista é um array, nunca `null`.
- `json` é `any` e `vector` é `number[]`.

## Com o cliente Node.js {#with-the-nodejs-client}

`lambdaorm build -l client-node` escreve o mesmo `queries.ts`, importando de `@lambdaorm/client`, para as
`application.queries` do `lambdaORM.yaml` do projeto cliente. Os tipos vêm do [Data Gateway](../data-gateway/index.md),
que compila cada consulta com a view de quem chama; uma consulta que o gateway rejeita é um erro que a nomeia.
`required` e `enum` precisam de um gateway que execute `@lambdaorm/lib` 3.13 ou posterior.

## De onde vêm os tipos {#where-the-types-come-from}

Os tipos vêm de `orm.model(query)` (também [`lambdaorm model`](../cli/Commands/Model.md)), que descreve o resultado de
uma consulta: de cada campo seu `name` e seu `type`, se sempre tem valor (`required`), seu `enum`, e os campos dos
includes em `children` (o tipo de uma lista termina em `[]`). Os parâmetros vêm de `orm.parameters(query)`. Veja
[Metadados de consultas](../queries/Metadata.md).
