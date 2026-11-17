[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / QueryTransaction

# Class: QueryTransaction

Defined in: [packages/lib/src/lib/expressions/application/useCases/transaction.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/useCases/transaction.ts#L10)

## Constructors

### Constructor

> **new QueryTransaction**(`transaction`, `builder`, `expressions`): `QueryTransaction`

Defined in: [packages/lib/src/lib/expressions/application/useCases/transaction.ts:12](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/useCases/transaction.ts#L12)

#### Parameters

##### transaction

[`Transaction`](Transaction.md)

##### builder

[`IQueryBuilder`](../interfaces/IQueryBuilder.md)

##### expressions

`Expressions`

#### Returns

`QueryTransaction`

## Methods

### execute()

On the transaction's stage, or on another one with `options.stage` (same transaction).

#### Call Signature

> **execute**(`query`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/expressions/application/useCases/transaction.ts:16](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/useCases/transaction.ts#L16)

##### Parameters

###### query

`Function`

###### data?

`any`

###### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

##### Returns

`Promise`\<`any`\>

#### Call Signature

> **execute**(`query`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/expressions/application/useCases/transaction.ts:17](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/useCases/transaction.ts#L17)

##### Parameters

###### query

`string`

###### data?

`any`

###### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

##### Returns

`Promise`\<`any`\>

***

### executeQuery()

> **executeQuery**(`query`, `data?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/expressions/application/useCases/transaction.ts:28](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/useCases/transaction.ts#L28)

#### Parameters

##### query

[`Query`](Query.md)

##### data?

`any` = `{}`

#### Returns

`Promise`\<`any`\>
