[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ReleaseConnection

# Class: ReleaseConnection

Defined in: [packages/lib/src/lib/connection/application/useCases/release.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/useCases/release.ts#L4)

## Constructors

### Constructor

> **new ReleaseConnection**(`poolService`): `ReleaseConnection`

Defined in: [packages/lib/src/lib/connection/application/useCases/release.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/useCases/release.ts#L6)

#### Parameters

##### poolService

[`ConnectionPoolService`](ConnectionPoolService.md)

#### Returns

`ReleaseConnection`

## Methods

### release()

> **release**(`connection`): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/connection/application/useCases/release.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/useCases/release.ts#L8)

#### Parameters

##### connection

[`Connection`](../interfaces/Connection.md)

#### Returns

`Promise`\<`void`\>
