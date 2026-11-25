# Vistas {#views}

Una **vista** es una forma de ver el dominio: el mismo esquema, las mismas fuentes y stages, con solo algunas
entidades, solo algunas propiedades, propiedades nuevas calculadas por una expresión y propiedades leídas a través de
una máscara. Una expresión con `options.view` se compila contra **el dominio de su vista**, como si fuera el único. La
base de datos no cambia.

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

## La vista `default` {#the-view-default}

`default` **es el dominio**: la vista de una consulta sin `options.view`. Siempre está (λORM la añade cuando el esquema
no la escribe) y no puede cambiar entidades.

## Entidades y propiedades {#entities-and-properties}

| En la vista | Efecto |
| --- | --- |
| Una entidad con `exclude: true` | No existe: cualquier sentencia sobre ella, un `include` de ella o una relación hacia ella es un `ViewError` |
| Una propiedad con `exclude: true` | Fuera de "todos los campos"; nombrarla es el error de una propiedad que no existe |
| Una propiedad con `exclude: true` y `default` | Oculta, y cada insert en la vista la escribe con ese valor (o el default del dominio), traigan lo que traigan los datos |
| Una propiedad del dominio con `readExp` | **Enmascarada**: se lee a través de la expresión, también en filtros y ordenamientos ("lo que se ve es lo que se filtra"); se escribe con su valor real |
| Una propiedad nueva con `readExp` (y `type`) | Calculada en la fuente; solo lectura |

La clave primaria y las claves de las relaciones que la vista conserva no se pueden excluir. Una vista que nombra lo que
no existe, un `readExp` que no compila o un `type` inválido es un `SchemaError` al cargar el esquema.

## Datos personales (PII) {#personal-data-pii}

Una propiedad del dominio dice qué tipo de dato personal es, y una vista enmascara, hashea o excluye **todos ellos** sin
nombrarlos:

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

Lo que la vista dice de una propiedad gana sobre su `pii`; las claves se mantienen.

## Funciones de máscara {#mask-functions}

Son funciones del lenguaje de consultas, traducidas a cada motor con el mismo resultado que dan en memoria:

| Función | Resultado |
| --- | --- |
| `mask(x)` | Un cuarto de cada lado visible (3 como máximo), el resto `*`; con menos de 4 caracteres, todo `*` |
| `maskLeft(x, n)` / `maskRight(x, n)` | Todo menos los últimos / los primeros `n` |
| `maskEmail(x)` | El primer carácter del usuario y el dominio: `f*****@x.com` |
| `hash(x, key?)` | SHA-256 en hexadecimal; con una clave, HMAC-SHA256 (PostgreSQL con `pgcrypto`). No en MongoDB |

## Toda la API {#the-whole-api}

`orm.metadata`, `model`, `parameters`, `constraints` y `plan` aceptan `options.view`; `orm.state.getSchemaDomain(view)`
da el dominio de la vista; una transacción, sus scripts y listeners heredan su vista; un repositorio acepta una
(`new CustomersRepository(stage, orm, view)`), y `lambdaorm build --view` genera el modelo y los repositorios de una
vista.

Las filas que ve una vista las limita su [filtro](Context.md). Quien elige la vista decide lo que se ve: en el Data
Gateway, el gateway.
