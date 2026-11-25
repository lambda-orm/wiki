# λORM CLI {#orm-cli}

Die λORM CLI ([`@lambdaorm/cli`](https://www.npmjs.com/package/@lambdaorm/cli)) ist eine Kommandozeilenanwendung zur Verwendung von
[λORM](https://www.npmjs.com/package/@lambdaorm/lib): Sie erstellt Projekte, synchronisiert die Datenbanken mit dem Schema,
importiert und exportiert Daten und führt Abfragen und Skripte aus. Ihre Befehle laufen lokal mit einem Workspace (`-w`), und die meisten
von ihnen können auch auf einem [Data Gateway](../data-gateway/index.md) ausgeführt werden (`-u <url>`).

## Installation {#installation}

Installieren Sie das Paket global; es stellt den Befehl `lambdaorm` bereit:

```sh
npm i -g @lambdaorm/cli
lambdaorm --version
```

Es erfordert Node.js 20 oder höher. Das Docker-Image des Data Gateway
([flaviorita/data-gateway](https://hub.docker.com/r/flaviorita/data-gateway)) enthält die CLI bereits.

!!! note "Hinweis"
    Das Paket `lambdaorm-cli` ohne Scope ist das alte Paket und wird nicht mehr gepflegt.

## Befehle {#commands}

| Befehl | Beschreibung |
| :-- | :-- |
| [version](Version.md) | Gibt die Version der CLI und die vom Projekt verwendete Version von `@lambdaorm/lib` aus. |
| [init](Commands/Init.md) | Erzeugt die Struktur eines λORM-Projekts. |
| [build](Commands/Build.md) | Erzeugt das Modell und die Repositories für die Sprache. |
| [schema](Commands/Schema.md) | Gibt einen Teil des Schemas zurück: die Domäne, eine Entität, ein Mapping, die Stages, die Views… |
| [push](Commands/Push.md) | Synchronisiert die Datenbanken mit dem Modell (`-o` schreibt stattdessen die Skripte). |
| [pull](../schema/SchemaSynchronization-Pull.md) | Aktualisiert das Schema mit der Struktur der Datenbanken eines Stages. |
| [fetch](Commands/Fetch.md) | Zeigt die Unterschiede zwischen den Datenbanken und dem Modell; endet mit Exit-Code 1, wenn es welche gibt. |
| [introspect](../schema/SchemaSynchronization-Introspect.md) | Liest und analysiert eine Datendatei und aktualisiert das Schema. |
| [incorporate](../schema/SchemaSynchronization-Incorporate.md) | Aktualisiert das Schema anhand einer Datendatei, überträgt die Änderungen in die Datenbanken und importiert die Daten. |
| [drop](Commands/Drop.md) | Entfernt alle Datenbankobjekte, nicht jedoch die Datenbank selbst. |
| [import](Commands/Import.md) | Importiert Daten aus einer Datei in die Datenbanken. |
| [export](Commands/Export.md) | Exportiert Daten aus den Datenbanken. |
| [execute](Commands/Execute.md) | Führt eine Abfrage aus. |
| [script](Commands/Script.md) | Führt ein Skript aus: mehrere Abfragen in einer Transaktion. |
| [plan](Commands/Plan.md) | Gibt den Ausführungsplan einer Abfrage zurück. |
| [metadata](Commands/Metadata.md) | Gibt die Metadaten einer Abfrage zurück. |
| [parameters](Commands/Parameters.md) | Gibt die Parameter einer Abfrage zurück. |
| [model](Commands/Model.md) | Gibt das Modell des Ergebnisses einer Abfrage zurück. |
| [constraints](Commands/Constraints.md) | Gibt die Constraints einer Abfrage zurück. |

`lambdaorm <command> -h` listet die Optionen eines Befehls auf; `lambdaorm -h` listet die Befehle auf.

Den Befehl `sync` gibt es nicht mehr: Er wurde durch [push](Commands/Push.md) ersetzt.

## Gemeinsame Optionen {#common-options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Pfad des Projekts (der Ordner mit `lambdaORM.yaml`). Standard: das aktuelle Verzeichnis. |
| stage | `-s` | Name des Stages. Standard: der erste Stage des Schemas. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen (zum Beispiel die Verbindungszeichenfolgen). |
| output | `-o` | Ausgabeformat des Ergebnisses: `json`, `beautiful`, `light` oder `yaml`. Bei `push` und `drop` gibt es die Anweisungen aus (oder schreibt sie), statt sie anzuwenden. |
| url | `-u` | URL des Schemas auf einem Data Gateway, um den Befehl dort statt lokal auszuführen. |

Jede Befehlsseite listet die Optionen auf, die der jeweilige Befehl akzeptiert.

## Exit-Code und Data Gateway {#exit-code-and-data-gateway}

Jeder Befehl endet mit Exit-Code 1, wenn er fehlschlägt (ab @lambdaorm/cli 1.6.3).

Befehle laufen auf einem Data Gateway mit `-u` und der URL des Schemas, zum Beispiel `http://gateway:8080/iot/v1`. Ist die
Umgebungsvariable `SERVICE_TOKEN` gesetzt, wird sie als `Authorization: Bearer <token>` gesendet (für ein Gateway mit
[Bearer-Authentifizierung](../data-gateway/Security.md#authentication)). Siehe auch [Clients](../data-gateway/Clients.md#cli).

## Mehr {#more}

- [Referenz des Quellcodes](source/README.md)
- [Änderungsprotokoll](CHANGELOG.md)
- [CLI-Labs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli)
