[**λORM service**](../README.md)

***

[λORM service](../README.md) / GeneralService

# Class: GeneralService

Defined in: [service/src/lib/application/services/generalService.ts:2](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/generalService.ts#L2)

## Constructors

### Constructor

> **new GeneralService**(`packageVersion`, `orm?`): `GeneralService`

Defined in: [service/src/lib/application/services/generalService.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/generalService.ts#L4)

#### Parameters

##### packageVersion

`string`

##### orm?

`IOrm`

#### Returns

`GeneralService`

## Methods

### health()

> **health**(): `Promise`\<`any`\>

Defined in: [service/src/lib/application/services/generalService.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/generalService.ts#L10)

#### Returns

`Promise`\<`any`\>

***

### ping()

> **ping**(): `Promise`\<`any`\>

Defined in: [service/src/lib/application/services/generalService.ts:28](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/generalService.ts#L28)

#### Returns

`Promise`\<`any`\>

***

### version()

> **version**(): `Promise`\<\{ `version`: `string`; \}\>

Defined in: [service/src/lib/application/services/generalService.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/generalService.ts#L6)

#### Returns

`Promise`\<\{ `version`: `string`; \}\>
