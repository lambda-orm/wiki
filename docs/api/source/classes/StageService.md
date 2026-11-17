[**λORM service**](../README.md)

***

[λORM service](../README.md) / StageService

# Class: StageService

Defined in: [service/src/lib/application/services/stageService.ts:2](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/stageService.ts#L2)

## Constructors

### Constructor

> **new StageService**(`orm`): `StageService`

Defined in: [service/src/lib/application/services/stageService.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/stageService.ts#L4)

#### Parameters

##### orm

`IOrm`

#### Returns

`StageService`

## Methods

### exists()

> **exists**(`__namedParameters`): `Promise`\<`any`\>

Defined in: [service/src/lib/application/services/stageService.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/stageService.ts#L10)

#### Parameters

##### \_\_namedParameters

###### stage

`string`

#### Returns

`Promise`\<`any`\>

***

### export()

> **export**(`__namedParameters`): `Promise`\<`SchemaData`\>

Defined in: [service/src/lib/application/services/stageService.ts:14](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/stageService.ts#L14)

#### Parameters

##### \_\_namedParameters

###### stage

`string`

#### Returns

`Promise`\<`SchemaData`\>

***

### import()

> **import**(`__namedParameters`): `Promise`\<`void`\>

Defined in: [service/src/lib/application/services/stageService.ts:18](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/stageService.ts#L18)

#### Parameters

##### \_\_namedParameters

###### body

`any`

###### stage

`string`

#### Returns

`Promise`\<`void`\>

***

### list()

> **list**(): `Promise`\<`string`[]\>

Defined in: [service/src/lib/application/services/stageService.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/stageService.ts#L6)

#### Returns

`Promise`\<`string`[]\>
