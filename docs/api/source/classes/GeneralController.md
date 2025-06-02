[**orm-service**](../README.md)

***

[orm-service](../globals.md) / GeneralController

# Class: GeneralController

Defined in: [src/infrastructure/controllers/generalController.ts:5](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/generalController.ts#L5)

## Extends

- `Controller`

## Constructors

### Constructor

> **new GeneralController**(`service`, `metric`): `GeneralController`

Defined in: [src/infrastructure/controllers/generalController.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/generalController.ts#L6)

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

Defined in: [src/infrastructure/controllers/Controller.ts:27](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/Controller.ts#L27)

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

### health()

> **health**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/generalController.ts:14](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/generalController.ts#L14)

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

Defined in: [src/infrastructure/controllers/generalController.ts:22](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/generalController.ts#L22)

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

Defined in: [src/infrastructure/controllers/generalController.ts:18](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/generalController.ts#L18)

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

***

### version()

> **version**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/generalController.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/generalController.ts#L10)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>
