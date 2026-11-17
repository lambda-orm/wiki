[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / StageActionDDL

# Abstract Class: StageActionDDL

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L8)

## Extended by

- [`StageDrop`](StageDrop.md)
- [`StagePush`](StagePush.md)
- [`StageTruncate`](StageTruncate.md)
- [`StagePull`](StagePull.md)

## Constructors

### Constructor

> **new StageActionDDL**(`executor`, `stageModelService`, `schemaState`, `languages`, `options`, `helper`): `StageActionDDL`

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L10)

#### Parameters

##### executor

[`Executor`](../interfaces/Executor.md)

##### stageModelService

[`StageModelService`](StageModelService.md)

##### schemaState

[`SchemaState`](SchemaState.md)

##### languages

[`LanguagesService`](LanguagesService.md)

##### options

[`QueryOptions`](../interfaces/QueryOptions.md)

##### helper

[`OrmH3lp`](OrmH3lp.md)

#### Returns

`StageActionDDL`

## Methods

### execute()

> `abstract` **execute**(): `Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:17](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L17)

#### Returns

`Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

***

### queries()

> `abstract` **queries**(): `Promise`\<[`Query`](Query.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:18](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L18)

#### Returns

`Promise`\<[`Query`](Query.md)[]\>

***

### sentence()

> **sentence**(): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L19)

#### Returns

`Promise`\<`any`[]\>

***

### sentencesBySource()

> **sentencesBySource**(): `Promise`\<`object`[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:29](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L29)

The sentences grouped by source, in the stage's order of sources (one script per database) — L19

#### Returns

`Promise`\<`object`[]\>
