# Baixar

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
