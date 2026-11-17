[**λORM service**](../README.md)

***

[λORM service](../README.md) / GeneralController

# Class: GeneralController

Defined in: [service/src/lib/infrastructure/controllers/generalController.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/generalController.ts#L5)

## Extends

- `Controller`

## Constructors

### Constructor

> **new GeneralController**(`service`, `metric`): `GeneralController`

Defined in: [service/src/lib/infrastructure/controllers/generalController.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/generalController.ts#L6)

#### Parameters

##### service

[`GeneralService`](GeneralService.md)

##### metric

[`Metric`](../interfaces/Metric.md)

#### Returns

`GeneralController`

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

### health()

> **health**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/generalController.ts:14](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/generalController.ts#L14)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### metrics()

> **metrics**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/generalController.ts:22](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/generalController.ts#L22)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### ping()

> **ping**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/generalController.ts:18](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/generalController.ts#L18)

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

***

### version()

> **version**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/generalController.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/generalController.ts#L10)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>
