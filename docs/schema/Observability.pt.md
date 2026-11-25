# Observabilidade {#observability}

Logs, métricas e traces com OpenTelemetry, configurados por `infrastructure.observability`. Use-a para ver o que o λORM
faz em produção: quais consultas são executadas, quanto tempo levam, quantas linhas trazem, e quem alterou o esquema de
um banco de dados e como. Sem essa seção o λORM se comporta como antes: logs em texto no console, sem métricas, sem
traces.

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

## As chaves {#the-keys}

| Chave | Descrição |
| --- | --- |
| `serviceName`, `resource` | O nome do serviço (`lambdaorm` por padrão) e os atributos de recurso do OpenTelemetry. |
| `exporter` | O exportador padrão dos três sinais: `type` (`otlp`, `console`, `none`), `protocol` (`http/protobuf`, `http/json`, `grpc`) e `endpoint`. |
| `logs` | O `level` e os `adapters`: `console` (`format: text` ou `json`), `file` (`path`, `events`, `maxBytes`), `opentelemetry` e `winston`. Cada adaptador pode ter seu próprio `level`. |
| `metrics` | `enabled`, `exporters` (`opentelemetry` com `exportIntervalMs`, `prometheus`), `entityAttribute` (a entidade como atributo, `true` por padrão) e `histogramBuckets`. |
| `traces` | `enabled`, `sampler` (`ratio` de 0 a 1, `parentBased`), `rules` e `queryText`. |

As variáveis padrão `OTEL_*` (`OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
`OTEL_TRACES_SAMPLER`, `OTEL_SDK_DISABLED`…) sobrescrevem o esquema, de modo que cada ambiente muda o destino sem
tocá-lo. Os cabeçalhos do exportador, que levam tokens, são lidos apenas de `OTEL_EXPORTER_OTLP_HEADERS`: não há
nenhuma chave para eles no esquema.

## Os sinais {#the-signals}

- **Traces:** um span por expressão e por sentença, com os atributos das convenções do OpenTelemetry; as constantes de
  uma sentença vão como `?` (`queryText: sanitized`; `full` é apenas para depuração). As **regras de traces** são
  condições sobre a sentença (`entity`, `action`, `write`…) e sobre o seu resultado (`durationMs`, `rows`, `error`);
  sem regras, todas as sentenças são rastreadas, e com regras a primeira que se cumpre decide (`record: false` a
  descarta). Uma entidade pode decidir por si mesma, em vez das regras:
  `entities[].observability.trace: 'write || durationMs > 500'` no [domínio](SchemaDefinition.md#entity).
- **Métricas:** a duração das operações e consultas, linhas retornadas, conexões, violações de restrições, transações,
  comandos de stage e carregamentos do esquema; por OTLP ou Prometheus.
- **Logs:** níveis, eventos, ocultação de segredos e adaptadores (console, file, OpenTelemetry, winston).
- **O histórico do esquema:** `push`, `pull`, `drop`, `truncate`, `delete`, `import`, `seed` e `migrate` deixam um
  evento `schema.change` com o DDL que gravaram e quem os executou; o adaptador `file` acima os guarda em
  `logs/changes.jsonl`.

## O SDK {#the-sdk}

Os pacotes do OpenTelemetry são dependências peer opcionais do `@lambdaorm/lib`, carregados apenas quando a
configuração os pede. Se a aplicação já registrou um SDK do OpenTelemetry, o λORM o usa (registre-o antes de
`orm.init`); caso contrário, o λORM inicia um por processo e o encerra com o último `orm.end()`.
