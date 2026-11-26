# Sicherheit {#security}

Wer das Gateway nutzen darf und was jeder tun darf, wird in seiner Konfiguration entschieden, einmal, für jeden
Transport: **Zugangsdaten** (ein Schlüssel, ein Token oder ein Benutzer) haben einen Namen und eine Liste von
**Berechtigungen**; das Gateway prüft sie, bevor irgendetwas eine Datenbank erreicht, **auditiert** jedes Schreiben mit
dem Namen der Zugangsdaten und setzt **Limits** dafür, was eine Anfrage beanspruchen darf. Diese Seite erklärt jeden
Teil.

## Authentifizierung {#authentication}

Der Block `authentication` hat drei Ebenen: global, pro Transport (`transports.<t>.authentication`) und pro Schema
(`orm.schemas[].authentication`). Die spezifischste ersetzt die anderen (Schema → Transport → global). Sie wird vom
Edge-Worker angewendet, bevor irgendetwas das Schema erreicht.

| `adapter` | Ein einzelner Zugang (alle Berechtigungen) | Mehrere Zugangsdaten mit Berechtigungen | Der Client sendet |
| --- | --- | --- | --- |
| `none` (Standard) | — | — | nichts: anonyme Zugangsdaten mit allen Berechtigungen |
| `local`, `type: bearer` | `token` | `tokens: [{ name, value, permissions }]` | `Authorization: Bearer <token>` |
| `local`, `type: apikey` | `value` (und `header`, Standard `X-Api-Key`) | `keys: [{ name, value, permissions }]` | `<header>: <key>` |
| `local`, `type: basic` | `username`, `password` | `users: [{ username, password, permissions }]` | `Authorization: Basic <base64(user:password)>` |
| `jwt` (4.1.0) | — | die Benutzer eines Identitätsanbieters, ihre Rollen auf Berechtigungen abgebildet ([unten](#jwt)) | `Authorization: Bearer <JWT>` |
| `methods` (4.1.0) | — | mehrere der obigen, der Reihe nach: Tokens für die Benutzer, Schlüssel für die Dienste ([unten](#jwt)) | was jede davon erwartet |

```yaml
authentication:
  adapter: local
  type: bearer
  tokens:
    - { name: reports, value: $REPORTS_TOKEN, permissions: [ read ] }
    - { name: backend, value: $BACKEND_TOKEN, permissions: [ read, write, script, queue, stageImport ] }
```

- `local`-Zugangsdaten ohne ihr Secret (oder deren `$VAR` nicht definiert ist) verhindern den Start. Offener Zugriff ist
  nur `adapter: none`, bewusst so geschrieben.
- Secrets werden in konstanter Zeit verglichen. Das Secret gelangt nie zu den Workern der Schemas: nur der Name und die
  Berechtigungen der Zugangsdaten.
- Ohne Zugangsdaten (oder mit falschen) lautet die Antwort `401` (`{ "error": "Unauthorized", "message": … }`);
  WebSocket-Upgrades werden abgelehnt.
- `/ping`, `/health`, `/metrics`, `/version` (auch unter jedem Schema), `/schemas`, `/transports` und die
  Dokumentation (`/openapi.json`, `/doc`, `/api-docs`) benötigen keine Zugangsdaten.
- Zugangsdaten ohne `permissions` erhalten die der Daten (`read`, `write`, `script`, `queue`, `stageImport`), nie die
  der Administration.
- In `management` (der IDE) gehen die Zugangsdaten nur in die Anmeldung, und jede Anfrage trägt das Token einer
  [Sitzung](Transports.md#sessions): Sitzungen werden aufgelistet, enden bei Inaktivität und können sofort widerrufen
  werden.
- Kein Transport beantwortet CORS: Ein Browser eines anderen Origins kann das Gateway nicht aufrufen, ein eigenes
  Backend schon.

## Tokens eines Identitätsanbieters (JWT / OIDC) {#jwt}

Seit data-gateway 4.1.0 (seit 4.3.0 gegen Keycloak getestet: seine Rollen, eine View nach einem Claim und die
Rotation seines Schlüssels, auf den fünf Transporten). Die Benutzer bringen das Token mit, das ihnen ihr Identitätsanbieter ausstellt (Keycloak,
Auth0, Entra ID, Cognito, Google…), und das Gateway prüft es, ohne den Anbieter bei jeder Anfrage aufzurufen:

```yaml
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop          # iss; its keys are discovered from it (OIDC)
      audience: data-gateway                                # aud
      # jwksUri: https://…/certs                            # if the discovery is not there
      # algorithms: [ RS256, ES256 ]                        # default RS256, ES256, PS256
      # clockTolerance: 30s
      principal:
        name: preferred_username                            # the claim of the name (default sub)
        permissions:
          claim: realm_access.roles                         # a list, or a text separated by spaces (as scope)
          roles:
            reader: [ read ]
            support: { permissions: [ read ], view: support }  # a role with its view (below)
            admin: [ read, write, script ]
      context:                                              # claim → variable of the context of λORM
        tenant: tenant_id
        region: address.region
    - adapter: local                                        # the services keep their keys
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, permissions: [ read, write ] }
```

- **Die Signatur** wird mit den öffentlichen Schlüsseln des Ausstellers geprüft (sein JWKS, zwischengespeichert; ein mit
  einem neuen Schlüssel signiertes Token liest sie erneut), danach der Aussteller, die Audience und die Zeiten.
  `secret: $JWT_SECRET` (HS256) anstelle der Schlüssel ist für Entwicklung und Tests gedacht.
- **Wer es ist:** sein Name (`principal.name`), die Berechtigungen seiner Rollen (eine Rolle muss sie auflisten: eine
  nicht aufgeführte Rolle gibt nichts) und sein **Kontext**: was die [Zeilenfilter der Views](#views), die Standardwerte
  und die Bedingungen des Schemas lesen (`context.tenant`). Ein Claim kann ein Pfad sein (`address.region`) oder ein
  Name mit Punkten oder eine URL, wie Auth0 sie benennt (`https://example.com/roles`).
- **`methods`:** Die erste, die die Zugangsdaten erkennt, entscheidet. Ein JWT, das fehlschlägt, wird als Token
  abgelehnt, ein falscher Schlüssel als Schlüssel; keiner wird von der anderen versucht.
- **Ein abgelehntes Token sagt, warum:** `401` mit `the token is not valid: expired` (oder `issuer`, `audience`,
  `signature`, `algorithm`, `unknown key`, `not yet valid`) und `WWW-Authenticate: Bearer error="invalid_token"`. Ein
  nicht erreichbarer Aussteller ist `503`, nicht `401`. Das Token wird nie in die Logs, das Audit oder die Traces
  geschrieben.
- **Nichts überdauert das Token:** Eine Sitzung von `management` endet bei seinem `exp`; eine WebSocket- oder
  MCP-WebSocket-Verbindung wird mit dem Code `4401` geschlossen.
- Der [Node-Client](Clients.md) nimmt das Token als Funktion, um es zu erneuern; die [IDE](../ide/Connections.md) nimmt
  es als Bearer-Token.

## Die View jedes Aufrufers {#views}

Seit data-gateway 4.1.0. Eine [View](../schema/Views.md) des Schemas entscheidet, was von der Domäne gesehen wird: ihre
Entitäten, ihre Eigenschaften (maskiert, ausgeblendet oder berechnet) und ihre Zeilen (ein Filter mit dem Kontext).
**Das Gateway wählt die View jeder Anfrage**, nie der Client:

```yaml
authentication:
  adapter: local
  type: apikey
  keys:
    - { name: billing, value: $BILLING_KEY, permissions: [ read ], view: billing }   # the view of a key
# or the view of a role of a token: roles: { support: { permissions: [ read ], view: support } }
orm:
  schemas:
    - path: shop
      view: public            # the one of a caller without a view; without it, default (the whole domain)
```

- **Alles liegt in dieser View:** die Abfragen (was sie maskiert, kommt maskiert, was sie ausschließt, existiert nicht,
  ihre Zeilen werden mit dem Kontext des Tokens gefiltert), deren `metadata`, `model`, `parameters` und `constraints`,
  die Domäne (`/schema`, `/domain`, `/entities`, `/typings`, die Suche), die Entitäten der Mappings, die aufgelisteten
  Views, was MCP einem Agenten mitteilt, und `/whoami` (`view`).
- **Eine `view` oder ein `context`, die ein Client in `options` sendet, wird verworfen**, von jedem Transport: Ein
  Client kann nicht umgehen, was seine View verbirgt, noch die Zeilen eines anderen Mandanten lesen.
- **Unter denen seiner Rollen gewählt** (seit 4.4.0, [unten](#roles)): Der Client kann eine davon in `options.view`
  anfragen; eine andere ist `403`. Vor 4.4.0 wählte der Client nie, und ein Token, dessen Rollen zwei Views ergaben,
  war `403`. Vor einer View, die das Schema nicht hat, wird beim Laden des Schemas gewarnt, und ihre Anfragen sind
  `403`. Eine Entität, die die View ausschließt, ist `403 ViewError`.
- Die Befehle der Stage (`import`, `export`, `push`…) sehen das ganze Schema: Vor Zugangsdaten mit einer View und
  `stageImport` oder `ddl` wird beim Lesen der Konfiguration gewarnt.

## Rollen: wo sie arbeiten und was sie dürfen {#roles}

**Seit data-gateway 4.4.0.** Eine Rolle sagt, **wo** sie arbeiten darf, die Views und Stages von λORM, die sie nutzen
darf, und **was** sie dort darf, ihre Berechtigungen und ihre Grenzen. Tokens nennen ihre Rollen über ihren Claim,
Schlüssel über `roles`:

```yaml
authorization:
  roles:
    support:
      views: [support]                 # die erste: die von dem, der nicht wählt; ohne sie die des Schemas
      permissions: [read]
    analyst:
      views: [analytics, support]
      stages: [default, reporting]     # ohne sie die des Schemas
      permissions: [read]
      maxRows: 5000                    # options.maxRows: der Client darf weniger anfragen, nie mehr
    backend:
      permissions: [read, write]
    operator:
      stages: [default, staging]
      permissions: [read, ddl, destructive]
    admin:
      permissions: [read, schemaRead, roles]
      locked: true                     # wird nicht über die Administration erweitert
  # stages: open                       # eine Stage, die keine Rolle nennt, darf gewählt werden, wie vor 4.4.0 (für eine Version)
authentication:
  methods:
    - adapter: jwt
      issuer: https://auth.example.com/realms/shop
      principal:
        permissions: { claim: realm_access.roles }    # die Namen des Claims sind die von authorization.roles
    - adapter: local
      type: apikey
      keys:
        - { name: billing, value: $BILLING_KEY, roles: [backend] }
orm:
  schemas:
    - path: shop
      view: public                     # die View des Schemas
      stage: default                   # die Stage des Schemas
      roles:                           # in diesem Schema, was die Rollen hinzufügen
        support: { views: [support, public] }
```

- **Der Client wählt nur unter ihnen:** `options.view` und `options.stage` jeder Anfrage, über jeden Transport; eine,
  die seine Rollen nicht erlauben, ist `403`. Ohne Wahl die erste seiner Rollen; sind sich seine Rollen nicht einig,
  die des Schemas, wenn sie sie erlauben, sonst `403` mit der Bitte zu wählen. Ein Agent über MCP wählt nicht: die
  Standards seiner Rollen.
- **Die Berechtigungen der Rollen, die das Gewählte erlauben,** nicht die Summe aller: Mit `support` (liest, in der
  View `support`) und `backend` (schreibt, in der View des Schemas) liest eine Anfrage in `support` nur. Die Befehle
  einer Stage (`push`, `migrate`, `seed`, `export`, `import`…) nur in den Stages ihrer Rolle; die Berechtigungen der
  Administration, was auch immer gewählt wurde. `scope: any` in einer Rolle behält ihre Berechtigungen, was auch immer
  gewählt wurde.
- **`options.maxRows`** nur kleiner als das der Rolle; **`allowDestructive`** ist keine Option des Clients mehr: Ein
  Push oder eine Migration, die Daten verliert, braucht die Berechtigung `destructive` zusätzlich zu `ddl`.
- **`GET /whoami`** nennt View und Stage des Aufrufers ohne Wahl, alle, die er wählen darf, und seine Rollen.
- **Die Rollen eines Schemas** (`orm.schemas[].roles`) und die [im Zustand des Gateways gespeicherten](Admin.md#since-4-4-0)
  erweitern die von `authorization.roles`: mehr Views, Stages oder Berechtigungen, nie weniger. Eine Rolle des Zustands,
  die das YAML nicht hat, ist eine neue.
- Das Bisherige gilt weiter: `roles` in einer Methode `jwt` und `view` (eine) in einer Rolle oder einem Schlüssel werden
  als Rollen gelesen; ein Schlüssel mit eigenen `permissions` und `view` ist eine eigene Rolle.

## Berechtigungen {#permissions}

| Berechtigung | Erlaubt |
| --- | --- |
| `read` | das Schema, die Domäne, plan, metadata, model, parameters, constraints, stage exists und export sowie `execute` **nur, wenn jede Anweisung ein `select` ist** |
| `write` | `execute`, das schreibt (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | Skripte (`POST /script`, `orm_execute_script`, `query.script`): Ein Skript kann intern alles tun, daher ist es eine eigene Berechtigung |
| `queue` | `execute-queued` (und `write`, wenn die Abfrage schreibt) |
| `stageImport` | das Importieren eines Stages |
| `schemaRead`, `schemaWrite`, `schemaAdmin`, `workbenchWrite`, `ddl`, `build` | die [Administration](Admin.md#turning-it-on): nie standardmäßig vergeben |
| `approve` | (4.3.0) die [wartenden Schreibvorgänge](#approvals) genehmigen oder ablehnen, nie die eigenen: nie standardmäßig vergeben |
| `destructive` | (4.4.0) mit `ddl` ein Push oder eine Migration, die Daten verliert (`allowDestructive`): nie standardmäßig vergeben |
| `roles` | (4.4.0) die [Rollen des Zustands des Gateways](Admin.md#since-4-4-0) sehen und ändern: nie standardmäßig vergeben |
| `sessionAdmin` | jede [Sitzung](Transports.md#sessions) von `management` auflisten und die anderer Zugangsdaten widerrufen (ohne sie sehen und schließen Zugangsdaten nur ihre eigenen): nie standardmäßig vergeben |

- Die Autorisierung erfolgt im Worker des Schemas, bevor irgendetwas ausgeführt wird, gleich für REST, MCP und WebSocket.
- Um zu wissen, ob eine Abfrage schreibt, analysiert das Gateway sie (ihre `metadata`): Mit nur `read` wird eine Abfrage
  mit irgendeiner Anweisung, die kein `select` ist, auch innerhalb eines `include`, abgelehnt.
- Ohne die Berechtigung: `403` in REST, `status: 403` in WebSocket, `isError: true` in MCP, mit der Meldung
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` liefert den Namen und die Berechtigungen der Zugangsdaten (ihre View, 4.1.0; ihre Stage, was sie wählen
  dürfen, und ihre Rollen, 4.4.0), nie deren Secret.

## Schreibvorgänge, die auf eine Person warten {#approvals}

**Seit data-gateway 4.3.0.** Ein Agent kann Änderungen vorschlagen, ohne sie allein auszuführen: Sein Schreibvorgang
wartet, bis eine Person ihn genehmigt.

```yaml
mcp:
  approval: writes
  approvalExpires: 1h
authentication:
  keys:
    - { name: agent, value: $AGENT_KEY, permissions: [ read, write ], approval: writes }
    - { name: ops,   value: $OPS_KEY,   permissions: [ read, approve ] }
```

- Der Schreibvorgang antwortet sofort `{ "approval": "…", "status": "pending", "expiresAt" }` (REST: `202`); noch hat
  sich nichts geändert. Ein Skript wartet immer (es kann schreiben); ein Schreibvorgang in der Warteschlange kann nicht
  warten (`403`).
- Wer ihn angefragt hat, sieht seinen Zustand mit dem MCP-Werkzeug `approval_status`, `GET /{schema}/approvals/{id}`
  oder `approvals.status`: `pending`, `done` (mit Ergebnis), `failed`, `rejected` (mit Grund) oder `expired`.
- Wer `approve` hat, listet sie mit den Anweisungen, die jeder ausführen würde, und genehmigt oder lehnt sie ab, in der
  [Administration](Admin.md#since-4-3-0) oder der [IDE](../ide/Connections.md#approvals); **nie den eigenen**.
  Genehmigt läuft er einmal als der Anfragende (seine View, sein Kontext) und wird mit `approvedBy` auditiert.
- Sie liegen im SQLite des Volumes (`.data-gateway/state.sqlite`), geteilt von den Replikas, die es einbinden.

## Audit {#audit}

Jede Operation, die Daten ändert oder ändern kann, hinterlässt einen Audit-Eintrag: eine JSON-Zeile mit
`"type": "audit"` auf der Standardausgabe, damit der Log-Collector (Loki, ELK, CloudWatch, …) sie getrennt ablegen kann.

| Operation | Protokolliert |
| --- | --- |
| `execute` | wenn irgendeine Anweisung kein `select` ist |
| `executeScript` | immer |
| `executeQueued` | immer (beim Einreihen) |
| `stageImport` | immer, auch der Befehl `import` der [Administration](Admin.md#the-commands) |
| `stagePush`, `stageDrop` | die Befehle `push` und `drop` der Administration |
| `stageMigrate`, `stageSeed` | die Befehle `migrate` und `seed` der Administration (4.1.0) |
| `login`, `logout`, `sessionExpired`, `sessionRevoked`, `loginRejected` | die [Sitzungen](Transports.md#sessions) von `management`, mit der ID der Sitzung (nie ihr Token), der Adresse und wer sie widerrufen hat |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- Er wird nach der Ausführung geschrieben, auch wenn sie fehlschlägt (`"result": "error"` mit der Meldung).
- Eine [benannte Abfrage](Rest.md#named-queries) wird mit ihrem `name` auditiert (4.1.0).
- Er enthält den Namen der Zugangsdaten, nie deren Secret. Die Parameter (`data`) werden nur mit
  `audit.includeData: true` hinzugefügt, da sie personenbezogene Daten enthalten können. `audit.enabled: false`
  deaktiviert ihn.

## Limits {#limits}

| Limit | Schlüssel | Wenn es erreicht wird |
| --- | --- | --- |
| Anfragen pro Zeitfenster (nur `http`) | `rateLimit.windowMs`, `rateLimit.max` (`0` = aus) | `429` |
| Gleichzeitige Operationen pro Schema | `server.maxConcurrent` | `429` mit `Retry-After` (MCP: `isError`; WebSocket: `status: 429`) |
| Dauer einer Operation | `server.timeout` | `504 TimeoutError`, die Operation wird abgebrochen |
| Größe eines Bodys | `server.requestBodySize` | `413` |
| Größe einer Antwort | `server.maxResponseBytes` | `413`: Verwenden Sie `.page(1, n)` oder aggregieren Sie in der Abfrage |
| Skripte | `scripts.maxLength`, `timeoutMs`, `maxIterations` | `413 ScriptTooLongError` (Länge) oder ein Fehler des Skripts |
| Zeilen eines Ergebnisses für MCP | `mcp.maxRows` | abgeschnitten, mit einem Hinweis ([MCP](Mcp.md#results-and-errors)) |
| Zeilen und Dauer einer [benannten Abfrage](Rest.md#named-queries) (4.1.0) | `orm.schemas[].queries.<name>.maxRows` / `timeout` | `422 TooManyRowsError` / `504` |

## Fehler {#errors}

Eine fehlgeschlagene Anfrage liefert einen Status, den ein Client zuordnen kann, und einen JSON-Body:

```json
{
  "error": "ExecutionError",
  "code": "23505",
  "message": "ERROR: duplicate key value violates unique constraint \"device_types_pkey\" …"
}
```

| Feld | Bedeutung |
| --- | --- |
| `error` | der Name des Fehlers: `ExecutionError`, `ValidationError`, `ForbiddenError`, `ScriptDisabledError`, … |
| `code` | der Fehlercode der Datenbank, falls vorhanden (Postgres-SQLSTATE wie `23505`, MySQL `ER_DUP_ENTRY`) |
| `message` | die Meldung |
| `suggestions` | für einen Namen der Abfrage, den es nicht gibt, die nächstliegenden: `[{ "name": "nme", "didYouMean": ["name"] }]` |
| `details` | in der Administration, was zum Weitermachen nötig ist: die Probleme eines ungültigen Schemas, der aktuelle Stand nach einem Konflikt |

| Status | Ursache |
| --- | --- |
| `400` | eine ungültige Abfrage oder ein ungültiges Modell (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), eine Verletzung von NOT NULL oder CHECK, ungültige Daten (Postgres `22xxx`); ein Wert des Kontexts, den ein Filter benötigt und den die Identität nicht mitbringt (`ContextError`, `details.variable`) |
| `401` | keine oder falsche Zugangsdaten (ein Token sagt, warum: `expired`, `audience`…); bei `management` keine Sitzung oder eine abgelaufene oder widerrufene |
| `403` | den Zugangsdaten fehlt die Berechtigung; Skripte deaktiviert; eine Entität, die ihre View ausschließt, oder ein Schreiben außerhalb des Filters ihrer View (`ViewError`, `details.view`, `details.entity`); ein Token mit zwei Views |
| `404` | ein Name, den das Schema nicht hat (eine Entität, ein Enum, eine Source, ein Mapping, eine Stage), ein auf diesem Transport nicht bereitgestelltes Schema, eine unbekannte Route |
| `409` | eine Verletzung eines eindeutigen Schlüssels oder Fremdschlüssels (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`); in der Administration ein belegter Workspace, ein laufender Befehl oder einer ohne seine Vorschau, ein `push`, der Daten verlieren kann, ohne `allowDestructive` (`DestructiveChangeError`, `details.changes`) |
| `412`, `428` | Administration: jemand hat es seit dem Lesen geändert; ein Schreiben ohne die Version, die es ändert |
| `413` | ein zu großer Body, eine zu große Antwort oder ein zu großes Skript |
| `422` | Administration: das Schema wäre nicht gültig (`details.issues`, jeweils mit seiner Zeile); eine Abfrage über mehrere Sources mit mehr Zeilen, als sie in den Speicher holen kann (`CrossSourceError`); eine benannte Abfrage über ihrem `maxRows` (`TooManyRowsError`) |
| `429` | Rate Limit oder zu viele gleichzeitige Operationen auf dem Schema |
| `503` | das Schema ist nicht `ready` (`SchemaUnavailableError`: startet, im Fehlerzustand, startet neu); eine Source, die das Gateway nicht erreicht oder deren Verbindungsvariable nicht gesetzt ist (`ConnectionError`); der Aussteller der Tokens ist nicht erreichbar |
| `504` | die Operation dauerte länger als `server.timeout` (`TimeoutError`) |
| *n* | ein Skript hat `throw { status: n, message }` ausgeführt (400–599) |
| `500` | alles andere |
