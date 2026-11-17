[**λORM service**](../README.md)

***

[λORM service](../README.md) / Metric

# Interface: Metric

Defined in: [service/src/lib/application/ports/metric.ts:1](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/metric.ts#L1)

## Methods

### after()

> **after**(`req`, `res`, `next`): `void`

Defined in: [service/src/lib/application/ports/metric.ts:3](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/metric.ts#L3)

#### Parameters

##### req

`any`

##### res

`any`

##### next

`any`

#### Returns

`void`

***

### before()

> **before**(`req`, `res`, `next`): `void`

Defined in: [service/src/lib/application/ports/metric.ts:2](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/metric.ts#L2)

#### Parameters

##### req

`any`

##### res

`any`

##### next

`any`

#### Returns

`void`

***

### metrics()

> **metrics**(): `Promise`\<`any`\>

Defined in: [service/src/lib/application/ports/metric.ts:4](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/service/src/lib/application/ports/metric.ts#L4)

#### Returns

`Promise`\<`any`\>
