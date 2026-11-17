[**λORM CLI**](../README.md)

***

[λORM CLI](../README.md) / VersionCommand

# Class: VersionCommand

Defined in: [packages/cli/src/lib/infrastructure/command/version.ts:7](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/version.ts#L7)

## Implements

- `CommandModule`

## Constructors

### Constructor

> **new VersionCommand**(): `VersionCommand`

#### Returns

`VersionCommand`

## Properties

### command

> **command**: `string` = `'version'`

Defined in: [packages/cli/src/lib/infrastructure/command/version.ts:8](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/version.ts#L8)

string (or array of strings) that executes this command when given on the command line, first string may contain positional args

#### Implementation of

`CommandModule.command`

***

### describe

> **describe**: `string` = `'Prints the lambdaorm cli version and the @lambdaorm/lib version this project uses.'`

Defined in: [packages/cli/src/lib/infrastructure/command/version.ts:9](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/version.ts#L9)

string used as the description for the command in help text, use `false` for a hidden command

#### Implementation of

`CommandModule.describe`

## Methods

### builder()

> **builder**(`args`): `Argv`\<`object` & `object`\>

Defined in: [packages/cli/src/lib/infrastructure/command/version.ts:10](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/version.ts#L10)

object declaring the options the command accepts, or a function accepting and returning a yargs instance

#### Parameters

##### args

`Argv`

#### Returns

`Argv`\<`object` & `object`\>

#### Implementation of

`CommandModule.builder`

***

### handler()

> **handler**(`args`): `Promise`\<`void`\>

Defined in: [packages/cli/src/lib/infrastructure/command/version.ts:22](https://github.com/lambda-orm/core/blob/937bdc8d9ed3c74f813dedaec3b7e46eae140170/packages/cli/src/lib/infrastructure/command/version.ts#L22)

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
