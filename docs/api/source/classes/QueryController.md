[**orm-service**](../README.md)

***

[orm-service](../globals.md) / QueryController

# Class: QueryController

Defined in: [src/infrastructure/controllers/queryController.ts:5](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L5)

## Extends

- `Controller`

## Constructors

### Constructor

> **new QueryController**(`service`, `queue?`): `QueryController`

Defined in: [src/infrastructure/controllers/queryController.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L6)

#### Parameters

##### service

[`QueryService`](QueryService.md)

##### queue?

[`Queue`](../interfaces/Queue.md)

#### Returns

`QueryController`

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

### constraints()

> **constraints**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/queryController.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L10)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### execute()

> **execute**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/queryController.ts:14](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L14)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### executeQueued()

> **executeQueued**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/queryController.ts:18](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L18)

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

### metadata()

> **metadata**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/queryController.ts:25](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L25)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### model()

> **model**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/queryController.ts:29](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L29)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### parameters()

> **parameters**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/queryController.ts:33](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L33)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### plan()

> **plan**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/queryController.ts:37](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/queryController.ts#L37)

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
