# Build

Generates the source code of the domain for the development language: the model (`model.ts`, with the entities and
enumerations) and one repository per entity (`repository<Entity>.ts`). See [Repositories](../../usage/Repository.md).

A repository file is generated only if it does not exist yet, so custom code added to it is kept; the model is
regenerated every time.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path. |
| language | `-l` | Development language: `node` (default, uses `@lambdaorm/lib`) or `client-node` (uses `@lambdaorm/client`; the domain is read from the Data Gateway at `infrastructure.service.url` of the schema, as written by [`init -u`](Init.md)). |
| model | `-m` | Builds the model. |
| repositories | `-r` | Builds the repositories. |
| all | `-a` | Builds the model and the repositories (the default when none of `-m`, `-r`, `-a` is given). |
| src-path | | Relative path of the source code in the workspace (`--src-path`). |
| data-path | | Relative path of the data folder in the workspace (`--data-path`). |
| domain-path | | Relative path of the domain in the source code path (`--domain-path`). |
| url | `-u` | URL of the schema on a Data Gateway. |
| view | | Builds the model and the repositories of a [view](../../schema/Views.md): only its entities and properties; its repositories use it. |

With `application.queries` in the schema, the model also writes `queries.ts`: the type of the result of each query and
a typed method that runs it ([Typed queries](../../usage/TypedQueries.md)).

It also prepares the project: it creates `package.json` and `tsconfig.json` if they don't exist, and installs
`typescript`, the library (`@lambdaorm/lib`, or `@lambdaorm/client` with `client-node`) and, with `node`, the driver of
each source's dialect (`mysql2`, `pg`, `tedious`, …) when they are missing. The source path defaults to `src` and the
domain path to `domain` (from `infrastructure.paths` of the schema when set). `--view` is only for `node`: with the
client, the Data Gateway chooses the view of the caller.

## Examples

```sh
lambdaorm build -w lab/countries
```

A project that uses a Data Gateway (created with `lambdaorm init -u <url>`):

```sh
lambdaorm build -w lab/client -l client-node
```
