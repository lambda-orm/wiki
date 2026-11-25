# Schema {#schema}

Gibt einen Teil des Schemas des Projekts zurück, oder eines Schemas, das ein
[Data Gateway](../../data-gateway/index.md) mit `-u` bereitstellt: das ganze Schema, die Domäne, eine Entität, ein
Mapping, eine Stage oder die Views. Damit lässt sich prüfen, was λORM geladen hat, mit aufgelösten Umgebungsvariablen
und vervollständigten geerbten Entitäten.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| path | `-p` | Der zurückzugebende Teil des Schemas (erforderlich); siehe unten. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |
| output | `-o` | Ausgabeformat: `json`, `beautiful`, `light` oder `yaml`. |
| url | `-u` | URL des Schemas auf einem [Data Gateway](../../data-gateway/index.md), um den Befehl dort auszuführen. |

| Pfad | Liefert |
| :-- | :-- |
| `schema` | Das ganze Schema. |
| `schema/version` | Die Version des Schemas. |
| `domain` | Die Domäne: Entitäten und Enumerationen. |
| `entities`, `entities/<Name>` | Die Entitäten, oder eine davon. |
| `enums`, `enums/<Name>` | Die Enumerationen, oder eine davon. |
| `sources/<Name>` | Eine Quelle. |
| `mappings`, `mappings/<Name>`, `mappings/<Name>/<Entität>` | Die Mappings, eines davon, oder das Mapping einer Entität. |
| `stages`, `stages/<Name>` | Die Stages, oder eine davon. |
| `views` | Die Views. |

Ein unbekannter Pfad gibt `the path … is not valid` aus und endet mit Exit-Code 1.

## Beispiele {#examples}

```sh
lambdaorm schema -w lab/northwind -p entities/Orders -o yaml
lambdaorm schema -u http://gateway:8080/northwind -p mappings/default/Customers -o beautiful
```
