[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ConnectionPoolService

# Class: ConnectionPoolService

Defined in: [packages/lib/src/lib/connection/application/services/connectionPoolService.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/services/connectionPoolService.ts#L4)

## Constructors

### Constructor

> **new ConnectionPoolService**(`dialectPoolService`): `ConnectionPoolService`

Defined in: [packages/lib/src/lib/connection/application/services/connectionPoolService.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/services/connectionPoolService.ts#L7)

#### Parameters

##### dialectPoolService

[`DialectPoolService`](DialectPoolService.md)

#### Returns

`ConnectionPoolService`

## Methods

### end()

> **end**(`name`): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/connection/application/services/connectionPoolService.ts:21](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/services/connectionPoolService.ts#L21)

#### Parameters

##### name

`string`

#### Returns

`Promise`\<`void`\>

***

### endAll()

> **endAll**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/connection/application/services/connectionPoolService.ts:28](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/services/connectionPoolService.ts#L28)

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`name`): [`ConnectionPool`](../interfaces/ConnectionPool.md)

Defined in: [packages/lib/src/lib/connection/application/services/connectionPoolService.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/services/connectionPoolService.ts#L13)

#### Parameters

##### name

`string`

#### Returns

[`ConnectionPool`](../interfaces/ConnectionPool.md)

***

### load()

> **load**(`config`): `void`

Defined in: [packages/lib/src/lib/connection/application/services/connectionPoolService.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/connection/application/services/connectionPoolService.ts#L9)

#### Parameters

##### config

[`ConnectionConfig`](../interfaces/ConnectionConfig.md)

#### Returns

`void`
