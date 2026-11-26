# Administration {#administration}

Mit seinem `management`-Port sind das Gateway und seine [UI](../ide/index.md) nicht mehr nur lesend: Schemas werden dort **angelegt,
bearbeitet und entfernt**, als YAML oder Element für Element, Gespeichertes (Abfragen, Skripte, Diagramme) wird in den
Workspaces geteilt, und die **Befehle der [CLI](../cli/index.md)** laufen aus der UI. Alles liegt im Volume des
Gateways, ein Workspace pro Schema; das Gateway bemerkt Änderungen und stellt sie ohne Neustart bereit.

Aktivieren Sie sie dort, wo Menschen die Schemas modellieren (Entwicklung, eine gemeinsame Modellierungsumgebung). In der
Produktion, wenn die Schemas fertig im Volume liegen, lassen Sie `management` weg: Die Datentransporte funktionieren
genauso, und über das Gateway kann nichts die Schemas oder die Struktur der Datenbanken ändern.

## Aktivieren {#turning-it-on}

```yaml
transports:
  management:
    port: 9090               # ohne Port keine Administration (und keine IDE)
admin:
  commandTimeoutMs: 600000   # wie lange ein Befehl dauern darf
  maxFileBytes: 2MB          # die größte Datei, die geschrieben werden kann
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: modeler, value: $MODELER_KEY, permissions: [ read, schemaRead, schemaWrite, schemaAdmin, workbenchWrite, ddl, build ] }
    - { name: analyst, value: $ANALYST_KEY, permissions: [ read, workbenchWrite ] }
```

Die Administration antwortet unter `/admin` des [`management`-Transports](Transports.md#management), mit dessen
Authentifizierung; `http` hat sie nicht. Ihre Berechtigungen werden **nie standardmäßig vergeben**: Anmeldedaten ohne
Berechtigungsliste haben nur die der Daten.

| Berechtigung | Erlaubt |
| --- | --- |
| `schemaRead` | die `lambdaORM.yaml` jedes Workspace lesen und prüfen |
| `schemaWrite` | sie ändern (als YAML oder Element für Element), `pull`, `introspect` |
| `schemaAdmin` | Workspaces anlegen und entfernen; die Variablen der Verbindungen setzen |
| `workbenchWrite` | Abfragen, Skripte und Diagramme in den Workspaces speichern, ohne das Schema zu ändern |
| `ddl` | die Struktur der Datenbanken eines Stage ändern (`push`, `drop`) |
| `build` | den Code der Domäne in `src/` des Workspace erzeugen |
| `sessionAdmin` | jede [Sitzung](Transports.md#sessions) von `management` sehen (wer verbunden ist) und sie widerrufen |

Mit `authentication: none` administriert niemand, außer mit `admin.allowAnonymous: true` (nur lokale Entwicklung).

## Workspaces im Volume {#workspaces-in-the-volume}

Jeder Ordner unter `orm.workspacePath` mit einer `lambdaORM.yaml` ist ein Schema, seine Route ist sein Pfad (`iot/v1`):

```text
/workspaces/iot/v1/
  lambdaORM.yaml     das Schema
  .env               die Variablen seiner Verbindungen
  workbench/         Gespeichertes: Ordner, *.query.yaml, *.script.yaml, *.diagram.yaml
  data/              Exporte
  src/domain/        der Code von build (nach 4.0.0: src/<language>/domain/)
  orm_state/         der Zustand von λORM und das Protokoll jedes Befehls
```

Solange das Gateway läuft (`orm.watch`, standardmäßig an), beobachtet es sie:

- ein Ordner mit einer `lambdaORM.yaml`, der erscheint, ist ein **neues Schema**, sofort auf allen Transporten;
- eine `lambdaORM.yaml` oder `.env`, deren Inhalt sich geändert hat, **lädt ihr Schema blue-green neu**: die neue
  Version startet neben der aktuellen, die antwortet, bis die neue bereit ist. Startet die neue nicht (ein ungültiges
  YAML), **antwortet weiter die zuletzt gestartete**, und der Zustand des Schemas nennt den Grund (`pending`);
- ein Ordner, der verschwindet, nimmt sein Schema mit;
- andere Dateien (`workbench/`, `data/`) werden nur gemeldet ([`workspace.changed`](WebSocket.md#notifications)).

Die Dateiereignisse sind der schnelle Weg; ein Durchlauf alle `orm.watch.intervalMs` (5 s) sieht, was in manchen
eingehängten Volumes nicht ankommt. Was sich geändert hat, entscheidet der Inhalt, nicht das Ereignis. Eine Datei
kann auch außerhalb des Gateways bearbeitet werden (ein Editor, `git pull`): es geschieht dasselbe.

## Gleichzeitigkeit {#concurrency}

Zwei Personen, oder eine Person und ein Agent, überschreiben sich nicht:

- jedes Lesen liefert die **Version** des Gelesenen, und jedes Schreiben nennt die, die es ändert; eine andere Version
  ist ein `412` mit dem aktuellen Stand, und die UI zeigt beide zur Auswahl;
- ein Formular ändert **ein Element** (eine Entität, eine Eigenschaft, eine Source…): die Änderung eines anderen an
  einem anderen Element kollidiert nicht; am selben Element zeigt das Formular den aktuellen Stand;
- Schreibvorgänge in einem Workspace laufen nacheinander (eine Sperrdatei, auch zwischen Replikas auf demselben
  Volume), und jede Datei wird atomar geschrieben;
- Befehle laufen nacheinander pro Schema.

## Das Schema {#the-schema}

- **Als YAML:** die ganze `lambdaORM.yaml` in einem Editor, beim Tippen geprüft (jeder Fehler in seiner Zeile), mit
  Vervollständigung der Schlüssel jeder Stelle und der bekannten Werte (Typen, Dialekte, Entitäten, Enums, Mappings),
  gespeichert mit Strg+S.
- **Als Formulare:** jeder Abschnitt (Entitäten, Enums, Sources, Mappings, Stages) und jedes Element in einem
  Formular; Eigenschaften, Beziehungen, Indizes und Werte in Tabellen. **Umbenennen** benennt auch um, was das Element
  nennt (Beziehungen, Schlüssel, Indizes, Mappings, Stages); **Entfernen** zeigt zuerst, wer es verwendet.
- Was das Gateway schreibt, behält **die Kommentare, die Reihenfolge und den Stil** der Datei: neu ist nur, was sich
  geändert hat.
- Ein ungültiges Schema wird nicht geschrieben: die Prüfung umfasst das YAML, die Form, einen doppelten Namen in einer
  Liste, die Typen (ein λORM unbekannter Typ ist eine Warnung) und λORM beim Vervollständigen des Schemas, ohne
  Verbindung und ohne etwas daraus auszuführen.

## Die Verbindungen {#the-connections}

Die Variablen, die ein Schema nennt (`connection: ${SHOP_CNX}`), werden in der `.env` seines Workspace über die UI
(oder die API) gesetzt; sie zeigt, welche das Schema nennt, welche die `.env` definiert und welche Sources sie
verwenden. **Ein Wert wird nie angezeigt**, sobald er gesetzt ist. Eine Änderung lädt das Schema neu. Eine Variable
kann auch aus der Konfiguration des Gateways (`orm.schemas[].env`) oder seiner Umgebung kommen.

## Die Befehle {#the-commands}

Die Befehle der [CLI](../cli/index.md) laufen im Worker des Schemas, mit seinen Verbindungen, als **Jobs** (einer
nach dem anderen pro Schema), aus dem Bereich **Befehle** der UI:

| Befehl | Vor dem Ausführen zeigt die UI | Berechtigung |
| --- | --- | --- |
| `version` | — (die Versionen des Gateways und des Schemas) | `read` |
| `fetch` | — (vergleicht die Datenbanken mit dem Modell) | `read` |
| `export` | — (heruntergeladen oder in `data/` gespeichert) | `read` |
| `push` | die Befehle pro Source und die, die Daten verlieren können (4.1.0: sie laufen nur mit `allowDestructive`) | `ddl` |
| `drop` | die Befehle; der Stage wird erneut eingegeben | `ddl` |
| `import` | die Zeilen jeder Entität | `stageImport` |
| `pull` | das Diff der `lambdaORM.yaml` | `schemaWrite` |
| `introspect` | das Diff und die Zeilen der Daten | `schemaWrite` |
| `incorporate` | das Diff und die Zeilen; danach lädt das Schema neu, `push` legt seine Tabellen an und die Zeilen werden importiert | `schemaWrite`, `ddl`, `stageImport` |
| `build` | — (in `src/` geschrieben oder als `.zip` heruntergeladen) | `build` |
| `migrations` (4.1.0) | — (die [Historie der Migrations](../schema/SchemaSynchronization-Migrations.md) der Stage) | `read` |
| `migrate` (4.1.0) | das Rückgängigmachen jeder Migration nach der `version` und was davon Daten verlieren kann | `ddl` |
| `seed` (4.1.0) | die Dateien des [Seeds](../schema/SchemaSynchronization-Seed.md) der Stage | `stageImport` |

Ein Befehl, der die Datenbanken oder das Schema ändert, führt **genau die gezeigte Vorschau** aus, einmal, innerhalb
von 10 Minuten, und nur solange die `lambdaORM.yaml` die ist, mit der sie erstellt wurde (sonst
`409 PreviewRequiredError`); ein weiterer Befehl desselben Schemas, während einer läuft, antwortet mit `409 BusyError`.
Jeder Job hinterlässt sein Protokoll in `orm_state/jobs/`; `push`, `drop`, `import`, `migrate` und `seed` werden
[auditiert](Security.md#audit). Ein `push` oder ein `migrate`, dessen Vorschau Änderungen auflistet, die Daten verlieren
können (ein engerer Typ, eine kürzere Länge), führt sie nur mit `"allowDestructive": true` aus; ohne dies schlägt der
Job mit `DestructiveChangeError` fehl. `admin.commandTimeoutMs` (10 Minuten) begrenzt, wie lange einer dauern darf.

Über die API ist ein Befehl eine Vorschau und dann ein Job:

```sh
S="X-Data-Gateway-Session: $TOKEN"
curl -X POST http://data-gateway:9090/admin/workspaces/~/commands/push/preview -H "$S" -H "Content-Type: application/json" -d '{"stage": "default"}'
# {"previewId":"…","stage":"default","sentences":[…],"expiresAt":"…"}
curl -X POST http://data-gateway:9090/admin/workspaces/~/commands/push -H "$S" -H "Content-Type: application/json" -d '{"stage": "default", "previewId": "…"}'
# 202 {"id":"…","command":"push","status":"running",…}
curl http://data-gateway:9090/admin/workspaces/~/jobs/<id> -H "$S"
```

## Gespeichertes {#what-is-saved}

Mit `workbenchWrite` werden Ordner, Abfragen, Skripte und Diagramme des Explorers in `workbench/` jedes Workspace
gespeichert, eine Datei pro Element, und alle mit Zugriff auf das Schema sehen sie (sie lassen sich mit git neben dem
Schema versionieren). Ohne sie bleiben sie wie bisher im Browser. Eine von Hand geschriebene Datei ist ebenfalls ein
Element; eine, die kein gültiges YAML ist, wird als solche gezeigt und nie überschrieben.

## Stages und ihre Quellen {#stages-and-their-sources}

In einer Stage hat jede Quelle eine `condition`, einen Ausdruck, der entscheidet, welche Sätze zu ihr gehen (die erste
Quelle, deren Bedingung wahr ist; eine letzte ohne Bedingung nimmt den Rest). Die IDE schreibt sie mit Vorschlägen, und
das Gateway prüft sie während der Eingabe (`/admin/expressions/check`): Eine Bedingung, die sich nicht parsen lässt, ist
ein Fehler des Schemas, eine Variable, die nicht zu einem Satz gehört (`entity`, `action`, `category`, `type`, `read`,
`write`, `dml`, `ddl`), eine Warnung.

## Dateien und wo jeder stand {#files-and-where-each-one-was}

- Die Dateien von `data/` und `src/` können aufgelistet und gelesen werden (`/admin/workspaces/{route}/files`), nie die
  `.env`, `orm_state/` oder eine versteckte Datei.
- Wo die IDE jeder Zugangsdaten stand (ihre Tabs und deren Entwürfe, was aufgeklappt ist), speichert das Gateway in
  `<orm.workspacePath>/.data-gateway/state.sqlite` (`/admin/session`), sodass ein Neuladen oder ein anderer Browser dort
  beginnt.

## Seit 4.1.0 {#since-4-1-0}

Seit data-gateway 4.1.0: die Befehle `migrations`, `migrate` und `seed` sowie die Änderungen, die Daten verlieren können,
in `push` (oben); die **Historie eines Schemas** (jede über die Administration gemachte Änderung, mit wem, vorher,
nachher und dem Diff, in `logs/changes.jsonl` des Workspaces und unter `GET /admin/workspaces/{route}/history`), das
**Routing einer Stage** (wohin jede Entität geht, `…/stages/{stage}/routing`) und `build` pro Sprache
(`src/<language>/domain/`), mit nur dem Modell oder nur den Repositories, ein generierter Code als Zip heruntergeladen
oder entfernt.

## Seit 4.2.0 {#since-4-2-0}

Die Ereignisse der [Outbox](Changes.md#retries-and-dead-events) eines Schemas: `GET /admin/workspaces/{route}/outbox?status=dead`
listet die, die zu oft fehlgeschlagen sind, mit ihrem Fehler (`schemaRead`), und `POST …/outbox/{id}/retry` setzt
eines wieder auf ausstehend (`schemaRead` und `ddl`).

## Seit 4.3.0 {#since-4-3-0}

Die [Schreibvorgänge, die auf eine Person warten](Security.md#approvals): `GET /admin/workspaces/{route}/approvals?status=pending`
listet sie, jeden mit dem Anfragenden, seiner Abfrage oder seinem Skript, seinen Daten und den Anweisungen, die er
ausführen würde; `POST …/approvals/{id}/approve` führt ihn als der Anfragende aus, `…/reject { reason }` verwirft ihn.
Beide brauchen `approve`, und nie durch den Anfragenden.

## Über MCP {#over-mcp}

Der MCP-Server jedes Schemas ergänzt `admin_schema_get`, `admin_schema_validate` und `admin_stage_fetch` für
Anmeldedaten mit `schemaRead`: ein Agent liest das Schema, prüft eine Änderung und sieht, ob die Datenbanken zum
Modell passen. Schreiben wird über MCP nicht angeboten: ein Modell täte es ohne die Vorschau und die Bestätigung der UI.

## Die API {#the-api}

Die REST-Routen stehen in der [REST-API](Rest.md#administration); ein Workspace wird über seine Route in einem
URL-Segment benannt (`iot%2Fv1`).
