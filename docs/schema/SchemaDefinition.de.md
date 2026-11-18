# Definition {#definition}

Diese Seite ist die Referenz der Schema-Datei (`lambdaORM.yaml`): ihre Struktur und jeder Schlüssel ihrer Abschnitte `domain`, `application` und `infrastructure`, jeweils mit einem Beispiel.

Das Schema enthält die gesamte Konfiguration, die das ORM benötigt. Es trennt das Geschäftsmodell (**Domäne**) von der Persistenz der Daten (**Infrastruktur**):

- In der Domäne sind die Entitäten und Enums, die das Geschäftsmodell abbilden, vollständig sauber, ohne irgendein Attribut, das sie an die Persistenz koppelt.
- Alle Abfragen werden gegen das Geschäftsmodell geschrieben und sind daher vom physischen Datenmodell entkoppelt.
- In der Infrastruktur wird alles definiert, was nötig ist, um die Daten in den verschiedenen Quellen zu speichern und zu lesen.

Das Schema kann in einer YAML- oder JSON-Datei geschrieben oder bei der Initialisierung des ORM als Objekt übergeben werden (siehe [Verwendung des Schemas](Schema-Use.md)).

Alle Ausdrücke, mit denen Bedingungen und Aktionen definiert werden, werden von der Expression-Engine [3xpr](https://www.npmjs.com/package/3xpr) ausgewertet (siehe [Ausdrücke im Schema](SchemaDefinition-Expressions.md)), und jeder Wert kann aus einer Umgebungsvariablen stammen (siehe [Umgebungsvariablen](SchemaDefinition-EnvironmentVariables.md)).

## Struktur {#structure}

```yaml
domain:
  enums:
    - name: string
      extends: string
      abstract: boolean
      values:
        - name: string
          value: any
  entities:
    - name: string
      abstract: boolean
      extends: string
      singular: string
      view: boolean
      primaryKey: string[]
      uniqueKey: string[]
      required: string[]
      properties:
        - name: string
          type: string | integer | decimal | boolean | dateTime | date | time | json
          length: number
          required: boolean
          autoIncrement: boolean
          view: boolean
          enum: string
          key: string
          default: expression
          readExp: expression
          readValue: expression
          writeValue: expression
      indexes:
        - name: string
          fields: string[]
      relations:
        - name: string
          type: oneToMany | manyToOne | oneToOne
          from: string
          entity: string
          to: string
          composite: boolean
          weak: boolean
          target: string
      constraints:
        - message: string
          condition: expression
application:
  start:
    - name: string
      condition: expression
      expression: expression
  end:
    - name: string
      condition: expression
      expression: expression
  listeners:
    - name: string
      on: [select | insert | upsert | update | delete]
      condition: expression
      before: expression
      after: expression
      error: expression
      transactional: boolean
infrastructure:
  mappings:
    - name: string
      extends: string
      entities:
        - name: string
          mapping: string
          abstract: boolean
          extends: string
          sequence: string
          filter: expression
          properties:
            - name: string
              mapping: string
              readMappingExp: expression
              dbType: string
              previousMapping: string
  sources:
    - name: string
      dialect: MySQL | MariaDB | PostgreSQL | Oracle | SqlServer | MongoDB | SQLjs
      mapping: string
      connection: object | environment variable
  stages:
    - name: string
      sources:
        - name: string
          condition: expression
  views:
    - name: string
      entities:
        - name: string
          exclude: boolean
          properties:
            - name: string
              exclude: boolean
              readExp: expression
  paths:
    src: string
    state: string
    domain: string
  queue:
    config: object
    consumers:
      - name: string
        config: object
        subscribe: object
        execute: expression
```

## Hauptabschnitte {#main-sections}

| Schlüssel      | Beschreibung                                                        |
|:---------------|:--------------------------------------------------------------------|
| domain         | Das Geschäftsmodell: Enums und Entitäten.                           |
| application    | Tasks, die beim Start und Ende des ORM ausgeführt werden, sowie Listener. |
| infrastructure | Wie und wo die Daten gespeichert werden: Mappings, Quellen, Stages, Views. |

## Domäne {#domain}

| Schlüssel | Beschreibung                   |
|----------|--------------------------------|
| enums    | Die Enums des Modells.         |
| entities | Die Entitäten des Modells.     |

- Ein **Enum** kann als Typ einer Eigenschaft verwendet werden.
- Eine **Entität** wird mit ihren Eigenschaften, Beziehungen, Schlüsseln, Indizes und Constraints definiert.

### Enum {#enum}

Ein Enum definiert eine Menge von Werten, die anschließend als Typ einer Eigenschaft verwendet werden kann.

| Schlüssel | Beschreibung                                                | Erforderlich |
|----------|-------------------------------------------------------------|:--------:|
| name     | Name des Enums.                                             | ja       |
| values   | Werte des Enums (`name` und `value`).                       | ja       |
| extends  | Name eines anderen Enums, dessen Werte dieses Enum erbt.    |          |
| abstract | Das Enum wird nur als Basis für andere Enums verwendet.     |          |

Hat ein Wert kein `value`, wird sein `name` verwendet.

#### Enum-Beispiel {#enum-example}

In diesem Beispiel wird das Enum **DeviceType** definiert und als Typ der Eigenschaft **type** der Entität **Devices** verwendet.

```yaml
domain:
  enums:
    - name: DeviceType
      values:
        - name: phone
          value: phone
        - name: computer
          value: computer
        - name: robot
          value: robot
  entities:
    ...
    - name: Devices
      extends: Products
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
```

### Entität {#entity}

Eine Entität wird mit ihren Eigenschaften, Beziehungen und Constraints definiert.

| Schlüssel   | Beschreibung                                                                                      | Erforderlich |
|-------------|---------------------------------------------------------------------------------------------------|:--------:|
| name        | Name der Entität. Ein Name mit Punkt (`Orders.details`) definiert eine [Komposit-Entität](SchemaDefinition-Composite.md). | ja |
| properties  | Eigenschaften der Entität.                                                                        | ja       |
| abstract    | Die Entität wird nur als Basis für andere Entitäten verwendet (für sie wird keine Tabelle erstellt). |       |
| extends     | Name der Entität, deren Eigenschaften, Primärschlüssel und Beziehungen diese Entität erbt.         |          |
| singular    | Name im Singular, verwendet für die von `lambdaorm build` generierten Klassen (standardmäßig aus dem Namen abgeleitet). |  |
| view        | Die Entität ist eine View: push erstellt keine Tabelle für sie (siehe unten).                      |          |
| primaryKey  | Eigenschaften des Primärschlüssels.                                                               |          |
| uniqueKey   | Eigenschaften des Unique Keys.                                                                    |          |
| required    | Erforderliche Eigenschaften (dasselbe wie `required: true` bei jeder von ihnen).                  |          |
| indexes     | Indizes (`name` und `fields`).                                                                    |          |
| relations   | Beziehungen zu anderen Entitäten.                                                                 |          |
| constraints | Constraints, die beim Schreiben eines Datensatzes validiert werden.                               |          |

Die Eigenschaften des Primärschlüssels und des Unique Keys sind erforderlich, sofern nicht anders angegeben.

#### Abstract und extends in der Entität {#abstract-and-extends-in-entity}

In diesem Beispiel wird die abstrakte Entität **Positions** definiert, und die Entität **Countries** erweitert sie: Countries erhält die Eigenschaften `latitude` und `longitude`.

```yaml
domain:
  entities:
    - name: Positions
      abstract: true
      properties:
        - name: latitude
          length: 16
        - name: longitude
          length: 16
    - name: Countries
      extends: Positions
      primaryKey: ["iso3"]
      uniqueKey: ["name"]
      properties:
        - name: name
          required: true
        - name: iso3
          length: 3
          required: true
```

Eine Entität muss nicht abstrakt sein, um erweitert zu werden. Siehe [Erweitern](SchemaExample-Extend.md).

#### Entität als View festlegen {#set-entity-as-view}

Dieses Beispiel definiert die Entität **Users** als View, da ihre Tabelle von einem externen System verwaltet wird.
Push erstellt keine Tabelle für eine View-Entität, und die Stage-Befehle ändern sie nicht.

```yaml
domain:
  entities:
    ...
    - name: Users
      view: true
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
    ...
```

### Eigenschaft {#property}

| Schlüssel     | Beschreibung                                                                        | Erforderlich | Standard   |
|---------------|-------------------------------------------------------------------------------------|:--------:|:----------:|
| name          | Name der Eigenschaft.                                                               | ja       |            |
| type          | Typ der Eigenschaft (siehe [Eigenschaftstypen](#property-types)).                   |          | string     |
| length        | Länge einer String-Eigenschaft.                                                     |          | siehe unten |
| required      | Die Eigenschaft darf nicht null sein.                                               |          | false      |
| autoIncrement | Der Wert wird von der Datenbank generiert.                                          |          | false      |
| enum          | Name des Enums, zu dem der Wert gehören muss.                                       |          |            |
| view          | Die Eigenschaft wird nicht gespeichert: Ihr Wert stammt aus `readExp`.              |          | false      |
| default       | Ausdruck, den λORM auswertet, um den Wert beim Einfügen eines Datensatzes zu setzen. |         |            |
| readExp       | Leseausdruck, der in der Quelle (Datenbank) aufgelöst wird.                         |          |            |
| readValue     | Ausdruck, den λORM auf den aus der Quelle gelesenen Wert anwendet.                  |          |            |
| writeValue    | Ausdruck, den λORM auf den Wert anwendet, bevor er geschrieben wird.                |          |            |
| key           | Fester Wert, der zum Filtern von Lese- und Aktualisierungsvorgängen verwendet und beim Einfügen gesetzt wird. | |   |

#### Eigenschaftstypen {#property-types}

| Typ       | Wert in Node             | Von push erstellte Spalte (standardmäßig)                                                  |
|-----------|--------------------------|--------------------------------------------------------------------------------------------|
| string    | string                   | `VARCHAR(length)`; ohne `length`: `TEXT` auf PostgreSQL, `VARCHAR(80)` auf anderen Datenbank-Engines |
| integer   | number                   | `INTEGER` (Oracle `NUMBER(10)`)                                                            |
| decimal   | number                   | `DECIMAL(10,4)` (Oracle `NUMBER(19,4)`)                                                    |
| boolean   | boolean                  | `BOOLEAN` (SqlServer `BIT`, Oracle `CHAR(1)`)                                              |
| dateTime  | Date                     | `TIMESTAMP` (PostgreSQL), `DATETIME` (MySQL, MariaDB, SqlServer), `DATE` (Oracle)          |
| date      | Date                     | `DATE` (SqlServer `SMALLDATETIME`)                                                         |
| time      | Date                     | `TIME` (Oracle `DATE`)                                                                     |
| json      | Objekt oder Liste        | `JSONB` (PostgreSQL), `JSON` (MySQL, MariaDB), `NVARCHAR(MAX)` (SqlServer), `CLOB` (Oracle), `TEXT` (andere) |

- **json**: Objekte und Listen werden als solche geschrieben und gelesen (`JSON.stringify` oder `JSON.parse` müssen nicht aufgerufen werden).
- **dateTime**: Auf PostgreSQL wird der Wert mit Millisekunden und seinem Offset geschrieben, sodass eine Spalte `timestamptz` (siehe `dbType` im [Eigenschafts-Mapping](#property-mapping)) den exakten Zeitpunkt behält.
- **String ohne Länge**: Auf PostgreSQL ist er unbegrenzt (`TEXT`); auf den anderen Datenbank-Engines ist er `VARCHAR(80)`. Setzen Sie daher `length`, wenn ein Wert länger sein kann.
- `''`, `0` und `false` sind Werte, niemals NULL (Oracle ist die Ausnahme: Es speichert `''` als NULL).

Siehe auch [Datenbank-Engines](Engines.md) für die Unterschiede zwischen den Datenbank-Engines.

In diesem Beispiel hat `name` keine Länge, `settings` ist ein JSON-Objekt und `createdAt` ein Datum mit Uhrzeit:

```yaml
domain:
  entities:
    - name: Products
      primaryKey: ["id"]
      properties:
        - name: id
          length: 36
          required: true
        - name: name                # TEXT on PostgreSQL, VARCHAR(80) elsewhere
          required: true
        - name: settings
          type: json                # { "color": "red", "tags": ["a", "b"] } in and out as an object
        - name: createdAt
          type: dateTime
```

#### Eigenschaft als View und readExp festlegen {#set-property-as-view-and-readexp}

Eine View-Eigenschaft wird nicht in der Datenbank gespeichert (push erstellt keine Spalte für sie): Ihr Wert wird beim Lesen mit dem Ausdruck in **readExp** berechnet.
In diesem Beispiel wird `fullName` aus `lastname` und `firstname` gebildet.

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
        - name: fullName
          view: true
          readExp: concat(lastname,", ",firstname)
    ...
```

**readExp** kann auch bei einer gespeicherten Eigenschaft gesetzt werden: Der Ausdruck wird beim Lesen angewendet, beim Schreiben ändert sich nichts.

#### Standardwert einer Eigenschaft {#default-value-in-property}

Wird ein Datensatz ohne Wert für die Eigenschaft eingefügt, wertet λORM (nicht die Datenbank) den Ausdruck in **default** aus und schreibt sein Ergebnis.
In diesem Beispiel wird die `id` einer Gruppe aus ihrem Namen gebildet.

```yaml
domain:
  entities:
    - name: Groups
      extends: Basics
      primaryKey: ["id"]
      uniqueKey: ["name"]
      properties:
        - name: id
          length: 32
          default: lower(substring(replace(name," ","-"),0,32))
          required: true
        - name: name
          length: 32
          required: true
```

#### Lese- und Schreibwert einer Eigenschaft {#read-and-write-value-in-property}

**readValue** und **writeValue** werden von λORM ausgewertet: **writeValue** transformiert den Wert, bevor er geschrieben wird, und **readValue** transformiert den aus der Datenbank gelesenen Wert.
In diesem Beispiel wird die E-Mail-Adresse verschlüsselt gespeichert und entschlüsselt zurückgegeben; der Schlüssel stammt aus einer Umgebungsvariablen.

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
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
    ...
```

#### Schlüsselwert einer Eigenschaft {#key-value-in-property}

Der in **key** gesetzte Wert wird als Filter in Lese-, Aktualisierungs- und Löschabfragen verwendet und beim Einfügen eines Datensatzes der Eigenschaft zugewiesen.

Dies ist nützlich, um mehrere Entitäten auf derselben Tabelle oder Collection zu definieren.
In diesem Beispiel speichert eine Tabelle **Locations** Länder, Bundesstaaten und Städte, und jede davon wird als eigene Entität behandelt:

```yaml
domain:
  entities:
    - name: Locations
      abstract: true
      primaryKey: ["type","code"]
      uniqueKey: ["type","name"]
      properties:
        - name: code
          required: true
          length: 16
        - name: type
          required: true
          length: 16
        - name: name
          required: true
    - name: Countries
      extends: Locations
      properties:
        - name: type
          key: 'country'
    - name: States
      extends: Locations
      properties:
        - name: type
          key: 'state'
    - name: Cities
      extends: Locations
      properties:
        - name: type
          key: 'city'
infrastructure:
  mappings:
    - name: default
      entities:
        - name: Locations
          abstract: true
          mapping: TBL_LOCATIONS
          properties:
            - name: code
              mapping: CODE
            - name: type
              mapping: TYPE
            - name: name
              mapping: NAME
        - name: Countries
          extends: Locations
        - name: States
          extends: Locations
        - name: Cities
          extends: Locations
```

### Beziehung {#relation}

| Schlüssel | Beschreibung                                                                                        | Erforderlich | Standard  |
|-----------|-----------------------------------------------------------------------------------------------------|:--------:|:---------:|
| name      | Name der Beziehung.                                                                                 | ja       |           |
| from      | Eigenschaft dieser Entität.                                                                         | ja       |           |
| entity    | Verknüpfte Entität.                                                                                 | ja       |           |
| to        | Eigenschaft der verknüpften Entität.                                                                | ja       |           |
| type      | Typ der Beziehung (siehe unten).                                                                    |          | oneToMany |
| composite | Die verknüpften Datensätze sind Teil dieser Entität (siehe [Komposit-Entität](SchemaDefinition-Composite.md)). |  | false     |
| weak      | Push erstellt keinen Fremdschlüssel für die Beziehung (zum Beispiel zwischen Entitäten in verschiedenen Quellen). | | false     |
| target    | Name der inversen Beziehung, die in der verknüpften Entität erzeugt wird.                           |          |           |

Der Typ der Beziehung bestimmt, was sie zurückgibt:

| Typ       | Bedeutung                                                            | Rückgabe        |
|-----------|----------------------------------------------------------------------|-----------------|
| oneToMany | Viele Datensätze dieser Entität verweisen auf einen Datensatz von `entity`. | ein Objekt |
| manyToOne | Viele Datensätze von `entity` verweisen auf diesen Datensatz.        | eine Liste      |
| oneToOne  | Ein Datensatz dieser Entität steht in Beziehung zu einem Datensatz von `entity`. | ein Objekt |

`manyToOne`-Beziehungen sind immer weak.

#### Target-Beziehung {#target-relation}

Mit **target** wird die inverse Beziehung in der verknüpften Entität erzeugt.
Hat die Entität **DeviceStatuses** beispielsweise eine Beziehung zu **Devices** mit `target: statuses`, wird in **Devices** eine Beziehung namens **statuses** erzeugt.
Der Typ der Target-Beziehung hängt vom Typ der Ausgangsbeziehung ab:

| Ausgang   | Target    |
|-----------|-----------|
| oneToMany | manyToOne |
| oneToOne  | oneToOne  |

```yaml
domain:
  entities:
    - name: DeviceStatuses
      extends: Basics
      primaryKey: ["id"]
      indexes:
        - name: time
          fields: ["time"]
      properties:
        - name: id
          type: integer
          required: true
          autoIncrement: true
        - name: deviceId
          length: 32
          required: true
        - name: time
          type: dateTime
      relations:
        - name: device
          from: deviceId
          entity: Devices
          to: id
          target: statuses
```

### Constraint {#constraint}

| Schlüssel | Beschreibung                        | Erforderlich |
|-----------|-------------------------------------|:--------:|
| message   | Meldung, die bei einem Fehlschlag zurückgegeben wird. | ja |
| condition | Auszuwertender boolescher Ausdruck. | ja       |

Constraints sind Ausdrücke, die λORM beim Einfügen oder Aktualisieren eines Datensatzes auswertet.
Das ORM erzeugt Constraints auch aus anderen Definitionen, zum Beispiel:

- Eine erforderliche Eigenschaft erhält einen Constraint, der prüft, dass sie nicht null ist.
- Eine Eigenschaft, deren Typ ein **Enum** ist, erhält einen Constraint, der prüft, dass der Wert zum Enum gehört.

Sie können eigene Constraints mit einer **message** und einer **condition** hinzufügen: Ist die Bedingung nicht erfüllt, schlägt das Schreiben mit der Meldung fehl.
In diesem Beispiel werden das Format der E-Mail-Adresse und die Reihenfolge zweier Datumswerte validiert:

```yaml
domain:
  entities:
    - name: Users
      properties:
        ...
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
      constraints:
        - message: invalid email
          condition: test(email,"^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$")
    - name: Files
      properties:
        - name: id
          length: 255
          required: true
        - name: type
          length: 16
          required: true
          enum: FileType
        - name: deviceId
          length: 32
          required: true
        - name: startDate
          type: dateTime
          required: true
        - name: endDate
          type: dateTime
          required: true
      constraints:
        - message: endDate cannot be less than startDate
          condition: startDate<=endDate
```

## Application {#application}

| Schlüssel | Beschreibung                                                      |
|:----------|:------------------------------------------------------------------|
| start     | Tasks, die bei der Initialisierung des ORM ausgeführt werden (`orm.init()`). |
| end       | Tasks, die beim Schließen des ORM ausgeführt werden (`orm.end()`). |
| listeners | Ausdrücke, die vor oder nach einer Abfrage oder bei deren Fehlschlag ausgeführt werden. |

### Task {#task}

Jeder Task von `start` und `end` hat:

| Schlüssel  | Beschreibung                                        | Erforderlich |
|------------|-----------------------------------------------------|:--------:|
| name       | Name des Tasks.                                     | ja       |
| expression | Auszuführender Ausdruck.                            | ja       |
| condition  | Der Task wird nur ausgeführt, wenn dieser Ausdruck wahr ist. |  |

### Listener {#listener}

| Schlüssel     | Beschreibung                                                                                  | Erforderlich | Standard |
|---------------|-----------------------------------------------------------------------------------------------|:--------:|:-------:|
| name          | Name des Listeners.                                                                           | ja       |         |
| on            | Abfragekategorien, die ihn auslösen: `select`, `insert`, `upsert`, `update`, `delete`.        | ja       |         |
| condition     | Der Listener wird nur ausgeführt, wenn dieser Ausdruck wahr ist.                              |          |         |
| before        | Ausdruck, der vor der Abfrage ausgeführt wird.                                                |          |         |
| after         | Ausdruck, der nach der Abfrage ausgeführt wird.                                               |          |         |
| error         | Ausdruck, der ausgeführt wird, wenn die Abfrage fehlschlägt.                                  |          |         |
| transactional | `false` führt den Listener außerhalb der Transaktion der Abfrage aus.                         |          | true    |

Wie Listener ausgeführt werden und welche Argumente sie erhalten, erfahren Sie unter [Listener](SchemaExample-Listener.md).

## Infrastruktur {#infrastructure}

| Schlüssel | Beschreibung                                                                |
|----------|-----------------------------------------------------------------------------|
| mappings | Wie die Entitäten auf die Tabellen oder Collections der Datenbanken abgebildet werden. |
| sources  | Die Datenbanken und ihre Verbindungen.                                      |
| stages   | Szenarien, die entscheiden, aus welcher Quelle jede Entität gelesen und in welche sie geschrieben wird. |
| views    | Views, die die Ergebnisse der Abfragen einschränken oder verändern.         |
| paths    | Ordner, in die generierte Dateien und der Zustand des ORM geschrieben werden. |
| queue    | Kafka-Queue, verwendet vom [Data Gateway](../data-gateway/index.md).        |

Werden einige davon weggelassen, ergänzt λORM sie:

- Ohne `mappings` wird ein leeres Mapping erstellt (benannt nach der Quelle, wenn es nur eine Quelle gibt).
- Eine Quelle ohne `mapping` verwendet das erste Mapping.
- Ohne `stages` wird ein Stage namens `default` mit der ersten Quelle erstellt.
- Ohne `views` wird eine View namens `default` ohne Einschränkungen erstellt.

### Mapping {#mapping}

Ein Mapping definiert, wie die Entitäten in den Tabellen oder Collections einer Datenbank gespeichert werden.
Nicht aufgeführte Entitäten und Eigenschaften werden auf eine Tabelle oder Spalte mit demselben Namen abgebildet.

| Schlüssel | Beschreibung                                               | Erforderlich |
|----------|------------------------------------------------------------|:--------:|
| name     | Name des Mappings.                                         | ja       |
| entities | Entitäts-Mappings.                                         |          |
| extends  | Name eines Mappings, dessen Entitäts-Mappings dieses erbt.  |          |

#### Entitäts-Mapping {#entity-mapping}

| Schlüssel  | Beschreibung                                                 | Erforderlich | Standard        |
|------------|--------------------------------------------------------------|:--------:|:---------------:|
| name       | Name der Entität.                                            | ja       |                 |
| mapping    | Name der Tabelle oder Collection in der Datenbank.           |          | der Name der Entität |
| abstract   | Das Entitäts-Mapping wird nur als Basis für andere verwendet. |         |                 |
| extends    | Name des Entitäts-Mappings, von dem dieses erbt.             |          |                 |
| sequence   | Name der Sequenz, mit der die Werte generiert werden.        |          |                 |
| filter     | Ausdruck, der die Datensätze der Tabelle filtert.            |          |                 |
| properties | Eigenschafts-Mappings.                                       |          |                 |

##### Abstract und extends im Entitäts-Mapping {#abstract-and-extends-in-entity-mapping}

Abstrakte Entitäts-Mappings sind als Basis für andere Entitäts-Mappings nützlich.
Dieses Beispiel definiert das abstrakte Entitäts-Mapping **Locations**, und die konkreten Entitäten erweitern es, sodass alle drei in der Tabelle `TBL_LOCATIONS` gespeichert werden.

```yaml
...
infrastructure:
  mappings:
    - name: default
      entities:
        - name: Locations
          abstract: true
          mapping: TBL_LOCATIONS
          properties:
            - name: code
              mapping: CODE
            - name: type
              mapping: TYPE
            - name: name
              mapping: NAME
        - name: Countries
          extends: Locations
        - name: States
          extends: Locations
        - name: Cities
          extends: Locations
...
```

##### Filter im Entitäts-Mapping {#filter-in-entity-mapping}

Der Filter eines Entitäts-Mappings wird auf jede Abfrage der Entität angewendet.
Dieses Beispiel liest die Benutzer der Tabelle **user_entity**, die zu einer bestimmten **realmId** gehören.

```yaml
...
infrastructure:
  mappings:
    - name: default
    - name: keycloak
      entities:
        - name: Users
          mapping: user_entity
          filter: realmId == "${REALM_ID}"
          properties:
            - name: username
              mapping: username
            - name: firstname
              mapping: first_name
            - name: lastname
              mapping: last_name
            - name: email
              mapping: email
            - name: created
              mapping: created_timestamp
              readMappingExp: millisecondToDate(created/1000)
            - name: realmId
              length: 255
              mapping: realm_id
...
```

#### Eigenschafts-Mapping {#property-mapping}

| Schlüssel       | Beschreibung                                                                        | Erforderlich | Standard          |
|-----------------|-------------------------------------------------------------------------------------|:--------:|:-----------------:|
| name            | Name der Eigenschaft.                                                               | ja       |                   |
| mapping         | Name der Spalte in der Datenbank.                                                   |          | der Name der Eigenschaft |
| readMappingExp  | Leseausdruck, der in der Quelle aufgelöst wird.                                     |          |                   |
| dbType          | Von push (DDL) verwendeter Spaltentyp anstelle des aus dem Eigenschaftstyp abgeleiteten. |      |                   |
| previousMapping | Vorheriger Name der Spalte: push benennt die Spalte um, anstatt eine neue hinzuzufügen. |       |                   |

##### Spaltentyp im Eigenschafts-Mapping {#column-type-in-property-mapping}

**dbType** legt den Spaltentyp fest, den jede DDL verwendet, die die Spalte erstellt oder ändert (`push`, `push -o`).
Verwenden Sie es, um einen Typ zu wählen, den der Eigenschaftstyp allein nicht ergibt, zum Beispiel einen Zeitpunkt mit Millisekunden oder binäres JSON auf PostgreSQL:

```yaml
infrastructure:
  mappings:
    - name: catalog
      entities:
        - name: Products
          mapping: products
          properties:
            - name: settings
              mapping: settings
              dbType: jsonb
            - name: createdAt
              mapping: created_at
              dbType: timestamptz(3)
```

##### Eine Spalte mit previousMapping umbenennen {#rename-a-column-with-previousmapping}

Um eine Spalte umzubenennen, ohne ihre Daten zu verlieren, setzen Sie den neuen Namen in **mapping** und den aktuellen in **previousMapping**.
Push generiert dann `ALTER TABLE … RENAME COLUMN icon TO icon_name` (SqlServer `sp_rename`), anstatt eine neue Spalte hinzuzufügen.

```yaml
infrastructure:
  mappings:
    - name: catalog
      entities:
        - name: Categories
          mapping: categories
          properties:
            - name: icon
              mapping: icon_name
              previousMapping: icon
```

Entfernen Sie **previousMapping**, sobald die Umbenennung in jeder Datenbank angewendet wurde. Das Umbenennen einer Tabelle wird nicht unterstützt.

##### Leseausdruck im Eigenschafts-Mapping {#read-expression-in-property-mapping}

Der Ausdruck in **readMappingExp** wird in der Quelle aufgelöst, und sein Ergebnis wird in Leseabfragen zurückgegeben.
In diesem Beispiel wird die in Millisekunden gespeicherte Spalte `created_timestamp` als Datum zurückgegeben:

```yaml
infrastructure:
  mappings:
    - name: default
    - name: keycloak
      entities:
        - name: Users
          mapping: user_entity
          filter: realmId == "${REALM_ID}"
          properties:
            ...
            - name: created
              mapping: created_timestamp
              readMappingExp: millisecondToDate(created/1000)
            - name: realmId
              length: 255
              mapping: realm_id
...
```

### Quelle {#source}

Eine Quelle ist eine Datenbank und ihre Verbindung.

| Schlüssel  | Beschreibung                                                             | Erforderlich | Standard          |
|------------|--------------------------------------------------------------------------|:--------:|:-----------------:|
| name       | Name der Quelle.                                                         | ja       |                   |
| dialect    | Dialekt: `MySQL`, `MariaDB`, `PostgreSQL`, `Oracle`, `SqlServer`, `MongoDB` oder `SQLjs`. | ja |       |
| mapping    | Name des von der Quelle verwendeten Mappings.                            |          | das erste Mapping |
| connection | Verbindung: ein Objekt oder eine Umgebungsvariable, die sie enthält.     | ja       |                   |

#### Verbindung einer Quelle festlegen {#set-connection-in-source}

Die Verbindung kann mit einer Umgebungsvariablen oder direkt im Schema definiert werden.
Sie in das Schema zu schreiben, wird aus Sicherheitsgründen nicht empfohlen und auch, weil sich die Verbindung meist von Umgebung zu Umgebung ändert; verwenden Sie dies nur für einen vorübergehenden lokalen Test.

Mit einer Umgebungsvariablen:

```yaml
...
infrastructure:
  sources:
    - name: test
      dialect: MySQL
      mapping: test
      connection: ${CNN_MYSQL}
...
```

Im Schema:

```yaml
...
infrastructure:
  sources:
    - name: test
      dialect: MySQL
      mapping: test
      connection:
        host: localhost
        port: 3306
        user: test
        password: test
        database: test
...
```

### Stage {#stage}

Ein Stage ist ein Szenario: Seine Regeln entscheiden, welche Quelle jede Entität verwendet.
Eine Abfrage wird auf dem in ihren Optionen angegebenen Stage ausgeführt; ohne Angabe auf dem ersten Stage.

| Schlüssel | Beschreibung       | Erforderlich |
|---------|----------------------|:--------:|
| name    | Name des Stages.     | ja       |
| sources | Quellenregeln.       | ja       |

#### Quellenregel {#source-rule}

| Schlüssel | Beschreibung                                   | Erforderlich | Standard |
|-----------|------------------------------------------------|:--------:|:-------:|
| name      | Name der Quelle.                               | ja       |         |
| condition | Boolescher Ausdruck, der die Quelle auswählt.  |          | true    |

#### Bedingung einer Quellenregel {#condition-on-source-rule}

**condition** entscheidet, auf welcher Quelle eine Abfrage oder eine DDL-Anweisung ausgeführt wird.
Im Ausdruck stehen folgende Variablen zur Verfügung:

| Variable | Beschreibung                                   | Wert                                                                   |
|----------|------------------------------------------------|------------------------------------------------------------------------|
| entity   | Entität der Anweisung                          | Name der Entität                                                       |
| action   | Aktion der Anweisung                           | `select`, `insert`, `bulkInsert`, `update`, `upsert`, `delete`, `createEntity`, … |
| category | Kategorie der Anweisung                        | `select`, `insert`, `upsert`, `update`, `delete`, `create`, `alter`, `drop`, … |
| type     | Typ der Anweisung                              | `dql`, `dml`, `ddl`                                                    |
| read     | Die Anweisung liest                            | boolean                                                                |
| write    | Die Anweisung schreibt                         | boolean                                                                |
| dml      | Die Anweisung ist eine Abfrage (DQL oder DML)  | boolean                                                                |
| ddl      | Die Anweisung ist DDL                          | boolean                                                                |

Die Regeln werden in der Reihenfolge ihrer Definition ausgewertet, und die erste Quelle, deren Bedingung wahr ist, wird verwendet.

Im folgenden Beispiel verwendet die Entität **Users** die Quelle **keycloak**, und alle anderen Entitäten verwenden die Quelle **main**.

```yaml
...
infrastructure:
  stages:
    - name: default
      sources:
        - name: main
          condition: entity != "Users"
        - name: keycloak
          condition: entity == "Users"
```

#### Auffangquelle {#catch-all-source}

Eine Quellenregel ohne **condition** ist eine Auffangquelle: Da die erste passende Quelle gewinnt, erhält sie nur die Entitäten, die keine vorherige Quelle übernommen hat.
Dies gilt sowohl für Abfragen (DML) als auch für push und die anderen Stage-Befehle (DDL), sodass die Auffangquelle nicht die Tabellen der Entitäten erhält, die anderen Quellen zugewiesen sind.
Setzen Sie sie an das Ende.

```yaml
infrastructure:
  stages:
    - name: default
      sources:
        - name: keycloak
          condition: entity == "Users"
        - name: main
```

### View {#view}

Eine View schränkt die Ergebnisse der Abfragen ein oder verändert sie.
Eine Abfrage verwendet die in der Option `view` angegebene View; Entitäten, die in einer View nicht aufgeführt sind, unterliegen keinen Einschränkungen.

| Schlüssel | Beschreibung       | Erforderlich |
|----------|----------------------|:--------:|
| name     | Name der View.       | ja       |
| entities | Entitäts-Views.      |          |

Im folgenden Beispiel maskiert die View **default** `apiKey` und blendet `email` aus, die View **collector** kann nicht auf Benutzer und Gruppen zugreifen, und die View **admin** kann auf alles zugreifen.

```yaml
infrastructure:
  views:
    - name: default
      entities:
        - name: Devices
          properties:
            - name: apiKey
              readExp: '"***"'
        - name: Users
          properties:
            - name: created
              readExp: date(created)
            - name: email
              exclude: true
    - name: collector
      entities:
        - name: Users
          exclude: true
        - name: Groups
          exclude: true
        - name: GroupUsers
          exclude: true
    - name: admin
      entities: []
```

#### Entitäts-View {#entity-view}

| Schlüssel  | Beschreibung                                     | Erforderlich |
|------------|--------------------------------------------------|:--------:|
| name       | Name der Entität.                                | ja       |
| exclude    | Auf die Entität kann mit dieser View nicht zugegriffen werden. |  |
| properties | Eigenschafts-Views.                              |          |

##### Exclude in der Entitäts-View {#exclude-in-entity-view}

Auf eine Entität mit **exclude** kann nicht zugegriffen werden, wenn diese View verwendet wird.

```yaml
infrastructure:
  views:
    ...
    - name: collector
      entities:
        - name: Users
          exclude: true
        - name: Groups
          exclude: true
        - name: GroupUsers
          exclude: true
    ...
```

#### Eigenschafts-View {#property-view}

| Schlüssel | Beschreibung                                       | Erforderlich |
|---------|----------------------------------------------------|:--------:|
| name    | Name der Eigenschaft.                              | ja       |
| exclude | Auf die Eigenschaft kann mit dieser View nicht zugegriffen werden. | |
| readExp | Leseausdruck, der in der Quelle aufgelöst wird.    |          |

##### Exclude in der Eigenschafts-View {#exclude-in-property-view}

Auf eine Eigenschaft mit **exclude** kann nicht zugegriffen werden, wenn diese View verwendet wird.

```yaml
infrastructure:
  views:
    - name: default
      entities:
        ...
        - name: Users
          properties:
            - name: created
              readExp: date(created)
            - name: email
              exclude: true
      ...
```

##### Leseausdruck in der Eigenschafts-View {#read-expression-in-property-view}

Mit **readExp** wird in Leseabfragen das Ergebnis des Ausdrucks anstelle des gespeicherten Werts zurückgegeben.
In diesem Beispiel wird `created` als Datum ohne Uhrzeit zurückgegeben:

```yaml
infrastructure:
  views:
    - name: default
      entities:
        ...
        - name: Users
          properties:
            - name: created
              readExp: date(created)
      ...
```

### Pfade {#paths}

Ordner, relativ zum Ordner des Schemas, in die generierte Dateien und der Zustand des ORM geschrieben werden.

| Schlüssel | Beschreibung                                                                        | Standard    |
|--------|-------------------------------------------------------------------------------------|:-----------:|
| src    | Ordner des Quellcodes.                                                              | `src`       |
| domain | Ordner innerhalb von `src`, in den `lambdaorm build` das Modell und die Repositories schreibt. | `domain` |
| state  | Ordner des ORM-Zustands (Modell jedes Stages, von push angewendete DDL-Skripte).    | `orm_state` |

```yaml
infrastructure:
  paths:
    src: src
    domain: domain
    state: orm_state
```

### Queue {#queue}

`infrastructure.queue` konfiguriert eine Kafka-Queue. Sie wird nicht von `@lambdaorm/lib` selbst verwendet: Sie wird vom [Data Gateway](../data-gateway/index.md) für Ausführungen über die Queue gelesen und fügt den Ausdrücken die Funktion `queue.send(topic, messages)` hinzu.

| Schlüssel | Beschreibung                                                                                 |
|-----------|----------------------------------------------------------------------------------------------|
| config    | Konfiguration des Kafka-Clients ([kafkajs](https://kafka.js.org/docs/configuration)).        |
| consumers | Consumer: Jeder hat einen `name`, eine Consumer-`config`, ein `subscribe` (Topic) und einen `execute`-Ausdruck, der für jede Nachricht mit den Variablen `message`, `topic` und `partition` ausgeführt wird. |

In diesem Beispiel wird jede Nachricht des Topics `insights-sync` auf dem Stage `insights` ausgeführt:

```yaml
infrastructure:
  queue:
    config: $QUEUE_CONFIG
    consumers:
      - name: syncInsights
        config:
          groupId: group1
        subscribe:
          topic: insights-sync
          fromBeginning: true
        execute: orm.execute(message.query, message.data, {stage:"insights"})
```
