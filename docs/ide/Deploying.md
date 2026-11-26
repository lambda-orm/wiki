# Deploying

The gateway serves no UI and answers no CORS. The IDE reaches it through its **`management`** port
([Transports](../data-gateway/Transports.md#management)): the routes of the REST API for every schema plus the
[administration](../data-gateway/Admin.md). A gateway without that port has no IDE, which is what a production gateway
whose schemas come in its volumes may want.

```yaml
# data-gateway.config.yaml
transports:
  http: { port: 8080 }
  management: { port: 9090 }    # the API of the IDE; without a port, not exposed
```

## The web IDE

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:4.2.0
    # 9090 is not published: only the IDE reaches it, on the network of the compose
  ide:
    image: flaviorita/data-gateway-ide:1.2.0
    environment:
      DATA_GATEWAY_IDE_TARGETS: "http://data-gateway:9090,http://data-gateway:8080"
    ports:
      - "127.0.0.1:8090:8080"
```

- **The browser talks only to the server of the IDE.** It serves the page and forwards each request to the gateway (a
  proxy): REST, MCP and the WebSocket alike. The gateways never see the browser.
- **The IDE keeps no connection and no credential.** They stay in the browser. It forwards the credential to the
  gateway and drops the cookies and the origin of the page.
- **Keep `management` on an internal network.** It writes the schemas and their variables and runs DDL; the IDE is
  the one to publish.

With `trustedProxies` of `management` set to the network of the IDE, the gateway sees the address of each browser in
its [sessions](Connections.md#sessions); otherwise every session shows the address of the IDE.

### Its targets {#its-targets}

**`DATA_GATEWAY_IDE_TARGETS`** lists the origins the IDE may reach, separated by commas, or `*` for any (an IDE run
locally). Without it, the IDE reaches none and says so: an open proxy would reach any host of its network. List the
`management` of each gateway, and its REST, WebSocket and MCP for the [tools](Connections.md#tools) of the connection.

| Variable | Default | What it is |
| --- | --- | --- |
| `DATA_GATEWAY_IDE_TARGETS` | none | the origins it may reach: `http://data-gateway:9090,http://data-gateway:8080` |
| `PORT` | `8080` | the port of the IDE in its container |
| `HOST` | `0.0.0.0` | the address it listens on |

## The desktop app

The [desktop app](Download.md) has the same server inside, on `127.0.0.1`, for its window only (a token per run): it
reaches any gateway your machine reaches, with no targets to list. Its sessions show as `desktop`. It checks for
updates when it starts and every 6 hours (**Help → Check automatically**).

## Where the IDE runs {#where-the-ide-runs}

| You deploy | For | `management` |
| --- | --- | --- |
| Only the gateway, without `management` | production, with the schemas in its volumes: no IDE, no administration | no port |
| The gateway and the IDE image | an IDE shared in the browser | on the internal network only, never published: the IDE container reaches it |
| Only the gateway, with `management` | an IDE on your own machine: the [desktop app](Download.md), or the image run with `docker run` | your machine has to reach its port (below) |

An IDE on your machine reaches a `management` that is elsewhere without publishing it open:

| The gateway runs | How the IDE reaches it | `management` published |
| --- | --- | --- |
| on the same machine | `localhost:9090` | — |
| in an internal network, or behind a VPN | `internal-host:9090` | only to that network |
| on a server, without a VPN | an SSH tunnel, `ssh -L 9090:localhost:9090 server`, and the connection to `localhost:9090` | only on the loopback of the server |
| in Kubernetes | `kubectl port-forward svc/data-gateway 9090`, and the connection to `localhost:9090` | an internal `Service`, no ingress |

Through a tunnel, the REST, WebSocket and MCP tabs need their own way too: tunnel their ports as well, or set their
URLs in the connection (**Other URLs of its transports**).
