# Version

Prints the version of the CLI that runs and the version of `@lambdaorm/lib` the project uses.

## Params

| parameter | short | describe |
|-----------|-------|----------|
| workspace | -w | Project path (default: the current directory). |
| language | -l | Develop language (default `node`). |

## Example

```sh
lambdaorm version
```

Result:

```sh
lambdaorm cli version: 1.6.2
Local lambdaorm version: 3.2.2
```

`Local lambdaorm not found.` when the project doesn't depend on `@lambdaorm/lib`.

To print only the CLI version:

```sh
lambdaorm --version   # or lambdaorm -v
```

```sh
1.6.2
```
