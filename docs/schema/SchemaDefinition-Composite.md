# Composite Entity

This page explains composite entities: entities whose records are part of the records of another entity, as the lines of an order are part of the order.

When a relation is **composite**, its records are treated as part of a document:

- In non-relational databases (MongoDB), the records of the relation are stored inside the document of the parent, in the same collection.
- In relational databases, the records are stored in their own table, but queries, import and export treat them as an object that contains the records of the relation.

## Define a composite entity

An entity is composite when its name starts with the name of its parent followed by a period, for example **Devices.Components**.
When the composite entity defines a relation to its parent with **target**, the inverse relation created in the parent (`components` in the example) is composite.

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

A relation can also be declared composite with `composite: true` (see [Relation](SchemaDefinition.md#relation)).

See a complete example, with the same entity stored in MongoDB and in PostgreSQL, in [Composite example](SchemaExample-Composite.md).
