[**λORM service**](../README.md)

***

[λORM service](../README.md) / ServiceConfig

# Interface: ServiceConfig

Defined in: [service/src/lib/domain/serviceSchema.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L4)

## Properties

### host?

> `optional` **host**: `string`

Defined in: [service/src/lib/domain/serviceSchema.ts:6](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L6)

***

### port?

> `optional` **port**: `number`

Defined in: [service/src/lib/domain/serviceSchema.ts:5](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L5)

***

### rateLimitMax?

> `optional` **rateLimitMax**: `string`

Defined in: [service/src/lib/domain/serviceSchema.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L9)

***

### rateLimitWindowMs?

> `optional` **rateLimitWindowMs**: `string`

Defined in: [service/src/lib/domain/serviceSchema.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L8)

***

### requestBodySize?

> `optional` **requestBodySize**: `string`

Defined in: [service/src/lib/domain/serviceSchema.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L7)

***

### scriptEnabled?

> `optional` **scriptEnabled**: `string` \| `boolean`

Defined in: [service/src/lib/domain/serviceSchema.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L11)

POST /script: off unless true (SCRIPT_ENABLED). A script runs several queries in one transaction

***

### scriptMaxIterations?

> `optional` **scriptMaxIterations**: `string` \| `number`

Defined in: [service/src/lib/domain/serviceSchema.ts:17](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L17)

Max loop iterations of a script, all its loops together (SCRIPT_MAX_ITERATIONS, default 100000)

***

### scriptMaxLength?

> `optional` **scriptMaxLength**: `string` \| `number`

Defined in: [service/src/lib/domain/serviceSchema.ts:13](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L13)

Max length of a script in characters (SCRIPT_MAX_LENGTH, default 20000)

***

### scriptTimeoutMs?

> `optional` **scriptTimeoutMs**: `string` \| `number`

Defined in: [service/src/lib/domain/serviceSchema.ts:15](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L15)

Max time of a script in ms; then it rolls back (SCRIPT_TIMEOUT_MS, default 30000)

***

### token?

> `optional` **token**: `string`

Defined in: [service/src/lib/domain/serviceSchema.ts:19](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/domain/serviceSchema.ts#L19)

When set (SERVICE_TOKEN), requests need "Authorization: Bearer <token>"; /ping, /health and /metrics don't
