# Script {#script}

Ejecuta un [script](../../usage/Script.md): varias consultas en **una sola transacción**. El script se escribe en
[3xpr](https://www.npmjs.com/package/3xpr), y todas sus llamadas `orm.execute(query, data, options)` se ejecutan en la
misma transacción, también entre fuentes distintas. La transacción se confirma cuando el script termina y se revierte
ante cualquier error (una consulta que falla o un `throw`). El resultado es el valor de la última sentencia (o de
`return`).

Se ejecuta localmente con el workspace (`-w`) o en un [Data Gateway](../../data-gateway/index.md) (`-u`, a través de
[`POST /script`](../../data-gateway/Rest.md#script)); el gateway debe tener `scripts.enabled` y la credencial debe tener
el permiso `script`.

## Opciones {#options}

| Opción | Corta | Descripción |
| :-- | :-- | :-- |
| workspace | `-w` | Ruta del proyecto (por defecto: el directorio actual). |
| stage | `-s` | Nombre del stage (por defecto: el primer stage del esquema). |
| script | `-x` | Script (sentencias 3xpr que llaman a `orm.execute(query, data, options)`). |
| file | `-f` | Archivo con el script (en lugar de `-x`). |
| data | `-d` | Variables del script: JSON, o la ruta de un archivo JSON. |
| envfile | `-e` | Lee un archivo de variables de entorno. |
| output | `-o` | Formato de salida: `json`, `beautiful`, `light` o `yaml`. |
| url | `-u` | URL del esquema en un Data Gateway (`POST /script`). |

## Ejemplos {#examples}

### En línea {#inline}

```sh
lambdaorm script -w lab/northwind -e lab/northwind/.env -o beautiful \
  -x 'orm.execute("Orders.update(p => ({ freight: freight })).filter(p => p.id == id)", { id: id, freight: freight }); orm.execute("Orders.filter(p => p.id == id)", { id: id })' \
  -d '{"id": 10248, "freight": 40}'
```

### Desde un archivo {#from-a-file}

`create-quote.3xpr`:

```text
account = orm.execute("Accounts.filter(p => p.id == accountId)", { accountId: accountId });
if (account.length() == 0) { throw { status: 404, message: "account not found" }; }
orm.execute("Quotes.insert()", { id: quoteId, accountId: accountId, status: "draft" });
for (line in lines) {
  orm.execute("QuoteLines.insert()", { id: line.id, quoteId: quoteId, quantity: line.qty });
}
orm.execute("QuoteEvents.insert()", { quoteId: quoteId, event: "created" }, { stage: "insights" });
quoteId
```

```sh
lambdaorm script -w . -f create-quote.3xpr -d quote.json
```

`orm.execute(…, { stage: "insights" })` se ejecuta en otro stage y se une a la misma transacción (desde `@lambdaorm/lib`
3.3.0).

### En un Data Gateway {#on-a-data-gateway}

La URL incluye la ruta del esquema (aquí `crm`):

```sh
lambdaorm script -u http://localhost:8080/crm -f create-quote.3xpr -d '{"quoteId": 10, "accountId": 1, "lines": []}'
```

## Notas {#notes}

- Lenguaje: variables, `if` / `else`, `for`, `for … in`, `while`, `switch`, `try` / `catch`, `throw`, `return`; no
  existe el operador `? :`, ni `++` / `--` (se usa `i += 1`), ni funciones definidas por el usuario. Ver [Script](../../usage/Script.md#the-language).
- El script trabaja sobre una copia de los datos y no puede leer variables de entorno (`$VAR` falla).
- Los errores se imprimen como `error: …`, y no se conserva nada de lo que el script escribió.
- Con `-u`, un Data Gateway con autenticación bearer necesita el token en la variable de entorno `SERVICE_TOKEN` de
  la CLI (se envía como `Authorization: Bearer`; desde @lambdaorm/cli 1.6.3).
- El comando termina con código 1 cuando el script falla (desde @lambdaorm/cli 1.6.3).
