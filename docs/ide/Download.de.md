# Herunterladen

<div id="ide-downloads" class="ide-downloads" aria-live="polite" data-repo="lambda-orm/data-gateway" data-tag-prefix="ide-v"
  data-labels='{"loading": "Die Versionen werden gelesen…", "latest": "Neueste Version: {version} · {date}", "downloadFor": "Herunterladen für {os}", "linux": "Linux", "windows": "Windows", "macos": "macOS", "appleSilicon": "Apple Silicon", "intel": "Intel", "bothArchs": "x64 und arm64", "allVersions": "Alle Versionen", "testVersions": "Testversionen", "version": "Version", "date": "Datum", "notes": "Was ist neu", "noReleases": "Es ist noch keine Version veröffentlicht.", "openReleases": "Die Versionen auf GitHub", "error": "Die Versionen konnten nicht von GitHub gelesen werden.", "rateLimit": "GitHub begrenzt Anfragen ohne Konto: versuche es nach {time} erneut, oder öffne die Versionen auf GitHub."}'>
<noscript><p><a href="https://github.com/lambda-orm/data-gateway/releases?q=ide-v&amp;expanded=true">Die Versionen auf GitHub</a></p></noscript>
</div>

## Installieren {#installing-it}

| BS | Datei | Wie |
| --- | --- | --- |
| Linux | `.AppImage` | `chmod +x data-gateway-ide-*.AppImage` und ausführen: nichts zu installieren, und es aktualisiert sich selbst |
| Linux | `.deb` | `sudo apt install ./data-gateway-ide-*.deb` (Debian, Ubuntu); es meldet, wenn eine neue Version da ist |
| Windows | `.exe` | das Installationsprogramm, für deinen Benutzer (ohne Administrator); es aktualisiert sich selbst. `-win.exe` enthält beide Architekturen |
| macOS | `.dmg` | öffnen und die App nach Programme ziehen; es meldet, wenn eine neue Version da ist |

Die ausführbaren Dateien sind **noch nicht signiert**:

- **macOS** meldet, dass der Entwickler nicht überprüft werden kann (auf Apple Silicon, dass die App beschädigt ist):
  Rechtsklick auf die App → **Öffnen**, oder `xattr -dr com.apple.quarantine "/Applications/Data Gateway IDE.app"`.
- **Windows** (SmartScreen) meldet, dass es den PC geschützt hat: **Weitere Informationen** → **Trotzdem ausführen**.

Nach Updates wird beim Start und alle 6 Stunden gesucht; **Help → Check automatically** schaltet das ab.
