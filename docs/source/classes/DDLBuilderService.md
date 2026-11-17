[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / DDLBuilderService

# Class: DDLBuilderService

Defined in: [packages/lib/src/lib/language/application/services/ddlBuilder.ts:12](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/ddlBuilder.ts#L12)

## Constructors

### Constructor

> **new DDLBuilderService**(`schemaState`, `languages`, `stage`, `helper`): `DDLBuilderService`

Defined in: [packages/lib/src/lib/language/application/services/ddlBuilder.ts:14](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/ddlBuilder.ts#L14)

#### Parameters

##### schemaState

[`SchemaState`](SchemaState.md)

##### languages

[`LanguagesService`](LanguagesService.md)

##### stage

`string`

##### helper

[`OrmH3lp`](OrmH3lp.md)

#### Returns

`DDLBuilderService`

## Properties

### stage

> `readonly` **stage**: `string`

Defined in: [packages/lib/src/lib/language/application/services/ddlBuilder.ts:16](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/ddlBuilder.ts#L16)

## Methods

### drop()

> **drop**(`mappings`): [`Query`](Query.md)[]

Defined in: [packages/lib/src/lib/language/application/services/ddlBuilder.ts:22](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/ddlBuilder.ts#L22)

#### Parameters

##### mappings

[`Mapping`](../interfaces/Mapping.md)[]

#### Returns

[`Query`](Query.md)[]

***

### sync()

> **sync**(`mappings`): [`Query`](Query.md)[]

Defined in: [packages/lib/src/lib/language/application/services/ddlBuilder.ts:48](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/ddlBuilder.ts#L48)

#### Parameters

##### mappings

[`Mapping`](../interfaces/Mapping.md)[]

#### Returns

[`Query`](Query.md)[]

***

### syncWithDatabase()

> **syncWithDatabase**(`database`): [`Query`](Query.md)[]

Defined in: [packages/lib/src/lib/language/application/services/ddlBuilder.ts:77](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/ddlBuilder.ts#L77)

The DDL that takes the databases (as fetch reads them) to the model — L19, L27, L20:
tables missing in the database are created (with their keys, FKs and indexes, as the usual sync does from a state
without them); in the existing tables, missing columns are added (or renamed from previousMapping), and columns
with another type, length or nullability are altered. Nothing that exists only in the database is dropped
(stage.fetch reports it).

#### Parameters

##### database

[`Mapping`](../interfaces/Mapping.md)[]

#### Returns

[`Query`](Query.md)[]

***

### truncate()

> **truncate**(`mappings`): [`Query`](Query.md)[]

Defined in: [packages/lib/src/lib/language/application/services/ddlBuilder.ts:35](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/ddlBuilder.ts#L35)

#### Parameters

##### mappings

[`Mapping`](../interfaces/Mapping.md)[]

#### Returns

[`Query`](Query.md)[]
