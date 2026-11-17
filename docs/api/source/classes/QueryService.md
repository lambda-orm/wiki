[**λORM service**](../README.md)

***

[λORM service](../README.md) / QueryService

# Class: QueryService

Defined in: [service/src/lib/application/services/queryService.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L19)

## Constructors

### Constructor

> **new QueryService**(`orm`, `scripts?`): `QueryService`

Defined in: [service/src/lib/application/services/queryService.ts:21](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L21)

#### Parameters

##### orm

`IOrm`

##### scripts?

[`ScriptSettings`](../interfaces/ScriptSettings.md) = `...`

#### Returns

`QueryService`

## Methods

### constraints()

> **constraints**(`__namedParameters`): `Promise`\<`MetadataConstraint`\>

Defined in: [service/src/lib/application/services/queryService.ts:23](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L23)

#### Parameters

##### \_\_namedParameters

###### body

\{ `query`: `string`; \}

###### body.query

`string`

#### Returns

`Promise`\<`MetadataConstraint`\>

***

### execute()

> **execute**(`__namedParameters`): `Promise`\<`any`\>

Defined in: [service/src/lib/application/services/queryService.ts:43](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L43)

#### Parameters

##### \_\_namedParameters

###### body

\{ `data`: `any`; `options?`: `QueryOptions`; `query`: `string`; \}

###### body.data

`any`

###### body.options?

`QueryOptions`

###### body.query

`string`

#### Returns

`Promise`\<`any`\>

***

### metadata()

> **metadata**(`__namedParameters`): `Promise`\<`Metadata`\>

Defined in: [service/src/lib/application/services/queryService.ts:27](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L27)

#### Parameters

##### \_\_namedParameters

###### body

\{ `query`: `string`; \}

###### body.query

`string`

#### Returns

`Promise`\<`Metadata`\>

***

### model()

> **model**(`__namedParameters`): `Promise`\<`MetadataModel`[]\>

Defined in: [service/src/lib/application/services/queryService.ts:31](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L31)

#### Parameters

##### \_\_namedParameters

###### body

\{ `query`: `string`; \}

###### body.query

`string`

#### Returns

`Promise`\<`MetadataModel`[]\>

***

### parameters()

> **parameters**(`__namedParameters`): `Promise`\<`MetadataParameter`[]\>

Defined in: [service/src/lib/application/services/queryService.ts:35](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L35)

#### Parameters

##### \_\_namedParameters

###### body

\{ `query`: `string`; \}

###### body.query

`string`

#### Returns

`Promise`\<`MetadataParameter`[]\>

***

### plan()

> **plan**(`__namedParameters`): `Promise`\<`QueryPlan`\>

Defined in: [service/src/lib/application/services/queryService.ts:39](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L39)

#### Parameters

##### \_\_namedParameters

###### body

\{ `options?`: `QueryOptions`; `query`: `string`; \}

###### body.options?

`QueryOptions`

###### body.query

`string`

#### Returns

`Promise`\<`QueryPlan`\>

***

### script()

> **script**(`__namedParameters`): `Promise`\<`any`\>

Defined in: [service/src/lib/application/services/queryService.ts:48](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/queryService.ts#L48)

Several queries in one transaction: a 3xpr script calling orm.execute (orm.executeScript)

#### Parameters

##### \_\_namedParameters

###### body

\{ `data?`: `any`; `options?`: `ScriptOptions`; `script`: `string`; \}

###### body.data?

`any`

###### body.options?

`ScriptOptions`

###### body.script

`string`

#### Returns

`Promise`\<`any`\>
