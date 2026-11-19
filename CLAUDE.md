# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Documentation wiki for **λORM** (LambdaORM), a distributed TypeScript/Node.js ORM, and its Data Gateway. The site is
built with [MkDocs](https://www.mkdocs.org/) and its `readthedocs` theme (the side menu lists the pages, not the
headings of the current page; `overrides/main.html` adds the language selector), in four languages (English, German, Spanish, Portuguese) with
[mkdocs-static-i18n](https://ultrabug.github.io/mkdocs-static-i18n/).

- `docs/` — Markdown source files (edit these)
- `wiki/` — the generated HTML (`mkdocs build`); ignored by git: CI builds the site
- `overrides/` — the theme's template overrides (the language selector)
- `mkdocs.yml` — site configuration, navigation and the translations of the navigation
- `requirements-docs.txt` — the pinned versions of MkDocs and the i18n plugin

## Commands

```bash
# Requirements (Python 3.12+), in a virtual environment
python3 -m venv .venv && .venv/bin/pip install -r requirements-docs.txt

# Preview locally (live reload at http://127.0.0.1:8000)
.venv/bin/mkdocs serve

# Build the static site into wiki/, as CI does (strict: a broken link between pages fails)
.venv/bin/mkdocs build --strict
```

## Key workflow

1. Edit Markdown in `docs/`.
2. Check it with `mkdocs serve` or `mkdocs build --strict`.
3. Commit `docs/` only. CI (`.github/workflows/static.yml`) builds the site with `mkdocs build --strict`, checks the
   README's links to the wiki (`scripts/check_wiki_links.py`) and, on a push to `main`, publishes it to GitHub Pages;
   pull requests build and check without publishing.

## Languages

- English is the default and the source: `Page.md`. Its translations are next to it: `Page.de.md`, `Page.es.md`,
  `Page.pt.md`. A page without a translation is shown in English in that language.
- A change to an English page must be carried to its translations in the same change.
- The navigation titles are translated in `mkdocs.yml` (`plugins.i18n.languages[].nav_translations`).
- The generated API references (`docs/source/`, `docs/cli/source/`) and the change logs are not translated.

## Commit conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) — this is used to auto-generate
changelogs. Branch names follow Git Flow: `feature/<name>`, `bugfix/<name>`, `release/<name>`, `hotfix/<name>`.

## Navigation

The site navigation is defined in `mkdocs.yml` under `nav:` (tabs: Home, Data Gateway, Queries, Schema, Usage, CLI).
When adding a new doc page, register it there and add its title to the `nav_translations` of each language.
