# In your own application

The IDE is built with [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui), a library of React components
that any web application can use against a Data Gateway: the whole workspace, or one query editor, a diagram, the form
of an entity. The gateway answers no CORS: the application calls it through its own backend, as the IDE does.

```sh
npm install @lambdaorm/ui react react-dom
```

```tsx
import { Workspace } from '@lambdaorm/ui'
import '@lambdaorm/ui/styles.css'

<Workspace
  baseUrl="/api/gateway"                         // your backend, which forwards to the gateway (it answers no CORS)
  headers={() => ({ 'X-Api-Key': key })}         // how to authenticate; the library keeps no credential
  locale="es"
  theme="dark"
  workspaceKey={`gateway.example.com|${user}`}   // separates what is saved
/>
```

| Component | What it is |
| --- | --- |
| `Workspace` | the whole workspace: explorer, entity forms, queries and their [wizard](QueryWizard.md), saved items and diagrams |
| `QueryWorkbench` | one query editor with its actions and result |
| `QueryTabs` | several workbenches in tabs |
| `DomainDiagram` | a diagram of the domain (an entity and its neighbours, the whole model, or chosen entities) |
| `EntityView` | the form of an entity |
| `ResultViewer` | a result as tree, table, JSON or YAML, with copy and export |
| `ExpressionInput` | an editor of one expression of 3xpr, checked by the gateway |
| `SchemaEditor` | the `lambdaORM.yaml` of a schema, checked while it is written ([Administration](Administration.md#the-yaml)) |
| `SchemaForms` | the forms of the elements of a schema ([Administration](Administration.md#forms)) |
| `CommandsPanel` | the commands of a schema on its stages, with their previews and jobs |
| `StageDiagram` | the diagram of a stage ([Administration](Administration.md#the-diagram-of-a-stage)) |
| `HistoryView` | the history of a schema, or of one of its elements |

What is saved can go to another place than the browser by giving `store` (a `WorkspaceStore`, for example a backend of
your own). Several gateways go in one `Workspace` with `connections` (each one with its name, its `baseUrl`, its
`headers` or its own `fetch`), as the IDE does; `pages` and `openPage` show pages of your application (an account, the
preferences) as tabs.
