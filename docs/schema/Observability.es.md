# Observabilidad {#observability}

Logs, métricas y trazas con OpenTelemetry, configurados por `infrastructure.observability`. Úsala para ver lo que hace
λORM en producción: qué consultas se ejecutan, cuánto tardan, cuántas filas traen, y quién cambió el esquema de una base
de datos y cómo. Sin esa sección λORM se comporta como antes: logs en texto en la consola, sin métricas ni trazas.

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

## Las claves {#the-keys}

| Clave | Descripción |
| --- | --- |
| `serviceName`, `resource` | El nombre del servicio (`lambdaorm` por defecto) y los atributos de recurso de OpenTelemetry. |
| `exporter` | El exportador por defecto de las tres señales: `type` (`otlp`, `console`, `none`), `protocol` (`http/protobuf`, `http/json`, `grpc`) y `endpoint`. |
| `logs` | El `level` y los `adapters`: `console` (`format: text` o `json`), `file` (`path`, `events`, `maxBytes`), `opentelemetry` y `winston`. Cada adaptador puede tener su propio `level`. |
| `metrics` | `enabled`, `exporters` (`opentelemetry` con `exportIntervalMs`, `prometheus`), `entityAttribute` (la entidad como atributo, `true` por defecto) y `histogramBuckets`. |
| `traces` | `enabled`, `sampler` (`ratio` de 0 a 1, `parentBased`), `rules` y `queryText`. |

Las variables estándar `OTEL_*` (`OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
`OTEL_TRACES_SAMPLER`, `OTEL_SDK_DISABLED`…) sobrescriben el esquema, así que cada entorno cambia el destino sin tocarlo.
Los headers del exportador, que llevan tokens, se leen solo de `OTEL_EXPORTER_OTLP_HEADERS`: no hay ninguna clave para
ellos en el esquema.

## Las señales {#the-signals}

- **Trazas:** un span por expresión y por sentencia, con los atributos de las convenciones de OpenTelemetry; las
  constantes de una sentencia van como `?` (`queryText: sanitized`; `full` es solo para depurar). Las **reglas de
  trazas** son condiciones sobre la sentencia (`entity`, `action`, `write`…) y sobre su resultado (`durationMs`, `rows`,
  `error`); sin reglas se traza cada sentencia, y con reglas decide la primera que se cumple (`record: false` la
  descarta). Una entidad puede decidir por sí misma, en lugar de las reglas:
  `entities[].observability.trace: 'write || durationMs > 500'` en el [dominio](SchemaDefinition.md#entity).
- **Métricas:** la duración de las operaciones y consultas, filas devueltas, conexiones, violaciones de restricciones,
  transacciones, comandos de stage y cargas del esquema; por OTLP o Prometheus.
- **Logs:** niveles, eventos, ocultación de secretos y adaptadores (console, file, OpenTelemetry, winston).
- **El historial del esquema:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` y `migrate` dejan un
  evento `schema.change` con el DDL que escribieron y quién los ejecutó; el adaptador `file` de arriba los guarda en
  `logs/changes.jsonl`.

## El SDK {#the-sdk}

Los paquetes de OpenTelemetry son dependencias peer opcionales de `@lambdaorm/lib`, que se cargan solo cuando la
configuración los pide. Si la aplicación ya registró un SDK de OpenTelemetry, λORM lo usa (regístralo antes de
`orm.init`); si no, λORM inicia uno por proceso y lo cierra con el último `orm.end()`.
