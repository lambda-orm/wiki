# Komposit-Entität {#composite-entity}

Diese Seite erklärt Komposit-Entitäten: Entitäten, deren Datensätze Teil der Datensätze einer anderen Entität sind, so wie die Positionen einer Bestellung Teil der Bestellung sind.

Wenn eine Beziehung **komposit** ist, werden ihre Datensätze als Teil eines Dokuments behandelt:

- In nicht-relationalen Datenbanken (MongoDB) werden die Datensätze der Beziehung im Dokument des Elternobjekts in derselben Collection gespeichert.
- In relationalen Datenbanken werden die Datensätze in einer eigenen Tabelle gespeichert, aber Abfragen, Import und Export behandeln sie als ein Objekt, das die Datensätze der Beziehung enthält.

## Eine Komposit-Entität definieren {#define-a-composite-entity}

Eine Entität ist komposit, wenn ihr Name mit dem Namen ihres Elternobjekts gefolgt von einem Punkt beginnt, zum Beispiel **Devices.Components**.
Wenn die Komposit-Entität mit **target** eine Beziehung zu ihrem Elternobjekt definiert, ist die im Elternobjekt erzeugte inverse Beziehung (im Beispiel `components`) komposit.

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

Eine Beziehung kann auch mit `composite: true` als komposit deklariert werden (siehe [Beziehung](SchemaDefinition.md#relation)).

Ein vollständiges Beispiel, in dem dieselbe Entität in MongoDB und in PostgreSQL gespeichert wird, finden Sie unter [Komposit-Beispiel](SchemaExample-Composite.md).
