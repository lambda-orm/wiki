# Entidade composta {#composite-entity}

Esta página explica as entidades compostas: entidades cujos registros fazem parte dos registros de outra entidade, assim como as linhas de um pedido fazem parte do pedido.

Quando uma relação é **composta**, seus registros são tratados como parte de um documento:

- Em bancos de dados não relacionais (MongoDB), os registros da relação são armazenados dentro do documento do pai, na mesma coleção.
- Em bancos de dados relacionais, os registros são armazenados em sua própria tabela, mas as consultas, a importação e a exportação os tratam como um objeto que contém os registros da relação.

## Definir uma entidade composta {#define-a-composite-entity}

Uma entidade é composta quando seu nome começa com o nome de seu pai seguido de um ponto, por exemplo **Devices.Components**.
Quando a entidade composta define uma relação com seu pai usando **target**, a relação inversa criada no pai (`components` no exemplo) é composta.

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

Uma relação também pode ser declarada composta com `composite: true` (veja [Relação](SchemaDefinition.md#relation)).

Veja um exemplo completo, com a mesma entidade armazenada no MongoDB e no PostgreSQL, em [Exemplo de entidade composta](SchemaExample-Composite.md).
