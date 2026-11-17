[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ExpressionFacade

# Class: ExpressionFacade

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L19)

## Constructors

### Constructor

> **new ExpressionFacade**(`sentenceFacade`, `schemaState`, `languages`, `executor`, `expressions`, `cache`, `helper`): `ExpressionFacade`

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:25](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L25)

#### Parameters

##### sentenceFacade

[`SentenceFacade`](SentenceFacade.md)

##### schemaState

[`SchemaState`](SchemaState.md)

##### languages

[`LanguagesService`](LanguagesService.md)

##### executor

[`Executor`](../interfaces/Executor.md)

##### expressions

`Expressions`

##### cache

`ICache`\<`string`, `string`\>

##### helper

[`OrmH3lp`](OrmH3lp.md)

#### Returns

`ExpressionFacade`

## Methods

### build()

> **build**(`query`, `options?`): [`Query`](Query.md)

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:40](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L40)

#### Parameters

##### query

`string`

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

[`Query`](Query.md)

***

### execute()

> **execute**(`query`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:57](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L57)

#### Parameters

##### query

`string`

##### data?

`any` = `{}`

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`Promise`\<`any`\>

***

### executeList()

> **executeList**(`queries`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:61](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L61)

#### Parameters

##### queries

`string`[]

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`Promise`\<`any`\>

***

### executeScript()

> **executeScript**(`script`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:69](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L69)

#### Parameters

##### script

`string`

##### data?

`any` = `{}`

##### options?

[`ScriptOptions`](../interfaces/ScriptOptions.md)

#### Returns

`Promise`\<`any`\>

***

### plan()

> **plan**(`query`, `options?`): [`QueryPlan`](../interfaces/QueryPlan.md)

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:44](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L44)

#### Parameters

##### query

`string`

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

[`QueryPlan`](../interfaces/QueryPlan.md)

***

### solveQueryOptions()

> **solveQueryOptions**(`options?`): [`QueryOptions`](../interfaces/QueryOptions.md)

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:48](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L48)

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

[`QueryOptions`](../interfaces/QueryOptions.md)

***

### transaction()

> **transaction**(`options?`, `callback`): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/expressions/application/facade.ts:65](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/expressions/application/facade.ts#L65)

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md) | `undefined`

##### callback

(`tr`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>
