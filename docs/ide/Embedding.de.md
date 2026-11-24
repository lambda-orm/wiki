# In deiner eigenen Anwendung

Die IDE ist mit [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui) gebaut, einer Bibliothek von
React-Komponenten, die jede Webanwendung gegenüber einem Data Gateway verwenden kann: den ganzen Workspace, oder einen
einzelnen Abfrage-Editor, ein Diagramm, das Formular einer Entität. Das Gateway beantwortet kein CORS: Die Anwendung
ruft es über ihr eigenes Backend auf, wie es die IDE tut.

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

| Komponente | Was sie ist |
| --- | --- |
| `Workspace` | der ganze Workspace: Explorer, Formulare der Entitäten, Abfragen und ihr [Assistent](QueryWizard.md), gespeicherte Elemente und Diagramme |
| `QueryWorkbench` | ein einzelner Abfrage-Editor mit seinen Aktionen und seinem Ergebnis |
| `QueryTabs` | mehrere Workbenches in Tabs |
| `DomainDiagram` | ein Diagramm der Domäne (eine Entität und ihre Nachbarn, das ganze Modell oder gewählte Entitäten) |
| `EntityView` | das Formular einer Entität |
| `ResultViewer` | ein Ergebnis als Baum, Tabelle, JSON oder YAML, mit Kopieren und Exportieren |
| `ExpressionInput` | ein Editor für einen einzelnen Ausdruck von 3xpr, vom Gateway geprüft |

Das Gespeicherte kann an einen anderen Ort als den Browser gehen, indem man `store` übergibt (ein `WorkspaceStore`, zum
Beispiel ein eigenes Backend).
