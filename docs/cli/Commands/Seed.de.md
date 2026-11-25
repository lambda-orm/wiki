# Seed {#seed}

Fügt die Daten ein, mit denen ein Stage beginnt (`stages[].seed`): aus jeder Datei die Zeilen, deren Schlüssel noch
nicht in der Datenbank ist. Siehe [Seed](../../schema/SchemaSynchronization-Seed.md).

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| stage | `-s` | Name des Stages. |
| envfile | `-e` | Liest eine Datei mit Umgebungsvariablen. |

## Beispiel {#example}

```sh
lambdaorm seed -s dev
```

```text
data/seed/base.json: Categories +2
data/seed/dev.json: Products +0 (2 already there)
```
