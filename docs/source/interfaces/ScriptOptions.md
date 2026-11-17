[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ScriptOptions

# Interface: ScriptOptions

Defined in: packages/base/build/lib/query/domain/query.d.ts:16

Options of orm.executeScript: the stage (…) of the script's transaction and the limits of the script

## Extends

- [`QueryOptions`](QueryOptions.md)

## Properties

### chunkSize?

> `optional` **chunkSize**: `number`

Defined in: packages/base/build/lib/query/domain/query.d.ts:11

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`chunkSize`](QueryOptions.md#chunksize)

***

### headers?

> `optional` **headers**: \[`string`, `any`\][]

Defined in: packages/base/build/lib/query/domain/query.d.ts:13

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`headers`](QueryOptions.md#headers)

***

### maxIterations?

> `optional` **maxIterations**: `number`

Defined in: packages/base/build/lib/query/domain/query.d.ts:20

Max loop iterations of the script, all loops together; past it the script fails and rolls back

***

### stage?

> `optional` **stage**: `string`

Defined in: packages/base/build/lib/query/domain/query.d.ts:9

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`stage`](QueryOptions.md#stage)

***

### timeout?

> `optional` **timeout**: `number`

Defined in: packages/base/build/lib/query/domain/query.d.ts:18

Max time in ms; when it passes, the script's loops stop, its transaction rolls back and the script rejects

***

### tryAllCan?

> `optional` **tryAllCan**: `boolean`

Defined in: packages/base/build/lib/query/domain/query.d.ts:12

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`tryAllCan`](QueryOptions.md#tryallcan)

***

### view?

> `optional` **view**: `string`

Defined in: packages/base/build/lib/query/domain/query.d.ts:10

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`view`](QueryOptions.md#view)
