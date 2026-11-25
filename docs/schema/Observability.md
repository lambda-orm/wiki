# Observability

Logs, metrics and traces with OpenTelemetry, configured by `infrastructure.observability`; the standard `OTEL_*`
variables override it. Without that section λORM behaves as before.

```yaml
infrastructure:
  observability:
    exporter: { type: otlp, endpoint: http://alloy:4318 }
    logs:
      adapters:
        - { type: console, format: json }
        - { type: file, path: changes.jsonl, events: [schema.change] }
        - { type: opentelemetry }
    metrics: { enabled: true }
    traces:
      enabled: true
      rules:                                                     # the first one met decides
        - { condition: 'entity == "Sessions"', record: false }
        - { condition: 'write || durationMs > 500 || isNotNull(error)' }
```

- **Traces:** a span per expression and per sentence, with the attributes of the OpenTelemetry conventions; the
  constants of a sentence go as `?`. **Trace rules** are conditions on the sentence (`entity`, `action`, `write`…) and
  on its result (`durationMs`, `rows`, `error`). An entity can decide for itself:
  `entities[].observability.trace: 'write || durationMs > 500'`.
- **Metrics:** the duration of operations and queries, rows returned, connections, constraint violations,
  transactions, stage commands and schema loads; by OTLP or Prometheus.
- **Logs:** levels, events, redaction of secrets and adapters (console, file, OpenTelemetry, winston).
- **The history of the schema:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` and `migrate` leave a
  `schema.change` event with the DDL they wrote and who ran them.
