[**λORM CLI**](../README.md)

***

[λORM CLI](../README.md) / PlanCommand

# Class: PlanCommand

Defined in: [packages/cli/src/lib/infrastructure/command/plan.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/plan.ts#L7)

## Implements

- `CommandModule`

## Constructors

### Constructor

> **new PlanCommand**(): `PlanCommand`

#### Returns

`PlanCommand`

## Properties

### command

> **command**: `string` = `'plan'`

Defined in: [packages/cli/src/lib/infrastructure/command/plan.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/plan.ts#L8)

string (or array of strings) that executes this command when given on the command line, first string may contain positional args

#### Implementation of

`CommandModule.command`

***

### describe

> **describe**: `string` = `'Return plan execution of query'`

Defined in: [packages/cli/src/lib/infrastructure/command/plan.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/plan.ts#L9)

string used as the description for the command in help text, use `false` for a hidden command

#### Implementation of

`CommandModule.describe`

## Methods

### builder()

> **builder**(`args`): `Argv`\<`object` & `object` & `object` & `object` & `object` & `object`\>

Defined in: [packages/cli/src/lib/infrastructure/command/plan.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/plan.ts#L11)

object declaring the options the command accepts, or a function accepting and returning a yargs instance

#### Parameters

##### args

`Argv`

#### Returns

`Argv`\<`object` & `object` & `object` & `object` & `object` & `object`\>

#### Implementation of

`CommandModule.builder`

***

### handler()

> **handler**(`args`): `Promise`\<`void`\>

Defined in: [packages/cli/src/lib/infrastructure/command/plan.ts:39](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/plan.ts#L39)

a function which will be passed the parsed argv.

#### Parameters

##### args

###### _

(`string` \| `number`)[]

Non-option arguments

###### $0

`string`

The script name or node command

#### Returns

`Promise`\<`void`\>

#### Implementation of

`CommandModule.handler`
