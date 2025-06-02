[**orm-service**](../README.md)

***

[orm-service](../globals.md) / StageController

# Class: StageController

Defined in: [src/infrastructure/controllers/stageController.ts:5](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/stageController.ts#L5)

## Extends

- `Controller`

## Constructors

### Constructor

> **new StageController**(`service`): `StageController`

Defined in: [src/infrastructure/controllers/stageController.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/stageController.ts#L6)

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

Defined in: [src/infrastructure/controllers/Controller.ts:27](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/Controller.ts#L27)

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

Defined in: [src/infrastructure/controllers/stageController.ts:14](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/stageController.ts#L14)

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

Defined in: [src/infrastructure/controllers/stageController.ts:18](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/stageController.ts#L18)

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

Defined in: [src/infrastructure/controllers/Controller.ts:50](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/Controller.ts#L50)

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

Defined in: [src/infrastructure/controllers/stageController.ts:22](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/stageController.ts#L22)

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

Defined in: [src/infrastructure/controllers/stageController.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/stageController.ts#L10)

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

Defined in: [src/infrastructure/controllers/Controller.ts:18](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/Controller.ts#L18)

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

Defined in: [src/infrastructure/controllers/Controller.ts:3](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/Controller.ts#L3)

#### Parameters

##### response

`any`

##### payload?

`any`

#### Returns

`void`

#### Inherited from

`Controller.sendResponse`
