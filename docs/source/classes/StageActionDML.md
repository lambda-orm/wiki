[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / StageActionDML

# Abstract Class: StageActionDML

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDML.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDML.ts#L7)

## Extended by

- [`StageDelete`](StageDelete.md)
- [`StageExport`](StageExport.md)
- [`StageImport`](StageImport.md)

## Constructors

### Constructor

> **new StageActionDML**(`stageMappingService`, `domain`, `expressionFacade`, `executor`, `options`): `StageActionDML`

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDML.ts:15](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDML.ts#L15)

#### Parameters

##### stageMappingService

[`StageMappingService`](StageMappingService.md)

##### domain

[`DomainConfigService`](DomainConfigService.md)

##### expressionFacade

[`ExpressionFacade`](ExpressionFacade.md)

##### executor

[`Executor`](../interfaces/Executor.md)

##### options

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`StageActionDML`

## Methods

### queries()

> **queries**(): [`Query`](Query.md)[]

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDML.ts:33](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDML.ts#L33)

#### Returns

[`Query`](Query.md)[]

***

### sentence()

> **sentence**(): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDML.ts:24](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDML.ts#L24)

#### Returns

`Promise`\<`any`\>
