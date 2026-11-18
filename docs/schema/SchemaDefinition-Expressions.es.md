# Expresiones en el esquema {#expressions-on-schema}

Esta página enumera las funciones que λORM añade a las expresiones que se usan en el esquema (valores por defecto, valores de lectura y escritura, restricciones, condiciones, tareas y listeners).

Todas estas expresiones las evalúa el motor de expresiones [3xpr](https://www.npmjs.com/package/3xpr).
Además de los operadores y funciones de 3xpr, λORM añade las siguientes funciones.

## Funciones generales {#general-functions}

| Función                                   | Descripción                     |
|-------------------------------------------|---------------------------------|
| toBase64(value:string):string             | Codifica un string en base64.   |
| getBase64(value:string):string            | Decodifica un string en base64. |
| encrypt(value:string,key:string):string   | Cifra un string con una clave.  |
| decrypt(value:string,key:string):string   | Descifra un string con una clave. |

### Ejemplo {#example}

En este ejemplo **encrypt** guarda el email cifrado en la base de datos, y **decrypt** lo devuelve descifrado en los resultados.

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

## Funciones de Orm {#orm-functions}

Estas funciones llaman a los métodos de la clase `Orm`, de modo que una expresión puede ejecutar o inspeccionar otra consulta.

| Función                                              | Descripción                              |
|------------------------------------------------------|------------------------------------------|
| orm.execute(query:string,data:any,options:any):any   | Ejecuta una consulta y devuelve el resultado. |
| orm.plan(query:string,options:any):any               | Devuelve el plan de ejecución de una consulta. |
| orm.metadata(query:string):any                       | Devuelve los metadatos de una consulta.  |
| orm.model(query:string):any                          | Devuelve el modelo de una consulta.      |
| orm.parameters(query:string):any                     | Devuelve los parámetros de una consulta. |
| orm.constraints(query:string):any                    | Devuelve las restricciones de una consulta. |

### Ejemplo {#example_1}

En este ejemplo un listener usa **orm.execute** para ejecutar, en el stage `insights`, la misma consulta que se acaba de ejecutar en el stage `default` o `cqrs`.
Es una forma de implementar el patrón CQRS. Ver [Listener](SchemaExample-Listener.md).

```yaml
application:
  listeners:
    - name: syncInsights
      on: [insert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"})
```

Ver el [laboratorio CLI - northwind CQRS](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs).
