# Contexto y filtros de filas {#context-and-row-filters}

El **contexto** es quién ejecuta una expresión: usuario, tenant, región, roles, claims. Lo da la aplicación (o el Data
Gateway, a partir de la identidad de quien llama), y las expresiones del esquema lo leen como `context`. Úsalo cuando el
mismo proceso sirve a varios usuarios, tenants o regiones y las reglas del esquema (qué filas ve cada uno, qué escribe
un insert) dependen de quién llama.

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1', roles: ['seller'] } })
```

- Los datos de una consulta **no pueden reemplazarlo**: una clave `context` en los datos no es el contexto.
- Viaja como un **parámetro**: una sentencia compilada sirve a todos los que llaman, y la caché no guarda los valores de
  nadie.
- Una transacción, sus scripts y listeners lo heredan, igual que heredan la vista y el stage.
- `actor` queda aparte: es lo que registra la observabilidad; `context` es con lo que deciden las reglas.

## Dónde se lee {#where-it-is-read}

| Expresión | Lee el contexto |
| --- | --- |
| `filter` de una vista y de un mapping | sí; un valor que falta es un error |
| `default` de una propiedad que una vista oculta | sí |
| `default`, `writeValue` y `constraints` del dominio | sí; un valor que falta es `null` |
| `readExp` (dominio y vista) | sí, como parámetro |
| condiciones de los listeners (`context`) | sí |
| headers `forward` de una [fuente Http](HttpSource.md) | sí |
| condiciones de las fuentes de un stage | **no**: deciden la ruta al compilar la consulta, y la ruta se guarda en caché |

`context` es un nombre reservado en las expresiones del esquema (`context.region`, `context.roles.includes("admin")`).

## El filtro de las filas de una vista {#the-filter-of-the-rows-of-a-view}

```yaml
views:
  - name: seller
    entities:
      - name: Orders
        filter: 'regionId == context.region'                               # its rows
        properties:
          - { name: tenantId, exclude: true, default: 'context.tenant' }   # an insert writes its tenant
```

- Se añade a cada select, update y delete sobre la entidad, a los joins por una relación y a los includes, y al filtro
  del mapping cuando hay ambos.
- Usa las propiedades del dominio, también las que la vista oculta (`tenantId` arriba).
- **Una escritura no puede salir de él**: un insert, o un update que cambia una propiedad del filtro, fuera de él es un
  `ViewError` (como `WITH CHECK` en PostgreSQL). Para que un insert lo cumpla sin que quien llama lo sepa, oculta la
  propiedad con un `default` tomado del contexto, como `tenantId` arriba.
- Un valor del contexto que un filtro necesita y que la ejecución no trae es un `ContextError`
  (`context.region is required by the view seller`), no cero filas en silencio.
- Se valida al cargar el esquema: debe compilar y usar solo propiedades de la entidad y `context`.

La vista `default` es el dominio y no tiene filtro. El `filter` de un mapping (`mappings[].entities[].filter`) funciona
igual, para todas las vistas, y también puede leer `context`:

```yaml
mappings:
  - name: keycloak
    entities:
      - name: Users
        mapping: user_entity
        filter: 'realmId == context.realm'
```

## Seguridad {#security}

Como la vista, el contexto lo elige quien llama a la librería; λORM garantiza que una consulta no puede cambiarlo ni
saltárselo. En el [Data Gateway](../data-gateway/index.md), el gateway lo construye a partir de la identidad de quien
llama y descarta cualquier `context` que envíe un cliente: allí es una frontera de seguridad. Ver [Vistas](Views.md).
