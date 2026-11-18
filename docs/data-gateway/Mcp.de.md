# MCP {#mcp}

Das Gateway ist ein [Model Context Protocol](https://modelcontextprotocol.io)-Server, sodass KI-Agenten (Claude Code und
jeder MCP-Client) die Domäne erkunden und die Daten mit der Sprache von λORM abfragen können. Es gibt **einen MCP-Server
pro Schema** (`/iot/v1/mcp`): Seine Tools beschreiben die Domäne dieses Schemas, und jede Version wird im Client als
eigener Server registriert (`iot-v1`, `iot-v2`).

```sh
claude mcp add --transport http iot-v1 http://localhost:8081/iot/v1/mcp --header "X-Api-Key: $KEY"
```

Mit einem einzigen Schema an der Wurzel: `http://localhost:8081/mcp`.

## Tools {#tools}

Ein Tool pro Operation des Schemas, **Schreibvorgänge eingeschlossen**: Ein Agent kann tun, was eine Anwendung tut,
**sofern seine Zugangsdaten es erlauben**. Die Beschreibungen und Eingabeschemas werden beim Start des Schemas generiert
und enthalten seine Domäne (Entitäten, Eigenschaften, Beziehungen, Enums), sodass das Modell ohne vorherigen Aufruf weiß,
was es abfragen kann.

| Tool | Argumente | REST-Entsprechung | Berechtigung | Hinweis |
| --- | --- | --- | --- | --- |
| `orm_execute` | `query`, `data?`, `options?` | `POST /execute` | `read` (Selects) oder `write` | nur lesend mit `read`; destruktiv mit `write` |
| `orm_execute_script` | `script`, `data?`, `options?` | `POST /script` | `script` | destruktiv |
| `orm_execute_queued` | `topic`, `query`, `data?`, `chunk?`, `options?` | `POST /execute-queued` | `queue` | destruktiv |
| `orm_plan` | `query`, `options?` | `POST /plan` | `read` | nur lesend |
| `orm_metadata` | `query` | `POST /metadata` | `read` | nur lesend |
| `orm_model` | `query` | `POST /model` | `read` | nur lesend |
| `orm_parameters` | `query` | `POST /parameters` | `read` | nur lesend |
| `orm_constraints` | `query` | `POST /constraints` | `read` | nur lesend |
| `schema_get` | — | `GET /schema` | `read` | nur lesend |
| `schema_version` | — | `GET /schema/version` | `read` | nur lesend |
| `schema_domain` | — | `GET /domain` | `read` | nur lesend |
| `schema_entities` | `entity?` | `GET /entities[/{entity}]` | `read` | nur lesend |
| `schema_enums` | `enum?` | `GET /enums[/{enum}]` | `read` | nur lesend |
| `schema_sources` | `source?` | `GET /sources[/{source}]` | `read` | nur lesend |
| `schema_mappings` | `mapping?`, `entity?` | `GET /mappings…` | `read` | nur lesend |
| `schema_views` | — | `GET /views` | `read` | nur lesend |
| `schema_stages` | `stage?` | `GET /stages[/{stage}]` | `read` | nur lesend |
| `stage_exists` | `stage` | `GET /stages/{stage}/exists` | `read` | nur lesend |
| `stage_export` | `stage` | `GET /stages/{stage}/export` | `read` | nur lesend |
| `stage_import` | `stage`, `data` | `POST /stages/{stage}/import` | `stageImport` | destruktiv |
| `gateway_version` | — | `GET /version` | `read` | nur lesend |
| `gateway_health` | — | `GET /health` | `read` | nur lesend |

- **`tools/list` zeigt Zugangsdaten nur die Tools, die sie verwenden dürfen.** Ohne `script` erscheint
  `orm_execute_script` nicht; mit nur `read` wird `orm_execute` als „read-only queries with this credential“ beschrieben.
- Die Hinweise (`readOnlyHint`, `destructiveHint`) blockieren nichts: Sie teilen dem Client mit, welche Tools Daten
  ändern, damit er eine Bestätigung anfordern kann. Was blockiert, sind die [Berechtigungen](Security.md#permissions).
- Es gelten dieselben Regeln wie bei REST: `orm_execute_script` schlägt fehl, wenn Skripte deaktiviert sind;
  `orm_execute_queued`, wenn das Schema keine Warteschlange hat.
- `mcp.tools.include` / `exclude` (global oder pro Schema) schränken die Liste weiter ein, zum Beispiel
  `exclude: [ orm_execute_script, stage_import ]`.

## Ergebnisse und Fehler {#results-and-errors}

- Ein Ergebnis ist `{ content: [{ type: "text", text: <JSON> }] }`, bei kleinen Ergebnissen zusätzlich mit
  `structuredContent`.
- **Zeilenlimit (`mcp.maxRows`, Standard 500).** Wenn `orm_execute` oder `orm_execute_script` eine längere Liste
  liefern, wird sie abgeschnitten, und dem Modell wird mitgeteilt, wie es weniger anfordern kann:

  ```json
  { "rows": [ "…500 rows…" ], "truncated": true, "returned": 500, "total": 18234,
    "hint": "The result was cut to 500 rows. Use .page(1, 500) (or a smaller page), aggregate with map/count, or filter the query more." }
  ```

  Dies gilt nur für MCP und erst nach Ausführung der Abfrage: Es schützt den Kontext des Modells. Die Datenbank wird
  durch `server.maxResponseBytes` und `server.timeout` geschützt.
- Ein Fehler von λORM (Syntax, eine unbekannte Entität, ein Constraint, ein deaktiviertes Skript) oder eine fehlende
  Berechtigung liefert `isError: true` mit der Meldung, sodass das Modell sie lesen und die Abfrage korrigieren kann.

## Ressourcen {#resources}

| URI | Inhalt |
| --- | --- |
| `lambdaorm://guide/expressions` | eine kurze Anleitung zur Abfragesprache (Markdown), um dem Modell Kontext zu geben |
| `lambdaorm://schema/domain` | die gesamte Domäne des Schemas, JSON |
| `lambdaorm://entities/{entity}` | eine Entität (Template) |

## Was ein Agent tun kann {#what-an-agent-can-do}

Es gibt keinen Nur-Lese-Modus des Transports: Was ein Agent tun kann, bestimmen **die Berechtigungen seiner
Zugangsdaten**. Ein Agent, der nur abfragt, erhält Zugangsdaten mit `[ read ]`: Er kann Selects ausführen, aber über
keinen Transport schreiben, Skripte ausführen, Warteschlangen nutzen oder importieren. Außerdem: `schemas[].transports`,
um ein Schema aus MCP herauszuhalten, `mcp.tools.exclude`, die Hinweise und die Berechtigungen des Datenbankbenutzers
(die darunterliegende Garantie). Jeder Schreibvorgang eines Agenten wird mit dem Namen seiner Zugangsdaten und
`"transport": "mcpHttp"` [protokolliert](Security.md#audit).

## Transporte {#transports}

### mcpHttp {#mcphttp}

| Route | Protokoll |
| --- | --- |
| `POST/GET/DELETE {basePath}/{schema}/mcp` | Streamable HTTP: Claude Code `--transport http` und aktuelle Clients |
| `GET {basePath}/{schema}/sse` + `POST {basePath}/{schema}/messages?sessionId=<id>` | HTTP+SSE (veraltet), mit `legacySse: true` |
| `GET {basePath}/status` | der Zustand des Transports, die Schemas und die offenen SSE-Sitzungen |

Streamable HTTP ist standardmäßig zustandslos (`stateful: false`): Jeder `POST` steht für sich, und jede Replika kann ihn
beantworten. Die Zugangsdaten werden mit jeder Anfrage gesendet.

### mcpWebSocket {#mcpwebsocket}

Ein Upgrade unter `{basePath}/{schema}/mcp`, authentifiziert im Handshake; JSON-RPC-2.0-Nachrichten mit den MCP-Methoden
(`initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, …). Es ist kein
Standard-MCP-Transport: Er wird für Clients und Gateways angeboten, die ihn von sich aus unterstützen. Sein
AsyncAPI-Dokument befindet sich unter `GET {basePath}/asyncapi`.

```json
→ { "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "orm_execute", "arguments": { "query": "Products.filter(p => p.price > 50).map(p => p.name)" } } }
← { "jsonrpc": "2.0", "id": 1, "result": { "content": [ { "type": "text", "text": "[\"Côte de Blaye\", \"Thüringer Rostbratwurst\"]" } ] } }
```
