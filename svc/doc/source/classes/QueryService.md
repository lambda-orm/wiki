[**orm-service**](../README.md)

***

[orm-service](../globals.md) / QueryService

# Class: QueryService

Defined in: [src/application/services/queryService.ts:2](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L2)

## Constructors

### Constructor

> **new QueryService**(`orm`): `QueryService`

Defined in: [src/application/services/queryService.ts:4](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L4)

#### Parameters

##### orm

`IOrm`

#### Returns

`QueryService`

## Methods

### constraints()

> **constraints**(`__namedParameters`): `Promise`\<`MetadataConstraint`\>

Defined in: [src/application/services/queryService.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L6)

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

Defined in: [src/application/services/queryService.ts:26](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L26)

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

Defined in: [src/application/services/queryService.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L10)

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

Defined in: [src/application/services/queryService.ts:14](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L14)

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

Defined in: [src/application/services/queryService.ts:18](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L18)

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

Defined in: [src/application/services/queryService.ts:22](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/queryService.ts#L22)

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
