[**orm-service**](../README.md)

***

[orm-service](../globals.md) / GeneralService

# Class: GeneralService

Defined in: [src/application/services/generalService.ts:2](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/generalService.ts#L2)

## Constructors

### Constructor

> **new GeneralService**(`packageVersion`, `orm?`): `GeneralService`

Defined in: [src/application/services/generalService.ts:4](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/generalService.ts#L4)

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

Defined in: [src/application/services/generalService.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/generalService.ts#L10)

#### Returns

`Promise`\<`any`\>

***

### ping()

> **ping**(): `Promise`\<`any`\>

Defined in: [src/application/services/generalService.ts:28](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/generalService.ts#L28)

#### Returns

`Promise`\<`any`\>

***

### version()

> **version**(): `Promise`\<\{ `version`: `string`; \}\>

Defined in: [src/application/services/generalService.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/generalService.ts#L6)

#### Returns

`Promise`\<\{ `version`: `string`; \}\>
