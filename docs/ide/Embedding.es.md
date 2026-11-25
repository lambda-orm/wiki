# En tu propia aplicación {#in-your-own-application}

El IDE está hecho con [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui), una biblioteca de componentes de
React que cualquier aplicación web puede usar contra un Data Gateway: el workspace entero, o un editor de consultas, un
diagrama, el formulario de una entidad. El gateway no responde CORS: la aplicación lo llama a través de su propio
backend, como hace el IDE.

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

| Componente | Qué es |
| --- | --- |
| `Workspace` | el workspace entero: explorador, formularios de entidades, consultas y su [asistente](QueryWizard.md), elementos guardados y diagramas |
| `QueryWorkbench` | un editor de consultas con sus acciones y su resultado |
| `QueryTabs` | varios workbenches en pestañas |
| `DomainDiagram` | un diagrama del dominio (una entidad y sus vecinas, el modelo entero, o entidades elegidas) |
| `EntityView` | el formulario de una entidad |
| `ResultViewer` | un resultado como árbol, tabla, JSON o YAML, con copiar y exportar |
| `ExpressionInput` | un editor de una expresión de 3xpr, verificada por el gateway |
| `SchemaEditor` | el `lambdaORM.yaml` de un esquema, verificado mientras se escribe ([Administración](Administration.md#the-yaml)) |
| `SchemaForms` | los formularios de los elementos de un esquema ([Administración](Administration.md#forms)) |
| `CommandsPanel` | los comandos de un esquema sobre sus stages, con sus vistas previas y sus trabajos |
| `StageDiagram` | el diagrama de un stage ([Administración](Administration.md#the-diagram-of-a-stage)) |
| `HistoryView` | el historial de un esquema, o de uno de sus elementos |

Lo guardado puede ir a otro lugar que no sea el navegador dando `store` (un `WorkspaceStore`, por ejemplo un backend
propio). Varios gateways van en un mismo `Workspace` con `connections` (cada uno con su nombre, su `baseUrl`, sus
`headers` o su propio `fetch`), como hace el IDE; `pages` y `openPage` muestran páginas de tu aplicación (una cuenta,
las preferencias) como pestañas.
