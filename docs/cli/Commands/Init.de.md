# Init {#init}

Erzeugt die Struktur eines λORM-Projekts: den Workspace-Ordner und seine Schemadatei (`lambdaORM.yaml`) mit einer Quelle,
einem Mapping und einem Stage.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: `my-project`). |
| source | `-s` | Name der Datenquelle. |
| dialect | `-d` | Datenbank-Engine des Projekts (`MySQL`, `MariaDB`, `PostgreSQL`, `SqlServer`, `Oracle`, `MongoDB`, `SQLjs`). Standard: `MySQL`. |
| connection | `-c` | Verbindungszeichenfolge der Datenbank. |
| data-path | | Relativer Pfad des Datenordners im Workspace (`--data-path`). |
| url | `-u` | URL eines Schemas auf einem Data Gateway: Das Projekt wird mit der Domäne dieses Schemas erstellt, zur Verwendung mit dem [Node.js-Client](../../data-gateway/Clients.md). |

Ohne `-c` erhält die Quelle eine lokale Verbindung für den Dialekt (zum Beispiel `localhost:5432` für PostgreSQL oder
die Datei `data.sqlite` für `SQLjs`), die durch die eigene zu ersetzen ist, am besten mit einer
[Umgebungsvariable](../../schema/SchemaDefinition-EnvironmentVariables.md). Existiert die Schemadatei bereits, ergänzt
`init` sie, statt sie zu ersetzen. Außerdem trägt er den Log-Ordner von λORM in `.gitignore` ein. Danach erzeugt
[build](Build.md) den Code und [push](Push.md) legt die Tabellen an.

## Beispiel {#example}

```sh
lambdaorm init -w lab/countries -d PostgreSQL
```
