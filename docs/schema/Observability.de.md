# Observability {#observability}

Logs, Metriken und Traces mit OpenTelemetry, konfiguriert durch `infrastructure.observability`; die Standardvariablen
`OTEL_*` überschreiben sie. Ohne diesen Abschnitt verhält sich λORM wie zuvor.

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

- **Traces:** ein Span pro Ausdruck und pro Anweisung, mit den Attributen der OpenTelemetry-Konventionen; die Konstanten
  einer Anweisung werden als `?` übertragen. **Trace-Regeln** sind Bedingungen auf die Anweisung (`entity`, `action`,
  `write`…) und auf ihr Ergebnis (`durationMs`, `rows`, `error`). Eine Entität kann selbst entscheiden:
  `entities[].observability.trace: 'write || durationMs > 500'`.
- **Metriken:** die Dauer von Operationen und Abfragen, zurückgegebene Zeilen, Verbindungen, Constraint-Verletzungen,
  Transaktionen, Stage-Befehle und Ladevorgänge des Schemas; per OTLP oder Prometheus.
- **Logs:** Level, Ereignisse, Schwärzung von Geheimnissen und Adapter (console, file, OpenTelemetry, winston).
- **Die Historie des Schemas:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` und `migrate`
  hinterlassen ein Ereignis `schema.change` mit der DDL, die sie geschrieben haben, und wer sie ausgeführt hat.
