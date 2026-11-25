# Sichten {#views}

Eine **Sicht** (View) ist eine Art, die Domäne zu sehen: dasselbe Schema, dieselben Quellen und Stages, mit nur einigen
Entitäten, nur einigen Eigenschaften, neuen Eigenschaften, die durch einen Ausdruck berechnet werden, und Eigenschaften,
die durch eine Maske gelesen werden. Ein Ausdruck mit `options.view` wird gegen **die Domäne seiner Sicht** kompiliert,
als wäre sie die einzige. Die Datenbank ändert sich nicht.

Verwenden Sie eine Sicht, um jeder Art von Benutzer (Support, Analytics, ein Partner, eine öffentliche API) nur die Daten
zu geben, die sie sehen soll, ohne ein zweites Modell und ohne Views in der Datenbank. Die Schlüssel von
`infrastructure.views` stehen in der [Definition](SchemaDefinition.md#view).

```yaml
infrastructure:
  views:
    - name: support
      entities:
        - name: Customers
          properties:
            - { name: email, readExp: 'maskEmail(email)' }                 # masked
            - { name: taxId, exclude: true }                                # not in the view
            - { name: segment, exclude: true, default: '"retail"' }        # hidden, an insert writes it
            - { name: label, type: string, readExp: 'name + " <" + email + ">"' }   # new, read only
        - { name: Invoices, exclude: true }                                 # the entity doesn't exist in the view
```

```ts
await orm.execute('Customers.map(p => [p.label, p.email])', {}, { view: 'support' })
await orm.execute('Invoices', {}, { view: 'support' })   // ViewError: the entity Invoices is not in the view support
```

## Die Sicht `default` {#the-view-default}

`default` **ist die Domäne**: die Sicht einer Abfrage ohne `options.view`. Sie ist immer vorhanden (λORM fügt sie hinzu,
wenn das Schema sie nicht schreibt) und kann keine Entitäten ändern.

## Entitäten und Eigenschaften {#entities-and-properties}

| In der Sicht | Wirkung |
| --- | --- |
| Eine Entität mit `exclude: true` | Sie existiert nicht: Jede Anweisung auf ihr, ein `include` von ihr oder eine Beziehung zu ihr ist ein `ViewError` |
| Eine Eigenschaft mit `exclude: true` | Nicht in „allen Feldern“; sie zu nennen ist der Fehler einer Eigenschaft, die nicht existiert |
| Eine Eigenschaft mit `exclude: true` und `default` | Verborgen, und jeder Insert in der Sicht schreibt sie mit diesem Wert (oder dem Default der Domäne), egal was die Daten bringen |
| Eine Eigenschaft der Domäne mit `readExp` | **Maskiert**: wird durch den Ausdruck gelesen, auch in Filtern und Sortierungen („was man sieht, wird gefiltert“); wird mit ihrem echten Wert geschrieben |
| Eine neue Eigenschaft mit `readExp` (und `type`) | In der Quelle berechnet; nur lesbar |

Der Primärschlüssel und die Schlüssel der Beziehungen, die die Sicht behält, können nicht ausgeschlossen werden (um eine
Beziehung zu verbergen, schließen Sie die Entität aus, zu der sie führt). Eine verborgene Eigenschaft, die `required` ist
und keinen `default` hat, lässt jeden Insert in der Sicht in der Datenbank fehlschlagen: Geben Sie ihr einen `default`.
Eine Sicht, die etwas nennt, das nicht existiert, ein `readExp`, das nicht kompiliert, oder ein ungültiger `type` ist beim
Laden des Schemas ein `SchemaError`.

## Personenbezogene Daten (PII) {#personal-data-pii}

Eine Eigenschaft der Domäne gibt an, welche Art personenbezogener Daten sie ist, und eine Sicht maskiert, hasht oder
schließt **alle davon** aus, ohne sie zu nennen:

```yaml
domain:
  entities:
    - name: Customers
      properties:
        - { name: email, pii: email }      # maskEmail
        - { name: cardNumber, pii: card }  # maskLeft(x, 4)
        - { name: lastname, pii: name }    # maskRight(x, 1)
infrastructure:
  views:
    - { name: support, pii: mask }
    - { name: analytics, pii: hash }       # with LAMBDAORM_HASH_KEY when it is defined
    - { name: public, pii: exclude }
```

| `pii` der Eigenschaft | Maske bei `pii: mask` |
| --- | --- |
| `email` | `maskEmail` |
| `phone`, `card`, `id` | `maskLeft(x, 4)` |
| `name` | `maskRight(x, 1)` |
| ein anderer | `mask` |

Was die Sicht über eine Eigenschaft sagt, hat Vorrang vor ihrem `pii`; die Schlüssel bleiben. Die Sicht `default` sieht
die personenbezogenen Daten so, wie sie sind.

## Maskierungsfunktionen {#mask-functions}

Es sind Funktionen der Abfragesprache, die in jede Datenbank mit demselben Ergebnis übersetzt werden, das sie im
Speicher liefern:

| Funktion | Ergebnis |
| --- | --- |
| `mask(x)` | Ein Viertel jeder Seite sichtbar (höchstens 3), der Rest `*`; bei weniger als 4 Zeichen alles `*` |
| `maskLeft(x, n)` / `maskRight(x, n)` | Alles außer den letzten / den ersten `n` |
| `maskEmail(x)` | Das erste Zeichen des Benutzers und die Domain: `f*****@x.com` |
| `hash(x, key?)` | SHA-256 hexadezimal; mit einem Schlüssel HMAC-SHA256. Ohne Schlüssel wird es auf PostgreSQL, MySQL, MariaDB, SQL Server und Oracle übersetzt; mit Schlüssel nur auf PostgreSQL (`pgcrypto`). Auf MongoDB und SQLite ist es beim Kompilieren der Abfrage ein Fehler |

## Die gesamte API {#the-whole-api}

`orm.metadata`, `model`, `parameters`, `constraints` und `plan` nehmen `options.view` entgegen;
`orm.state.getSchemaDomain(view)` liefert die Domäne der Sicht; eine Transaktion, ihre Skripte und Listener erben ihre
Sicht; ein Repository nimmt eine entgegen (`new CustomersRepository(stage, orm, view)`), und `lambdaorm build --view`
erzeugt das Modell und die Repositories einer Sicht.

## Was eine Sicht nicht einschränkt {#what-a-view-does-not-restrict}

- **Wer die Sicht wählt:** in der Bibliothek, wer sie aufruft (er kann `default` anfordern); im Data Gateway das
  Gateway, anhand der Anmeldeinformation oder der Claims.
- **Die Aktionen:** Eine Sicht ist nicht schreibgeschützt; `insert`, `update` und `delete` auf ihren Entitäten sind
  erlaubt. Sie werden durch die Berechtigungen des Gateways oder durch die Anwendung begrenzt.
- **Die Stage-Befehle** (`push`, `pull`, `import`, `export`, `drop`, `truncate`) arbeiten auf dem gesamten Schema: Sie
  dienen der Administration, nicht dem, der eine Sicht verwendet.
- **Die Zeilen:** Eine Sicht sieht alle, sofern ihr [Filter](Context.md) sie nicht mit dem Kontext begrenzt.
