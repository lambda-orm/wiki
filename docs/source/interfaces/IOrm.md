[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / IOrm

# Interface: IOrm

Defined in: [packages/lib/src/lib/orm/application/orm.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L8)

## Properties

### exp

> **exp**: `Expressions`

Defined in: [packages/lib/src/lib/orm/application/orm.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L13)

***

### schema

> **schema**: [`SchemaFacade`](../classes/SchemaFacade.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L11)

***

### stage

> **stage**: [`StageFacade`](../classes/StageFacade.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L10)

***

### state

> **state**: [`SchemaState`](../classes/SchemaState.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:12](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L12)

## Methods

### constraints()

#### Call Signature

> **constraints**(`query`): [`MetadataConstraint`](MetadataConstraint.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:45](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L45)

Get constraints of query

##### Parameters

###### query

`Function`

##### Returns

[`MetadataConstraint`](MetadataConstraint.md)

Constraints of query

#### Call Signature

> **constraints**(`query`): [`MetadataConstraint`](MetadataConstraint.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:46](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L46)

##### Parameters

###### query

`string`

##### Returns

[`MetadataConstraint`](MetadataConstraint.md)

***

### dialect()

> **dialect**(`source`): [`Dialect`](../enumerations/Dialect.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:15](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L15)

#### Parameters

##### source

`string`

#### Returns

[`Dialect`](../enumerations/Dialect.md)

***

### end()

> **end**(): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/orm/application/orm.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L19)

#### Returns

`Promise`\<`void`\>

***

### execute()

#### Call Signature

> **execute**(`query`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/orm/application/orm.ts:70](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L70)

Execute query

##### Parameters

###### query

`Function`

Query to execute

###### data?

`any`

Data with variables

###### options?

[`QueryOptions`](QueryOptions.md)

query options

##### Returns

`Promise`\<`any`\>

Result of execution

#### Call Signature

> **execute**(`query`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/orm/application/orm.ts:71](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L71)

##### Parameters

###### query

`string`

###### data?

`any`

###### options?

[`QueryOptions`](QueryOptions.md)

##### Returns

`Promise`\<`any`\>

***

### executeScript()

> **executeScript**(`script`, `data?`, `options?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/orm/application/orm.ts:87](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L87)

Evaluates a 3xpr script whose orm.execute calls all run in one transaction (also across sources)

#### Parameters

##### script

`string`

statements calling orm.execute(query, data, options), with variables, if, for, throw, return

##### data?

`any`

variables of the script (the script works on a copy)

##### options?

[`ScriptOptions`](ScriptOptions.md)

stage (…) of the script's transaction, shared by every orm.execute without its own; `timeout` (ms:
when it passes the loops stop, the transaction rolls back and the script rejects) and `maxIterations` (loop
iterations of the script, all loops together)

#### Returns

`Promise`\<`any`\>

the value of the last statement (or of `return`)

***

### init()

> **init**(`configPath?`, `connect?`): `Promise`\<[`Schema`](Schema.md)\>

Defined in: [packages/lib/src/lib/orm/application/orm.ts:18](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L18)

#### Parameters

##### configPath?

`string`

##### connect?

`boolean`

#### Returns

`Promise`\<[`Schema`](Schema.md)\>

***

### metadata()

#### Call Signature

> **metadata**(`query`): [`Metadata`](Metadata.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:52](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L52)

Get metadata of query

##### Parameters

###### query

`Function`

##### Returns

[`Metadata`](Metadata.md)

metadata of query

#### Call Signature

> **metadata**(`query`): [`Metadata`](Metadata.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:53](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L53)

##### Parameters

###### query

`string`

##### Returns

[`Metadata`](Metadata.md)

***

### model()

#### Call Signature

> **model**(`query`): [`MetadataModel`](MetadataModel.md)[]

Defined in: [packages/lib/src/lib/orm/application/orm.ts:31](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L31)

Get model of query

##### Parameters

###### query

`Function`

##### Returns

[`MetadataModel`](MetadataModel.md)[]

Model of query

#### Call Signature

> **model**(`query`): [`MetadataModel`](MetadataModel.md)[]

Defined in: [packages/lib/src/lib/orm/application/orm.ts:32](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L32)

##### Parameters

###### query

`string`

##### Returns

[`MetadataModel`](MetadataModel.md)[]

***

### normalize()

#### Call Signature

> **normalize**(`query`): `string`

Defined in: [packages/lib/src/lib/orm/application/orm.ts:24](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L24)

Normalize query

##### Parameters

###### query

`Function`

##### Returns

`string`

Expression normalized

#### Call Signature

> **normalize**(`query`): `string`

Defined in: [packages/lib/src/lib/orm/application/orm.ts:25](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L25)

##### Parameters

###### query

`string`

##### Returns

`string`

***

### parameters()

#### Call Signature

> **parameters**(`query`): [`MetadataParameter`](MetadataParameter.md)[]

Defined in: [packages/lib/src/lib/orm/application/orm.ts:38](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L38)

Get parameters of query

##### Parameters

###### query

`Function`

##### Returns

[`MetadataParameter`](MetadataParameter.md)[]

Parameters of query

#### Call Signature

> **parameters**(`query`): [`MetadataParameter`](MetadataParameter.md)[]

Defined in: [packages/lib/src/lib/orm/application/orm.ts:39](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L39)

##### Parameters

###### query

`string`

##### Returns

[`MetadataParameter`](MetadataParameter.md)[]

***

### plan()

#### Call Signature

> **plan**(`query`, `options?`): [`QueryPlan`](QueryPlan.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:60](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L60)

##### Parameters

###### query

`Function`

###### options?

[`QueryOptions`](QueryOptions.md)

##### Returns

[`QueryPlan`](QueryPlan.md)

#### Call Signature

> **plan**(`query`, `options?`): [`QueryPlan`](QueryPlan.md)

Defined in: [packages/lib/src/lib/orm/application/orm.ts:61](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L61)

##### Parameters

###### query

`string`

###### options?

[`QueryOptions`](QueryOptions.md)

##### Returns

[`QueryPlan`](QueryPlan.md)

***

### transaction()

> **transaction**(`options`, `callback`): `Promise`\<`void`\>

Defined in: [packages/lib/src/lib/orm/application/orm.ts:77](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/orm/application/orm.ts#L77)

transaction

#### Parameters

##### options

query options

[`QueryOptions`](QueryOptions.md) | `undefined`

##### callback

(`tr`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>
