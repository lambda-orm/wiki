[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / IFileSchemaService

# Interface: IFileSchemaService

Defined in: packages/base/build/lib/schema/domain/ports/fileSchemaService.d.ts:2

## Methods

### read()

> **read**(`source`): `Promise`\<[`SchemaInfo`](SchemaInfo.md) \| `null`\>

Defined in: packages/base/build/lib/schema/domain/ports/fileSchemaService.d.ts:3

#### Parameters

##### source

`string`

#### Returns

`Promise`\<[`SchemaInfo`](SchemaInfo.md) \| `null`\>

***

### write()

> **write**(`schema`, `fullPath`): `Promise`\<`void`\>

Defined in: packages/base/build/lib/schema/domain/ports/fileSchemaService.d.ts:4

#### Parameters

##### schema

[`Schema`](Schema.md)

##### fullPath

`string`

#### Returns

`Promise`\<`void`\>
