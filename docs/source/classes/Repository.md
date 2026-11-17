[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / Repository

# Class: Repository\<TEntity, TQuery\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L9)

## Type Parameters

### TEntity

`TEntity`

### TQuery

`TQuery`

## Implements

- [`IRepository`](../interfaces/IRepository.md)\<`TEntity`, `TQuery`\>

## Constructors

### Constructor

> **new Repository**\<`TEntity`, `TQuery`\>(`name`, `stage?`, `orm?`): `Repository`\<`TEntity`, `TQuery`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L11)

#### Parameters

##### name

`string`

##### stage?

`string`

##### orm?

[`IOrm`](../interfaces/IOrm.md) = `_orm`

#### Returns

`Repository`\<`TEntity`, `TQuery`\>

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L11)

***

### stage?

> `optional` **stage**: `string`

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L11)

## Methods

### bulkDelete()

#### Call Signature

> **bulkDelete**(`entities`): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:18](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L18)

##### Parameters

###### entities

`TEntity`[]

##### Returns

`Promise`\<`any`[]\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`bulkDelete`](../interfaces/IRepository.md#bulkdelete)

#### Call Signature

> **bulkDelete**(`entities`, `include`): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L19)

##### Parameters

###### entities

`TEntity`[]

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`any`[]\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`bulkDelete`](../interfaces/IRepository.md#bulkdelete)

***

### bulkInsert()

#### Call Signature

> **bulkInsert**(`entities`): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:59](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L59)

##### Parameters

###### entities

`TEntity`[]

##### Returns

`Promise`\<`any`[]\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`bulkInsert`](../interfaces/IRepository.md#bulkinsert)

#### Call Signature

> **bulkInsert**(`entities`, `include`): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:61](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L61)

##### Parameters

###### entities

`TEntity`[]

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`any`[]\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`bulkInsert`](../interfaces/IRepository.md#bulkinsert)

***

### bulkMerge()

#### Call Signature

> **bulkMerge**(`entities`): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:24](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L24)

##### Parameters

###### entities

`TEntity`[]

##### Returns

`Promise`\<`any`[]\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`bulkMerge`](../interfaces/IRepository.md#bulkmerge)

#### Call Signature

> **bulkMerge**(`entities`, `include`): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:25](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L25)

##### Parameters

###### entities

`TEntity`[]

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`any`[]\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`bulkMerge`](../interfaces/IRepository.md#bulkmerge)

***

### delete()

#### Call Signature

> **delete**(`entity`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:91](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L91)

##### Parameters

###### entity

`TEntity`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`delete`](../interfaces/IRepository.md#delete)

#### Call Signature

> **delete**(`entity`, `include`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:93](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L93)

##### Parameters

###### entity

`TEntity`

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`delete`](../interfaces/IRepository.md#delete)

***

### deleteAll()

> **deleteAll**(`data`, `filter?`, `include?`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:98](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L98)

#### Parameters

##### data

`any`

##### filter?

(`value`, `index`, `array`) => `unknown`

##### include?

(`value`, `index`, `array`) => `unknown`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`deleteAll`](../interfaces/IRepository.md#deleteall)

***

### distinct()

> **distinct**(`data`, `filter?`, `include?`): `Promise`\<`any`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:112](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L112)

#### Parameters

##### data

`any`

##### filter?

(`value`, `index`, `array`) => `unknown`

##### include?

(`value`, `index`, `array`) => `unknown`

#### Returns

`Promise`\<`any`[]\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`distinct`](../interfaces/IRepository.md#distinct)

***

### execute()

> **execute**(`query`, `data?`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:46](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L46)

#### Parameters

##### query

`string`

##### data?

`any`

#### Returns

`Promise`\<`any`\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`execute`](../interfaces/IRepository.md#execute)

***

### first()

> **first**(`data`, `filter?`, `include?`): `Promise`\<`TEntity` \| `null`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:119](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L119)

#### Parameters

##### data

`any`

##### filter?

(`value`, `index`, `array`) => `unknown`

##### include?

(`value`, `index`, `array`) => `unknown`

#### Returns

`Promise`\<`TEntity` \| `null`\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`first`](../interfaces/IRepository.md#first)

***

### insert()

#### Call Signature

> **insert**(`entity`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:51](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L51)

##### Parameters

###### entity

`TEntity`

##### Returns

`Promise`\<`any`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`insert`](../interfaces/IRepository.md#insert)

#### Call Signature

> **insert**(`entity`, `include`): `Promise`\<`any`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:53](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L53)

##### Parameters

###### entity

`TEntity`

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`any`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`insert`](../interfaces/IRepository.md#insert)

***

### last()

> **last**(`data`, `filter?`, `include?`): `Promise`\<`TEntity` \| `null`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:131](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L131)

#### Parameters

##### data

`any`

##### filter?

(`value`, `index`, `array`) => `unknown`

##### include?

(`value`, `index`, `array`) => `unknown`

#### Returns

`Promise`\<`TEntity` \| `null`\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`last`](../interfaces/IRepository.md#last)

***

### list()

> **list**(`data`, `filter?`, `include?`): `Promise`\<`TEntity`[]\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:105](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L105)

#### Parameters

##### data

`any`

##### filter?

(`value`, `index`, `array`) => `unknown`

##### include?

(`value`, `index`, `array`) => `unknown`

#### Returns

`Promise`\<`TEntity`[]\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`list`](../interfaces/IRepository.md#list)

***

### merge()

#### Call Signature

> **merge**(`entity`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:83](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L83)

##### Parameters

###### entity

`TEntity`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`merge`](../interfaces/IRepository.md#merge)

#### Call Signature

> **merge**(`entity`, `include`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:85](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L85)

##### Parameters

###### entity

`TEntity`

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`merge`](../interfaces/IRepository.md#merge)

***

### query()

> **query**(): [`Queryable`](Queryable.md)\<`TQuery`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:143](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L143)

#### Returns

[`Queryable`](Queryable.md)\<`TQuery`\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`query`](../interfaces/IRepository.md#query)

***

### update()

#### Call Signature

> **update**(`entity`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:67](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L67)

##### Parameters

###### entity

`TEntity`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`update`](../interfaces/IRepository.md#update)

#### Call Signature

> **update**(`entity`, `include`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:69](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L69)

##### Parameters

###### entity

`TEntity`

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`update`](../interfaces/IRepository.md#update)

***

### updateAll()

> **updateAll**(`data`, `map`, `filter?`, `include?`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:74](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L74)

#### Parameters

##### data

`any`

##### map

(`value`) => `unknown`

##### filter?

(`value`, `index`, `array`) => `unknown`

##### include?

(`value`, `index`, `array`) => `unknown`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`updateAll`](../interfaces/IRepository.md#updateall)

***

### upsert()

#### Call Signature

> **upsert**(`entity`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:12](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L12)

##### Parameters

###### entity

`TEntity`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`upsert`](../interfaces/IRepository.md#upsert)

#### Call Signature

> **upsert**(`entity`, `include`): `Promise`\<`number`\>

Defined in: [packages/lib/src/lib/repository/infrastructure/repository.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/repository/infrastructure/repository.ts#L13)

##### Parameters

###### entity

`TEntity`

###### include

(`value`, `index`, `array`) => `unknown`

##### Returns

`Promise`\<`number`\>

##### Implementation of

[`IRepository`](../interfaces/IRepository.md).[`upsert`](../interfaces/IRepository.md#upsert)
