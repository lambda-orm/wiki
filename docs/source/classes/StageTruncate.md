[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / StageTruncate

# Class: StageTruncate

Defined in: [packages/lib/src/lib/stage/application/useCases/truncate.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/truncate.ts#L4)

## Extends

- [`StageActionDDL`](StageActionDDL.md)

## Constructors

### Constructor

> **new StageTruncate**(`executor`, `stageModelService`, `schemaState`, `languages`, `options`, `helper`): `StageTruncate`

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

`StageTruncate`

#### Inherited from

[`StageActionDDL`](StageActionDDL.md).[`constructor`](StageActionDDL.md#constructor)

## Methods

### execute()

> **execute**(): `Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/truncate.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/truncate.ts#L13)

#### Returns

`Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

#### Overrides

[`StageActionDDL`](StageActionDDL.md).[`execute`](StageActionDDL.md#execute)

***

### queries()

> **queries**(): `Promise`\<[`Query`](Query.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/truncate.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/truncate.ts#L5)

#### Returns

`Promise`\<[`Query`](Query.md)[]\>

#### Overrides

[`StageActionDDL`](StageActionDDL.md).[`queries`](StageActionDDL.md#queries)

***

### sentence()

> **sentence**(): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L19)

#### Returns

`Promise`\<`any`[]\>

#### Inherited from

[`StageActionDDL`](StageActionDDL.md).[`sentence`](StageActionDDL.md#sentence)

***

### sentencesBySource()

> **sentencesBySource**(): `Promise`\<`object`[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts:29](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/base/actionDDL.ts#L29)

The sentences grouped by source, in the stage's order of sources (one script per database) — L19

#### Returns

`Promise`\<`object`[]\>

#### Inherited from

[`StageActionDDL`](StageActionDDL.md).[`sentencesBySource`](StageActionDDL.md#sentencesbysource)
