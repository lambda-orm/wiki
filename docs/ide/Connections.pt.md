# Conexões {#connections}

Uma conexão é um gateway com o qual a IDE trabalha: o endereço da sua porta `management` e uma credencial. A IDE não
tem login nem página inicial: ela guarda as suas conexões e, na primeira vez, abre em uma **Nova conexão**. Várias
conexões podem estar abertas ao mesmo tempo, cada uma uma árvore do [explorador](Explorer.md): sua **Administração** (o que sua credencial pode administrar do
gateway) e seus **Esquemas**, com suas abas lado a lado.

Adicione uma conexão por gateway e credencial que você usa: uma local, a de um ambiente de testes, o mesmo gateway com
uma credencial que só lê e outra que administra.

## Uma nova conexão {#a-new-connection}

O **+** ao lado de **Conexões**, no topo do explorador:

| Campo | O que é |
| --- | --- |
| **Nome** | como a conexão é mostrada (`local`, `production`…) |
| **Protocolo** | `REST · http` ou `REST · https` |
| **Endereço do management** | `host:porta/caminho base` do `management` do gateway, **como o servidor da IDE o alcança**: `data-gateway:9090` para uma IDE web no mesmo compose, `localhost:9090` para o aplicativo de desktop na máquina do gateway |
| **Autenticação** | **API key** (seu **Header**, por padrão `X-Api-Key`, e sua **Chave**), **Token Bearer (JWT)** (seu **Token**: uma chave do gateway ou o [token de um provedor de identidade](../data-gateway/Security.md#jwt); quando expira, a conexão avisa e pede um novo), **Basic (usuário e senha)**, **OpenID Connect (entrar)** (IDE 1.3.0: seu **Emissor**, **Client ID** e **Scopes**; veja abaixo) ou **Nenhuma** |
| **Lembrar a chave neste navegador** | guardada com a conexão; caso contrário, só naquela aba do navegador, e pedida de novo depois de fechá-la |
| **Outras URLs dos seus transportes** (recolhido) | a **URL do REST**, a **URL do WebSocket** e a **URL do MCP**, só quando a IDE não os alcança nas portas que o gateway informa (um proxy na frente, outra rede) |

**OpenID Connect (entrar)**: a página da connection tem **Entrar**, que abre o login do provedor de identidade (no
navegador, uma janela própria; no app desktop, o navegador do sistema, que volta ao app); o token fica nessa aba e é
renovado antes de vencer; **Sair** encerra também a sessão do provedor. O provedor precisa de um cliente público com
PKCE cujas redirect URIs aceitem a IDE (`…/oidc-callback.html` da IDE, e `http://127.0.0.1:*` para o app desktop); o
servidor da IDE o alcança, então sua origem vai em `DATA_GATEWAY_IDE_TARGETS` ([Implantação](Deploying.md)).

**Mostrar** mostra a chave digitada. **Testar** abre uma sessão e a fecha em seguida: `Conectado como admin ·
data-gateway 4.0.0`, ou por que não conseguiu. **Conectar** adiciona a conexão e abre a sua página.

![Nova conexão](images/ide-new-connection.png)

A conexão fica no navegador (no aplicativo de desktop, nos seus dados); seus esquemas, workspaces e o que neles se
salva estão no gateway.

## Sua linha no explorador {#its-row-in-the-explorer}

| Elemento | O que faz |
| --- | --- |
| ▸ | recolhe e expande os seus esquemas |
| seu nome e endereço | abrem a sua página |
| ⟳ **Atualizar** | lê de novo o que mudou em outro lugar: seus esquemas, seus domínios e o que está salvo |
| ⚠ no lugar do seu ícone | algo a ver: o ponteiro sobre ele diz o quê |

Os problemas que ela informa, em vermelho sob o seu nome:

- **Falta a chave: abra a conexão para informá-la** — a chave não foi lembrada e a aba do navegador foi fechada.
- **A credencial não é válida.**
- **O servidor do IDE não chega à data-gateway** — o seu endereço, ou o seu `management` não está exposto; o motivo
  vem em seguida (um destino não permitido: [Implantação](Deploying.md#its-targets)).
- **A sessão terminou: …** — revogada ([abaixo](#sessions)).
- **A sessão expira em 2 minutos: salve o que estiver editando.**

## Sua página {#its-page}

Um clique no seu nome abre **Conexão: nome** (desde a IDE 1.5.0, só a conexão; suas ferramentas, papéis, sessões e
escritas que aguardam estão na sua [Administração](#administration)):

- **O formulário** acima, com **Salvar** (salvá-la sem mudanças a conecta de novo, depois de uma revogação) e
  **Remover**, que pergunta antes e a remove só da IDE: nada é removido do gateway, e suas abas se fecham.
- **Quem sou aqui** (data-gateway 5.0, `GET /admin/me`): o usuário da credencial, seu contexto e cada um dos seus papéis
  como vale, com suas permissões, seus esquemas e, em cada um, suas views e stages (marcado o que se usa quando nada é
  escolhido). Em cada esquema as permissões são as dos papéis que permitem a view e o stage escolhidos. Um papel que o
  gateway não tem diz *desconhecido: não dá nada*. Com um gateway anterior à 5.0, seu nome e suas permissões.

## Sua administração {#administration}

**Desde a IDE 1.5.0, com data-gateway 5.0.** No explorador, cada conexão tem o nó **Administração** sobre seus
**Esquemas**, com o que sua credencial pode administrar; o que precisa de uma permissão que ela não tem não aparece:

```text
northwind  http://data-gateway:9090
├─ Administração
│  ├─ Papéis                   (roles)        cada papel um nó: Editar, Remover
│  ├─ Acesso                   (roles)
│  ├─ Persistência             (roles ou persist)
│  │  ├─ Config                seu lambdaORM.yaml, no Monaco
│  │  └─ Conexão               (persist)
│  ├─ Sessões
│  ├─ Escritas que aguardam    (approve)
│  ├─ Ferramentas              API REST · WebSocket · MCP
│  └─ Observabilidade          (observability)   Métricas · Logs · Traces
└─ Esquemas
   └─ /
```

### Papéis {#roles}

**Permissões por papel:** um papel por linha e uma permissão por coluna (a configuração e o estado juntos), com seus
esquemas. **+ Adicionar um papel** abre um novo. Cada papel é um nó próprio: tudo o que dá, suas permissões e, por
esquema, suas views e stages com os padrões marcados, de onde vem (*a configuração*, ou quem o mudou e quando), com
**Editar** e **Remover**.

**Editar** tem uma caixa por permissão (as que a configuração dá, marcadas e fixas: o que se salva estende um papel da
configuração, nunca tira dele), seus **Esquemas** (nenhum: todos os esquemas) e, para cada esquema escolhido, suas views
e stages para marcar com sua **View padrão** e seu **Stage padrão**, **Máximo de linhas**, *Suas escritas esperam que
uma pessoa as aprove* e **Por quê (opcional)**. Um papel *bloqueado* na configuração não pode ser estendido; um papel
que a 4.4 guardou para um esquema é marcado *de um esquema (4.4): não se aplica; remova-o*. **Suas mudanças** diz quem
mudou o quê e quando. Ver [papéis](../data-gateway/Security.md#roles).

### Acesso {#access}

**Acesso: chaves e tokens:** quem pode entrar, como a configuração o diz (`GET /admin/access`): por **Onde** (*em tudo*,
um transporte, um esquema) cada **Método** e **Credencial** com seus papéis e seu **Contexto**; um método `jwt` diz seu
emissor e a claim dos seus papéis. Nunca um segredo.

### Persistência {#persist}

Onde o gateway guarda sua administração (as sessões, os papéis, sua observabilidade, as escritas que aguardam e as
mudanças de cada um): seu banco ou arquivo, quem o lê e grava, quem o diz (*state.source da configuração*, *por padrão:
o SQLite do volume*, *a administração*), a cada quanto as réplicas o releem, se é obrigatório e se pode ser lido agora.

- **Config:** o `lambdaORM.yaml` da administração, no Monaco: as entidades, o mapping e a fonte do estado como o λORM os
  usa. Com `persist` seu mapping pode ser editado (a tabela de cada entidade e suas colunas): **Salvar o mapping** copia
  o estado para as tabelas novas e o gateway reinicia.
- **Conexão** (com `persist`): **Agora**, o banco do momento, e **Outro banco**: **Copiar o estado e mover** o copia ali
  com o λORM e o gateway reinicia com ele (as conexões abertas se reconectam); **Voltar à configuração** desfaz. Ver
  [onde o estado é guardado](../data-gateway/Admin.md#persist).

### Ferramentas {#tools}

**API REST (Swagger)**, **WebSocket** e **MCP**: os transportes do gateway, cada um aberto em uma aba própria
(`REST API · northwind`…), com a credencial da conexão. Um transporte que o gateway não expõe fica desativado
(`esta data-gateway não o expõe`). A IDE descobre onde eles estão pelo gateway (`GET /transports` do seu
`management`), ou por **Outras URLs dos seus transportes**.

| Ferramenta | O que tem |
| --- | --- |
| **API REST (Swagger)** | o OpenAPI do gateway, cada método com **Try it out**; a credencial vai com cada requisição |
| **WebSocket** | um **Esquema**, **Conectar** / **Desconectar**, seus **Métodos** (do seu AsyncAPI: um clique preenche a requisição), a **Requisição** (JSON-RPC) com **Enviar** (Ctrl+Enter) e as **Mensagens** enviadas e recebidas (as últimas 200) |
| **MCP** | um **Esquema** e **Conectar**, depois as **Tools do esquema**: escolhida uma, seus **Argumentos** (preenchidos com os obrigatórios), **Chamar** (Ctrl+Enter) e seu **Resultado** |

![Ferramentas](images/ide-connection-tools.png)

### Observabilidade {#observability}

Com `observability`: o que o gateway envia e para onde, em três nós, **Métricas** (*Enviar por OTLP*, *A cada (ms)*,
*lambdaorm.entity nas métricas*; `/metrics` para o Prometheus é servido sempre), **Logs** (*Para o console*, seu
**Nível**, por OTLP) e **Traces** (*Amostragem (0–1)*, *Seguir a decisão de quem chama*, *Texto das consultas nos
spans*); **Para onde vai: o exportador OTLP** (seu **Endpoint**; seus headers só em `OTEL_EXPORTER_OTLP_HEADERS`) e
**Onde se vê** (**URL do Grafana**, os datasources do **Tempo**, **Prometheus** e **Loki**, a **Organização do
Grafana**), com **Abrir no Grafana**. **Salvar e aplicar** o guarda sobre a configuração e o aplica na hora (o edge
reinicia e os esquemas cuja telemetria muda recarregam); **Voltar à configuração** desfaz. O link de uma entidade para
seus traces ([Entidades](Entities.md)) vem daqui, não de cada IDE.

### Escritas que aguardam {#approvals}

Desde a IDE 1.3.0, com uma credencial que tem `approve`: as
[escritas de agentes que aguardam uma pessoa](../data-gateway/Security.md#approvals) em todos os schemas do gateway,
cada uma com quem pediu e quando, sua consulta (ou script), **O que rodaria** (suas sentenças) e **Seus dados**.
**Aprovar** a roda como quem pediu; **Recusar** pede um motivo (opcional). Quem pediu uma escrita não pode aprová-la. A
lista é relida a cada 15 segundos.

### Sessões {#sessions}

Conectar faz login no `management` do gateway ([sessões](../data-gateway/Transports.md#sessions)): a IDE guarda o
token naquela aba do navegador, e cada requisição o leva, nunca a chave.

- Quando a sessão **expira** (30 minutos sem atividade, ou 12 horas) e a chave está à mão, a IDE abre outra sozinha;
  sem ela, pede a chave.
- Quando ela é **revogada**, a IDE diz quem a revogou e não volta sozinha, mesmo com a chave lembrada: salvar a
  conexão de novo a conecta.
- A IDE mantém aberto o WebSocket de eventos do gateway: a sessão aparece como *conectado* (um ● verde), e um esquema
  que muda, ou algo salvo por outra pessoa, aparece na hora. Uma mudança feita por outra sessão (outra pessoa, outra
  IDE, a CLI através do gateway) é anunciada sob a conexão, `modeler alterou Orders em /`, com **Atualizar**.

**Minhas sessões** lista as sessões da mesma credencial: esta (**esta**) e as outras (outra aba, navegador ou
computador), cada uma com seu cliente, seu endereço, o que está olhando (seu esquema e sua aba ativa), sua última
atividade e quando expira. **Fechar** fecha uma; **Fechar as outras**, todas menos esta.

Com `sessionAdmin`, **Sessões ativas** lista todas as sessões do gateway por credencial: **Revogar** uma, ou **Revogar
todas** de uma credencial (com confirmação; na sua, esta sessão permanece).

![Sessões](images/ide-connection-sessions.png)
