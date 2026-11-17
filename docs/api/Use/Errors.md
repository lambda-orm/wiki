# Errors

When a request fails the service answers a JSON body and an HTTP status a client can map:

```json
{
  "error": "ExecutionError",
  "code": "23505",
  "message": "ERROR: duplicate key value violates unique constraint \"device_types_pkey\" SOURCE: default ENTITY: DeviceTypes QUERY: … DATA: …"
}
```

| Field | Description |
| --- | --- |
| `error` | The error's name, e.g. `ExecutionError`, `ValidationError`, `ScriptDisabledError`, `Error`. |
| `code` | The database's error code when there is one (Postgres SQLSTATE such as `23505`, MySQL code such as `ER_DUP_ENTRY`). |
| `message` | The error's message. |

## Status

| Status | Cause |
| --- | --- |
| 400 | Not null or check violation, invalid data (Postgres `22xxx`), an invalid query or schema (`ValidationError`, `SchemaError`, `SintaxisError`, `LanguageError`). |
| 401 | `SERVICE_TOKEN` is set and the request has no valid `Authorization: Bearer <token>` header. |
| 403 | `POST /script` while scripts are disabled. |
| 409 | Unique or foreign key violation (Postgres `23505`, `23503`; MySQL `ER_DUP_ENTRY`, `ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`). |
| 413 | `POST /script` with a script longer than `SCRIPT_MAX_LENGTH`. |
| 429 | Rate limit reached (`RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOWS_MS`). |
| *n* | A script ran `throw { status: n, message: "…" }` (400–599). |
| 500 | Anything else. |

A script can choose the answer, e.g. "not found":

```js
quote = orm.execute("Quotes.filter(p => p.id == id)", { id: id });
if (quote.length() == 0) { throw { status: 404, message: "quote not found" }; }
```

```json
{ "error": "Error", "message": "quote not found" }
```

## Results

Every successful answer is JSON, also numbers, `0` and `null`:

- a select answers the rows;
- `update` and `delete` answer the number of affected rows (`0` when nothing matched, useful for "not found" or an
  optimistic lock);
- `insert` answers the inserted data.
