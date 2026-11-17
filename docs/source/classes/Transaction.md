[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / Transaction

# Class: Transaction

Defined in: [packages/lib/src/lib/execution/domain/transaction.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/transaction.ts#L5)

## Constructors

### Constructor

> **new Transaction**(`queryExecutor`, `ofStage?`): `Transaction`

Defined in: [packages/lib/src/lib/execution/domain/transaction.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/transaction.ts#L11)

#### Parameters

##### queryExecutor

[`QueryExecutor`](../interfaces/QueryExecutor.md)

the executor of the transaction's stage

##### ofStage?

(`options`) => [`QueryExecutor`](../interfaces/QueryExecutor.md)

the executor of another stage, on the same connections (a transaction can span stages)

#### Returns

`Transaction`

## Accessors

### options

#### Get Signature

> **get** **options**(): [`QueryOptions`](../interfaces/QueryOptions.md)

Defined in: [packages/lib/src/lib/execution/domain/transaction.ts:27](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/transaction.ts#L27)

##### Returns

[`QueryOptions`](../interfaces/QueryOptions.md)

## Methods

### close()

> **close**(): `void`

Defined in: [packages/lib/src/lib/execution/domain/transaction.ts:23](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/transaction.ts#L23)

After the commit or the rollback: any later execution fails.

#### Returns

`void`

***

### execute()

> **execute**(`query`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/execution/domain/transaction.ts:16](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/transaction.ts#L16)

Executes on the transaction's stage, or on the stage of `options` when it is another one.

#### Parameters

##### query

[`Query`](Query.md)

##### data?

`any` = `{}`

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`Promise`\<`any`\>
