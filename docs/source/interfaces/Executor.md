[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / Executor

# Interface: Executor

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:45](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L45)

## Extended by

- [`ObservableExecutorDecorator`](ObservableExecutorDecorator.md)

## Methods

### currentTransaction()?

> `optional` **currentTransaction**(): [`Transaction`](../classes/Transaction.md) \| `undefined`

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:50](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L50)

The transaction this code runs in (orm.transaction, orm.executeScript), or undefined outside one.

#### Returns

[`Transaction`](../classes/Transaction.md) \| `undefined`

***

### execute()

> **execute**(`query`, `data`, `options`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:46](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L46)

#### Parameters

##### query

[`Query`](../classes/Query.md)

##### data

`any`

##### options

[`QueryOptions`](QueryOptions.md)

#### Returns

`Promise`\<`any`\>

***

### executeList()

> **executeList**(`queries`, `options`): `Promise`\<[`ExecuteResult`](ExecuteResult.md)[]\>

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:47](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L47)

#### Parameters

##### queries

[`Query`](../classes/Query.md)[]

##### options

[`QueryOptions`](QueryOptions.md)

#### Returns

`Promise`\<[`ExecuteResult`](ExecuteResult.md)[]\>

***

### transaction()

> **transaction**(`options`, `callback`): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:48](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L48)

#### Parameters

##### options

[`QueryOptions`](QueryOptions.md)

##### callback

(`tr`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>
