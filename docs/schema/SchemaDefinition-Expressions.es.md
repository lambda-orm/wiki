# Expresiones en el esquema {#expressions-on-schema}

Esta página enumera las funciones que λORM añade a las expresiones que se usan en el esquema (valores por defecto, valores de lectura y escritura, restricciones, condiciones, tareas y listeners).

Todas estas expresiones se escriben en el lenguaje del motor de expresiones [3xpr](https://www.npmjs.com/package/3xpr), el mismo de las consultas. Dónde se ejecutan depende de la clave:

| Evaluadas por λORM, en Node | Traducidas a la fuente (SQL, agregación de MongoDB) |
| --- | --- |
| `default`, `readValue`, `writeValue`, `constraints`, condiciones de los stages, tareas y listeners | `readExp`, `readMappingExp`, el `filter` de los mappings y de las vistas |

Una expresión que se ejecuta en Node puede usar todas las funciones de 3xpr y las de abajo. Una expresión traducida a la fuente solo puede usar las funciones que λORM traduce a ese motor (ver [Operadores y funciones](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)); se valida al cargar el esquema.

Además de los operadores y funciones de 3xpr, λORM añade las siguientes funciones y variables.

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
| orm.metadata(query:string,options:any):any           | Devuelve los metadatos de una consulta.  |
| orm.model(query:string,options:any):any              | Devuelve el modelo de una consulta.      |
| orm.parameters(query:string,options:any):any         | Devuelve los parámetros de una consulta. |
| orm.constraints(query:string,options:any):any        | Devuelve las restricciones de una consulta. |

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

## Funciones de máscara {#mask-functions}

Enmascaran datos personales; también se traducen a cada motor, así que se pueden usar en un `readExp` de una [vista](Views.md#mask-functions).

| Función                                   | Descripción                                                                   |
|-------------------------------------------|-------------------------------------------------------------------------------|
| mask(value:string):string                 | Un cuarto de cada lado visible (3 como máximo), el resto `*`.                 |
| maskLeft(value:string,n:integer):string   | Todos los caracteres salvo los últimos `n` como `*`.                          |
| maskRight(value:string,n:integer):string  | Todos los caracteres salvo los primeros `n` como `*`.                         |
| maskEmail(value:string):string            | El primer carácter del usuario y el dominio: `f*****@x.com`.                  |
| hash(value:string,key?:string):string     | SHA-256 en hexadecimal; con una clave, HMAC-SHA256.                           |

## Funciones JSON, de vectores y geográficas {#json-vector-and-geo-functions}

Trabajan sobre propiedades de tipo `json`, `vector` y `point` (ver [JSON, vectores y puntos](../queries/JsonVectorsPoints.md)).

| Función                                        | Descripción                                                       |
|------------------------------------------------|-------------------------------------------------------------------|
| jsonHas(value:any,path:string):boolean         | La ruta existe en el json.                                        |
| jsonIncludes(value:any,path:string,item:any):boolean | La lista de la ruta contiene el elemento.                   |
| jsonSet(value:any,path:string,item:any):any    | El json con el elemento en la ruta.                               |
| cosineDistance(a,b), l2Distance(a,b), innerProduct(a,b) | Distancias entre dos vectores.                           |
| point(longitude,latitude)                      | Un punto GeoJSON.                                                 |
| distance(a,b)                                  | La distancia en metros entre dos puntos.                          |
| within(p,minLongitude,minLatitude,maxLongitude,maxLatitude) | El punto está dentro del rectángulo.                 |
| inside(p,area)                                 | El punto está dentro del polígono GeoJSON `area`.                 |

## El contexto {#the-context}

`context` es una variable reservada: el [contexto](Context.md) de quien ejecuta la consulta (`context.user`, `context.tenant`, `context.roles`). Se puede leer en filtros, `default`, `writeValue`, `constraints`, `readExp` y las condiciones de los listeners, pero no en las condiciones de las fuentes de un stage.

```yaml
domain:
  entities:
    - name: Orders
      properties:
        - name: createdBy
          default: context.user
```
