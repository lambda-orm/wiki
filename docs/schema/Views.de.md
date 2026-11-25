# Sichten {#views}

Eine **Sicht** (View) ist eine Art, die Domäne zu sehen: dasselbe Schema, dieselben Quellen und Stages, mit nur einigen
Entitäten, nur einigen Eigenschaften, neuen Eigenschaften, die durch einen Ausdruck berechnet werden, und Eigenschaften,
die durch eine Maske gelesen werden. Ein Ausdruck mit `options.view` wird gegen **die Domäne seiner Sicht** kompiliert,
als wäre sie die einzige. Die Datenbank ändert sich nicht.

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

Der Primärschlüssel und die Schlüssel der Beziehungen, die die Sicht behält, können nicht ausgeschlossen werden. Eine
Sicht, die etwas nennt, das nicht existiert, ein `readExp`, das nicht kompiliert, oder ein ungültiger `type` ist beim
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

Was die Sicht über eine Eigenschaft sagt, hat Vorrang vor ihrem `pii`; die Schlüssel bleiben.

## Maskierungsfunktionen {#mask-functions}

Es sind Funktionen der Abfragesprache, die in jede Datenbank mit demselben Ergebnis übersetzt werden, das sie im
Speicher liefern:

| Funktion | Ergebnis |
| --- | --- |
| `mask(x)` | Ein Viertel jeder Seite sichtbar (höchstens 3), der Rest `*`; bei weniger als 4 Zeichen alles `*` |
| `maskLeft(x, n)` / `maskRight(x, n)` | Alles außer den letzten / den ersten `n` |
| `maskEmail(x)` | Das erste Zeichen des Benutzers und die Domain: `f*****@x.com` |
| `hash(x, key?)` | SHA-256 hexadezimal; mit einem Schlüssel HMAC-SHA256 (PostgreSQL mit `pgcrypto`). Nicht in MongoDB |

## Die gesamte API {#the-whole-api}

`orm.metadata`, `model`, `parameters`, `constraints` und `plan` nehmen `options.view` entgegen;
`orm.state.getSchemaDomain(view)` liefert die Domäne der Sicht; eine Transaktion, ihre Skripte und Listener erben ihre
Sicht; ein Repository nimmt eine entgegen (`new CustomersRepository(stage, orm, view)`), und `lambdaorm build --view`
erzeugt das Modell und die Repositories einer Sicht.

Die Zeilen, die eine Sicht sieht, werden durch ihren [Filter](Context.md) begrenzt. Wer die Sicht wählt, entscheidet,
was gesehen wird: im Data Gateway das Gateway.
