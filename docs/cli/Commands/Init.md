# Init

Generates lambdaorm project structure.

## Params

| parameter	| short | describe 																												|
|-----------|-------|-----------------------------------------------------------------|
|workspace	| -w 		| project path (default `my-project`).														|
|source			| -s 		| Name of data source.																						|
|dialect		| -d 		| Database type you\'ll use in your project.											|
|connection	| -c 		| string connection to database																		|
|data-path	|  		| Relative data path in workspace (`--data-path`).								|
|url				| -u 		| When working with a client you must pass the url of the service	|

## Example

```sh
lambdaorm init -w lab/countries
```
