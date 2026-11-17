[**λORM service**](../README.md)

***

[λORM service](../README.md) / StageController

# Class: StageController

Defined in: [service/src/lib/infrastructure/controllers/stageController.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/stageController.ts#L5)

## Extends

- `Controller`

## Constructors

### Constructor

> **new StageController**(`service`): `StageController`

Defined in: [service/src/lib/infrastructure/controllers/stageController.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/stageController.ts#L6)

#### Parameters

##### service

[`StageService`](StageService.md)

#### Returns

`StageController`

#### Overrides

`Controller.constructor`

## Methods

### collectRequestParams()

> `protected` **collectRequestParams**(`request`): `any`

Defined in: [service/src/lib/infrastructure/controllers/Controller.ts:64](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/Controller.ts#L64)

#### Parameters

##### request

`Request`

#### Returns

`any`

#### Inherited from

`Controller.collectRequestParams`

***

### exists()

> **exists**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/stageController.ts:14](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/stageController.ts#L14)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### export()

> **export**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/stageController.ts:18](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/stageController.ts#L18)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### handleRequest()

> `protected` **handleRequest**(`request`, `response`, `serviceOperation`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/Controller.ts:87](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/Controller.ts#L87)

#### Parameters

##### request

`any`

##### response

`any`

##### serviceOperation

`any`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Controller.handleRequest`

***

### import()

> **import**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/stageController.ts:22](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/stageController.ts#L22)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### list()

> **list**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/stageController.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/stageController.ts#L10)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### sendError()

> `protected` **sendError**(`response`, `error`): `void`

Defined in: [service/src/lib/infrastructure/controllers/Controller.ts:38](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/Controller.ts#L38)

#### Parameters

##### response

`any`

##### error

`any`

#### Returns

`void`

#### Inherited from

`Controller.sendError`

***

### sendResponse()

> `protected` **sendResponse**(`response`, `payload?`): `void`

Defined in: [service/src/lib/infrastructure/controllers/Controller.ts:28](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/Controller.ts#L28)

#### Parameters

##### response

`any`

##### payload?

`any`

#### Returns

`void`

#### Inherited from

`Controller.sendResponse`

***

### toHttpError()

> `protected` **toHttpError**(`error`): `HttpError`

Defined in: [service/src/lib/infrastructure/controllers/Controller.ts:43](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/Controller.ts#L43)

#### Parameters

##### error

`any`

#### Returns

`HttpError`

#### Inherited from

`Controller.toHttpError`
