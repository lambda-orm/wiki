[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ExecutorImpl

# Class: ExecutorImpl

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L13)

## Implements

- [`Executor`](../interfaces/Executor.md)
- [`ObservableExecutor`](../interfaces/ObservableExecutor.md)

## Constructors

### Constructor

> **new ExecutorImpl**(`connectionFacade`, `languages`, `schemaState`, `expressions`, `helper`): `ExecutorImpl`

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:22](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L22)

#### Parameters

##### connectionFacade

[`ConnectionFacade`](ConnectionFacade.md)

##### languages

[`LanguagesService`](LanguagesService.md)

##### schemaState

[`SchemaState`](SchemaState.md)

##### expressions

`Expressions`

##### helper

[`OrmH3lp`](OrmH3lp.md)

#### Returns

`ExecutorImpl`

## Methods

### currentTransaction()

> **currentTransaction**(): [`Transaction`](Transaction.md) \| `undefined`

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:44](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L44)

The transaction this code runs in, or undefined outside a transaction.

#### Returns

[`Transaction`](Transaction.md) \| `undefined`

#### Implementation of

[`Executor`](../interfaces/Executor.md).[`currentTransaction`](../interfaces/Executor.md#currenttransaction)

***

### execute()

> **execute**(`query`, `data`, `options`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:48](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L48)

#### Parameters

##### query

[`Query`](Query.md)

##### data

`any`

##### options

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`Promise`\<`any`\>

#### Implementation of

[`Executor`](../interfaces/Executor.md).[`execute`](../interfaces/Executor.md#execute)

***

### executeList()

> **executeList**(`queries`, `options`): `Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:69](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L69)

#### Parameters

##### queries

[`Query`](Query.md)[]

##### options

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

#### Implementation of

[`Executor`](../interfaces/Executor.md).[`executeList`](../interfaces/Executor.md#executelist)

***

### subscribe()

> **subscribe**(`observer`): `void`

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:31](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L31)

#### Parameters

##### observer

[`ActionObserver`](ActionObserver.md)

#### Returns

`void`

#### Implementation of

[`ObservableExecutor`](../interfaces/ObservableExecutor.md).[`subscribe`](../interfaces/ObservableExecutor.md#subscribe)

***

### transaction()

> **transaction**(`options`, `callback`): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:110](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L110)

Create a transaction: commit when the callback ends, rollback (and rethrow its error) when it fails.
Inside a transaction in course, the callback joins it: the outer transaction commits or rolls back.
A transaction can run on several stages (an execution with another stage joins it too); all of them share the
connections, one per source, and commit or roll back together.

#### Parameters

##### options

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

##### callback

(`tr`) => `Promise`\<`void`\>

Code to be executed in transaction

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Executor`](../interfaces/Executor.md).[`transaction`](../interfaces/Executor.md#transaction)

***

### unsubscribe()

> **unsubscribe**(`observer`): `void`

Defined in: [packages/lib/src/lib/execution/application/services/executor.ts:35](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/executor.ts#L35)

#### Parameters

##### observer

[`ActionObserver`](ActionObserver.md)

#### Returns

`void`

#### Implementation of

[`ObservableExecutor`](../interfaces/ObservableExecutor.md).[`unsubscribe`](../interfaces/ObservableExecutor.md#unsubscribe)
