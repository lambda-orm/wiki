# Contexto y filtros de filas {#context-and-row-filters}

El **contexto** es quién ejecuta una expresión: usuario, tenant, región, roles, claims. Lo da la aplicación (o el Data
Gateway, a partir de la identidad de quien llama), y las expresiones del esquema lo leen como `context`:

```ts
await orm.execute('Orders', {}, { view: 'seller', context: { region: 'north', tenant: 't1' } })
```

- Los datos de una consulta **no pueden reemplazarlo**: una clave `context` en los datos no es el contexto.
- Viaja como un **parámetro**: una sentencia compilada sirve a todos los que llaman.
- Una transacción, sus scripts y listeners lo heredan. `actor` queda aparte: es lo que registra la observabilidad.

Se lee en los filtros de las vistas y los mappings, `default`, `writeValue`, `constraints`, `readExp` y las condiciones
de los listeners (`args.context`); no en las condiciones de las fuentes de un stage.

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

- Se añade a cada select, update y delete sobre la entidad, a los joins por una relación y a los includes.
- **Una escritura no puede salir de él**: un insert, o un update que cambia una propiedad del filtro, fuera de él es un
  `ViewError` (como `WITH CHECK`).
- Un valor del contexto que un filtro necesita y que la ejecución no trae es un `ContextError`, no cero filas en
  silencio.

El `filter` de un mapping (`mappings[].entities[].filter`) funciona igual, para todas las vistas, y también puede leer
`context`.
