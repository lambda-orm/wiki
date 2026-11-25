# Repositórios {#repositories}

Um repositório está associado a uma entidade e tem métodos para consultá-la e modificá-la, sem escrever a consulta inteira.

## Gerar repositórios {#generating-repositories}

O comando [`lambdaorm build`](../cli/Commands/Build.md) gera o modelo (`model.ts`) e um repositório por
entidade (`repository<Entity>.ts`) no caminho do domínio do projeto:

```sh
lambdaorm build -w lab/northwind -r
```

Um arquivo de repositório só é gerado se ainda não existir, então é seguro adicionar métodos personalizados a ele.

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

O construtor recebe o stage (opcional: quando omitido, é usado o stage padrão) e, opcionalmente, a instância `orm` e a
[view](../schema/Views.md) que suas consultas usam. Com `lambdaorm build --view <nome>`, a view é o valor padrão do
construtor gerado.

## Exemplo {#example}

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

| Método | Descrição |
| :-- | :-- |
| `insert(entity, include?)` | Insere um registro (e, com `include`, seus registros relacionados). |
| `bulkInsert(entities, include?)` | Insere vários registros. |
| `update(entity, include?)` | Atualiza um registro. |
| `updateAll(data, map, filter?, include?)` | Atualiza todos os registros que atendem ao filtro (ou todos os registros da entidade). |
| `upsert(entity, include?)` | Insere um registro, ou o atualiza se já existir um com a mesma chave primária ([upsert](../queries/Insert.md#upsert)). |
| `bulkMerge(entities, include?)` | Insere ou atualiza vários registros. |
| `delete(entity, include?)` | Exclui um registro. |
| `bulkDelete(entities, include?)` | Exclui vários registros. |
| `deleteAll(data, filter?, include?)` | Exclui todos os registros que atendem ao filtro (ou todos os registros da entidade). |
| `list(data, filter?, include?)` | Retorna os registros que atendem ao filtro. |
| `distinct(data, filter?, include?)` | Retorna os registros distintos que atendem ao filtro. |
| `first(data, filter?, include?)` | Retorna o primeiro registro, ou `null`. |
| `last(data, filter?, include?)` | Retorna o último registro, ou `null`. |
| `query()` | Inicia uma consulta personalizada sobre a entidade (`filter`, `include`, `having`, `map`, `sort`, `page`, …), executada com `execute(data)`. |
| `execute(query, data?)` | Executa uma string de consulta anexada à entidade, por exemplo `.filter(p => p.id == id)`. |

`data` contém os valores dos parâmetros usados por `filter` e `map`.
