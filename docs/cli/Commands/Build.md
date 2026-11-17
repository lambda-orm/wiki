# Build

build model, repositories.

## Params

| parameter		| short | describe 																												|
|-------------|-------|-----------------------------------------------------------------|
|workspace		| -w 		| Project path.																										|
|url					| -u 		| When working with a client you must pass the url of the service	|
|language			| -l 		| Develop language: `node` (default) or `client-node`.							|
|model				| -m 		| Build model.																										|
|repositories	| -r 		| Build repositories.																							|
|all					| -a 		| Build model and repositories (the default when none of -m, -r, -a is given).	|
|src-path			|  		| Relative source code path in workspace (`--src-path`).					|
|data-path		|  		| Relative data path in workspace (`--data-path`).								|
|domain-path	|  		| Relative domain path in source code path (`--domain-path`).			|

## Example

```sh
lambdaorm build -w lab/countries
```
