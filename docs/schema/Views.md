# Views

A **view** is a way of seeing the domain: the same schema, sources and stages, with only some entities, only some
properties, new properties computed by an expression and properties read through a mask. An expression with
`options.view` is compiled against **the domain of its view**, as if it were the only one. The database doesn't
change.

Use a view to give each kind of user (support, analytics, a partner, a public API) only the data it should see,
without a second model and without views of the database. The keys of `infrastructure.views` are in the
[Definition](SchemaDefinition.md#view).

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

## The view `default`

`default` **is the domain**: the view of a query without `options.view`. It is always there (λORM adds it when the
schema doesn't write it) and it can't change entities.

## Entities and properties

| In the view | Effect |
| --- | --- |
| An entity with `exclude: true` | It doesn't exist: any sentence on it, an `include` of it or a relation to it is a `ViewError` |
| A property with `exclude: true` | Out of "all the fields"; naming it is the error of a property that doesn't exist |
| A property with `exclude: true` and `default` | Hidden, and every insert in the view writes it with that value (or the default of the domain), whatever the data brings |
| A property of the domain with `readExp` | **Masked**: read through the expression, also in filters and sorts ("what is seen is what is filtered"); written with its real value |
| A new property with `readExp` (and `type`) | Computed in the source; read only |

The primary key and the keys of the relations the view keeps can't be excluded (to hide a relation, exclude the
entity it goes to). A hidden property that is `required` and has no `default` makes every insert in the view fail in
the database: give it a `default`. A view that names what doesn't exist,
a `readExp` that doesn't compile or an invalid `type` is a `SchemaError` when the schema loads.

## Personal data (PII)

A property of the domain says what kind of personal data it is, and a view masks, hashes or excludes **all of them**
without naming them:

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

| `pii` of the property | Mask of `pii: mask` |
| --- | --- |
| `email` | `maskEmail` |
| `phone`, `card`, `id` | `maskLeft(x, 4)` |
| `name` | `maskRight(x, 1)` |
| another one | `mask` |

What the view says of a property wins over its `pii`; the keys stay. The view `default` sees the personal data as it
is.

## Mask functions

They are functions of the query language, translated to each engine with the result they give in memory:

| Function | Result |
| --- | --- |
| `mask(x)` | A quarter of each side visible (3 at most), the rest `*`; less than 4 characters, all `*` |
| `maskLeft(x, n)` / `maskRight(x, n)` | All but the last / the first `n` |
| `maskEmail(x)` | The first character of the user and the domain: `f*****@x.com` |
| `hash(x, key?)` | SHA-256 in hexadecimal; with a key, HMAC-SHA256. Without a key it is translated on PostgreSQL, MySQL, MariaDB, SQL Server and Oracle; with a key, only on PostgreSQL (`pgcrypto`). On MongoDB and SQLite it is an error when the query is compiled |

## The whole API

`orm.metadata`, `model`, `parameters`, `constraints` and `plan` take `options.view`; `orm.state.getSchemaDomain(view)`
gives the domain of the view; a transaction, its scripts and listeners inherit its view; a repository takes one
(`new CustomersRepository(stage, orm, view)`), and `lambdaorm build --view` generates the model and repositories of a
view.

## What a view does not restrict

- **Who chooses the view:** in the library, whoever calls it (it can ask for `default`); in the Data Gateway, the
  gateway, from the credential or the claims.
- **The actions:** a view is not read only; `insert`, `update` and `delete` on its entities are allowed. They are
  limited by the permissions of the gateway or by the application.
- **The stage commands** (`push`, `pull`, `import`, `export`, `drop`, `truncate`) work on the whole schema: they are
  administration, not for whoever uses a view.
- **The rows:** a view sees all of them unless its [filter](Context.md) limits them with the context.
