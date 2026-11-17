[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / columnTypeDifference

# Function: columnTypeDifference()

> **columnTypeDifference**(`dialect`, `model`, `database`): \{ `database`: `string`; `model`: `string`; \} \| `undefined`

Defined in: [packages/lib/src/lib/language/application/services/columnType.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/language/application/services/columnType.ts#L10)

A model property and a database column (as stage.fetch reads it) compared the way the dialect creates the column, so
that a type the engine stores as another one is not a difference: MySQL BOOLEAN is TINYINT, Oracle integer is
NUMBER, SqlServer json is NVARCHAR(MAX), MariaDB json is LONGTEXT… Used by stage.fetch (L22) and push (L19, L27).
Returns undefined when they match, or the database's and the model's type as text.

## Parameters

### dialect

[`DialectService`](../interfaces/DialectService.md) | `undefined`

### model

[`PropertyMapping`](../interfaces/PropertyMapping.md)

### database

[`PropertyMapping`](../interfaces/PropertyMapping.md)

## Returns

\{ `database`: `string`; `model`: `string`; \} \| `undefined`
