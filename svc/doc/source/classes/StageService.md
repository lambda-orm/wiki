[**orm-service**](../README.md)

***

[orm-service](../globals.md) / StageService

# Class: StageService

Defined in: [src/application/services/stageService.ts:2](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/stageService.ts#L2)

## Constructors

### Constructor

> **new StageService**(`orm`): `StageService`

Defined in: [src/application/services/stageService.ts:4](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/stageService.ts#L4)

#### Parameters

##### orm

`IOrm`

#### Returns

`StageService`

## Methods

### exists()

> **exists**(`__namedParameters`): `Promise`\<`any`\>

Defined in: [src/application/services/stageService.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/stageService.ts#L10)

#### Parameters

##### \_\_namedParameters

###### stage

`string`

#### Returns

`Promise`\<`any`\>

***

### export()

> **export**(`__namedParameters`): `Promise`\<`SchemaData`\>

Defined in: [src/application/services/stageService.ts:14](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/stageService.ts#L14)

#### Parameters

##### \_\_namedParameters

###### stage

`string`

#### Returns

`Promise`\<`SchemaData`\>

***

### import()

> **import**(`__namedParameters`): `Promise`\<`void`\>

Defined in: [src/application/services/stageService.ts:18](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/stageService.ts#L18)

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

Defined in: [src/application/services/stageService.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/stageService.ts#L6)

#### Returns

`Promise`\<`string`[]\>
