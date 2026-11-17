# Expressions on the schema

The conditions and actions of the schema (listeners, consumers) and the scripts of [`POST /script`](../Endpoints/Script.md)
use the expression engine [3xpr](https://www.npmjs.com/package/3xpr).

## λORM functions

Besides the operators and functions of 3xpr, λORM adds these functions:

| Function | Description |
| --- | --- |
| `toBase64(value:string):string` | Encode a string to base64 |
| `getBase64(value:string):string` | Decode a base64 string |
| `encrypt(value:string,key:string):string` | Encrypt a string with a key |
| `decrypt(value:string,key:string):string` | Decrypt a string with a key |
| `orm.execute(query:string,data:any,options:any):any` | Execute a query and return the result |
| `orm.plan(query:string,options:any):any` | Return the execution plan of the query |
| `orm.metadata(query:string):any` | Return the metadata of the query |
| `orm.model(query:string):any` | Return the model of the query |
| `orm.parameters(query:string):any` | Return the parameters of the query |
| `orm.constraints(query:string):any` | Return the constraints of the query |

`orm.execute` called from a listener or a script joins the transaction in progress. With `options.stage` it runs on
another stage, in the same transaction (from `@lambdaorm/lib` 3.3.0):

```js
orm.execute("Insights.insert()", { quoteId: quoteId }, { stage: "insights" })
```

## Service functions

The service adds:

| Function | Description |
| --- | --- |
| `queue.send(topic:string,messages:any[]):void` | Send messages to a Kafka topic (see [Kafka](Kafka.md)) |

**Example:**

```yaml
application:
  listeners:
    - name: syncInsights
      on: [insert, bulkInsert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: queue.send("insights-sync", [{ query: query, data: data }])
```
