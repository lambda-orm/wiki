# Sicherheit {#security}

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
- Ohne Zugangsdaten (oder mit falschen) lautet die Antwort `401`; WebSocket-Upgrades werden abgelehnt.
- `/ping`, `/health`, `/metrics`, `/version`, `/schemas`, `/doc` und die Dateien der UI benötigen keine Zugangsdaten.

## Berechtigungen {#permissions}

| Berechtigung | Erlaubt |
| --- | --- |
| `read` | das Schema, die Domäne, plan, metadata, model, parameters, constraints, stage exists und export sowie `execute` **nur, wenn jede Anweisung ein `select` ist** |
| `write` | `execute`, das schreibt (`insert`, `update`, `delete`, `upsert`, `merge`, `bulk*`, …) |
| `script` | Skripte (`POST /script`, `orm_execute_script`, `query.script`): Ein Skript kann intern alles tun, daher ist es eine eigene Berechtigung |
| `queue` | `execute-queued` (und `write`, wenn die Abfrage schreibt) |
| `stageImport` | das Importieren eines Stages |

- Die Autorisierung erfolgt im Worker des Schemas, bevor irgendetwas ausgeführt wird, gleich für REST, MCP und WebSocket.
- Um zu wissen, ob eine Abfrage schreibt, analysiert das Gateway sie (ihre `metadata`): Mit nur `read` wird eine Abfrage
  mit irgendeiner Anweisung, die kein `select` ist, auch innerhalb eines `include`, abgelehnt.
- Ohne die Berechtigung: `403` in REST, `status: 403` in WebSocket, `isError: true` in MCP, mit der Meldung
  `the credential "reader" does not have the "write" permission`.
- `GET /whoami` liefert den Namen und die Berechtigungen der Zugangsdaten, nie deren Secret.

## Audit {#audit}

Jede Operation, die Daten ändert oder ändern kann, hinterlässt einen Audit-Eintrag: eine JSON-Zeile mit
`"type": "audit"` auf der Standardausgabe, damit der Log-Collector (Loki, ELK, CloudWatch, …) sie getrennt ablegen kann.

| Operation | Protokolliert |
| --- | --- |
| `execute` | wenn irgendeine Anweisung kein `select` ist |
| Skript | immer |
| Ausführung in der Warteschlange | immer (beim Einreihen) |
| Stage-Import | immer |

```json
{ "type": "audit", "time": "2026-11-17T14:03:22.114Z", "schema": "iot/v1", "transport": "mcpHttp",
  "credential": "agent", "operation": "execute", "actions": ["insert"], "entities": ["Devices"],
  "query": "Devices.insert()", "rows": 1, "durationMs": 42, "result": "ok" }
```

- Er wird nach der Ausführung geschrieben, auch wenn sie fehlschlägt (`"result": "error"` mit der Meldung).
- Er enthält den Namen der Zugangsdaten, nie deren Secret. Die Parameter (`data`) werden nur mit
  `audit.includeData: true` hinzugefügt, da sie personenbezogene Daten enthalten können. `audit.enabled: false`
  deaktiviert ihn.

## Limits {#limits}

| Limit | Schlüssel | Wenn es erreicht wird |
| --- | --- | --- |
| Anfragen pro Zeitfenster (nur `http`) | `rateLimit.windowMs`, `rateLimit.max` (`0` = aus) | `429` |
| Gleichzeitige Operationen pro Schema | `server.maxConcurrent` | `429` mit `Retry-After` (MCP: `isError`; WebSocket: `status: 429`) |
| Dauer einer Operation | `server.timeout` | Fehler, die Operation wird abgebrochen |
| Größe eines Bodys | `server.requestBodySize` | `413` |
| Größe einer Antwort | `server.maxResponseBytes` | `413`: Verwenden Sie `.page(1, n)` oder aggregieren Sie in der Abfrage |
| Skripte | `scripts.maxLength`, `timeoutMs`, `maxIterations` | `413` (Länge) oder ein Fehler des Skripts |
| Zeilen eines Ergebnisses für MCP | `mcp.maxRows` | abgeschnitten, mit einem Hinweis ([MCP](Mcp.md#results-and-errors)) |

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

| Status | Ursache |
| --- | --- |
| `400` | eine ungültige Abfrage oder ein ungültiges Modell (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`), eine Verletzung von NOT NULL oder CHECK, ungültige Daten (Postgres `22xxx`) |
| `401` | keine oder falsche Zugangsdaten |
| `403` | den Zugangsdaten fehlt die Berechtigung; Skripte deaktiviert |
| `404` | ein auf diesem Transport nicht bereitgestelltes Schema, eine unbekannte Route |
| `409` | eine Verletzung eines eindeutigen Schlüssels oder Fremdschlüssels (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`) |
| `413` | ein zu großer Body, eine zu große Antwort oder ein zu großes Skript |
| `429` | Rate Limit oder zu viele gleichzeitige Operationen auf dem Schema |
| `503` | das Schema ist nicht `ready` (startet, im Fehlerzustand, startet neu) |
| *n* | ein Skript hat `throw { status: n, message }` ausgeführt (400–599) |
| `500` | alles andere |
