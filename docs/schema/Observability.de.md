# Observability {#observability}

Logs, Metriken und Traces mit OpenTelemetry, konfiguriert durch `infrastructure.observability`. Verwenden Sie sie, um
zu sehen, was λORM in der Produktion tut: welche Abfragen ausgeführt werden, wie lange sie dauern, wie viele Zeilen sie
liefern und wer das Schema einer Datenbank wie geändert hat. Ohne diesen Abschnitt verhält sich λORM wie zuvor: Logs
als Text auf der Konsole, keine Metriken, keine Traces.

```yaml
infrastructure:
  observability:
    serviceName: lambdaorm                       # OTEL_SERVICE_NAME wins
    resource: { deployment.environment.name: dev }
    exporter: { type: otlp, protocol: http/protobuf, endpoint: http://alloy:4318 }
    logs:
      level: info                                # debug | info | warn | error
      adapters:
        - { type: console, format: json }
        - { type: file, path: changes.jsonl, events: [schema.change] }   # relative to infrastructure.paths.logs
        - { type: opentelemetry }
    metrics:
      enabled: true
      exporters: [{ type: opentelemetry, exportIntervalMs: 60000 }, { type: prometheus }]
    traces:
      enabled: true
      sampler: { ratio: 1, parentBased: true }
      rules:                                     # the first one met decides
        - { condition: 'entity == "Sessions"', record: false }
        - { condition: 'write || durationMs > 500 || isNotNull(error)' }
      queryText: sanitized                       # none | sanitized | full
```

## Die Schlüssel {#the-keys}

| Schlüssel | Beschreibung |
| --- | --- |
| `serviceName`, `resource` | Der Name des Dienstes (standardmäßig `lambdaorm`) und die Ressourcenattribute von OpenTelemetry. |
| `exporter` | Der Standard-Exporter der drei Signale: `type` (`otlp`, `console`, `none`), `protocol` (`http/protobuf`, `http/json`, `grpc`) und `endpoint`. |
| `logs` | Das `level` und die `adapters`: `console` (`format: text` oder `json`), `file` (`path`, `events`, `maxBytes`), `opentelemetry` und `winston`. Jeder Adapter kann sein eigenes `level` haben. |
| `metrics` | `enabled`, `exporters` (`opentelemetry` mit `exportIntervalMs`, `prometheus`), `entityAttribute` (die Entität als Attribut, standardmäßig `true`) und `histogramBuckets`. |
| `traces` | `enabled`, `sampler` (`ratio` von 0 bis 1, `parentBased`), `rules` und `queryText`. |

Die Standardvariablen `OTEL_*` (`OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
`OTEL_TRACES_SAMPLER`, `OTEL_SDK_DISABLED`…) überschreiben das Schema, sodass jede Umgebung das Ziel ändern kann, ohne
es anzufassen. Die Header des Exporters, die Tokens enthalten, werden nur aus `OTEL_EXPORTER_OTLP_HEADERS` gelesen: Im
Schema gibt es keinen Schlüssel dafür.

## Die Signale {#the-signals}

- **Traces:** ein Span pro Ausdruck und pro Anweisung, mit den Attributen der OpenTelemetry-Konventionen; die Konstanten
  einer Anweisung werden als `?` übertragen (`queryText: sanitized`; `full` ist nur zum Debuggen gedacht).
  **Trace-Regeln** sind Bedingungen auf die Anweisung (`entity`, `action`, `write`…) und auf ihr Ergebnis
  (`durationMs`, `rows`, `error`); ohne Regeln wird jede Anweisung als Trace aufgezeichnet, und mit Regeln entscheidet die erste
  zutreffende (`record: false` verwirft sie). Eine Entität kann statt der Regeln selbst entscheiden:
  `entities[].observability.trace: 'write || durationMs > 500'` in der [Domäne](SchemaDefinition.md#entity).
- **Metriken:** die Dauer von Operationen und Abfragen, zurückgegebene Zeilen, Verbindungen, Constraint-Verletzungen,
  Transaktionen, Stage-Befehle und Ladevorgänge des Schemas; per OTLP oder Prometheus.
- **Logs:** Level, Ereignisse, Schwärzung von Geheimnissen und Adapter (console, file, OpenTelemetry, winston).
- **Die Historie des Schemas:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` und `migrate`
  hinterlassen ein Ereignis `schema.change` mit der DDL, die sie geschrieben haben, und wer sie ausgeführt hat; der
  obige `file`-Adapter speichert sie in `logs/changes.jsonl`.

## Das SDK {#the-sdk}

Die OpenTelemetry-Pakete sind optionale Peer-Dependencies von `@lambdaorm/lib` und werden nur geladen, wenn die
Konfiguration sie anfordert. Hat die Anwendung bereits ein OpenTelemetry-SDK registriert, verwendet λORM dieses
(registrieren Sie es vor `orm.init`); andernfalls startet λORM eines pro Prozess und fährt es mit dem letzten
`orm.end()` herunter.
