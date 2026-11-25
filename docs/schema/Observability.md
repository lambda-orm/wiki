# Observability

Logs, metrics and traces with OpenTelemetry, configured by `infrastructure.observability`. Use it to see what λORM
does in production: which queries run, how long they take, how many rows they bring, and who changed the schema of a
database and how. Without that section λORM behaves as before: logs in text on the console, no metrics, no traces.

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

## The keys

| Key | Description |
| --- | --- |
| `serviceName`, `resource` | The name of the service (`lambdaorm` by default) and the resource attributes of OpenTelemetry. |
| `exporter` | The default exporter of the three signals: `type` (`otlp`, `console`, `none`), `protocol` (`http/protobuf`, `http/json`, `grpc`) and `endpoint`. |
| `logs` | The `level` and the `adapters`: `console` (`format: text` or `json`), `file` (`path`, `events`, `maxBytes`), `opentelemetry` and `winston`. Each adapter can have its own `level`. |
| `metrics` | `enabled`, `exporters` (`opentelemetry` with `exportIntervalMs`, `prometheus`), `entityAttribute` (the entity as an attribute, `true` by default) and `histogramBuckets`. |
| `traces` | `enabled`, `sampler` (`ratio` from 0 to 1, `parentBased`), `rules` and `queryText`. |

The standard `OTEL_*` variables (`OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
`OTEL_TRACES_SAMPLER`, `OTEL_SDK_DISABLED`…) override the schema, so each environment changes the destination without
touching it. The headers of the exporter, which carry tokens, are read only from `OTEL_EXPORTER_OTLP_HEADERS`: there
is no key for them in the schema.

## The signals

- **Traces:** a span per expression and per sentence, with the attributes of the OpenTelemetry conventions; the
  constants of a sentence go as `?` (`queryText: sanitized`; `full` is only for debugging). **Trace rules** are
  conditions on the sentence (`entity`, `action`, `write`…) and on its result (`durationMs`, `rows`, `error`); without
  rules every sentence is traced, and with rules the first one met decides (`record: false` drops it). An entity can
  decide for itself, instead of the rules: `entities[].observability.trace: 'write || durationMs > 500'` in the
  [domain](SchemaDefinition.md#entity).
- **Metrics:** the duration of operations and queries, rows returned, connections, constraint violations,
  transactions, stage commands and schema loads; by OTLP or Prometheus.
- **Logs:** levels, events, redaction of secrets and adapters (console, file, OpenTelemetry, winston).
- **The history of the schema:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` and `migrate` leave a
  `schema.change` event with the DDL they wrote and who ran them; the `file` adapter above keeps them in
  `logs/changes.jsonl`.

## The SDK

The OpenTelemetry packages are optional peer dependencies of `@lambdaorm/lib`, loaded only when the configuration asks
for them. If the application has already registered an OpenTelemetry SDK, λORM uses it (register it before
`orm.init`); if not, λORM starts one per process and shuts it down with the last `orm.end()`.
