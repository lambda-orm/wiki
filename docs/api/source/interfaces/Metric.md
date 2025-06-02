[**orm-service**](../README.md)

***

[orm-service](../globals.md) / Metric

# Interface: Metric

Defined in: [src/application/ports/metric.ts:1](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/metric.ts#L1)

## Methods

### after()

> **after**(`req`, `res`, `next`): `void`

Defined in: [src/application/ports/metric.ts:3](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/metric.ts#L3)

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

Defined in: [src/application/ports/metric.ts:2](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/metric.ts#L2)

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

Defined in: [src/application/ports/metric.ts:4](https://github.com/lambda-orm/lambdaorm-svc/blob/b85161d80fb94d76aed52272905d40acde9ea6fd/src/application/ports/metric.ts#L4)

#### Returns

`Promise`\<`any`\>
