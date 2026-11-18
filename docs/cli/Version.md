# Version

Prints the version of the CLI that is running and the version of `@lambdaorm/lib` that the project uses.

## Options

| Option | Short | Description |
| :-- | :-- | :-- |
| workspace | `-w` | Project path (default: the current directory). |
| language | `-l` | Development language (default: `node`). |

## Example

```sh
lambdaorm version
```

Result (the versions depend on your installation):

```text
lambdaorm cli version: 1.6.10
Local lambdaorm version: 3.5.3
```

When the project does not depend on `@lambdaorm/lib`, the second line is `Local lambdaorm not found.`

To print only the version of the CLI:

```sh
lambdaorm --version   # or lambdaorm -v
```

```text
1.6.10
```
