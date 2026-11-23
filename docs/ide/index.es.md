# Data Gateway IDE

El IDE del Data Gateway: conéctate a tus gateways, recorre sus esquemas, lee cada entidad como un formulario, escribe
consultas con autocompletado, dibuja diagramas y administra los esquemas. Como un IDE de bases de datos, se conecta a
gateways, una o varias, cada una con su credencial; sus esquemas, workspaces y proyectos quedan en ellas.

Viene de dos formas, la misma app y la misma versión:

- **La aplicación de escritorio**, para Linux, Windows y macOS, que se descarga desde [Descargar](Download.md): corre en tu máquina y se conecta
  desde ella.
- **El IDE web**, la imagen [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  que se despliega junto a las gateways y se usa desde el navegador ([En un contenedor](#in-a-container)).

Cómo usarlo está en la [guía](Guide.md).

![El IDE](../data-gateway/images/ui-query.png)

## Dónde se conecta {#where-it-connects}

El IDE se conecta al puerto `management` de cada gateway ([Transportes](../data-gateway/Transports.md#management)),
con una [sesión](../data-gateway/Transports.md#sessions) abierta con tu credencial. La aplicación de escritorio se
conecta desde tu máquina: para una gateway que no está en ella, una VPN, un túnel SSH o un `kubectl port-forward`
llegan a su `management` sin publicarlo ([Dónde corre el IDE](Guide.md#where-the-ide-runs)).

## En un contenedor {#in-a-container}

Para un IDE web compartido por un equipo, junto a las gateways, con `management` solo en su red interna:

```sh
docker run -p 127.0.0.1:8090:8080 -e DATA_GATEWAY_IDE_TARGETS='http://data-gateway:9090' flaviorita/data-gateway-ide
```

Ver [Desplegarlo](Guide.md#deploying-it) en la guía.
