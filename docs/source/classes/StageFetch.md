[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / StageFetch

# Class: StageFetch

Defined in: [packages/lib/src/lib/stage/application/useCases/fetch.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/fetch.ts#L6)

## Constructors

### Constructor

> **new StageFetch**(`executor`, `schemaState`, `languages`, `helper`, `options`): `StageFetch`

Defined in: [packages/lib/src/lib/stage/application/useCases/fetch.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/fetch.ts#L8)

#### Parameters

##### executor

[`Executor`](../interfaces/Executor.md)

##### schemaState

[`SchemaState`](SchemaState.md)

##### languages

[`LanguagesService`](LanguagesService.md)

##### helper

[`SchemaHelper`](SchemaHelper.md)

##### options

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`StageFetch`

## Methods

### differences()

> **differences**(): `Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/fetch.ts:39](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/fetch.ts#L39)

The database compared with the model (L22): per mapping, only the entities that differ — present in one side only,
or with different columns (name, type, length, required) or primary key. Empty entities: in step.
Each entity carries `differences` (what differs, readable) and is the database's version (or the model's, when the
table is missing). Relations are not compared.

#### Returns

`Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>

***

### execute()

> **execute**(): `Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>

Defined in: [packages/lib/src/lib/stage/application/useCases/fetch.ts:16](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/stage/application/useCases/fetch.ts#L16)

#### Returns

`Promise`\<[`Mapping`](../interfaces/Mapping.md)[]\>
