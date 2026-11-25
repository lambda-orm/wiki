# Ausdrücke im Schema {#expressions-on-schema}

Diese Seite listet die Funktionen auf, die λORM den im Schema verwendeten Ausdrücken hinzufügt (Standardwerte, Lese- und Schreibwerte, Constraints, Bedingungen, Tasks und Listener).

Alle diese Ausdrücke werden in der Sprache der Expression-Engine [3xpr](https://www.npmjs.com/package/3xpr) geschrieben, derselben wie die der Abfragen. Wo sie ausgeführt werden, hängt vom Schlüssel ab:

| Von λORM in Node ausgewertet | In die Quelle übersetzt (SQL, MongoDB-Aggregation) |
| --- | --- |
| `default`, `readValue`, `writeValue`, `constraints`, Bedingungen der Stages, Tasks und Listener | `readExp`, `readMappingExp`, der `filter` von Mappings und Sichten |

Ein Ausdruck, der in Node ausgeführt wird, kann jede Funktion von 3xpr und die unten aufgeführten verwenden. Ein in die Quelle übersetzter Ausdruck kann nur die Funktionen verwenden, die λORM für diese Engine übersetzt (siehe [Operatoren und Funktionen](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)); er wird beim Laden des Schemas validiert.

Zusätzlich zu den Operatoren und Funktionen von 3xpr fügt λORM die folgenden Funktionen und Variablen hinzu.

## Allgemeine Funktionen {#general-functions}

| Funktion                                  | Beschreibung                    |
|-------------------------------------------|---------------------------------|
| toBase64(value:string):string             | Kodiert einen String in Base64. |
| getBase64(value:string):string            | Dekodiert einen Base64-String.  |
| encrypt(value:string,key:string):string   | Verschlüsselt einen String mit einem Schlüssel. |
| decrypt(value:string,key:string):string   | Entschlüsselt einen String mit einem Schlüssel. |

### Beispiel {#example}

In diesem Beispiel speichert **encrypt** die E-Mail-Adresse verschlüsselt in der Datenbank, und **decrypt** gibt sie in den Ergebnissen entschlüsselt zurück.

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

## Orm-Funktionen {#orm-functions}

Diese Funktionen rufen die Methoden der Klasse `Orm` auf, sodass ein Ausdruck eine andere Abfrage ausführen oder untersuchen kann.

| Funktion                                             | Beschreibung                             |
|------------------------------------------------------|------------------------------------------|
| orm.execute(query:string,data:any,options:any):any   | Führt eine Abfrage aus und gibt das Ergebnis zurück. |
| orm.plan(query:string,options:any):any               | Gibt den Ausführungsplan einer Abfrage zurück. |
| orm.metadata(query:string,options:any):any           | Gibt die Metadaten einer Abfrage zurück. |
| orm.model(query:string,options:any):any              | Gibt das Modell einer Abfrage zurück.    |
| orm.parameters(query:string,options:any):any         | Gibt die Parameter einer Abfrage zurück. |
| orm.constraints(query:string,options:any):any        | Gibt die Constraints einer Abfrage zurück. |

### Beispiel {#example_1}

In diesem Beispiel verwendet ein Listener **orm.execute**, um auf dem Stage `insights` dieselbe Abfrage auszuführen, die gerade auf dem Stage `default` oder `cqrs` ausgeführt wurde.
Auf diese Weise lässt sich das CQRS-Muster umsetzen. Siehe [Listener](SchemaExample-Listener.md).

```yaml
application:
  listeners:
    - name: syncInsights
      on: [insert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"})
```

Siehe das [CLI-Lab „northwind CQRS“](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs).

## Maskierungsfunktionen {#mask-functions}

Sie maskieren personenbezogene Daten; sie werden außerdem in jede Engine übersetzt, sodass sie in einem `readExp` einer [Sicht](Views.md#mask-functions) verwendet werden können.

| Funktion                                  | Beschreibung                                                                  |
|-------------------------------------------|-------------------------------------------------------------------------------|
| mask(value:string):string                 | Ein Viertel jeder Seite sichtbar (höchstens 3), der Rest `*`.                 |
| maskLeft(value:string,n:integer):string   | Alle Zeichen außer den letzten `n` als `*`.                                   |
| maskRight(value:string,n:integer):string  | Alle Zeichen außer den ersten `n` als `*`.                                    |
| maskEmail(value:string):string            | Das erste Zeichen des Benutzers und die Domain: `f*****@x.com`.               |
| hash(value:string,key?:string):string     | SHA-256 hexadezimal; mit einem Schlüssel HMAC-SHA256.                         |

## JSON-, Vektor- und Geo-Funktionen {#json-vector-and-geo-functions}

Sie arbeiten mit Eigenschaften vom Typ `json`, `vector` und `point` (siehe [JSON, Vektoren und Punkte](../queries/JsonVectorsPoints.md)).

| Funktion                                       | Beschreibung                                                      |
|------------------------------------------------|-------------------------------------------------------------------|
| jsonHas(value:any,path:string):boolean         | Der Pfad existiert im JSON.                                       |
| jsonIncludes(value:any,path:string,item:any):boolean | Die Liste am Pfad enthält das Element.                      |
| jsonSet(value:any,path:string,item:any):any    | Das JSON mit dem Element am Pfad.                                 |
| cosineDistance(a,b), l2Distance(a,b), innerProduct(a,b) | Abstände zwischen zwei Vektoren.                         |
| point(longitude,latitude)                      | Ein GeoJSON-Punkt.                                                |
| distance(a,b)                                  | Die Entfernung zwischen zwei Punkten in Metern.                   |
| within(p,minLongitude,minLatitude,maxLongitude,maxLatitude) | Der Punkt liegt innerhalb des Rechtecks.             |
| inside(p,area)                                 | Der Punkt liegt innerhalb des GeoJSON-Polygons `area`.            |

## Der Kontext {#the-context}

`context` ist eine reservierte Variable: der [Kontext](Context.md) dessen, der die Abfrage ausführt (`context.user`, `context.tenant`, `context.roles`). Er kann in Filtern, `default`, `writeValue`, `constraints`, `readExp` und den Bedingungen der Listener gelesen werden, nicht jedoch in den Bedingungen der Quellen eines Stages.

```yaml
domain:
  entities:
    - name: Orders
      properties:
        - name: createdBy
          default: context.user
```
