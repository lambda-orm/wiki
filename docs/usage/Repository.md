# Repositories

A repository is associated with an entity and has methods to query and modify it, without writing the whole query.

## Generating repositories

The [`lambdaorm build`](../cli/Commands/Build.md) command generates the model (`model.ts`) and one repository per
entity (`repository<Entity>.ts`) in the domain path of the project:

```sh
lambdaorm build -w lab/northwind -r
```

A repository file is generated only if it does not exist yet, so it is safe to add custom methods to it.

```typescript
import { Repository, IOrm } from '@lambdaorm/lib'
import { Product, QryProduct } from './model'

export class ProductRepository extends Repository<Product, QryProduct> {
  constructor (stage?: string, orm?: IOrm, view?: string) {
    super('Products', stage, orm, view)
  }
  // Add your code here
}
```

The constructor receives the stage (optional: the default stage when omitted) and, optionally, the `orm` instance and
the [view](../schema/Views.md) its queries use. With `lambdaorm build --view <name>`, the view is the default of the
generated constructor.

## Example

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

## Methods

| Method | Description |
| :-- | :-- |
| `insert(entity, include?)` | Inserts a record (and, with `include`, its related records). |
| `bulkInsert(entities, include?)` | Inserts several records. |
| `update(entity, include?)` | Updates a record. |
| `updateAll(data, map, filter?, include?)` | Updates all the records that match the filter (or all the records of the entity). |
| `upsert(entity, include?)` | Inserts a record, or updates it if one with the same primary key exists ([upsert](../queries/Insert.md#upsert)). |
| `bulkMerge(entities, include?)` | Inserts or updates several records. |
| `delete(entity, include?)` | Deletes a record. |
| `bulkDelete(entities, include?)` | Deletes several records. |
| `deleteAll(data, filter?, include?)` | Deletes all the records that match the filter (or all the records of the entity). |
| `list(data, filter?, include?)` | Returns the records that match the filter. |
| `distinct(data, filter?, include?)` | Returns the distinct records that match the filter. |
| `first(data, filter?, include?)` | Returns the first record, or `null`. |
| `last(data, filter?, include?)` | Returns the last record, or `null`. |
| `query()` | Starts a custom query on the entity (`filter`, `include`, `having`, `map`, `sort`, `page`, …), run with `execute(data)`. |
| `execute(query, data?)` | Runs a query string appended to the entity, for example `.filter(p => p.id == id)`. |

`data` holds the values of the parameters used by `filter` and `map`.
