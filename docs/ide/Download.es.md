# Descargar

<div id="ide-downloads" class="ide-downloads" aria-live="polite" data-repo="lambda-orm/data-gateway" data-tag-prefix="ide-v"
  data-labels='{"loading": "Leyendo las versiones…", "latest": "Última versión: {version} · {date}", "downloadFor": "Descargar para {os}", "linux": "Linux", "windows": "Windows", "macos": "macOS", "appleSilicon": "Apple Silicon", "intel": "Intel", "bothArchs": "x64 y arm64", "allVersions": "Todas las versiones", "testVersions": "Versiones de prueba", "version": "Versión", "date": "Fecha", "notes": "Qué hay de nuevo", "noReleases": "Todavía no hay ninguna versión publicada.", "openReleases": "Las versiones en GitHub", "error": "No se pudieron leer las versiones de GitHub.", "rateLimit": "GitHub limita los pedidos sin cuenta: prueba de nuevo después de las {time}, o abre las versiones en GitHub."}'>
<noscript><p><a href="https://github.com/lambda-orm/data-gateway/releases?q=ide-v&amp;expanded=true">Las versiones en GitHub</a></p></noscript>
</div>

## Instalarlo {#installing-it}

| SO | Archivo | Cómo |
| --- | --- | --- |
| Linux | `.AppImage` | `chmod +x data-gateway-ide-*.AppImage` y ejecutarlo: no hay nada que instalar, y se actualiza solo |
| Linux | `.deb` | `sudo apt install ./data-gateway-ide-*.deb` (Debian, Ubuntu); avisa cuando sale una versión nueva |
| Windows | `.exe` | el instalador, para tu usuario (sin administrador); se actualiza solo. `-win.exe` trae las dos arquitecturas |
| macOS | `.dmg` | abrirlo y arrastrar la app a Aplicaciones; avisa cuando sale una versión nueva |

Los ejecutables **todavía no están firmados**:

- **macOS** dice que no puede verificar al desarrollador (en Apple Silicon, que la app está dañada): clic derecho en la
  app → **Abrir**, o `xattr -dr com.apple.quarantine "/Applications/Data Gateway IDE.app"`.
- **Windows** (SmartScreen) dice que protegió tu PC: **Más información** → **Ejecutar de todas formas**.

Las actualizaciones se buscan al arrancar y cada 6 horas; **Ayuda → Check automatically** lo apaga.
