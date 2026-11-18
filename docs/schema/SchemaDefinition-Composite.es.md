# Entidad compuesta {#composite-entity}

Esta página explica las entidades compuestas: entidades cuyos registros forman parte de los registros de otra entidad, igual que las líneas de un pedido forman parte del pedido.

Cuando una relación es **compuesta**, sus registros se tratan como parte de un documento:

- En las bases de datos no relacionales (MongoDB), los registros de la relación se guardan dentro del documento del padre, en la misma colección.
- En las bases de datos relacionales, los registros se guardan en su propia tabla, pero las consultas, la importación y la exportación los tratan como un objeto que contiene los registros de la relación.

## Definir una entidad compuesta {#define-a-composite-entity}

Una entidad es compuesta cuando su nombre empieza por el nombre de su padre seguido de un punto, por ejemplo **Devices.Components**.
Cuando la entidad compuesta define una relación con su padre mediante **target**, la relación inversa que se crea en el padre (`components` en el ejemplo) es compuesta.

```yaml
...
domain:
  entities:
    ...
    - name: Devices
      primaryKey: ["id"]
      uniqueKey: ["name"]
      properties:
        - name: id
          length: 32
          required: true
          default: 'concat(type,"-",switch(type){case"phone":imei;default:mac;})'
        - name: type
          length: 16
          required: true
          enum: DeviceType
        - name: name
          length: 32
          required: true
        ...
    - name: Devices.Components
      extends: Products
      primaryKey: ["id"]
      uniqueKey: ["deviceId", "name"]
      properties:
        - name: id
          length: 50
          required: true
          default: concat(deviceId,"-",lower(substring(replace(name," ","-"),0,16)))
        - name: deviceId
          length: 32
          required: true
        - name: name
          length: 16
          required: true
        ...
      relations:
        - name: device
          from: deviceId
          entity: Devices
          to: id
          target: components
      ...
```

Una relación también se puede declarar compuesta con `composite: true` (ver [Relación](SchemaDefinition.md#relation)).

Hay un ejemplo completo, con la misma entidad guardada en MongoDB y en PostgreSQL, en [Ejemplo de entidad compuesta](SchemaExample-Composite.md).
