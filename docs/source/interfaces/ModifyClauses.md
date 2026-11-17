[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ModifyClauses

# Interface: ModifyClauses\<T\>

Defined in: packages/base/build/lib/repository/domain/queryable.d.ts:102

## Type Parameters

### T

`T`

## Methods

### filter()

> **filter**(`predicate`, `thisArg?`): [`ModifyFilterClauses`](ModifyFilterClauses.md)\<`T`\>

Defined in: packages/base/build/lib/repository/domain/queryable.d.ts:104

#### Parameters

##### predicate

(`value`, `index`, `array`) => `unknown`

##### thisArg?

`any`

#### Returns

[`ModifyFilterClauses`](ModifyFilterClauses.md)\<`T`\>

***

### include()

> **include**(`predicate`, `thisArg?`): [`ModifyIncludeClauses`](ModifyIncludeClauses.md)\<`T`\>

Defined in: packages/base/build/lib/repository/domain/queryable.d.ts:106

#### Parameters

##### predicate

(`value`, `index`, `array`) => `unknown`

##### thisArg?

`any`

#### Returns

[`ModifyIncludeClauses`](ModifyIncludeClauses.md)\<`T`\>
