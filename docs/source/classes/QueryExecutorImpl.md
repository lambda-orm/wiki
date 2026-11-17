[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / QueryExecutorImpl

# Class: QueryExecutorImpl

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:21](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L21)

## Implements

- [`QueryExecutor`](../interfaces/QueryExecutor.md)
- [`QueryInternalExecutor`](../interfaces/QueryInternalExecutor.md)

## Constructors

### Constructor

> **new QueryExecutorImpl**(`connectionFacade`, `languages`, `schemaState`, `expressions`, `_options`, `helper`, `transactional?`, `connections?`): `QueryExecutorImpl`

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:33](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L33)

#### Parameters

##### connectionFacade

[`ConnectionFacade`](ConnectionFacade.md)

##### languages

[`LanguagesService`](LanguagesService.md)

##### schemaState

[`SchemaState`](SchemaState.md)

##### expressions

`Expressions`

##### \_options

[`QueryOptions`](../interfaces/QueryOptions.md)

##### helper

[`OrmH3lp`](OrmH3lp.md)

##### transactional?

`boolean` = `false`

##### connections?

`SourceConnections`

#### Returns

`QueryExecutorImpl`

## Accessors

### options

#### Get Signature

> **get** **options**(): [`QueryOptions`](../interfaces/QueryOptions.md)

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:56](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L56)

##### Returns

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Implementation of

[`QueryExecutor`](../interfaces/QueryExecutor.md).[`options`](../interfaces/QueryExecutor.md#options)

## Methods

### \_execute()

> **\_execute**(`query`, `data`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:105](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L105)

#### Parameters

##### query

[`Query`](Query.md)

##### data

[`Data`](Data.md)

#### Returns

`Promise`\<`any`\>

#### Implementation of

[`QueryInternalExecutor`](../interfaces/QueryInternalExecutor.md).[`_execute`](../interfaces/QueryInternalExecutor.md#_execute)

***

### commit()

> **commit**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:60](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L60)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`QueryExecutor`](../interfaces/QueryExecutor.md).[`commit`](../interfaces/QueryExecutor.md#commit)

***

### execute()

> **execute**(`query`, `data`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:72](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L72)

#### Parameters

##### query

[`Query`](Query.md)

##### data

`any`

#### Returns

`Promise`\<`any`\>

#### Implementation of

[`QueryExecutor`](../interfaces/QueryExecutor.md).[`execute`](../interfaces/QueryExecutor.md#execute)

***

### release()

> **release**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:68](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L68)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`QueryExecutor`](../interfaces/QueryExecutor.md).[`release`](../interfaces/QueryExecutor.md#release)

***

### rollback()

> **rollback**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts:64](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/application/services/queryExecutor/queryExecutor.ts#L64)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`QueryExecutor`](../interfaces/QueryExecutor.md).[`rollback`](../interfaces/QueryExecutor.md#rollback)
