[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / AcquireConnection

# Class: AcquireConnection

Defined in: [packages/lib/src/lib/connection/application/useCases/acquire.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/useCases/acquire.ts#L4)

## Constructors

### Constructor

> **new AcquireConnection**(`poolService`): `AcquireConnection`

Defined in: [packages/lib/src/lib/connection/application/useCases/acquire.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/useCases/acquire.ts#L6)

#### Parameters

##### poolService

[`ConnectionPoolService`](ConnectionPoolService.md)

#### Returns

`AcquireConnection`

## Methods

### acquire()

> **acquire**(`name`): `Promise`\<[`Connection`](../interfaces/Connection.md)\>

Defined in: [packages/lib/src/lib/connection/application/useCases/acquire.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/useCases/acquire.ts#L8)

#### Parameters

##### name

`string`

#### Returns

`Promise`\<[`Connection`](../interfaces/Connection.md)\>
