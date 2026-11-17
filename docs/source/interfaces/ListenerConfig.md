[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ListenerConfig

# Interface: ListenerConfig

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:141

## Properties

### after?

> `optional` **after**: `string`

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:146

***

### before?

> `optional` **before**: `string`

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:145

***

### condition?

> `optional` **condition**: `string`

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:144

***

### error?

> `optional` **error**: `string`

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:147

***

### name

> **name**: `string`

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:142

***

### on

> **on**: [`SentenceCategory`](../enumerations/SentenceCategory.md)[]

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:143

***

### transactional?

> `optional` **transactional**: `boolean`

Defined in: packages/base/build/lib/schema/domain/schema.d.ts:153

true (default): the listener runs in the sentence's transaction (its orm.execute calls use the same connections,
a rollback undoes them, an error fails the sentence). false: it runs outside it, and its writes are kept even if
the sentence's transaction rolls back.
