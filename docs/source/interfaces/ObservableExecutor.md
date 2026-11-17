[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ObservableExecutor

# Interface: ObservableExecutor

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:53](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L53)

## Extended by

- [`ObservableExecutorDecorator`](ObservableExecutorDecorator.md)

## Methods

### subscribe()

> **subscribe**(`observer`): `void`

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:54](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L54)

#### Parameters

##### observer

[`ActionObserver`](../classes/ActionObserver.md)

#### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(`observer`): `void`

Defined in: [packages/lib/src/lib/execution/domain/executor.ts:55](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/lib/src/lib/execution/domain/executor.ts#L55)

#### Parameters

##### observer

[`ActionObserver`](../classes/ActionObserver.md)

#### Returns

`void`
