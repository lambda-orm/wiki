# Constraints

Return constraints associated with the query expression.

## Params

| parameter	| short | describe 																																									|
|-----------|-------|-------------------------------------------------------------------------------------------|
|workspace	| -w 		| project path.																																							|
|query			| -q 		| Query expression																																					|
|envfile		| -e 		| Read in a file of environment variables.																									|
|output			| -o 		| Generates an output according to the following possible values [json\|beautiful\|light\|yaml]|
|url					| -u 		| URL of the schema on a Data Gateway	                        |

## Example

```sh
lambdaorm constraints -o beautiful -q "Orders.filter(p=>p.id==id).include(p=>p.details)"
```

Result:

```json
{
  "entity": "Orders",
  "constraints": [],
  "children": [
    {
      "entity": "Orders.details",
      "constraints": []
    }
  ]
}
```
