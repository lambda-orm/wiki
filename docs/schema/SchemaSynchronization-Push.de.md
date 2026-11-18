# Push {#push}

Diese Seite erklärt push, das die Quellen (Datenbanken) eines Stages anhand des Schemas aktualisiert: wie es funktioniert, den CLI-Befehl `lambdaorm push` und die Methode `orm.stage.push()`.

## Wie push funktioniert {#how-push-works}

Push liest die Datenbanken des Stages (wie [fetch](SchemaSynchronization-Fetch.md)) und generiert die DDL, die sie auf den Stand des Modells bringt:

- Nicht existierende Tabellen werden mit ihrem Primärschlüssel, Unique Key, ihren Fremdschlüsseln und Indizes erstellt.
- In bestehenden Tabellen werden fehlende Spalten hinzugefügt (`ALTER TABLE … ADD`) und Spalten mit anderem Typ, anderer Länge oder anderer Nullbarkeit geändert.
- Eine Spalte, die im Mapping ihrer Eigenschaft mit `previousMapping` deklariert ist, wird umbenannt (`ALTER TABLE … RENAME COLUMN`, bei SqlServer `sp_rename`), anstatt hinzugefügt zu werden. Siehe [Eine Spalte umbenennen](SchemaDefinition.md#rename-a-column-with-previousmapping).
- **Push löscht niemals** etwas, das nur in der Datenbank existiert (Tabellen, Spalten). `fetch` meldet es, sodass es bei Bedarf von Hand entfernt werden kann.
- Die Spaltentypen folgen den Eigenschaftstypen und dem `dbType` im Mapping der Eigenschaft. Siehe [Eigenschaftstypen](SchemaDefinition.md#property-types).
- Jede Entität geht an die durch die Regeln des Stages gewählte Quelle; eine Quelle ohne Bedingung erhält nur die Entitäten, die keine andere Quelle übernommen hat.

Da der Vergleich mit den Datenbanken erfolgt, funktioniert push auf jedem Host und in jedem CI-Job gleich: Es benötigt nicht den Ordner `orm_state` eines vorherigen Push.
Der Ordner `orm_state` wird trotzdem geschrieben, als Protokoll dessen, was angewendet wurde.

Das Umbenennen einer Tabelle wird nicht unterstützt.

## CLI {#cli}

Änderungen anwenden:

```sh
lambdaorm push
```

| Option | Beschreibung |
|--------|-------------|
| `-w`, `--workspace` | Ordner des Projekts (Standard: der aktuelle Ordner). |
| `-s`, `--stage` | Name des Stages (Standard: der erste Stage). |
| `-e`, `--envfile` | Zu lesende Datei mit Umgebungsvariablen. |
| `-o`, `--output` | Generiert die DDL, ohne sie anzuwenden (siehe unten). |
| `-f`, `--force` | Fährt bei einer fehlschlagenden Anweisung mit den nächsten fort. |

Beispiel der generierten DDL auf einer leeren Datenbank:

```sql
CREATE TABLE Countries (name VARCHAR(80) NOT NULL ,iso3 VARCHAR(3) NOT NULL ,CONSTRAINT Countries_PK PRIMARY KEY (iso3));
ALTER TABLE Countries ADD CONSTRAINT Countries_UK UNIQUE (name);
CREATE TABLE States (id INTEGER NOT NULL ,name VARCHAR(80) NOT NULL ,countryCode VARCHAR(3) NOT NULL ,CONSTRAINT States_PK PRIMARY KEY (id));
ALTER TABLE States ADD CONSTRAINT States_UK UNIQUE (countryCode,name);
ALTER TABLE States ADD CONSTRAINT States_country_FK FOREIGN KEY (countryCode) REFERENCES Countries (iso3);
```

Nachdem die Eigenschaft `phone` zu `Customers` hinzugefügt und die Spalte `icon` in `icon_name` umbenannt wurde (mit `previousMapping: icon`), generiert ein Push nur diese Änderungen:

```sql
ALTER TABLE customers ADD phone VARCHAR(32);
ALTER TABLE categories RENAME COLUMN icon TO icon_name;
```

### Die DDL generieren, ohne sie anzuwenden {#generate-the-ddl-without-applying-it}

Mit `-o` generiert push die DDL, wendet sie aber nicht an.

- `-o` allein gibt die Anweisungen jeder Quelle aus.
- `-o <dir>` schreibt ein Skript pro geänderter Quelle mit dem Namen `<stage>.<source>.sql`. Quellen ohne Änderungen erhalten keine Datei, und eine mit dem Modell übereinstimmende Datenbank erzeugt überhaupt keine Dateien.

```sh
lambdaorm push -s default -o migrations
```

```sh
migrations
├── default.catalog.sql
└── default.accounts.sql
```

Die Namen sind deterministisch, sodass die Skripte in versionierte Migrationen umbenannt und von Ihrem eigenen Deployment-Prozess angewendet werden können.

### Dateien in orm_state {#files-in-orm_state}

Wenn push die Änderungen anwendet, protokolliert es sie im Ordner `orm_state`:

```sh
├── orm_state
│   ├── default-model.json
│   └── main
│       └── V231122154351__push.sql
```

- `<stage>-model.json`: das Modell des Stages beim letzten Push.
- `<source>/V<yyMMddHHmmss>__push.sql`: die auf dieser Quelle ausgeführten Anweisungen.

Labs:

- [Einfach](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/01-simple)
- [Zwei Stages](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/03-two-stages)
- [Northwind](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/05-northwind)
- [Northwind mit mehreren Datenquellen](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
- [Northwind CQRS](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs)

## Node {#node}

`orm.stage.push()` gibt eine Aktion zurück, die die Anweisungen liefern kann, ohne sie anzuwenden, oder sie anwenden kann:

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const orm = new Orm()
	try {
		await orm.init('./lambdaORM.yaml')
		// the sentences, without applying them
		const sentences = await orm.stage.push({ stage: 'default' }).sentence()
		// the sentences grouped by source: [{ source: 'accounts', sentences: ['ALTER TABLE accounts ADD phone VARCHAR(32)'] }]
		const bySource = await orm.stage.push({ stage: 'default' }).sentencesBySource()
		// apply them
		await orm.stage.push({ stage: 'default' }).execute()
	} finally {
		await orm.end()
	}
})()
```
