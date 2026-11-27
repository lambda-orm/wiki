# Bereitstellen

Das Gateway liefert keine UI aus und beantwortet kein CORS. Die IDE erreicht es über seinen Port **`management`**
([Transporte](../data-gateway/Transports.md#management)): die Routen der REST API für jedes Schema sowie die
[Verwaltung](../data-gateway/Admin.md). Ein Gateway ohne diesen Port hat keine IDE, was ein Produktions-Gateway, dessen
Schemas in seinen Volumes kommen, wollen kann.

```yaml
# data-gateway.config.yaml
transports:
  http: { port: 8080 }
  management: { port: 9090 }    # die API der IDE; ohne Port nicht angeboten
```

## Die Web-IDE {#the-web-ide}

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:5.0.0
    # 9090 wird nicht veröffentlicht: nur die IDE erreicht ihn, im Netzwerk des Compose
  ide:
    image: flaviorita/data-gateway-ide:1.5.0
    environment:
      DATA_GATEWAY_IDE_TARGETS: "http://data-gateway:9090,http://data-gateway:8080"
    ports:
      - "127.0.0.1:8090:8080"
```

- **Der Browser spricht nur mit dem Server der IDE.** Er liefert die Seite aus und leitet jede Anfrage an das Gateway
  weiter (ein Proxy): REST, MCP und den WebSocket gleichermaßen. Die Gateways sehen den Browser nie.
- **Die IDE behält keine Verbindung und keine Zugangsdaten.** Sie bleiben im Browser. Sie leitet die Zugangsdaten an das
  Gateway weiter und verwirft die Cookies und den Origin der Seite.
- **Halte `management` in einem internen Netzwerk.** Er schreibt die Schemas und ihre Variablen und führt DDL aus; die
  IDE ist das, was veröffentlicht wird.

Mit `trustedProxies` von `management` auf das Netzwerk der IDE gesetzt, sieht das Gateway die Adresse jedes Browsers in
seinen [Sitzungen](Connections.md#sessions); sonst zeigt jede Sitzung die Adresse der IDE.

### Ihre Ziele {#its-targets}

**`DATA_GATEWAY_IDE_TARGETS`** listet die Origins, die die IDE erreichen darf, durch Kommas getrennt, oder `*` für
jeden (eine lokal ausgeführte IDE). Ohne die Variable erreicht die IDE keinen und sagt es: Ein offener Proxy würde jeden
Host seines Netzwerks erreichen. Liste das `management` jedes Gateways auf, und sein REST, WebSocket und MCP für die
[Werkzeuge](Connections.md#tools) der Verbindung.

| Variable | Standard | Was sie ist |
| --- | --- | --- |
| `DATA_GATEWAY_IDE_TARGETS` | keiner | die Origins, die sie erreichen darf: `http://data-gateway:9090,http://data-gateway:8080` |
| `DATA_GATEWAY_IDE_CONNECT_SRC` | keine | (1.3.0) weitere Origins, die die Seite selbst erreicht: die Speicher der [Dateien](../data-gateway/Configuration.md#files), die die Bytes direkt annehmen und liefern |
| `PORT` | `8080` | der Port der IDE in ihrem Container |
| `HOST` | `0.0.0.0` | die Adresse, auf der sie lauscht |

## Die Desktop-App {#the-desktop-app}

Die [Desktop-App](Download.md) hat denselben Server eingebaut, auf `127.0.0.1`, nur für ihr Fenster (ein Token pro
Start): Sie erreicht jedes Gateway, das dein Rechner erreicht, ohne Ziele aufzulisten. Ihre Sitzungen erscheinen als
`desktop`. Sie sucht beim Start und alle 6 Stunden nach Updates (**Help → Check automatically**).

## Wo die IDE läuft {#where-the-ide-runs}

| Du stellst bereit | Für | `management` |
| --- | --- | --- |
| Nur das Gateway, ohne `management` | Produktion, mit den Schemas in seinen Volumes: keine IDE, keine Verwaltung | kein Port |
| Das Gateway und das Image der IDE | eine im Browser geteilte IDE | nur im internen Netzwerk, nie veröffentlicht: der Container der IDE erreicht ihn |
| Nur das Gateway, mit `management` | eine IDE auf deinem eigenen Rechner: die [Desktop-App](Download.md), oder das Image mit `docker run` ausgeführt | dein Rechner muss seinen Port erreichen (unten) |

Eine IDE auf deinem Rechner erreicht ein `management`, das woanders ist, ohne es offen zu veröffentlichen:

| Das Gateway läuft | Wie die IDE es erreicht | `management` veröffentlicht |
| --- | --- | --- |
| auf demselben Rechner | `localhost:9090` | — |
| in einem internen Netzwerk oder hinter einem VPN | `internal-host:9090` | nur für dieses Netzwerk |
| auf einem Server, ohne VPN | ein SSH-Tunnel, `ssh -L 9090:localhost:9090 server`, und die Verbindung zu `localhost:9090` | nur auf dem Loopback des Servers |
| in Kubernetes | `kubectl port-forward svc/data-gateway 9090`, und die Verbindung zu `localhost:9090` | ein interner `Service`, kein Ingress |

Über einen Tunnel brauchen auch die Tabs REST, WebSocket und MCP ihren eigenen Weg: Tunnele auch ihre Ports, oder trage
ihre URLs in der Verbindung ein (**Andere URLs seiner Transporte**).
