# Kafka

## Configuration

To use Kafka, add a `queue` section to the `infrastructure` section of the λORM configuration file. `config` is the
[kafkajs](https://kafka.js.org/docs/configuration) client configuration.

```yaml
infrastructure:
  queue:
    config: $QUEUE_CONFIG
    consumers:
      - name: syncInsights
        config:
          groupId: group1
        subscribe:
          topic: insights-sync
          fromBeginning: true
        execute: orm.execute(message.query, message.data, { stage: "insights" })
```

Each consumer evaluates its `execute` expression for every message it receives, with the variables `message` (the
message's value, parsed as JSON), `topic` and `partition`.

```sh
export QUEUE_CONFIG='{"clientId": "collections", "brokers": ["localhost:9093"]}'
```

## Send message

To send messages to a Kafka topic, use the `queue.send(topic, messages)` function, e.g. in a listener:

```yaml
application:
  listeners:
    - name: syncInsights
      on: [insert, bulkInsert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: queue.send("insights-sync", [{ query: query, data: data }])
```

## Execute queued

`POST /execute-queued` runs a query in the background and sends its result to a topic. It answers at once with the
queue id; the messages carry the keys `<queueId>-<chunk>`.

```sh
curl -X POST "http://localhost:9291/execute-queued" -H "Content-Type: application/json" \
  -d '{"query": "Countries.map(p => [p.iso3, p.name])", "topic": "countries", "chunk": 1000, "options": { "stage": "default" }}'
```
