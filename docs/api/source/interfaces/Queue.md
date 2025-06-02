[**orm-service**](../README.md)

***

[orm-service](../globals.md) / Queue

# Interface: Queue

Defined in: [src/application/ports/queue.ts:3](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/queue.ts#L3)

## Methods

### execute()

> **execute**(`args`): `string`

Defined in: [src/application/ports/queue.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/queue.ts#L6)

#### Parameters

##### args

[`QueueExecuteArgs`](QueueExecuteArgs.md)

#### Returns

`string`

***

### executeInBackground()

> **executeInBackground**(`queueId`, `args`): `Promise`\<`void`\>

Defined in: [src/application/ports/queue.ts:7](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/queue.ts#L7)

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

Defined in: [src/application/ports/queue.ts:8](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/queue.ts#L8)

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

Defined in: [src/application/ports/queue.ts:4](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/queue.ts#L4)

#### Parameters

##### queuedInfo

[`QueuedInfo`](QueuedInfo.md)

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [src/application/ports/queue.ts:5](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/queue.ts#L5)

#### Returns

`Promise`\<`void`\>
