# Fetch {#fetch}

Diese Seite erklärt fetch, das die Unterschiede zwischen den Quellen (Datenbanken) eines Stages und dem Schema anzeigt, ohne Änderungen anzuwenden: was verglichen wird, den CLI-Befehl `lambdaorm fetch` und die Methode `orm.stage.fetch()`.

## Was fetch vergleicht {#what-fetch-compares}

Fetch liest die Datenbanken des Stages und vergleicht sie mit dem Modell (Drift). Das Ergebnis enthält einen Eintrag pro Mapping mit den Entitäten, die sich unterscheiden:

- Tabellen, die in der Datenbank oder im Modell fehlen,
- Spalten, die auf einer Seite fehlen,
- Spalten mit anderem Typ, anderer Länge oder anderer Nullbarkeit,
- ein abweichender Primärschlüssel.

Jede Entität hat ihre `differences` in lesbarem Text. **Wenn die Datenbanken mit dem Modell übereinstimmen, enthält kein Mapping Entitäten.**

Beziehungen (Fremdschlüssel) und Indizes werden nicht verglichen.
Auf MongoDB, das schemalos ist, prüft fetch nur, ob jede Collection existiert.

Beispiel für ein Ergebnis, nachdem die Eigenschaft `phone` im Modell zu `Customers` hinzugefügt wurde:

```yaml
- name: default
  entities:
    - name: Customers
      mapping: customers
      differences:
        - column phone missing in the database
```

Ergebnis, wenn die Datenbank mit dem Modell übereinstimmt:

```yaml
- name: default
  entities: []
```

## CLI {#cli}

```sh
lambdaorm fetch -s default -o yaml
```

| Option | Beschreibung |
|--------|-------------|
| `-w`, `--workspace` | Ordner des Projekts (Standard: der aktuelle Ordner). |
| `-s`, `--stage` | Name des Stages (Standard: der erste Stage). |
| `-e`, `--envfile` | Zu lesende Datei mit Umgebungsvariablen. |
| `-o`, `--output` | Ausgabeformat: `json`, `beautiful`, `light` oder `yaml`. |

**Der Befehl endet mit dem Code 1, wenn es Unterschiede gibt** (und mit 0, wenn die Datenbanken übereinstimmen), sodass er in CI zur Erkennung von Drift verwendet werden kann:

```sh
lambdaorm fetch -s default || echo "the database differs from the model"
```

Siehe das [CLI-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/10-fetch).

## Node {#node}

`orm.stage.fetch()` gibt die Unterschiede zurück. Um die Mappings der Datenbanken so zu lesen, wie sie sind (jede Tabelle und Spalte), verwenden Sie `orm.stage.read()`.

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const orm = new Orm()
	try {
		await orm.init('./lambdaORM.yaml')
		const mappings = await orm.stage.fetch({ stage: 'default' })
		const differing: any[] = mappings.flatMap(p => p.entities || [])
		for (const entity of differing) {
			console.log(entity.name, entity.differences)
		}
		// the databases' own mappings
		const database = await orm.stage.read({ stage: 'default' })
		await orm.helper.fs.write('./mappings.yaml', orm.helper.yaml.dump(database))
	} finally {
		await orm.end()
	}
})()
```

Siehe das [Node-Lab](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/10-fetch).
