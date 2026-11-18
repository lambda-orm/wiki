# Export

Export data from a database.

## Params

| parameter	| short | describe 																												|
|-----------|-------|-----------------------------------------------------------------|
|workspace	| -w 		| project path.																										|
|stage			| -s 		| Name of stage																										|
|envfile		| -e 		| Read in a file of environment variables.												|
|target			| -t 		| Destination file with export data.															|
|force			| -f 		| If there is an error in a statement, continue executing the next statements	|
|url				| -u 		| URL of the schema on a Data Gateway	|

## Example

```sh
lambdaorm export -w lab/countries -e lab/countries/.env -t ./lab/countries/data
```
