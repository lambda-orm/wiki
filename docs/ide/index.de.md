# IDE

Die IDE des Data Gateway: verbinde dich mit deinen Gateways, durchsuche ihre Schemas, lies jede Entität als
Formular, schreibe Abfragen mit Autovervollständigung, zeichne Diagramme und verwalte die Schemas. Wie eine
Datenbank-IDE verbindet sie sich mit Gateways, einem oder mehreren, jedes mit seinen Zugangsdaten; ihre Schemas,
Workspaces und Projekte bleiben in ihnen.

Es gibt sie auf zwei Arten, dieselbe App und dieselbe Version:

- **Die Desktop-App** für Linux, Windows und macOS, hier herunterzuladen: Sie läuft auf deinem Rechner und
  verbindet sich von dort.
- **Die Web-IDE**, das Image [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  neben den Gateways bereitgestellt und im Browser genutzt ([In einem Container](#in-a-container)).

Wie man sie benutzt, steht in der [Anleitung](Guide.md).

![Die IDE](../data-gateway/images/ui-query.png)

## Herunterladen {#download}

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

## Wohin sie sich verbindet {#where-it-connects}

Die IDE verbindet sich mit dem Port `management` jedes Gateways ([Transporte](../data-gateway/Transports.md#management)),
mit einer [Sitzung](../data-gateway/Transports.md#sessions), die mit deinen Zugangsdaten geöffnet wird. Die Desktop-App
verbindet sich von deinem Rechner aus: Für ein Gateway, das nicht darauf läuft, erreichen ein VPN, ein SSH-Tunnel oder
ein `kubectl port-forward` sein `management`, ohne es zu veröffentlichen ([Wo die IDE läuft](Guide.md#where-the-ide-runs)).

## In einem Container {#in-a-container}

Für eine Web-IDE, die ein Team gemeinsam nutzt, neben den Gateways, mit `management` nur in ihrem internen Netzwerk:

```sh
docker run -p 127.0.0.1:8090:8080 -e DATA_GATEWAY_IDE_TARGETS='http://data-gateway:9090' flaviorita/data-gateway-ide
```

Siehe [Bereitstellen](Guide.md#deploying-it) in der Anleitung.
