# λORM Wiki

This repository contains the documentation for **LambdaORM**, generated with [MkDocs](https://www.mkdocs.org/) using the **Read the Docs** theme.

## Requirements

- Python 3.12+
- [pipx](https://pypa.github.io/pipx/) or `venv`

Install MkDocs with pipx:

```bash
pipx install mkdocs
```

Make sure that `~/.local/bin` is in your PATH:
```bash
pipx ensurepath
exec $SHELL -l
```

## Structure

- `mkdocs.yml` → main configuration file
- `docs/` → source documents in Markdown
- `wiki/` → output folder with generated HTML files (`mkdocs build` will create/update it)

## Local usage

Start a local development server:

```bash
mkdocs serve
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Build

Generate the static site in the `wiki/` folder:

```bash
mkdocs build
```

## Deployment to GitHub Pages

Deploy the wiki to GitHub Pages:

```bash
mkdocs gh-deploy
```

This will create or update the `gh-pages` branch in the repository and the wiki will be available at:

```
https://<username>.github.io/<repository>/
```