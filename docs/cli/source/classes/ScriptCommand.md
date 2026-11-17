[**λORM CLI**](../README.md)

***

[λORM CLI](../README.md) / ScriptCommand

# Class: ScriptCommand

Defined in: [packages/cli/src/lib/infrastructure/command/script.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/script.ts#L8)

## Implements

- `CommandModule`

## Constructors

### Constructor

> **new ScriptCommand**(): `ScriptCommand`

#### Returns

`ScriptCommand`

## Properties

### command

> **command**: `string` = `'script'`

Defined in: [packages/cli/src/lib/infrastructure/command/script.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/script.ts#L9)

string (or array of strings) that executes this command when given on the command line, first string may contain positional args

#### Implementation of

`CommandModule.command`

***

### describe

> **describe**: `string` = `'Run a script: several queries (orm.execute) in one transaction'`

Defined in: [packages/cli/src/lib/infrastructure/command/script.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/script.ts#L10)

string used as the description for the command in help text, use `false` for a hidden command

#### Implementation of

`CommandModule.describe`

## Methods

### builder()

> **builder**(`args`): `Argv`\<`object` & `object` & `object` & `object` & `object` & `object` & `object` & `object`\>

Defined in: [packages/cli/src/lib/infrastructure/command/script.ts:12](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/script.ts#L12)

object declaring the options the command accepts, or a function accepting and returning a yargs instance

#### Parameters

##### args

`Argv`

#### Returns

`Argv`\<`object` & `object` & `object` & `object` & `object` & `object` & `object` & `object`\>

#### Implementation of

`CommandModule.builder`

***

### handler()

> **handler**(`args`): `Promise`\<`void`\>

Defined in: [packages/cli/src/lib/infrastructure/command/script.ts:48](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/script.ts#L48)

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
