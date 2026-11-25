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
| view | | Erzeugt das Modell und die Repositories einer [View](../../schema/Views.md): nur ihre Entitäten und Eigenschaften; ihre Repositories verwenden sie. |

Mit `application.queries` im Schema schreibt das Modell auch `queries.ts`: den Typ des Ergebnisses jeder Abfrage und eine typisierte Methode, die sie ausführt ([Typisierte Abfragen](../../usage/TypedQueries.md)).

Außerdem bereitet er das Projekt vor: Er legt `package.json` und `tsconfig.json` an, falls sie fehlen, und installiert
`typescript`, die Bibliothek (`@lambdaorm/lib`, oder `@lambdaorm/client` mit `client-node`) und, mit `node`, den
Treiber des Dialekts jeder Quelle (`mysql2`, `pg`, `tedious`, …), wenn sie fehlen. Der Quellcodepfad ist standardmäßig
`src` und der Domänenpfad `domain` (oder die aus `infrastructure.paths` des Schemas, falls gesetzt). `--view` gilt nur
für `node`: Mit dem Client wählt das Data Gateway die View des Aufrufers.

## Beispiele {#examples}

```sh
lambdaorm build -w lab/countries
```

Ein Projekt, das ein Data Gateway verwendet (erstellt mit `lambdaorm init -u <url>`):

```sh
lambdaorm build -w lab/client -l client-node
```
