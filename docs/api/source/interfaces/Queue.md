[**λORM service**](../README.md)

***

[λORM service](../README.md) / Queue

# Interface: Queue

Defined in: [service/src/lib/application/ports/queue.ts:3](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/queue.ts#L3)

## Methods

### execute()

> **execute**(`args`): `string`

Defined in: [service/src/lib/application/ports/queue.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/queue.ts#L6)

#### Parameters

##### args

[`QueueExecuteArgs`](QueueExecuteArgs.md)

#### Returns

`string`

***

### executeInBackground()

> **executeInBackground**(`queueId`, `args`): `Promise`\<`void`\>

Defined in: [service/src/lib/application/ports/queue.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/queue.ts#L7)

#### Parameters

##### queueId

`string`

##### args

[`QueueExecuteArgs`](QueueExecuteArgs.md)

#### Returns

`Promise`\<`void`\>

***

### send()

> **send**(`topic`, `messages`): `Promise`\<`void`\>

Defined in: [service/src/lib/application/ports/queue.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/queue.ts#L8)

#### Parameters

##### topic

`string`

##### messages

`any`[]

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(`queuedInfo`): `Promise`\<`void`\>

Defined in: [service/src/lib/application/ports/queue.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/queue.ts#L4)

#### Parameters

##### queuedInfo

[`QueuedInfo`](QueuedInfo.md)

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [service/src/lib/application/ports/queue.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/queue.ts#L5)

#### Returns

`Promise`\<`void`\>
