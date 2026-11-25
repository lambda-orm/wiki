# Expressions on Schema

This page lists the functions that λORM adds to the expressions used in the schema (defaults, read and write values, constraints, conditions, tasks and listeners).

All these expressions are written in the language of the expression engine [3xpr](https://www.npmjs.com/package/3xpr), the same one of the queries. Where they run depends on the key:

| Evaluated by λORM, in Node | Translated to the source (SQL, MongoDB aggregation) |
| --- | --- |
| `default`, `readValue`, `writeValue`, `constraints`, conditions of the stages, tasks and listeners | `readExp`, `readMappingExp`, the `filter` of mappings and views |

An expression that runs in Node can use every function of 3xpr and the ones below. An expression translated to the source can only use the functions that λORM translates to that engine (see [Operators and functions](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)); it is validated when the schema loads.

Besides the operators and functions of 3xpr, λORM adds the following functions and variables.

## General functions

| Function                                  | Description                     |
|-------------------------------------------|---------------------------------|
| toBase64(value:string):string             | Encodes a string to base64.     |
| getBase64(value:string):string            | Decodes a base64 string.        |
| encrypt(value:string,key:string):string   | Encrypts a string with a key.   |
| decrypt(value:string,key:string):string   | Decrypts a string with a key.   |

### Example

In this example **encrypt** stores the email encrypted in the database, and **decrypt** returns it decrypted in the results.

```yaml
domain:
  entities:
    ...
    - name: Users
      extends: Basics
      primaryKey: ["username"]
      uniqueKey: ["email"]
      properties:
        - name: username
          length: 32
          required: true
        - name: firstname
          required: true
        - name: lastname
          required: true
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
    ...
```

## Orm functions

These functions call the methods of the `Orm` class, so an expression can run or inspect another query.

| Function                                             | Description                              |
|------------------------------------------------------|------------------------------------------|
| orm.execute(query:string,data:any,options:any):any   | Executes a query and returns the result. |
| orm.plan(query:string,options:any):any               | Returns the execution plan of a query.   |
| orm.metadata(query:string,options:any):any           | Returns the metadata of a query.         |
| orm.model(query:string,options:any):any              | Returns the model of a query.            |
| orm.parameters(query:string,options:any):any         | Returns the parameters of a query.       |
| orm.constraints(query:string,options:any):any        | Returns the constraints of a query.      |

### Example

In this example a listener uses **orm.execute** to run, on the `insights` stage, the same query that was just executed on the `default` or `cqrs` stage.
This is a way to implement the CQRS pattern. See [Listener](SchemaExample-Listener.md).

```yaml
application:
  listeners:
    - name: syncInsights
      on: [insert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"})
```

See the [CLI - northwind CQRS lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs).

## Mask functions

They mask personal data; they are also translated to each engine, so they can be used in a `readExp` of a [view](Views.md#mask-functions).

| Function                                  | Description                                                                   |
|-------------------------------------------|-------------------------------------------------------------------------------|
| mask(value:string):string                 | A quarter of each side visible (3 at most), the rest `*`.                    |
| maskLeft(value:string,n:integer):string   | All but the last `n` characters as `*`.                                       |
| maskRight(value:string,n:integer):string  | All but the first `n` characters as `*`.                                      |
| maskEmail(value:string):string            | The first character of the user and the domain: `f*****@x.com`.               |
| hash(value:string,key?:string):string     | SHA-256 in hexadecimal; with a key, HMAC-SHA256.                              |

## JSON, vector and geo functions

They work on properties of type `json`, `vector` and `point` (see [JSON, vectors and points](../queries/JsonVectorsPoints.md)).

| Function                                       | Description                                                       |
|------------------------------------------------|-------------------------------------------------------------------|
| jsonHas(value:any,path:string):boolean         | The path exists in the json.                                      |
| jsonIncludes(value:any,path:string,item:any):boolean | The list at the path contains the item.                     |
| jsonSet(value:any,path:string,item:any):any    | The json with the item at the path.                               |
| cosineDistance(a,b), l2Distance(a,b), innerProduct(a,b) | Distances between two vectors.                           |
| point(longitude,latitude)                      | A GeoJSON point.                                                  |
| distance(a,b)                                  | The distance in meters between two points.                        |
| within(p,minLongitude,minLatitude,maxLongitude,maxLatitude) | The point is inside the rectangle.                   |
| inside(p,area)                                 | The point is inside the GeoJSON polygon `area`.                   |

## The context

`context` is a reserved variable: the [context](Context.md) of who runs the query (`context.user`, `context.tenant`, `context.roles`). It can be read in filters, `default`, `writeValue`, `constraints`, `readExp` and the conditions of the listeners, but not in the conditions of the sources of a stage.

```yaml
domain:
  entities:
    - name: Orders
      properties:
        - name: createdBy
          default: context.user
```
