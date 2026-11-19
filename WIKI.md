# λORM Wiki

This repository contains the documentation for **LambdaORM**, generated with [MkDocs](https://www.mkdocs.org/) using the **Read the Docs** theme.

## Requirements

- Python 3.12+
- [pipx](https://pypa.github.io/pipx/) or `venv`

Install MkDocs with pipx:

```bash
pipx install mkdocs
pipx install mkdocs-material
pipx inject mkdocs mkdocs-material
```

Make sure that `~/.local/bin` is in your PATH:
```bash
pipx ensurepath
exec $SHELL -l
```

## Structure

- `mkdocs.yml` → main configuration file
- `docs/` → source documents in Markdown
- `wiki/` → output folder with the generated HTML (`mkdocs build` creates it; not committed: CI builds the site)

## Local usage

Start a local development server:

```bash
mkdocs serve
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Build

Generate the static site in the `wiki/` folder (ignored by git), as CI does:

```bash
mkdocs build --strict
```

## Deployment to GitHub Pages

CI publishes the wiki: on every push to `main`, `.github/workflows/static.yml` builds the site with
`mkdocs build --strict`, checks the README's links to the wiki and deploys it to
[lambda-orm.github.io/wiki](https://lambda-orm.github.io/wiki). Pull requests build and check without publishing.
There is nothing to deploy by hand.
