# Umgebungsvariablen im Schema {#environment-variables-on-schema}

Diese Seite zeigt, wie Sie Umgebungsvariablen im Schema verwenden, um Verbindungen und Geheimnisse aus der Schema-Datei herauszuhalten.

Jeder Wert des Schemas kann mit der Notation `$VARIABLE` oder `${VARIABLE}` aus einer Umgebungsvariablen übernommen werden.
Die Variablen werden einmal ersetzt, beim Laden des Schemas. In der CLI liest die Option `-e` sie aus einer Datei (zum Beispiel `-e .env`).
Ein Wert, der nach der Ersetzung ein JSON-Text ist (etwa eine Verbindung), wird als Objekt gelesen; eine Verbindung mit einer nicht definierten Variablen wird beim Laden des Schemas als Warnung gemeldet.

Da sie beim Laden ersetzt werden, sind Umgebungsvariablen für jede Abfrage gleich. Ein Wert, der davon abhängt, wer die jeweilige Abfrage ausführt (Benutzer, Mandant, Region), gehört stattdessen in den [Kontext](Context.md).

## Beispiele {#examples}

### Verbindung zur Datenbank {#connection-to-the-database}

Die Verbindung jeder Quelle wird aus einer Umgebungsvariablen gelesen:

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

Die Variable enthält die Verbindung als JSON:

```sh
CNN_MYSQL={"host":"localhost","port":3306,"user":"test","password":"test","database":"test"}
CNN_POSTGRES={"host":"localhost","port":5433,"user":"test","password":"test","database":"test"}
```

### Schlüssel der Verschlüsselungsfunktionen {#key-of-the-encryption-functions}

Der von `encrypt` und `decrypt` verwendete Schlüssel wird innerhalb eines Ausdrucks aus einer Umgebungsvariablen gelesen:

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
