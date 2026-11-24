# Data Gateway IDE

The IDE of the Data Gateway: connect to your gateways, browse their schemas, read each entity as a form, write queries
with autocompletion or with the [query wizard](QueryWizard.md), draw diagrams and administer the schemas. Like a
database IDE, it connects to gateways, one or several, each with its credential; their schemas, workspaces and projects
stay in them.

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
| [Entities](Entities.md) | the form of an entity: properties, relations, keys, its rows and its diagram |
| [Queries](Queries.md) | the query editor, its suggestions, data and options, its actions, the result, the history |
| [Query wizard](QueryWizard.md) | a query written from a diagram: tables, fields, filter, order and page |
| [Diagrams](Diagrams.md) | the diagrams of the domain: saved, edited, exported |
| [Projects](Projects.md) | folders, saved queries and diagrams; where they are kept, export and import |
| [Administration](Administration.md) | the schemas edited from the IDE: YAML and forms, variables, commands, new schemas |
| [Deploying](Deploying.md) | the web IDE in a container, its targets, where it runs and how it reaches a gateway |
| [In your own application](Embedding.md) | the components of `@lambdaorm/ui` in a React application |

## The window

| Part | Where | What it has |
| --- | --- | --- |
| **The header** | top | the name and version of the IDE, **Documentation** (this wiki, in its language) and the menu ☰: **New connection** and **Preferences** |
| **The explorer** | left | the connections and, for each one, its schemas: metadata, domain, entities, projects ([Explorer](Explorer.md)) |
| **The tabs** | right | queries, entities, diagrams, schemas, connections and preferences, side by side; several connections at once |

**Preferences** (menu ☰ → Preferences) has:

- **Language:** English, Español, Português, Français, Italiano, Deutsch, Nederlands, Català, Galego, Euskara.
- **Regional format:** the culture of the numbers and dates of the results (en-US, es-AR, pt-BR, de-DE…), with a sample.
- **Theme:** System (light or dark as the system), Light, Dark, Dracula, Night, Nord, Solarized Light, Solarized Dark,
  Monokai, High Contrast.

They are remembered by the browser (or by the desktop app).

![Preferences](images/ide-preferences.png)

![Dark, in Spanish](images/ide-dark-es.png)

## Where it connects {#where-it-connects}

The IDE connects to the `management` port of each gateway ([Transports](../data-gateway/Transports.md#management)),
with a [session](Connections.md#sessions) opened with your credential. The desktop app connects from your machine: for
a gateway that is not on it, a VPN, an SSH tunnel or a `kubectl port-forward` reaches its `management` without
publishing it ([Where the IDE runs](Deploying.md#where-the-ide-runs)).

What it can do depends on the permissions of the credential: reading needs `read`; saving in the workspace,
`workbenchWrite`; administering, `schemaRead`, `schemaWrite` and the others
([Connections → Roles](Connections.md#roles)).

## In a container {#in-a-container}

For a web IDE shared by a team, next to the gateways, with `management` only on their internal network:

```sh
docker run -p 127.0.0.1:8090:8080 -e DATA_GATEWAY_IDE_TARGETS='http://data-gateway:9090' flaviorita/data-gateway-ide
```

See [Deploying](Deploying.md).
