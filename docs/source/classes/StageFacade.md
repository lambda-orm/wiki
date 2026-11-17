[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / StageFacade

# Class: StageFacade

Defined in: [packages/lib/src/lib/stage/application/facade.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L19)

## Constructors

### Constructor

> **new StageFacade**(`schemaState`, `expression`, `executor`, `languages`, `helper`): `StageFacade`

Defined in: [packages/lib/src/lib/stage/application/facade.ts:23](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L23)

#### Parameters

##### schemaState

[`SchemaState`](SchemaState.md)

##### expression

[`ExpressionFacade`](ExpressionFacade.md)

##### executor

[`Executor`](../interfaces/Executor.md)

##### languages

[`LanguagesService`](LanguagesService.md)

##### helper

[`OrmH3lp`](OrmH3lp.md)

#### Returns

`StageFacade`

## Methods

### delete()

> **delete**(`options?`): [`StageDelete`](StageDelete.md)

Defined in: [packages/lib/src/lib/stage/application/facade.ts:78](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L78)

Delete source entities related to the stage

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

[`StageDelete`](StageDelete.md)

***

### drop()

> **drop**(`options?`): [`StageActionDDL`](StageActionDDL.md)

Defined in: [packages/lib/src/lib/stage/application/facade.ts:58](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L58)

Drop source entities related to the stage

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

[`StageActionDDL`](StageActionDDL.md)

***

### exists()

> **exists**(`name`): `Promise`\<`boolean`\>

Defined in: [packages/lib/src/lib/stage/application/facade.ts:38](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L38)

Check if the stage exists

#### Parameters

##### name

`string`

string

#### Returns

`Promise`\<`boolean`\>

***

### export()

> **export**(`options?`): [`StageExport`](StageExport.md)

Defined in: [packages/lib/src/lib/stage/application/facade.ts:88](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L88)

Export source entities related to the stage

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

[`StageExport`](StageExport.md)

***

### fetch()

> **fetch**(`options?`): `Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/facade.ts:109](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L109)

Compare the databases of the stage with the model (drift): per mapping, the entities that differ, each with its
`differences`; no entities when the database is in step with the model (L22)

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

`Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>

***

### import()

> **import**(`options?`): [`StageImport`](StageImport.md)

Defined in: [packages/lib/src/lib/stage/application/facade.ts:98](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L98)

Import data into source entities related to the stage

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

[`StageImport`](StageImport.md)

***

### incorporate()

> **incorporate**(`data`, `name`, `options?`): `Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/facade.ts:155](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L155)

Update and Push Schema and import data

#### Parameters

##### data

`any`

any|any[]

##### name

`string`

string

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

`Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

***

### introspect()

> **introspect**(`data`, `name`, `options?`): `Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/facade.ts:143](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L143)

Update and Push Schema with data

#### Parameters

##### data

`any`

any|any[]

##### name

`string`

string

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

`Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

***

### pull()

> **pull**(`options?`): `Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/facade.ts:129](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L129)

Pull the stage with the sources

#### Parameters

##### options?

[`StagePullOptions`](../interfaces/StagePullOptions.md) = `...`

StagePullOptions

#### Returns

`Promise`\<[`ExecuteResult`](../interfaces/ExecuteResult.md)[]\>

***

### push()

> **push**(`options?`): [`StageActionDDL`](StageActionDDL.md)

Defined in: [packages/lib/src/lib/stage/application/facade.ts:48](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L48)

Push the stage with sources

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

[`StageActionDDL`](StageActionDDL.md)

***

### read()

> **read**(`options?`): `Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/facade.ts:119](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L119)

Read the mappings of the stage's databases (every table and view, as the database has them)

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

`Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>

***

### truncate()

> **truncate**(`options?`): [`StageActionDDL`](StageActionDDL.md)

Defined in: [packages/lib/src/lib/stage/application/facade.ts:68](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/facade.ts#L68)

Truncate source entities related to the stage

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

QueryOptions

#### Returns

[`StageActionDDL`](StageActionDDL.md)
