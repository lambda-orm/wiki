[**Lambda ORM**](../README.md)

***

[Lambda ORM](../README.md) / ViewConfigService

# Class: ViewConfigService

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:2

## Constructors

### Constructor

> **new ViewConfigService**(`view`): `ViewConfigService`

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:4

#### Parameters

##### view

[`View`](../interfaces/View.md)

#### Returns

`ViewConfigService`

## Accessors

### entities

#### Get Signature

> **get** **entities**(): [`EntityView`](../interfaces/EntityView.md)[]

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:8

##### Returns

[`EntityView`](../interfaces/EntityView.md)[]

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:5

##### Returns

`string`

## Methods

### excludeEntity()

> **excludeEntity**(`name`): `boolean`

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:11

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### get()

> **get**(): [`View`](../interfaces/View.md)

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:6

#### Returns

[`View`](../interfaces/View.md)

***

### getEntity()

> **getEntity**(`name`): [`EntityView`](../interfaces/EntityView.md) \| `undefined`

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:9

#### Parameters

##### name

`string`

#### Returns

[`EntityView`](../interfaces/EntityView.md) \| `undefined`

***

### getProperty()

> **getProperty**(`entityName`, `name`): [`PropertyView`](../interfaces/PropertyView.md) \| `undefined`

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:10

#### Parameters

##### entityName

`string`

##### name

`string`

#### Returns

[`PropertyView`](../interfaces/PropertyView.md) \| `undefined`

***

### set()

> **set**(`value`): `void`

Defined in: packages/base/build/lib/schema/application/services/config/viewConfigService.d.ts:7

#### Parameters

##### value

[`View`](../interfaces/View.md)

#### Returns

`void`
