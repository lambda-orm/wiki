[**λORM service**](../README.md)

***

[λORM service](../README.md) / SchemaController

# Class: SchemaController

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L5)

## Extends

- `Controller`

## Constructors

### Constructor

> **new SchemaController**(`service`): `SchemaController`

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L6)

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

Defined in: [service/src/lib/infrastructure/controllers/Controller.ts:64](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/Controller.ts#L64)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:18](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L18)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:30](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L30)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:34](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L34)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:38](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L38)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:46](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L46)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:42](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L42)

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

### mapping()

> **mapping**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:54](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L54)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:50](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L50)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:14](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L14)

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

### source()

> **source**(`request`, `response`): `Promise`\<`void`\>

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:22](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L22)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:26](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L26)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:62](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L62)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:58](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L58)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L10)

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

Defined in: [service/src/lib/infrastructure/controllers/schemaController.ts:66](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/infrastructure/controllers/schemaController.ts#L66)

#### Parameters

##### request

`Request`

##### response

`Response`

#### Returns

`Promise`\<`void`\>
