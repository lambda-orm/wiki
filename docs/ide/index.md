# Data Gateway IDE

The IDE of the Data Gateway: connect to your gateways, browse their schemas, read each entity as a form, write queries
with autocompletion or with the [query wizard](QueryWizard.md), draw diagrams and administer the schemas. Like a
database IDE, it connects to gateways, one or several, each with its credential; their schemas, workspaces and what is
saved in them stay in the gateways.

Use it to explore a schema you don't know, to try a query before it goes into your code, to show the domain as a
diagram and, with a credential of administration, to change the schema and apply it to the databases.

It comes in two ways, the same app and the same version:

- **The desktop app**, for Linux, Windows and macOS, [downloaded](Download.md) and run on your machine: it connects
  from it.
- **The web IDE**, the image [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  deployed next to the gateways and used from the browser ([In a container](#in-a-container)).

![The query wizard](images/ide-wizard.png)

## The pages of this section

| Page | What it explains |
| --- | --- |
| [Download](Download.md) | the desktop app for each system, and how to install it |
| [Getting started](GettingStarted.md) | from the first connection to a query, a query of the wizard and a diagram, on Northwind |
| [Connections](Connections.md) | a connection to a gateway, its credential, its session, its roles, its REST, WebSocket and MCP |
| [Explorer](Explorer.md) | the tree of the connections and their schemas, its filter, the tabs |
| [Entities](Entities.md) | the view of an entity: properties, relations, keys, constraints, its rows, its diagram and its history |
| [Queries](Queries.md) | the query editor, its suggestions, data and options, its actions, the result, the history |
| [Query wizard](QueryWizard.md) | a query written from a diagram: tables, fields, filter, order and page |
| [Diagrams](Diagrams.md) | the diagrams of the domain: saved, edited, exported |
| [Workbench](Projects.md) | projects, folders, saved queries and diagrams; where they are kept, export and import |
| [Administration](Administration.md) | the schemas edited from the IDE: YAML and forms, variables, commands, stages, code, history, new schemas |
| [Deploying](Deploying.md) | the web IDE in a container, its targets, where it runs and how it reaches a gateway |
| [In your own application](Embedding.md) | the components of `@lambdaorm/ui` in a React application |

## The window {#the-window}

| Part | Where | What it has |
| --- | --- | --- |
| **The menu λORM Data Gateway ▾** | top left, over the explorer | **Preferences**, **Wiki** (this documentation, in the language of the IDE), **Update** and **About** |
| **Connections** | next to the menu | how many connections there are, ⟳ (read everything again) and **+** (**New connection**) |
| **The explorer** | left | the connections and, for each one, its schemas: metadata, state, source code and workbench ([Explorer](Explorer.md)) |
| **The tabs** | right | queries, entities, diagrams, schemas, connections and preferences, side by side; several connections at once |

![The menu of the app](images/ide-app-menu.png)

**Preferences** opens in a tab:

- **Language:** English, Español, Português, Français, Italiano, Deutsch, Nederlands, Català, Galego, Euskara. The
  first time, the language of the browser.
- **Regional format:** the culture of the numbers and dates of the results (en-US, es-AR, pt-BR, de-DE…), with a sample.
- **Theme:** System (light or dark as the system), Light, Dark, Dracula, Night, Nord, Solarized Light, Solarized Dark,
  Monokai, High Contrast, each one previewed with its colours.

They are remembered by the browser (or by the desktop app).

![Preferences](images/ide-preferences.png)

![Dark, in Spanish](images/ide-dark-es.png)

**Update** says whether a newer version is out. The desktop app looks for it as **Help → Check for updates** does
([Download](Download.md#installing-it)); the web IDE can't update itself, so it shows the new version and the command
that takes its image (`docker pull flaviorita/data-gateway-ide:<version>`), with what is new. **About** shows the
version, how it runs (web, or desktop and its system), the version of `@lambdaorm/ui`, the license and the links to its
source code and to this wiki.

When the web IDE is updated while a page is open, the page says that a new version is there, with **Reload**: what is
saved stays.

## Where it connects {#where-it-connects}

The IDE connects to the `management` port of each gateway ([Transports](../data-gateway/Transports.md#management)),
with a [session](Connections.md#sessions) opened with your credential. The desktop app connects from your machine: for
a gateway that is not on it, a VPN, an SSH tunnel or a `kubectl port-forward` reaches its `management` without
publishing it ([Where the IDE runs](Deploying.md#where-the-ide-runs)).

What it can do depends on the permissions of the credential: reading needs `read`; saving in the workspace,
`workbenchWrite`; administering, `schemaRead`, `schemaWrite` and the others
([Connections → Roles](Connections.md#roles)). What the credential can't do is not shown, or shows disabled with the
reason.

## In a container {#in-a-container}

For a web IDE shared by a team, next to the gateways, with `management` only on their internal network:

```sh
docker run -p 127.0.0.1:8090:8080 -e DATA_GATEWAY_IDE_TARGETS='http://data-gateway:9090' flaviorita/data-gateway-ide
```

See [Deploying](Deploying.md).
