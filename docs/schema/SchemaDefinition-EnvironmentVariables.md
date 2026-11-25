# Environment Variables on Schema

This page shows how to use environment variables in the schema, to keep connections and secrets out of the schema file.

Any value of the schema can be taken from an environment variable, with the notation `$VARIABLE` or `${VARIABLE}`.
The variables are replaced once, when the schema is loaded. With the CLI, the `-e` option reads them from a file (for example `-e .env`).
A value that is a JSON text after the replacement (such as a connection) is read as an object; a connection with a variable that is not defined is reported as a warning when the schema loads.

Because they are replaced at load time, environment variables are the same for every query. A value that depends on who runs each query (user, tenant, region) goes in the [context](Context.md) instead.

## Examples

### Connection to the database

The connection of each source is read from an environment variable:

```yaml
infrastructure:
  sources:
    - name: source1
      dialect: MySQL
      mapping: mapping1
      connection: $CNN_MYSQL
    - name: source2
      dialect: PostgreSQL
      mapping: mapping2
      connection: $CNN_POSTGRES
```

The variable holds the connection as JSON:

```sh
CNN_MYSQL={"host":"localhost","port":3306,"user":"test","password":"test","database":"test"}
CNN_POSTGRES={"host":"localhost","port":5433,"user":"test","password":"test","database":"test"}
```

### Key of the encryption functions

The key used by `encrypt` and `decrypt` is read from an environment variable, inside an expression:

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
