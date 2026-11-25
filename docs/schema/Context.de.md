# Kontext und Zeilenfilter {#context-and-row-filters}

Der **Kontext** ist, wer einen Ausdruck ausführt: Benutzer, Tenant, Region, Rollen, Claims. Die Anwendung (oder das
Data Gateway, aus der Identität des Aufrufers) liefert ihn, und die Ausdrücke des Schemas lesen ihn als `context`.
Verwenden Sie ihn, wenn derselbe Prozess mehrere Benutzer, Tenants oder Regionen bedient und die Regeln des Schemas
(welche Zeilen jeder sieht, was ein Insert schreibt) davon abhängen, wer aufruft.

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1', roles: ['seller'] } })
```

- Die Daten einer Abfrage **können ihn nicht ersetzen**: Ein Schlüssel `context` in den Daten ist nicht der Kontext.
- Er wird als **Parameter** übertragen: Eine kompilierte Anweisung dient jedem Aufrufer, und der Cache speichert keine
  Werte von irgendjemandem.
- Eine Transaktion, ihre Skripte und Listener erben ihn, so wie sie die Sicht und den Stage erben.
- `actor` bleibt getrennt: Es ist das, was die Observability aufzeichnet; `context` ist das, womit die Regeln
  entscheiden.

## Wo er gelesen wird {#where-it-is-read}

| Ausdruck | Liest den Kontext |
| --- | --- |
| `filter` einer Sicht und eines Mappings | ja; ein fehlender Wert ist ein Fehler |
| `default` einer Eigenschaft, die eine Sicht verbirgt | ja |
| `default`, `writeValue` und `constraints` der Domäne | ja; ein fehlender Wert ist `null` |
| `readExp` (Domäne und Sicht) | ja, als Parameter |
| Bedingungen der Listener (`context`) | ja |
| `forward`-Header einer [Http-Quelle](HttpSource.md) | ja |
| Bedingungen der Quellen eines Stages | **nein**: Sie bestimmen die Route beim Kompilieren der Abfrage, und die Route wird gecacht |

`context` ist ein reservierter Name in den Ausdrücken des Schemas (`context.region`, `context.roles.includes("admin")`).

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

- Er wird jedem Select, Update und Delete auf der Entität, den Joins über eine Beziehung und den Includes hinzugefügt
  sowie, wenn es beide gibt, dem Filter des Mappings.
- Er verwendet die Eigenschaften der Domäne, auch diejenigen, die die Sicht verbirgt (oben `tenantId`).
- **Ein Schreibvorgang kann ihn nicht verlassen**: Ein Insert oder ein Update, das eine Eigenschaft des Filters ändert,
  außerhalb davon ist ein `ViewError` (wie `WITH CHECK` in PostgreSQL). Damit ein Insert ihn erfüllt, ohne dass der
  Aufrufer es weiß, verbergen Sie die Eigenschaft mit einem `default` aus dem Kontext, wie oben `tenantId`.
- Ein Wert des Kontexts, den ein Filter braucht und den die Ausführung nicht mitbringt, ist ein `ContextError`
  (`context.region is required by the view seller`), nicht stillschweigend null Zeilen.
- Er wird beim Laden des Schemas validiert: Er muss kompilieren und darf nur Eigenschaften der Entität und `context`
  verwenden.

Die Sicht `default` ist die Domäne und hat keinen Filter. Der `filter` eines Mappings (`mappings[].entities[].filter`)
funktioniert genauso, für jede Sicht, und kann ebenfalls `context` lesen:

```yaml
mappings:
  - name: keycloak
    entities:
      - name: Users
        mapping: user_entity
        filter: 'realmId == context.realm'
```

## Sicherheit {#security}

Wie die Sicht wird auch der Kontext von dem gewählt, der die Bibliothek aufruft; λORM garantiert, dass eine Abfrage ihn
weder ändern noch umgehen kann. Im [Data Gateway](../data-gateway/index.md) baut das Gateway ihn aus der Identität des
Aufrufers auf und verwirft jeden `context`, den ein Client sendet: Dort ist er eine Sicherheitsgrenze. Siehe
[Sichten](Views.md).
