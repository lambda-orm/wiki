# Version {#version}

Gibt die Version der laufenden CLI und die Version von `@lambdaorm/lib` aus, die das Projekt verwendet.

## Optionen {#options}

| Option | Kurz | Beschreibung |
| :-- | :-- | :-- |
| workspace | `-w` | Projektpfad (Standard: das aktuelle Verzeichnis). |
| language | `-l` | Entwicklungssprache (Standard: `node`). |

## Beispiel {#example}

```sh
lambdaorm version
```

Ergebnis (die Versionen hängen von Ihrer Installation ab):

```text
lambdaorm cli version: 1.6.10
Local lambdaorm version: 3.5.3
```

Wenn das Projekt nicht von `@lambdaorm/lib` abhängt, lautet die zweite Zeile `Local lambdaorm not found.`

Um nur die Version der CLI auszugeben:

```sh
lambdaorm --version   # or lambdaorm -v
```

```text
1.6.10
```
