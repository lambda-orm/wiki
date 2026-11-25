# Na sua própria aplicação {#in-your-own-application}

A IDE é construída com [`@lambdaorm/ui`](https://www.npmjs.com/package/@lambdaorm/ui), uma biblioteca de componentes
React que qualquer aplicação web pode usar contra um Data Gateway: o workspace inteiro, ou um editor de consultas, um
diagrama, o formulário de uma entidade. O gateway não responde CORS: a aplicação o chama pelo seu próprio backend, como
faz a IDE.

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

| Componente | O que é |
| --- | --- |
| `Workspace` | o workspace inteiro: explorador, formulários de entidades, consultas e o seu [assistente](QueryWizard.md), itens salvos e diagramas |
| `QueryWorkbench` | um editor de consultas com as suas ações e o seu resultado |
| `QueryTabs` | vários workbenches em abas |
| `DomainDiagram` | um diagrama do domínio (uma entidade e as suas vizinhas, o modelo inteiro, ou entidades escolhidas) |
| `EntityView` | o formulário de uma entidade |
| `ResultViewer` | um resultado como árvore, tabela, JSON ou YAML, com cópia e exportação |
| `ExpressionInput` | um editor de uma expressão do 3xpr, verificada pelo gateway |
| `SchemaEditor` | o `lambdaORM.yaml` de um esquema, verificado enquanto é escrito ([Administração](Administration.md#the-yaml)) |
| `SchemaForms` | os formulários dos elementos de um esquema ([Administração](Administration.md#forms)) |
| `CommandsPanel` | os comandos de um esquema sobre os seus stages, com as suas prévias e jobs |
| `StageDiagram` | o diagrama de um stage ([Administração](Administration.md#the-diagram-of-a-stage)) |
| `HistoryView` | o histórico de um esquema, ou de um dos seus elementos |

O que é salvo pode ir para outro lugar que não o navegador, passando `store` (um `WorkspaceStore`, por exemplo um
backend próprio). Vários gateways cabem em um `Workspace` com `connections` (cada um com o seu nome, o seu `baseUrl`,
os seus `headers` ou o seu próprio `fetch`), como faz a IDE; `pages` e `openPage` mostram páginas da sua aplicação (uma
conta, as preferências) como abas.
