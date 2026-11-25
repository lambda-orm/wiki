# Observabilidade {#observability}

Logs, métricas e traces com OpenTelemetry, configurados por `infrastructure.observability`; as variáveis padrão
`OTEL_*` a sobrescrevem. Sem essa seção o λORM se comporta como antes.

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

- **Traces:** um span por expressão e por sentença, com os atributos das convenções do OpenTelemetry; as constantes de
  uma sentença vão como `?`. As **regras de traces** são condições sobre a sentença (`entity`, `action`, `write`…) e
  sobre o seu resultado (`durationMs`, `rows`, `error`). Uma entidade pode decidir por si mesma:
  `entities[].observability.trace: 'write || durationMs > 500'`.
- **Métricas:** a duração das operações e consultas, linhas retornadas, conexões, violações de restrições, transações,
  comandos de stage e carregamentos do esquema; por OTLP ou Prometheus.
- **Logs:** níveis, eventos, ocultação de segredos e adaptadores (console, file, OpenTelemetry, winston).
- **O histórico do esquema:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` e `migrate` deixam um
  evento `schema.change` com o DDL que gravaram e quem os executou.
