# Synchronisierung {#synchronization}

Diese Seite fasst die Befehle zusammen, die das Schema und die Datenbanken eines Stages synchron halten.

Die Synchronisierung funktioniert in beide Richtungen: vom Schema zu den Quellen (Datenbanken) und von den Quellen zur Schema-Datei.
Jede Operation ist als Befehl der CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)) und als Methode von `orm.stage` in [@lambdaorm/lib](https://www.npmjs.com/package/@lambdaorm/lib) verfügbar.

| Operation   | Richtung                     | Ändert das Schema | Ändert die Datenbanken |
|-------------|------------------------------|:------------------:|:---------------------:|
| push        | Schema → Datenbanken         | nein               | ja                    |
| pull        | Datenbanken → Schema         | ja                 | nein                  |
| fetch       | vergleicht beide             | nein               | nein                  |
| introspect  | Datendatei → Schema → Datenbanken | ja            | ja                    |
| incorporate | Datendatei → Schema → Datenbanken, anschließend Import der Daten | ja | ja |

## Push {#push}

Push aktualisiert die Quellen (Datenbanken) anhand des Schemas, mit dem Befehl `lambdaorm push`.

Push vergleicht das Modell mit den Datenbanken selbst: Es erstellt fehlende Tabellen, fügt Spalten hinzu und ändert sie, benennt die mit `previousMapping` deklarierten Spalten um und löscht niemals etwas, das nur in der Datenbank existiert. `lambdaorm push -o <dir>` schreibt die DDL als ein Skript pro Quelle (`<stage>.<source>.sql`), ohne sie anzuwenden.

[Weitere Informationen](SchemaSynchronization-Push.md)

## Pull {#pull}

Pull aktualisiert das Schema mit der Struktur der Quellen (Datenbanken), mit dem Befehl `lambdaorm pull`. Was im Schema von Hand geschrieben wurde (Beziehungen, Listener, Stages), bleibt erhalten.

[Weitere Informationen](SchemaSynchronization-Pull.md)

## Fetch {#fetch}

Fetch zeigt die Unterschiede zwischen den Quellen und dem Schema an, ohne Änderungen anzuwenden, mit dem Befehl `lambdaorm fetch`. Das Ergebnis ist leer, wenn die Datenbanken mit dem Modell übereinstimmen, und der Befehl endet mit dem Code 1, wenn es Unterschiede gibt (nützlich in CI).

[Weitere Informationen](SchemaSynchronization-Fetch.md)

## Introspect {#introspect}

Introspect aktualisiert das Schema anhand der Struktur einer JSON-Datendatei und überträgt die Änderungen anschließend auf die Quellen (Datenbanken), mit dem Befehl `lambdaorm introspect`.

[Weitere Informationen](SchemaSynchronization-Introspect.md)

## Incorporate {#incorporate}

Incorporate tut dasselbe wie introspect und importiert anschließend die Daten der Datei in die Quellen (Datenbanken), mit dem Befehl `lambdaorm incorporate`.

[Weitere Informationen](SchemaSynchronization-Incorporate.md)
