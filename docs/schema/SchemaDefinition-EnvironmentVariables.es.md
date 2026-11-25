# Variables de entorno en el esquema {#environment-variables-on-schema}

Esta página muestra cómo usar variables de entorno en el esquema, para mantener las conexiones y los secretos fuera del archivo del esquema.

Cualquier valor del esquema se puede tomar de una variable de entorno, con la notación `$VARIABLE` o `${VARIABLE}`.
Las variables se reemplazan una sola vez, al cargar el esquema. Con la CLI, la opción `-e` las lee de un archivo (por ejemplo `-e .env`).
Un valor que, tras el reemplazo, es un texto JSON (como una conexión) se lee como objeto; una conexión con una variable que no está definida se informa como advertencia al cargar el esquema.

Como se reemplazan al cargar, las variables de entorno son las mismas para todas las consultas. Un valor que depende de quién ejecuta cada consulta (usuario, tenant, región) va en el [contexto](Context.md).

## Ejemplos {#examples}

### Conexión a la base de datos {#connection-to-the-database}

La conexión de cada fuente se lee de una variable de entorno:

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

La variable contiene la conexión en formato JSON:

```sh
CNN_MYSQL={"host":"localhost","port":3306,"user":"test","password":"test","database":"test"}
CNN_POSTGRES={"host":"localhost","port":5433,"user":"test","password":"test","database":"test"}
```

### Clave de las funciones de cifrado {#key-of-the-encryption-functions}

La clave que usan `encrypt` y `decrypt` se lee de una variable de entorno, dentro de una expresión:

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
