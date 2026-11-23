# IDE

A IDE do Data Gateway: conecte-se aos seus gateways, percorra os esquemas, leia cada entidade como um formulário,
escreva consultas com autocompletar, desenhe diagramas e administre os esquemas. Como uma IDE de bancos de dados, ela se
conecta a gateways, um ou vários, cada um com sua credencial; os esquemas, workspaces e projetos ficam neles.

Ela vem de duas formas, o mesmo app e a mesma versão:

- **O aplicativo de desktop**, para Linux, Windows e macOS, baixado aqui: roda na sua máquina e se conecta a partir
  dela.
- **A IDE web**, a imagem [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  implantada junto aos gateways e usada pelo navegador ([Em um contêiner](#in-a-container)).

Como usá-la está no [guia](Guide.md).

![A IDE](../data-gateway/images/ui-query.png)

## Baixar {#download}

<div id="ide-downloads" class="ide-downloads" aria-live="polite" data-repo="lambda-orm/data-gateway" data-tag-prefix="ide-v"
  data-labels='{"loading": "Lendo as versões…", "latest": "Última versão: {version} · {date}", "downloadFor": "Baixar para {os}", "linux": "Linux", "windows": "Windows", "macos": "macOS", "appleSilicon": "Apple Silicon", "intel": "Intel", "bothArchs": "x64 e arm64", "allVersions": "Todas as versões", "testVersions": "Versões de teste", "version": "Versão", "date": "Data", "notes": "O que há de novo", "noReleases": "Ainda não há nenhuma versão publicada.", "openReleases": "As versões no GitHub", "error": "Não foi possível ler as versões do GitHub.", "rateLimit": "O GitHub limita as requisições sem conta: tente de novo depois das {time}, ou abra as versões no GitHub."}'>
<noscript><p><a href="https://github.com/lambda-orm/data-gateway/releases?q=ide-v&amp;expanded=true">As versões no GitHub</a></p></noscript>
</div>

## Instalar {#installing-it}

| SO | Arquivo | Como |
| --- | --- | --- |
| Linux | `.AppImage` | `chmod +x data-gateway-ide-*.AppImage` e execute: nada a instalar, e ele se atualiza sozinho |
| Linux | `.deb` | `sudo apt install ./data-gateway-ide-*.deb` (Debian, Ubuntu); avisa quando sai uma versão nova |
| Windows | `.exe` | o instalador, para o seu usuário (sem administrador); se atualiza sozinho. `-win.exe` traz as duas arquiteturas |
| macOS | `.dmg` | abra-o e arraste o app para Aplicativos; avisa quando sai uma versão nova |

Os executáveis **ainda não são assinados**:

- **macOS** diz que não pode verificar o desenvolvedor (no Apple Silicon, que o app está danificado): clique com o
  botão direito no app → **Abrir**, ou `xattr -dr com.apple.quarantine "/Applications/Data Gateway IDE.app"`.
- **Windows** (SmartScreen) diz que protegeu o seu PC: **Mais informações** → **Executar assim mesmo**.

As atualizações são verificadas ao iniciar e a cada 6 horas; **Help → Check automatically** desliga isso.

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
