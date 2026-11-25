# Typisierte Abfragen {#typed-queries}

Die Abfragen einer Anwendung werden im Schema mit einem Namen deklariert, und λORM gibt jeder den TypeScript-Typ ihres
Ergebnisses und eine typisierte Funktion, die sie ausführt. Sie lohnen sich, wenn der Code zur Kompilierzeit wissen
muss, was eine Abfrage zurückgibt, einschließlich Includes und Enums.

## Die Abfragen deklarieren {#declaring-the-queries}

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

Sie werden beim Laden des Schemas geprüft: Der Name muss ein Bezeichner und eindeutig sein, und die Abfrage muss
kompilieren. Ein Fehler nennt die Abfrage: `Invalid application.queries: deviceWithType: …`.

## Die Typen erzeugen {#generating-the-types}

[`lambdaorm build`](../cli/Commands/Build.md) schreibt `queries.ts` in den Domänenpfad (standardmäßig `src/domain`),
neben `model.ts`. λORM verwaltet die Datei und schreibt sie bei jedem Build neu; mit `--view` sind die Typen die, die
die [View](../schema/Views.md) sieht.

```ts
/** a device with its type and category */
export interface DeviceWithType {
  code: string
  brand: string | null          // nicht required: kann ohne Wert sein
  status: Status                // das Enum aus model.ts
  deviceType: {                 // ein Include einer Zeile: kann fehlen
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

Verwendung:

```ts
import { orm } from '@lambdaorm/lib'
import { Queries } from './domain/queries'

await orm.init()
const queries = new Queries(orm, { stage: 'default' })
const devices = await queries.deviceWithType({ code: 'd1' })   // DeviceWithType[]
```

Wie die Typen entstehen:

- Eine Eigenschaft, die `required` ist oder zum Primärschlüssel gehört, ist nie `null`; jedes andere Feld,
  einschließlich berechneter, kann `null` sein.
- Eine Eigenschaft mit einem Enum der Domäne hat den Enum-Typ aus `model.ts`.
- Ein Include einer Zeile kann `null` sein; ein Include einer Liste ist ein Array, nie `null`.
- `json` ist `any` und `vector` ist `number[]`.

## Mit dem Node.js-Client {#with-the-nodejs-client}

`lambdaorm build -l client-node` schreibt dieselbe `queries.ts`, mit Imports aus `@lambdaorm/client`, für die
`application.queries` der `lambdaORM.yaml` des Client-Projekts. Die Typen kommen vom
[Data Gateway](../data-gateway/index.md), das jede Abfrage mit der View des Aufrufers kompiliert; eine Abfrage, die das
Gateway ablehnt, ist ein Fehler, der sie nennt. `required` und `enum` erfordern ein Gateway mit `@lambdaorm/lib` 3.13
oder neuer.

## Woher die Typen kommen {#where-the-types-come-from}

Die Typen kommen von `orm.model(query)` (auch [`lambdaorm model`](../cli/Commands/Model.md)), das das Ergebnis einer
Abfrage beschreibt: für jedes Feld `name` und `type`, ob es immer einen Wert hat (`required`), sein `enum` und die
Felder der Includes in `children` (der Typ einer Liste endet auf `[]`). Die Parameter kommen von
`orm.parameters(query)`. Siehe [Abfrage-Metadaten](../queries/Metadata.md).
