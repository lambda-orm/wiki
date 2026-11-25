# Kontext und Zeilenfilter {#context-and-row-filters}

Der **Kontext** ist, wer einen Ausdruck ausführt: Benutzer, Tenant, Region, Rollen, Claims. Die Anwendung (oder das
Data Gateway, aus der Identität des Aufrufers) liefert ihn, und die Ausdrücke des Schemas lesen ihn als `context`:

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1' } })
```

- Die Daten einer Abfrage **können ihn nicht ersetzen**: Ein Schlüssel `context` in den Daten ist nicht der Kontext.
- Er wird als **Parameter** übertragen: Eine kompilierte Anweisung dient jedem Aufrufer.
- Eine Transaktion, ihre Skripte und Listener erben ihn. `actor` bleibt getrennt: Es ist das, was die Observability
  aufzeichnet.

Er wird in den Filtern der Sichten und Mappings, `default`, `writeValue`, `constraints`, `readExp` und den Bedingungen
der Listener (`args.context`) gelesen; nicht in den Bedingungen der Quellen eines Stages.

## Der Filter der Zeilen einer Sicht {#the-filter-of-the-rows-of-a-view}

```yaml
views:
  - name: seller
    entities:
      - name: Orders
        filter: 'regionId == context.region'                               # its rows
        properties:
          - { name: tenantId, exclude: true, default: 'context.tenant' }   # an insert writes its tenant
```

- Er wird jedem Select, Update und Delete auf der Entität, den Joins über eine Beziehung und den Includes hinzugefügt.
- **Ein Schreibvorgang kann ihn nicht verlassen**: Ein Insert oder ein Update, das eine Eigenschaft des Filters ändert,
  außerhalb davon ist ein `ViewError` (wie `WITH CHECK`).
- Ein Wert des Kontexts, den ein Filter braucht und den die Ausführung nicht mitbringt, ist ein `ContextError`, nicht
  stillschweigend null Zeilen.

Der `filter` eines Mappings (`mappings[].entities[].filter`) funktioniert genauso, für jede Sicht, und kann ebenfalls
`context` lesen.
