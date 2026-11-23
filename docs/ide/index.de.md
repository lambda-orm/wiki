# Data Gateway IDE

Die IDE des Data Gateway: verbinde dich mit deinen Gateways, durchsuche ihre Schemas, lies jede Entität als
Formular, schreibe Abfragen mit Autovervollständigung, zeichne Diagramme und verwalte die Schemas. Wie eine
Datenbank-IDE verbindet sie sich mit Gateways, einem oder mehreren, jedes mit seinen Zugangsdaten; ihre Schemas,
Workspaces und Projekte bleiben in ihnen.

Es gibt sie auf zwei Arten, dieselbe App und dieselbe Version:

- **Die Desktop-App** für Linux, Windows und macOS, unter [Herunterladen](Download.md) herunterzuladen: Sie läuft auf deinem Rechner und
  verbindet sich von dort.
- **Die Web-IDE**, das Image [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  neben den Gateways bereitgestellt und im Browser genutzt ([In einem Container](#in-a-container)).

Wie man sie benutzt, steht in der [Anleitung](Guide.md).

![Die IDE](../data-gateway/images/ui-query.png)

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
