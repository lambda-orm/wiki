[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / DdlBuilder

# Interface: DdlBuilder

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L4)

## Methods

### addFk()

> **addFk**(`entity`, `relation`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:25](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L25)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### relation

[`Relation`](Relation.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### addPk()

> **addPk**(`entity`, `primaryKey`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:23](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L23)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### primaryKey

`string`[]

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### addProperty()

> **addProperty**(`entity`, `property`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:14](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L14)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### property

[`PropertyMapping`](PropertyMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### addUk()

> **addUk**(`entity`, `uniqueKey`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:24](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L24)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### uniqueKey

`string`[]

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### ~~alterProperty()~~

> **alterProperty**(`entity`, `property`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L19)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### property

[`PropertyMapping`](PropertyMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

#### Deprecated

Use alterPropertyType or alterPropertyRequired

***

### alterPropertyRequired()

> **alterPropertyRequired**(`entity`, `property`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:21](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L21)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### property

[`PropertyMapping`](PropertyMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### alterPropertyType()

> **alterPropertyType**(`entity`, `property`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:20](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L20)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### property

[`PropertyMapping`](PropertyMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### createEntity()

> **createEntity**(`entity`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L13)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### createFk()

> **createFk**(`entity`, `relation`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:26](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L26)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### relation

[`Relation`](Relation.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### createIndex()

> **createIndex**(`entity`, `index`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:27](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L27)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### index

[`Index`](Index.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### createSequence()

> **createSequence**(`entity`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:28](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L28)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### dropEntity()

> **dropEntity**(`entity`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L10)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### dropFk()

> **dropFk**(`entity`, `relation`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L7)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### relation

[`Relation`](Relation.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### dropIndex()

> **dropIndex**(`entity`, `index`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L8)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### index

[`Index`](Index.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### dropPk()

> **dropPk**(`entity`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L11)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### dropProperty()

> **dropProperty**(`entity`, `property`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:22](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L22)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### property

[`PropertyMapping`](PropertyMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### dropSequence()

> **dropSequence**(`entity`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L9)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### dropUk()

> **dropUk**(`entity`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:12](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L12)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### foreignKeys()

> **foreignKeys**(`tableNames`): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:34](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L34)

#### Parameters

##### tableNames

`string`[]

#### Returns

[`Query`](../classes/Query.md)

***

### indexes()

> **indexes**(`tableNames`): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:35](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L35)

#### Parameters

##### tableNames

`string`[]

#### Returns

[`Query`](../classes/Query.md)

***

### objects()

> **objects**(): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:29](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L29)

#### Returns

[`Query`](../classes/Query.md)

***

### primaryKeys()

> **primaryKeys**(`tableNames`): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:32](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L32)

#### Parameters

##### tableNames

`string`[]

#### Returns

[`Query`](../classes/Query.md)

***

### renameProperty()

> **renameProperty**(`entity`, `previousMapping`, `property`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:15](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L15)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### previousMapping

`string`

##### property

[`PropertyMapping`](PropertyMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### sequences()

> **sequences**(): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:36](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L36)

#### Returns

[`Query`](../classes/Query.md)

***

### setNull()

> **setNull**(`entity`, `relation`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L6)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

##### relation

[`Relation`](Relation.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### tables()

> **tables**(`names`): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:30](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L30)

#### Parameters

##### names

`string`[]

#### Returns

[`Query`](../classes/Query.md)

***

### truncateEntity()

> **truncateEntity**(`entity`): [`Query`](../classes/Query.md) \| `undefined`

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L5)

#### Parameters

##### entity

[`EntityMapping`](EntityMapping.md)

#### Returns

[`Query`](../classes/Query.md) \| `undefined`

***

### uniqueKeys()

> **uniqueKeys**(`tableNames`): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:33](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L33)

#### Parameters

##### tableNames

`string`[]

#### Returns

[`Query`](../classes/Query.md)

***

### views()

> **views**(`names`): [`Query`](../classes/Query.md)

Defined in: [packages/lib/src/lib/language/domain/ports/DdlBuilder.ts:31](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/domain/ports/DdlBuilder.ts#L31)

#### Parameters

##### names

`string`[]

#### Returns

[`Query`](../classes/Query.md)
