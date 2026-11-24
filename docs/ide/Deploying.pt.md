# Implantação {#deploying}

O gateway não serve nenhuma UI e não responde CORS. A IDE o alcança pela sua porta **`management`**
([Transportes](../data-gateway/Transports.md#management)): as rotas da API REST para todos os esquemas, mais a
[administração](../data-gateway/Admin.md). Um gateway sem essa porta não tem IDE, que é o que pode querer um gateway
de produção cujos esquemas vêm nos seus volumes.

```yaml
# data-gateway.config.yaml
transports:
  http: { port: 8080 }
  management: { port: 9090 }    # a API da IDE; sem porta, não é exposta
```

## A IDE web {#the-web-ide}

```yaml
# docker-compose.yml
services:
  data-gateway:
    image: flaviorita/data-gateway:4.0.0
    # 9090 não é publicada: só a IDE a alcança, na rede do compose
  ide:
    image: flaviorita/data-gateway-ide:1.0.0
    environment:
      DATA_GATEWAY_IDE_TARGETS: "http://data-gateway:9090,http://data-gateway:8080"
    ports:
      - "127.0.0.1:8090:8080"
```

- **O navegador fala só com o servidor da IDE.** Ele serve a página e encaminha cada requisição ao gateway (um
  proxy): REST, MCP e o WebSocket igualmente. Os gateways nunca veem o navegador.
- **A IDE não guarda nenhuma conexão nem credencial.** Elas ficam no navegador. Ela encaminha a credencial ao
  gateway e descarta os cookies e a origem da página.
- **Mantenha o `management` em uma rede interna.** Ele grava os esquemas e as suas variáveis e executa DDL; a IDE é
  quem deve ser publicada.

Com `trustedProxies` do `management` definido para a rede da IDE, o gateway vê o endereço de cada navegador nas suas
[sessões](Connections.md#sessions); caso contrário, cada sessão mostra o endereço da IDE.

### Seus destinos {#its-targets}

**`DATA_GATEWAY_IDE_TARGETS`** lista as origens que a IDE pode alcançar, separadas por vírgulas, ou `*` para qualquer
uma (uma IDE executada localmente). Sem ela, a IDE não alcança nenhuma e o diz: um proxy aberto alcançaria qualquer
host da sua rede. Liste o `management` de cada gateway, e o seu REST, WebSocket e MCP para as
[ferramentas](Connections.md#tools) da conexão.

| Variável | Padrão | O que é |
| --- | --- | --- |
| `DATA_GATEWAY_IDE_TARGETS` | nenhum | as origens que ela pode alcançar: `http://data-gateway:9090,http://data-gateway:8080` |
| `PORT` | `8080` | a porta da IDE no seu contêiner |
| `HOST` | `0.0.0.0` | o endereço em que ela escuta |

## O aplicativo de desktop {#the-desktop-app}

O [aplicativo de desktop](Download.md) tem o mesmo servidor dentro, em `127.0.0.1`, só para a sua janela (um token por
execução): ele alcança qualquer gateway que a sua máquina alcança, sem destinos a listar. As suas sessões aparecem como
`desktop`. Ele verifica atualizações ao iniciar e a cada 6 horas (**Help → Check automatically**).

## Onde a IDE roda {#where-the-ide-runs}

| Você implanta | Para | `management` |
| --- | --- | --- |
| Só o gateway, sem `management` | produção, com os esquemas nos seus volumes: sem IDE, sem administração | sem porta |
| O gateway e a imagem da IDE | uma IDE compartilhada no navegador | só na rede interna, nunca publicado: o contêiner da IDE o alcança |
| Só o gateway, com `management` | uma IDE na sua própria máquina: o [aplicativo de desktop](Download.md), ou a imagem executada com `docker run` | a sua máquina precisa alcançar a sua porta (abaixo) |

Uma IDE na sua máquina alcança um `management` que está em outro lugar sem publicá-lo abertamente:

| O gateway roda | Como a IDE o alcança | `management` publicado |
| --- | --- | --- |
| na mesma máquina | `localhost:9090` | — |
| em uma rede interna, ou atrás de uma VPN | `internal-host:9090` | só para essa rede |
| em um servidor, sem VPN | um túnel SSH, `ssh -L 9090:localhost:9090 server`, e a conexão a `localhost:9090` | só no loopback do servidor |
| no Kubernetes | `kubectl port-forward svc/data-gateway 9090`, e a conexão a `localhost:9090` | um `Service` interno, sem ingress |

Por um túnel, as abas de REST, WebSocket e MCP também precisam do seu próprio caminho: faça o túnel das suas portas
também, ou defina as suas URLs na conexão (**Outras URLs dos seus transportes**).
