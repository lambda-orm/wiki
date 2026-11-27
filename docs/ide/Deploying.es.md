# Despliegue {#deploying}

El gateway no sirve ninguna UI y no responde CORS. El IDE llega a él a través de su puerto **`management`**
([Transportes](../data-gateway/Transports.md#management)): las rutas de la API REST para todos los esquemas más la
[administración](../data-gateway/Admin.md). Un gateway sin ese puerto no tiene IDE, que es lo que puede querer un
gateway de producción cuyos esquemas vienen en sus volúmenes.

```yaml
# data-gateway.config.yaml
transports:
  http: { port: 8080 }
  management: { port: 9090 }    # la API del IDE; sin puerto, no se expone
```

## El IDE web {#the-web-ide}

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:5.0.0
    # 9090 no se publica: solo el IDE llega a él, en la red del compose
  ide:
    image: flaviorita/data-gateway-ide:1.5.0
    environment:
      DATA_GATEWAY_IDE_TARGETS: "http://data-gateway:9090,http://data-gateway:8080"
    ports:
      - "127.0.0.1:8090:8080"
```

- **El navegador habla solo con el servidor del IDE.** Este sirve la página y reenvía cada petición al gateway (un
  proxy): REST, MCP y el WebSocket por igual. Los gateways nunca ven el navegador.
- **El IDE no guarda ninguna conexión ni credencial.** Quedan en el navegador. Reenvía la credencial al gateway y
  descarta las cookies y el origen de la página.
- **Mantén `management` en una red interna.** Escribe los esquemas y sus variables y ejecuta DDL; el que se publica es
  el IDE.

Con `trustedProxies` de `management` configurado con la red del IDE, el gateway ve la dirección de cada navegador en
sus [sesiones](Connections.md#sessions); si no, cada sesión muestra la dirección del IDE.

### Sus destinos {#its-targets}

**`DATA_GATEWAY_IDE_TARGETS`** lista los orígenes a los que puede llegar el IDE, separados por comas, o `*` para
cualquiera (un IDE ejecutado localmente). Sin ella, el IDE no llega a ninguno y lo dice: un proxy abierto llegaría a
cualquier host de su red. Lista el `management` de cada gateway, y su REST, WebSocket y MCP para las
[herramientas](Connections.md#tools) de la conexión.

| Variable | Por defecto | Qué es |
| --- | --- | --- |
| `DATA_GATEWAY_IDE_TARGETS` | ninguno | los orígenes a los que puede llegar: `http://data-gateway:9090,http://data-gateway:8080` |
| `DATA_GATEWAY_IDE_CONNECT_SRC` | ninguna | (1.3.0) otros orígenes a los que la página llega sola: los almacenamientos de los [archivos](../data-gateway/Configuration.md#files), que reciben y dan los bytes directo |
| `PORT` | `8080` | el puerto del IDE en su contenedor |
| `HOST` | `0.0.0.0` | la dirección en la que escucha |

## La aplicación de escritorio {#the-desktop-app}

La [aplicación de escritorio](Download.md) tiene el mismo servidor dentro, en `127.0.0.1`, solo para su ventana (un
token por ejecución): llega a cualquier gateway al que llegue tu máquina, sin destinos que listar. Sus sesiones se
muestran como `desktop`. Busca actualizaciones al arrancar y cada 6 horas (**Ayuda → Check automatically**).

## Dónde corre el IDE {#where-the-ide-runs}

| Despliegas | Para | `management` |
| --- | --- | --- |
| Solo el gateway, sin `management` | producción, con los esquemas en sus volúmenes: sin IDE, sin administración | sin puerto |
| El gateway y la imagen del IDE | un IDE compartido en el navegador | solo en la red interna, nunca publicado: el contenedor del IDE llega a él |
| Solo el gateway, con `management` | un IDE en tu propia máquina: la [aplicación de escritorio](Download.md), o la imagen ejecutada con `docker run` | tu máquina tiene que llegar a su puerto (abajo) |

Un IDE en tu máquina llega a un `management` que está en otro lugar sin publicarlo abierto:

| El gateway corre | Cómo llega el IDE a él | `management` publicado |
| --- | --- | --- |
| en la misma máquina | `localhost:9090` | — |
| en una red interna, o detrás de una VPN | `internal-host:9090` | solo a esa red |
| en un servidor, sin VPN | un túnel SSH, `ssh -L 9090:localhost:9090 server`, y la conexión a `localhost:9090` | solo en el loopback del servidor |
| en Kubernetes | `kubectl port-forward svc/data-gateway 9090`, y la conexión a `localhost:9090` | un `Service` interno, sin ingress |

A través de un túnel, las pestañas REST, WebSocket y MCP también necesitan su propio camino: haz un túnel también para
sus puertos, o configura sus URLs en la conexión (**Otras URLs de sus transportes**).
