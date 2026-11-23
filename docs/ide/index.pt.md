# Data Gateway IDE

A IDE do Data Gateway: conecte-se aos seus gateways, percorra os esquemas, leia cada entidade como um formulário,
escreva consultas com autocompletar, desenhe diagramas e administre os esquemas. Como uma IDE de bancos de dados, ela se
conecta a gateways, um ou vários, cada um com sua credencial; os esquemas, workspaces e projetos ficam neles.

Ela vem de duas formas, o mesmo app e a mesma versão:

- **O aplicativo de desktop**, para Linux, Windows e macOS, baixado em [Baixar](Download.md): roda na sua máquina e se conecta a partir
  dela.
- **A IDE web**, a imagem [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  implantada junto aos gateways e usada pelo navegador ([Em um contêiner](#in-a-container)).

Como usá-la está no [guia](Guide.md).

![A IDE](../data-gateway/images/ui-query.png)

## Onde ela se conecta {#where-it-connects}

A IDE se conecta à porta `management` de cada gateway ([Transportes](../data-gateway/Transports.md#management)), com
uma [sessão](../data-gateway/Transports.md#sessions) aberta com a sua credencial. O aplicativo de desktop se conecta a
partir da sua máquina: para um gateway que não está nela, uma VPN, um túnel SSH ou um `kubectl port-forward` alcançam o
`management` sem publicá-lo ([Onde a IDE roda](Guide.md#where-the-ide-runs)).

## Em um contêiner {#in-a-container}

Para uma IDE web compartilhada por uma equipe, junto aos gateways, com `management` só na rede interna deles:

```sh
docker run -p 127.0.0.1:8090:8080 -e DATA_GATEWAY_IDE_TARGETS='http://data-gateway:9090' flaviorita/data-gateway-ide
```

Veja [Implantação](Guide.md#deploying-it) no guia.
