# Verbindungen

Eine Verbindung ist ein Gateway, mit dem die IDE arbeitet: die Adresse seines Ports `management` und Zugangsdaten. Die
IDE hat weder Login noch Startseite: Sie behält ihre Verbindungen und öffnet sich beim ersten Mal mit einer **Neuen
Verbindung**. Mehrere Verbindungen können gleichzeitig offen sein, jede ein Baum des [Explorers](Explorer.md): ihre **Administration** (was ihre Zugangsdaten vom Gateway
verwalten dürfen) und ihre **Schemas**, mit ihren Tabs nebeneinander.

Lege eine Verbindung pro Gateway und Zugangsdaten an, die du nutzt: eine lokale, die einer Testumgebung, dasselbe
Gateway mit Zugangsdaten, die nur lesen, und mit anderen, die verwalten.

## Eine neue Verbindung {#a-new-connection}

Das **+** neben **Verbindungen**, oben im Explorer:

| Feld | Was es ist |
| --- | --- |
| **Name** | wie die Verbindung angezeigt wird (`local`, `production`…) |
| **Protokoll** | `REST · http` oder `REST · https` |
| **Management-Adresse** | `host:port/base path` des `management` des Gateways, **so wie der Server der IDE es erreicht**: `data-gateway:9090` für eine Web-IDE im selben Compose, `localhost:9090` für die Desktop-App auf dem Rechner des Gateways |
| **Authentifizierung** | **API-Schlüssel** (sein **Header**, standardmäßig `X-Api-Key`, und sein **Schlüssel**), **Bearer-Token (JWT)** (sein **Token**: ein Schlüssel des Gateways oder das [Token eines Identitätsanbieters](../data-gateway/Security.md#jwt); wenn es abläuft, sagt die Verbindung es und fragt nach einem neuen), **Basic (Benutzer und Passwort)**, **OpenID Connect (Anmeldung)** (IDE 1.3.0: sein **Aussteller**, **Client-ID** und **Scopes**; siehe unten) oder **Keine** |
| **Schlüssel in diesem Browser merken** | mit der Verbindung aufbewahrt; sonst nur in diesem Tab des Browsers, und nach dem Schließen erneut abgefragt |
| **Andere URLs seiner Transporte** (eingeklappt) | die **REST-URL**, **WebSocket-URL** und **MCP-URL**, nur wenn die IDE sie nicht an den Ports erreicht, die das Gateway nennt (ein Proxy davor, ein anderes Netzwerk) |

**OpenID Connect (Anmeldung)**: Die Seite der Connection hat **Anmelden**, das die Anmeldung des Identitätsanbieters
öffnet (im Browser ein eigenes Fenster; in der Desktop-App der Browser des Systems, der zur App zurückkehrt); das Token
bleibt in diesem Tab und wird vor Ablauf erneuert; **Abmelden** beendet auch die Sitzung des Anbieters. Der Anbieter
braucht einen öffentlichen Client mit PKCE, dessen Redirect-URIs die IDE annehmen (`…/oidc-callback.html` der IDE und
`http://127.0.0.1:*` für die Desktop-App); der Server der IDE erreicht ihn, daher gehört sein Origin in
`DATA_GATEWAY_IDE_TARGETS` ([Bereitstellung](Deploying.md)).

**Anzeigen** zeigt den eingegebenen Schlüssel. **Testen** öffnet eine Sitzung und schließt sie sofort wieder: `Verbunden
als admin · data-gateway 4.0.0`, oder warum es nicht ging. **Verbinden** fügt die Verbindung hinzu und öffnet ihre
Seite.

![Neue Verbindung](images/ide-new-connection.png)

Die Verbindung bleibt im Browser (in der Desktop-App in deren Daten); ihre Schemas, Workspaces und das, was darin
gespeichert ist, liegen im Gateway.

## Ihre Zeile im Explorer {#its-row-in-the-explorer}

| Element | Was es tut |
| --- | --- |
| ▸ | klappt ihre Schemas ein und aus |
| ihr Name und ihre Adresse | öffnen ihre Seite |
| ⟳ **Aktualisieren** | liest neu, was sich anderswo geändert hat: ihre Schemas, deren Domänen und das Gespeicherte |
| ⚠ anstelle ihres Symbols | es gibt etwas zu sehen: der Mauszeiger darüber sagt was |

Die Probleme, die sie meldet, in Rot unter ihrem Namen:

- **Schlüssel fehlt: Verbindung öffnen, um ihn einzugeben** — der Schlüssel wurde nicht gemerkt und der Tab des
  Browsers wurde geschlossen.
- **Die Anmeldedaten sind nicht gültig.**
- **Der IDE-Server erreicht das data-gateway nicht** — seine Adresse, oder sein `management` ist nicht offen; der
  Grund folgt (ein nicht erlaubtes Ziel: [Bereitstellen](Deploying.md#its-targets)).
- **Die Sitzung ist beendet: …** — widerrufen ([unten](#sessions)).
- **Die Sitzung läuft in 2 Minuten ab: speichere, was du bearbeitest.**

## Ihre Seite {#its-page}

Ein Klick auf ihren Namen öffnet **Verbindung: Name** (seit IDE 1.5.0 nur die Verbindung; ihre Werkzeuge, Rollen,
Sitzungen und wartenden Schreibvorgänge sind in ihrer [Administration](#administration)):

- **Das Formular** oben, mit **Speichern** (unverändert gespeichert verbindet es erneut, nach einem Widerruf) und
  **Entfernen**, das vorher fragt und sie nur aus der IDE entfernt: im Gateway wird nichts entfernt, und ihre Tabs
  schließen sich.
- **Wer ich hier bin** (data-gateway 5.0, `GET /admin/me`): der Benutzer der Zugangsdaten, sein Kontext und jede seiner
  Rollen, wie sie gilt, mit Berechtigungen, Schemas und in jedem seinen Views und Stages (markiert, was ohne Wahl
  benutzt wird). In jedem Schema sind die Berechtigungen die der Rollen, die die gewählte View und den gewählten Stage
  erlauben. Eine Rolle, die das Gateway nicht hat, sagt *unbekannt: gibt nichts*. Mit einem Gateway vor 5.0 sein Name
  und seine Berechtigungen.

## Ihre Administration {#administration}

**Seit IDE 1.5.0, mit data-gateway 5.0.** Im Explorer hat jede Verbindung den Knoten **Administration** über ihren
**Schemas**, mit dem, was ihre Zugangsdaten verwalten dürfen; was eine fehlende Berechtigung braucht, wird nicht gezeigt:

```text
northwind  http://data-gateway:9090
├─ Administration
│  ├─ Rollen                   (roles)        jede Rolle ein Knoten: Bearbeiten, Entfernen
│  ├─ Zugang                   (roles)
│  ├─ Persistenz               (roles oder persist)
│  │  ├─ Config                sein lambdaORM.yaml, in Monaco
│  │  └─ Verbindung            (persist)
│  ├─ Sitzungen
│  ├─ Wartende Schreibvorgänge (approve)
│  ├─ Werkzeuge                REST API · WebSocket · MCP
│  └─ Observability            (observability)   Metriken · Logs · Traces
└─ Schemas
   └─ /
```

### Rollen {#roles}

**Berechtigungen nach Rolle:** eine Rolle pro Zeile und eine Berechtigung pro Spalte (Konfiguration und Zustand
zusammen), mit ihren Schemas. **+ Rolle hinzufügen** öffnet eine neue. Jede Rolle ist ein eigener Knoten: alles, was sie
gibt, ihre Berechtigungen und pro Schema ihre Views und Stages mit den markierten Standards, woher sie kommt (*seine
Konfiguration*, oder wer sie wann geändert hat), mit **Bearbeiten** und **Entfernen**.

**Bearbeiten** hat ein Kästchen pro Berechtigung (die von der Konfiguration gegebenen, markiert und fest: Gespeichertes
erweitert eine Rolle der Konfiguration, nimmt ihr nie etwas), ihre **Schemas** (keine: alle Schemas) und für jedes
gewählte Schema seine Views und Stages zum Ankreuzen mit **Standard-View** und **Standard-Stage**, **Höchstens Zeilen**,
*Ihre Schreibvorgänge warten auf die Freigabe einer Person* und **Warum (optional)**. Eine in der Konfiguration
*gesperrte* Rolle lässt sich nicht erweitern; eine Rolle, die 4.4 für ein Schema gespeichert hat, ist markiert *eines
Schemas (4.4): gilt nicht; entferne sie*. **Ihre Änderungen** sagt, wer was wann geändert hat. Siehe
[Rollen](../data-gateway/Security.md#roles).

### Zugang {#access}

**Zugang: Schlüssel und Tokens:** wer hereinkommt, wie die Konfiguration es sagt (`GET /admin/access`): nach **Wo**
(*überall*, ein Transport, ein Schema) jede **Methode** und **Anmeldedaten** mit ihren Rollen und ihrem **Kontext**;
eine Methode `jwt` nennt ihren Aussteller und den Claim ihrer Rollen. Nie ein Geheimnis.

### Persistenz {#persist}

Wo das Gateway seine Administration hält (die Sitzungen, die Rollen, seine Observability, die wartenden
Schreibvorgänge und die Änderungen von allem): seine Datenbank oder Datei, wer sie liest und schreibt, wer es sagt
(*state.source der Konfiguration*, *standardmäßig: das SQLite des Volumes*, *die Administration*), wie oft die Replikas
sie neu lesen, ob sie Pflicht ist und ob sie jetzt lesbar ist.

- **Config:** das `lambdaORM.yaml` der Administration, in Monaco: Entitäten, Mapping und Quelle des Zustands, wie λORM
  sie benutzt. Mit `persist` lässt sich sein Mapping bearbeiten (die Tabelle jeder Entität und ihre Spalten):
  **Mapping speichern** kopiert den Zustand in die neuen Tabellen, und das Gateway startet neu.
- **Verbindung** (mit `persist`): **Jetzt**, die aktuelle Datenbank, und **Eine andere Datenbank**: **Zustand kopieren
  und umziehen** kopiert ihn mit λORM dorthin, und das Gateway startet damit neu (offene Verbindungen verbinden sich
  neu); **Zurück zur Konfiguration** macht es rückgängig. Siehe [wo der Zustand liegt](../data-gateway/Admin.md#persist).

### Werkzeuge {#tools}

**REST-API (Swagger)**, **WebSocket** und **MCP**: die Transporte des Gateways, jeder in einem eigenen Tab geöffnet
(`REST API · northwind`…), mit den Zugangsdaten der Verbindung. Ein Transport, den das Gateway nicht anbietet, ist
deaktiviert (`von diesem data-gateway nicht angeboten`). Die IDE erfährt vom Gateway, wo sie sind (`GET /transports`
seines `management`), oder aus **Andere URLs seiner Transporte**.

| Werkzeug | Was es enthält |
| --- | --- |
| **REST-API (Swagger)** | die OpenAPI des Gateways, jede Methode mit **Try it out**; die Zugangsdaten gehen mit jeder Anfrage mit |
| **WebSocket** | ein **Schema**, **Verbinden** / **Trennen**, seine **Methoden** (aus seiner AsyncAPI: ein Klick füllt die Anfrage), die **Anfrage** (JSON-RPC) mit **Senden** (Strg+Enter) und die gesendeten und empfangenen **Nachrichten** (die letzten 200) |
| **MCP** | ein **Schema** und **Verbinden**, dann die **Tools des Schemas**: wenn eines gewählt ist, seine **Argumente** (mit den erforderlichen gefüllt), **Aufrufen** (Strg+Enter) und sein **Ergebnis** |

![Werkzeuge](images/ide-connection-tools.png)

### Observability {#observability}

Mit `observability`: was das Gateway sendet und wohin, in drei Knoten, **Metriken** (*Per OTLP senden*, *Alle (ms)*,
*lambdaorm.entity in den Metriken*; `/metrics` für Prometheus wird immer bereitgestellt), **Logs** (*Auf die Konsole*,
ihre **Stufe**, per OTLP) und **Traces** (*Sampling (0–1)*, *Der Entscheidung des Aufrufers folgen*, *Text der Abfragen
in den Spans*); **Wohin es geht: der OTLP-Exporter** (sein **Endpoint**; seine Header nur in
`OTEL_EXPORTER_OTLP_HEADERS`) und **Wo man es sieht** (**Grafana-URL**, die Datasources von **Tempo**, **Prometheus**
und **Loki**, die **Organisation in Grafana**), mit **In Grafana öffnen**. **Speichern und anwenden** speichert es über
der Konfiguration und wendet es sofort an (der Edge startet neu, und die Schemas, deren Telemetrie sich ändert, laden
neu); **Zurück zur Konfiguration** macht es rückgängig. Der Link einer Entität zu ihren Traces ([Entitäten](Entities.md))
kommt von hier, nicht aus jeder IDE.

### Wartende Schreibvorgänge {#approvals}

Seit IDE 1.3.0, mit Anmeldedaten, die `approve` haben: die
[Schreibvorgänge von Agenten, die auf eine Person warten](../data-gateway/Security.md#approvals), in allen Schemas
des Gateways, jeder mit dem Anfragenden und wann, seiner Abfrage (oder seinem Skript), **Was ausgeführt würde** (seine
Anweisungen) und **Ihre Daten**. **Genehmigen** führt ihn als der Anfragende aus; **Ablehnen** fragt nach einem Grund
(optional). Wer einen Schreibvorgang angefragt hat, kann ihn nicht genehmigen. Die Liste wird alle 15 Sekunden neu
gelesen.

### Sitzungen {#sessions}

Verbinden meldet sich beim `management` des Gateways an ([Sitzungen](../data-gateway/Transports.md#sessions)): Die IDE
behält das Token in diesem Tab des Browsers, und jede Anfrage trägt es, nie den Schlüssel.

- Wenn die Sitzung **abläuft** (30 Minuten ohne Aktivität, oder 12 Stunden) und der Schlüssel zur Hand ist, öffnet die
  IDE von selbst eine neue; ohne ihn fragt sie nach dem Schlüssel.
- Wenn sie **widerrufen** wird, sagt die IDE, wer sie widerrufen hat, und verbindet sich nicht von selbst wieder, auch
  nicht mit gemerktem Schlüssel: Die Verbindung erneut zu speichern verbindet sie.
- Die IDE hält den WebSocket der Ereignisse des Gateways offen: Die Sitzung erscheint als *verbunden* (ein grüner ●),
  und ein Schema, das sich ändert, oder etwas, das jemand anderes gespeichert hat, erscheint sofort. Eine Änderung aus
  einer anderen Sitzung (eine andere Person, eine andere IDE, die CLI über das Gateway) wird unter der Verbindung
  angekündigt, `modeler hat Orders in / geändert`, mit **Aktualisieren**.

**Meine Sitzungen** listet die Sitzungen derselben Zugangsdaten: diese (**diese**) und die anderen (ein anderer Tab,
Browser oder Computer), jede mit ihrem Client, ihrer Adresse, was sie gerade ansieht (ihr Schema und ihr aktiver Tab),
ihrer letzten Aktivität und wann sie abläuft. **Schließen** schließt eine; **Die anderen schließen** alle außer dieser.

Mit `sessionAdmin` listet **Aktive Sitzungen** jede Sitzung des Gateways nach Zugangsdaten: **Widerrufen** eine, oder
**Alle widerrufen** von Zugangsdaten (vorher gefragt; bei deinen bleibt diese Sitzung).

![Sitzungen](images/ide-connection-sessions.png)
