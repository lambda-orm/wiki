[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / QueryActions

# Interface: QueryActions

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:3

## Methods

### constraints()

> **constraints**(`query`): `Promise`\<[`MetadataConstraint`](MetadataConstraint.md)\>

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:8

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`MetadataConstraint`](MetadataConstraint.md)\>

***

### execute()

> **execute**(`query`, `data`): `Promise`\<`any`\>

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:4

#### Parameters

##### query

`string`

##### data

`any`

#### Returns

`Promise`\<`any`\>

***

### metadata()

> **metadata**(`query`): `Promise`\<[`Metadata`](Metadata.md)\>

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:9

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`Metadata`](Metadata.md)\>

***

### model()

> **model**(`query`): `Promise`\<[`MetadataModel`](MetadataModel.md)[]\>

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:6

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`MetadataModel`](MetadataModel.md)[]\>

***

### normalize()

> **normalize**(`query`): `string`

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:5

#### Parameters

##### query

`string`

#### Returns

`string`

***

### parameters()

> **parameters**(`query`): `Promise`\<[`MetadataParameter`](MetadataParameter.md)[]\>

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:7

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`MetadataParameter`](MetadataParameter.md)[]\>

***

### plan()

> **plan**(`query`): `Promise`\<[`QueryPlan`](QueryPlan.md)\>

Defined in: packages/base/build/lib/repository/domain/actions.d.ts:10

#### Parameters

##### query

`string`

#### Returns

`Promise`\<[`QueryPlan`](QueryPlan.md)\>
