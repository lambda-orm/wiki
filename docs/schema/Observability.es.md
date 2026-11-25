# Observabilidad {#observability}

Logs, métricas y trazas con OpenTelemetry, configurados por `infrastructure.observability`; las variables estándar
`OTEL_*` lo sobrescriben. Sin esa sección λORM se comporta como antes.

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

- **Trazas:** un span por expresión y por sentencia, con los atributos de las convenciones de OpenTelemetry; las
  constantes de una sentencia van como `?`. Las **reglas de trazas** son condiciones sobre la sentencia (`entity`,
  `action`, `write`…) y sobre su resultado (`durationMs`, `rows`, `error`). Una entidad puede decidir por sí misma:
  `entities[].observability.trace: 'write || durationMs > 500'`.
- **Métricas:** la duración de las operaciones y consultas, filas devueltas, conexiones, violaciones de restricciones,
  transacciones, comandos de stage y cargas del esquema; por OTLP o Prometheus.
- **Logs:** niveles, eventos, ocultación de secretos y adaptadores (console, file, OpenTelemetry, winston).
- **El historial del esquema:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` y `migrate` dejan un
  evento `schema.change` con el DDL que escribieron y quién los ejecutó.
