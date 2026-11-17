[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / OperandFacade

# Class: OperandFacade

Defined in: [packages/lib/src/lib/operand/application/facade.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/operand/application/facade.ts#L10)

## Constructors

### Constructor

> **new OperandFacade**(`expressions`, `schemaState`, `cache`, `operandSerializer`, `operandHelper`, `helper`): `OperandFacade`

Defined in: [packages/lib/src/lib/operand/application/facade.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/operand/application/facade.ts#L13)

#### Parameters

##### expressions

`Expressions`

##### schemaState

[`SchemaState`](SchemaState.md)

##### cache

`ICache`\<`string`, `string`\>

##### operandSerializer

`OperandSerializer`

##### operandHelper

[`OrmOperandHelper`](OrmOperandHelper.md)

##### helper

[`OrmH3lp`](OrmH3lp.md)

#### Returns

`OperandFacade`

## Methods

### build()

> **build**(`expression`): `Operand`

Defined in: [packages/lib/src/lib/operand/application/facade.ts:27](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/operand/application/facade.ts#L27)

#### Parameters

##### expression

`string`

#### Returns

`Operand`

***

### getClauses()

> **getClauses**(`operand`): `any`

Defined in: [packages/lib/src/lib/operand/application/facade.ts:35](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/operand/application/facade.ts#L35)

#### Parameters

##### operand

`Operand`

#### Returns

`any`

***

### normalize()

> **normalize**(`expression`): `string`

Defined in: [packages/lib/src/lib/operand/application/facade.ts:31](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/operand/application/facade.ts#L31)

#### Parameters

##### expression

`string`

#### Returns

`string`
