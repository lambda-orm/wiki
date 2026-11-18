# Ausdrücke im Schema {#expressions-on-schema}

Diese Seite listet die Funktionen auf, die λORM den im Schema verwendeten Ausdrücken hinzufügt (Standardwerte, Lese- und Schreibwerte, Constraints, Bedingungen, Tasks und Listener).

Alle diese Ausdrücke werden von der Expression-Engine [3xpr](https://www.npmjs.com/package/3xpr) ausgewertet.
Zusätzlich zu den Operatoren und Funktionen von 3xpr fügt λORM die folgenden Funktionen hinzu.

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
| orm.metadata(query:string):any                       | Gibt die Metadaten einer Abfrage zurück. |
| orm.model(query:string):any                          | Gibt das Modell einer Abfrage zurück.    |
| orm.parameters(query:string):any                     | Gibt die Parameter einer Abfrage zurück. |
| orm.constraints(query:string):any                    | Gibt die Constraints einer Abfrage zurück. |

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
