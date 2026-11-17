[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / QueryExecutor

# Interface: QueryExecutor

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:37](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L37)

## Accessors

### options

#### Get Signature

> **get** **options**(): [`QueryOptions`](QueryOptions.md)

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:38](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L38)

##### Returns

[`QueryOptions`](QueryOptions.md)

## Methods

### commit()

> **commit**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:39](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L39)

#### Returns

`Promise`\<`void`\>

***

### execute()

> **execute**(`query`, `data`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:42](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L42)

#### Parameters

##### query

[`Query`](../classes/Query.md)

##### data

`any`

#### Returns

`Promise`\<`any`\>

***

### release()

> **release**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:41](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L41)

#### Returns

`Promise`\<`void`\>

***

### rollback()

> **rollback**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:40](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L40)

#### Returns

`Promise`\<`void`\>
