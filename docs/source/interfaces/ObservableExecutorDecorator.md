[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ObservableExecutorDecorator

# Interface: ObservableExecutorDecorator

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:58](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L58)

## Extends

- [`Executor`](Executor.md).[`ObservableExecutor`](ObservableExecutor.md)

## Methods

### currentTransaction()?

> `optional` **currentTransaction**(): [`Transaction`](../classes/Transaction.md) \| `undefined`

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:50](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L50)

The transaction this code runs in (orm.transaction, orm.executeScript), or undefined outside one.

#### Returns

[`Transaction`](../classes/Transaction.md) \| `undefined`

#### Inherited from

[`Executor`](Executor.md).[`currentTransaction`](Executor.md#currenttransaction)

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

#### Inherited from

[`Executor`](Executor.md).[`execute`](Executor.md#execute)

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

#### Inherited from

[`Executor`](Executor.md).[`executeList`](Executor.md#executelist)

***

### subscribe()

> **subscribe**(`observer`): `void`

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:54](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L54)

#### Parameters

##### observer

[`ActionObserver`](../classes/ActionObserver.md)

#### Returns

`void`

#### Inherited from

[`ObservableExecutor`](ObservableExecutor.md).[`subscribe`](ObservableExecutor.md#subscribe)

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

#### Inherited from

[`Executor`](Executor.md).[`transaction`](Executor.md#transaction)

***

### unsubscribe()

> **unsubscribe**(`observer`): `void`

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:55](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L55)

#### Parameters

##### observer

[`ActionObserver`](../classes/ActionObserver.md)

#### Returns

`void`

#### Inherited from

[`ObservableExecutor`](ObservableExecutor.md).[`unsubscribe`](ObservableExecutor.md#unsubscribe)
