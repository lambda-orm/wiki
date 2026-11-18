# Repositorios {#repositories}

Un repositorio está asociado a una entidad y tiene métodos para consultarla y modificarla, sin escribir la consulta completa.

## Generar los repositorios {#generating-repositories}

El comando [`lambdaorm build`](../cli/Commands/Build.md) genera el modelo (`model.ts`) y un repositorio por
entidad (`repository<Entity>.ts`) en la ruta del dominio del proyecto:

```sh
lambdaorm build -w lab/northwind -r
```

Un archivo de repositorio solo se genera si todavía no existe, por lo que se le pueden añadir métodos propios sin riesgo.

```typescript
import { Repository, IOrm } from '@lambdaorm/lib'
import { Product, QryProduct } from './model'

export class ProductRepository extends Repository<Product, QryProduct> {
  constructor (stage?: string, orm?: IOrm) {
    super('Products', stage, orm)
  }
  // Add your code here
}
```

El constructor recibe el stage (opcional: si se omite, se usa el stage por defecto) y, opcionalmente, la instancia de `orm`.

## Ejemplo {#example}

```typescript
import { orm } from '@lambdaorm/lib'
import { ProductRepository } from './northwind/domain/repositoryProduct'

(async () => {
  await orm.init()
  const productRepository = new ProductRepository('default')
  const country = 'USA'
  const result = await productRepository.query()
    .filter(p => (p.price > 5 && p.supplier.country == country) || (p.inStock < 3))
    .having(p => max(p.price) > 50)
    .map(p => ({ category: p.category.name, largestPrice: max(p.price) }))
    .sort(p => desc(p.largestPrice))
    .execute({ country })
  console.log(JSON.stringify(result, null, 2))
  await orm.end()
})()
```

## Métodos {#methods}

| Método | Descripción |
| :-- | :-- |
| `insert(entity, include?)` | Inserta un registro (y, con `include`, sus registros relacionados). |
| `bulkInsert(entities, include?)` | Inserta varios registros. |
| `update(entity, include?)` | Actualiza un registro. |
| `updateAll(data, map, filter?, include?)` | Actualiza todos los registros que cumplen el filtro (o todos los registros de la entidad). |
| `upsert(entity, include?)` | Inserta un registro, o lo actualiza si ya existe uno con la misma clave primaria ([upsert](../queries/Insert.md#upsert)). |
| `bulkMerge(entities, include?)` | Inserta o actualiza varios registros. |
| `delete(entity, include?)` | Elimina un registro. |
| `bulkDelete(entities, include?)` | Elimina varios registros. |
| `deleteAll(data, filter?, include?)` | Elimina todos los registros que cumplen el filtro (o todos los registros de la entidad). |
| `list(data, filter?, include?)` | Devuelve los registros que cumplen el filtro. |
| `distinct(data, filter?, include?)` | Devuelve los registros distintos que cumplen el filtro. |
| `first(data, filter?, include?)` | Devuelve el primer registro, o `null`. |
| `last(data, filter?, include?)` | Devuelve el último registro, o `null`. |
| `query()` | Inicia una consulta personalizada sobre la entidad (`filter`, `include`, `having`, `map`, `sort`, `page`, …), que se ejecuta con `execute(data)`. |
| `execute(query, data?)` | Ejecuta una cadena de consulta añadida a la entidad, por ejemplo `.filter(p => p.id == id)`. |

`data` contiene los valores de los parámetros que usan `filter` y `map`.
