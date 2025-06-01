[**orm-service**](../README.md)

***

[orm-service](../globals.md) / SchemaController

# Class: SchemaController

Defined in: [src/infrastructure/controllers/schemaController.ts:5](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L5)

## Extends

- `Controller`

## Constructors

### Constructor

> **new SchemaController**(`service`): `SchemaController`

Defined in: [src/infrastructure/controllers/schemaController.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L6)

#### Parameters

##### service

[`SchemaService`](SchemaService.md)

#### Returns

`SchemaController`

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

### domain()

> **domain**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:18](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L18)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### entities()

> **entities**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:30](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L30)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### entity()

> **entity**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:34](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L34)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### entityMapping()

> **entityMapping**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:38](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L38)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### enum()

> **enum**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:46](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L46)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### enums()

> **enums**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:42](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L42)

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

### mapping()

> **mapping**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:54](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L54)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### mappings()

> **mappings**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:50](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L50)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### schema()

> **schema**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:14](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L14)

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

### source()

> **source**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:22](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L22)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### sources()

> **sources**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:26](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L26)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### stage()

> **stage**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:62](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L62)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### stages()

> **stages**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:58](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L58)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### version()

> **version**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L10)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

***

### views()

> **views**(`request`, `response`): `Promise`\<`void`\>

Defined in: [src/infrastructure/controllers/schemaController.ts:66](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/infrastructure/controllers/schemaController.ts#L66)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>
