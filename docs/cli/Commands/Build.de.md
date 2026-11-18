# Build {#build}

Erzeugt den Quellcode der Domäne für die Entwicklungssprache: das Modell (`model.ts`, mit den Entitäten und
Enumerationen) und ein Repository pro Entität (`repository<Entity>.ts`). Siehe [Repositories](../../usage/Repository.md).

Eine Repository-Datei wird nur erzeugt, wenn sie noch nicht existiert, sodass darin hinzugefügter eigener Code erhalten bleibt; das Modell wird
jedes Mal neu erzeugt.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad. |
| language | `-l` | Entwicklungssprache: `node` (Standard, verwendet `@lambdaorm/lib`) oder `client-node` (verwendet `@lambdaorm/client`; die Domäne wird vom Data Gateway unter `infrastructure.service.url` des Schemas gelesen, wie von [`init -u`](Init.md) geschrieben). |
| model | `-m` | Erzeugt das Modell. |
| repositories | `-r` | Erzeugt die Repositories. |
| all | `-a` | Erzeugt das Modell und die Repositories (Standard, wenn weder `-m`, `-r` noch `-a` angegeben ist). |
| src-path | | Relativer Pfad des Quellcodes im Workspace (`--src-path`). |
| data-path | | Relativer Pfad des Datenordners im Workspace (`--data-path`). |
| domain-path | | Relativer Pfad der Domäne im Quellcodepfad (`--domain-path`). |
| url | `-u` | URL des Schemas auf einem Data Gateway. |

## Beispiel {#example}

```sh
lambdaorm build -w lab/countries
```
