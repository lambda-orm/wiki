# Configuration

## Workspace

The `WORKSPACE` environment variable is the path of the directory with the λORM configuration file (`lambdaORM.yaml`).
It defaults to `/workspace`, the volume of the Docker image.

```sh
export WORKSPACE=./config/northwind
```

## Service settings

Each setting can be given as an environment variable or in the `infrastructure.service` section of the configuration
file (the file's value wins when both are set). A setting left as an undefined `$VARIABLE` falls back to its default.

| Variable | `infrastructure.service` | Default | Description |
| --- | --- | --- | --- |
| `HOST` | `host` | `http://localhost` | Host shown in the OpenAPI document. |
| `PORT` | `port` | `80` | Port the service listens on. |
| `REQUEST_BODY_SIZE` | `requestBodySize` | `14MB` | Max size of a request body. |
| `RATE_LIMIT_MAX` | `rateLimitMax` | `30` | Requests per window and IP. **`0` turns the rate limit off** (an internal service behind its own gateway). |
| `RATE_LIMIT_WINDOWS_MS` | `rateLimitWindowMs` | `30000` | Rate limit window in ms. |
| `SERVICE_TOKEN` | `token` | — | When set, requests need `Authorization: Bearer <token>` (see [Security](#security)). |
| `SCRIPT_ENABLED` | `scriptEnabled` | `false` | `true` turns on [`POST /script`](../Endpoints/Script.md) (403 when off). |
| `SCRIPT_MAX_LENGTH` | `scriptMaxLength` | `20000` | Max length of a script in characters (413 above it). |
| `SCRIPT_TIMEOUT_MS` | `scriptTimeoutMs` | `30000` | Max time of a script in ms; then its loops stop and its transaction rolls back. |
| `SCRIPT_MAX_ITERATIONS` | `scriptMaxIterations` | `100000` | Max loop iterations of a script, all its loops together; past it the script fails and rolls back (service 2.3.2). |

Example in the configuration file:

```yml
infrastructure:
  service:
    host: $HOST
    port: $PORT
    requestBodySize: $REQUEST_BODY_SIZE
    rateLimitWindowMs: $RATE_LIMIT_WINDOWS_MS
    rateLimitMax: $RATE_LIMIT_MAX
```

```sh
export HOST=http://localhost
export PORT=9291
export REQUEST_BODY_SIZE=100mb
export RATE_LIMIT_WINDOWS_MS=60000
export RATE_LIMIT_MAX=0
export SERVICE_TOKEN=my-secret-token
export SCRIPT_ENABLED=true
```

On start the service logs the rate limit, whether a token is required and whether scripts are enabled.

## Security

With `SERVICE_TOKEN` set, every request but `/ping`, `/health` and `/metrics` needs the token; otherwise it answers 401:

```sh
curl -X POST "http://localhost:9291/execute" \
  -H "Authorization: Bearer my-secret-token" -H "Content-Type: application/json" \
  -d '{"query": "Countries.page(1,10)"}'
```

```json
{ "error": "Unauthorized", "message": "a valid service token is required (Authorization: Bearer <token>)" }
```

Node client:

```ts
import { orm } from '@lambdaorm/client'
await orm.init('http://localhost:9291', { token: process.env.SERVICE_TOKEN })
```

Without `SERVICE_TOKEN` the service has no authentication: keep it on an internal network or behind a gateway.

## Docker

The image [flaviorita/lambdaorm-svc](https://hub.docker.com/r/flaviorita/lambdaorm-svc) (2.3.x) runs on Node 24 and
includes the `lambdaorm` CLI (`@lambdaorm/cli`). Mount the workspace on `/workspace`:

```yaml
services:
  orm:
    image: flaviorita/lambdaorm-svc:2.3.1
    container_name: orm
    environment:
      HOST: http://0.0.0.0
      PORT: 9291
      WORKSPACE: /workspace
      RATE_LIMIT_MAX: 0
      SERVICE_TOKEN: my-secret-token
      SCRIPT_ENABLED: "true"
      POSTGRES_CNX: '{"host":"postgres","port":5432,"user":"northwind","password":"northwind","database":"northwind"}'
    ports:
      - 9291:9291
    volumes:
      - ./:/workspace
```

The CLI can run inside the container, e.g. `docker exec orm lambdaorm fetch -w /workspace`.
