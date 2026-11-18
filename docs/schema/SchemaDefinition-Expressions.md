# Expressions on Schema

This page lists the functions that λORM adds to the expressions used in the schema (defaults, read and write values, constraints, conditions, tasks and listeners).

All these expressions are evaluated by the expression engine [3xpr](https://www.npmjs.com/package/3xpr).
Besides the operators and functions of 3xpr, λORM adds the following functions.

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
| orm.metadata(query:string):any                       | Returns the metadata of a query.         |
| orm.model(query:string):any                          | Returns the model of a query.            |
| orm.parameters(query:string):any                     | Returns the parameters of a query.       |
| orm.constraints(query:string):any                    | Returns the constraints of a query.      |

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
