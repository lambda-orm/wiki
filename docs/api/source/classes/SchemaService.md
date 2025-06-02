[**orm-service**](../README.md)

***

[orm-service](../globals.md) / SchemaService

# Class: SchemaService

Defined in: [src/application/services/schemaService.ts:2](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L2)

## Constructors

### Constructor

> **new SchemaService**(`orm`): `SchemaService`

Defined in: [src/application/services/schemaService.ts:4](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L4)

#### Parameters

##### orm

`IOrm`

#### Returns

`SchemaService`

## Methods

### domain()

> **domain**(): `Promise`\<`DomainSchema`\>

Defined in: [src/application/services/schemaService.ts:10](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L10)

#### Returns

`Promise`\<`DomainSchema`\>

***

### entities()

> **entities**(): `Promise`\<`Entity`[]\>

Defined in: [src/application/services/schemaService.ts:31](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L31)

#### Returns

`Promise`\<`Entity`[]\>

***

### entity()

> **entity**(`__namedParameters`): `Promise`\<`undefined` \| `Entity`\>

Defined in: [src/application/services/schemaService.ts:35](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L35)

#### Parameters

##### \_\_namedParameters

###### entity

`string`

#### Returns

`Promise`\<`undefined` \| `Entity`\>

***

### entityMapping()

> **entityMapping**(`__namedParameters`): `Promise`\<`undefined` \| `EntityMapping`\>

Defined in: [src/application/services/schemaService.ts:55](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L55)

#### Parameters

##### \_\_namedParameters

###### entity

`string`

###### mapping

`string`

#### Returns

`Promise`\<`undefined` \| `EntityMapping`\>

***

### enum()

> **enum**(`__namedParameters`): `Promise`\<`undefined` \| `Enum`\>

Defined in: [src/application/services/schemaService.ts:43](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L43)

#### Parameters

##### \_\_namedParameters

###### _enum

`string`

#### Returns

`Promise`\<`undefined` \| `Enum`\>

***

### enums()

> **enums**(): `Promise`\<`Enum`[]\>

Defined in: [src/application/services/schemaService.ts:39](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L39)

#### Returns

`Promise`\<`Enum`[]\>

***

### mapping()

> **mapping**(`__namedParameters`): `Promise`\<`undefined` \| `Mapping`\>

Defined in: [src/application/services/schemaService.ts:51](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L51)

#### Parameters

##### \_\_namedParameters

###### mapping

`string`

#### Returns

`Promise`\<`undefined` \| `Mapping`\>

***

### mappings()

> **mappings**(): `Promise`\<`Mapping`[]\>

Defined in: [src/application/services/schemaService.ts:47](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L47)

#### Returns

`Promise`\<`Mapping`[]\>

***

### schema()

> **schema**(): `Promise`\<`Schema`\>

Defined in: [src/application/services/schemaService.ts:14](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L14)

#### Returns

`Promise`\<`Schema`\>

***

### source()

> **source**(`__namedParameters`): `Promise`\<\{ `dialect`: `string`; `name`: `string`; \}\>

Defined in: [src/application/services/schemaService.ts:27](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L27)

#### Parameters

##### \_\_namedParameters

###### source

`string`

#### Returns

`Promise`\<\{ `dialect`: `string`; `name`: `string`; \}\>

***

### sources()

> **sources**(): `Promise`\<`object`[]\>

Defined in: [src/application/services/schemaService.ts:23](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L23)

#### Returns

`Promise`\<`object`[]\>

***

### stage()

> **stage**(`__namedParameters`): `Promise`\<`undefined` \| `Stage`\>

Defined in: [src/application/services/schemaService.ts:63](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L63)

#### Parameters

##### \_\_namedParameters

###### stage

`string`

#### Returns

`Promise`\<`undefined` \| `Stage`\>

***

### stages()

> **stages**(): `Promise`\<`Stage`[]\>

Defined in: [src/application/services/schemaService.ts:59](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L59)

#### Returns

`Promise`\<`Stage`[]\>

***

### version()

> **version**(): `Promise`\<\{ `version`: `string`; \}\>

Defined in: [src/application/services/schemaService.ts:6](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L6)

#### Returns

`Promise`\<\{ `version`: `string`; \}\>

***

### views()

> **views**(): `Promise`\<`string`[]\>

Defined in: [src/application/services/schemaService.ts:67](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/services/schemaService.ts#L67)

#### Returns

`Promise`\<`string`[]\>
