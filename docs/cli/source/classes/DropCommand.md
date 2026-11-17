[**λORM CLI**](../README.md)

***

[λORM CLI](../README.md) / DropCommand

# Class: DropCommand

Defined in: [packages/cli/src/lib/infrastructure/command/drop.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/drop.ts#L7)

## Implements

- `CommandModule`

## Constructors

### Constructor

> **new DropCommand**(): `DropCommand`

#### Returns

`DropCommand`

## Properties

### command

> **command**: `string` = `'drop'`

Defined in: [packages/cli/src/lib/infrastructure/command/drop.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/drop.ts#L8)

string (or array of strings) that executes this command when given on the command line, first string may contain positional args

#### Implementation of

`CommandModule.command`

***

### describe

> **describe**: `string` = `'Removes all database objects but not the database.'`

Defined in: [packages/cli/src/lib/infrastructure/command/drop.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/drop.ts#L9)

string used as the description for the command in help text, use `false` for a hidden command

#### Implementation of

`CommandModule.describe`

## Methods

### builder()

> **builder**(`args`): `Argv`\<`object` & `object` & `object` & `object` & `object` & `object`\>

Defined in: [packages/cli/src/lib/infrastructure/command/drop.ts:11](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/drop.ts#L11)

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

Defined in: [packages/cli/src/lib/infrastructure/command/drop.ts:43](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/drop.ts#L43)

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
