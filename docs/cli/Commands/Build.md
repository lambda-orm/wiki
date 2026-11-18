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

## Example

```sh
lambdaorm build -w lab/countries
```
