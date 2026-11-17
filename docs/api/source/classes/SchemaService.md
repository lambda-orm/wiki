[**λORM service**](../README.md)

***

[λORM service](../README.md) / SchemaService

# Class: SchemaService

Defined in: [service/src/lib/application/services/schemaService.ts:2](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L2)

## Constructors

### Constructor

> **new SchemaService**(`orm`): `SchemaService`

Defined in: [service/src/lib/application/services/schemaService.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L4)

#### Parameters

##### orm

`IOrm`

#### Returns

`SchemaService`

## Methods

### domain()

> **domain**(): `Promise`\<`DomainSchema`\>

Defined in: [service/src/lib/application/services/schemaService.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L10)

#### Returns

`Promise`\<`DomainSchema`\>

***

### entities()

> **entities**(): `Promise`\<`Entity`[]\>

Defined in: [service/src/lib/application/services/schemaService.ts:31](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L31)

#### Returns

`Promise`\<`Entity`[]\>

***

### entity()

> **entity**(`__namedParameters`): `Promise`\<`Entity` \| `undefined`\>

Defined in: [service/src/lib/application/services/schemaService.ts:35](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L35)

#### Parameters

##### \_\_namedParameters

###### entity

`string`

#### Returns

`Promise`\<`Entity` \| `undefined`\>

***

### entityMapping()

> **entityMapping**(`__namedParameters`): `Promise`\<`EntityMapping` \| `undefined`\>

Defined in: [service/src/lib/application/services/schemaService.ts:55](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L55)

#### Parameters

##### \_\_namedParameters

###### entity

`string`

###### mapping

`string`

#### Returns

`Promise`\<`EntityMapping` \| `undefined`\>

***

### enum()

> **enum**(`__namedParameters`): `Promise`\<`Enum` \| `undefined`\>

Defined in: [service/src/lib/application/services/schemaService.ts:43](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L43)

#### Parameters

##### \_\_namedParameters

###### _enum

`string`

#### Returns

`Promise`\<`Enum` \| `undefined`\>

***

### enums()

> **enums**(): `Promise`\<`Enum`[]\>

Defined in: [service/src/lib/application/services/schemaService.ts:39](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L39)

#### Returns

`Promise`\<`Enum`[]\>

***

### mapping()

> **mapping**(`__namedParameters`): `Promise`\<`Mapping` \| `undefined`\>

Defined in: [service/src/lib/application/services/schemaService.ts:51](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L51)

#### Parameters

##### \_\_namedParameters

###### mapping

`string`

#### Returns

`Promise`\<`Mapping` \| `undefined`\>

***

### mappings()

> **mappings**(): `Promise`\<`Mapping`[]\>

Defined in: [service/src/lib/application/services/schemaService.ts:47](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L47)

#### Returns

`Promise`\<`Mapping`[]\>

***

### schema()

> **schema**(): `Promise`\<`Schema`\>

Defined in: [service/src/lib/application/services/schemaService.ts:14](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L14)

#### Returns

`Promise`\<`Schema`\>

***

### source()

> **source**(`__namedParameters`): `Promise`\<\{ `dialect`: `string`; `name`: `string`; \}\>

Defined in: [service/src/lib/application/services/schemaService.ts:27](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L27)

#### Parameters

##### \_\_namedParameters

###### source

`string`

#### Returns

`Promise`\<\{ `dialect`: `string`; `name`: `string`; \}\>

***

### sources()

> **sources**(): `Promise`\<`object`[]\>

Defined in: [service/src/lib/application/services/schemaService.ts:23](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L23)

#### Returns

`Promise`\<`object`[]\>

***

### stage()

> **stage**(`__namedParameters`): `Promise`\<`Stage` \| `undefined`\>

Defined in: [service/src/lib/application/services/schemaService.ts:63](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L63)

#### Parameters

##### \_\_namedParameters

###### stage

`string`

#### Returns

`Promise`\<`Stage` \| `undefined`\>

***

### stages()

> **stages**(): `Promise`\<`Stage`[]\>

Defined in: [service/src/lib/application/services/schemaService.ts:59](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L59)

#### Returns

`Promise`\<`Stage`[]\>

***

### version()

> **version**(): `Promise`\<\{ `version`: `string`; \}\>

Defined in: [service/src/lib/application/services/schemaService.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L6)

#### Returns

`Promise`\<\{ `version`: `string`; \}\>

***

### views()

> **views**(): `Promise`\<`string`[]\>

Defined in: [service/src/lib/application/services/schemaService.ts:67](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/services/schemaService.ts#L67)

#### Returns

`Promise`\<`string`[]\>
