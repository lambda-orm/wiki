# λORM CLI

λORM CLI is a command line application to use [λORM](https://www.npmjs.com/package/lambdaorm)

## Installation

Install the package globally to use the CLI commands to help you create and maintain projects

```sh
npm install lambdaorm-cli -g
```

## CLI

| Command    	| Description                                  									  		|
|:------------|:--------------------------------------------------------------------|
|	version	 		| Prints lambdaorm version this project uses.													|
|	init				| Generates lambdaorm project structure.															|
|	sync				|	Synchronize database.																								|
|	import			| Import data from file to database.																	|
|	export			| Export data from a database. 																				|
|	execute			| Execute an expression lambda.																				|
| metadata		|	Return metadata of query expression.																|
| parameters	|	Return parameters of query expression.															|
| model				|	Return model of query expression.																		|
| plan				|	Return plan execution of query expression.													|
|	build				| add configuration, model and repositories according to the language.|
|	drop				|	Removes all database objects but not the database.									|

## Usage

* Commands
  * Infrastructure Commands
    * [Version](https://lambda-orm.github.io/wiki/cli/Commands/Version/index.html)
    * [Init](https://lambda-orm.github.io/wiki/cli/Commands/Init/index.html)
    * [Build](https://lambda-orm.github.io/wiki/cli/Commands/Build/index.html)
  * DDL Commands
    * [Sync](https://lambda-orm.github.io/wiki/cli/Commands/Sync/index.html)
    * [Drop](https://lambda-orm.github.io/wiki/cli/Commands/Drop/index.html)
  * Query Commands
    * [Execute](https://lambda-orm.github.io/wiki/cli/Commands/Execute/index.html)
    * [Plan](https://lambda-orm.github.io/wiki/cli/Commands/Plan/index.html)
    * [Metadata](https://lambda-orm.github.io/wiki/cli/Commands/Metadata/index.html)
    * [Parameters](https://lambda-orm.github.io/wiki/cli/Commands/Parameters/index.html)
    * [Model](https://lambda-orm.github.io/wiki/cli/Commands/Model/index.html)
    * [Constraints](https://lambda-orm.github.io/wiki/cli/Commands/Constraints/index.html)
* [source](https://lambda-orm.github.io/wiki/cli/source/README/index.html)
* [Change log](https://lambda-orm.github.io/wiki/cli/CHANGELOG/index.html)

## Labs

You can access various labs at [github.com/lambda-orm/lambdaorm-labs](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli)
