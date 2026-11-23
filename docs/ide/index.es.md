# IDE

El IDE del Data Gateway: conéctate a tus gateways, recorre sus esquemas, lee cada entidad como un formulario, escribe
consultas con autocompletado, dibuja diagramas y administra los esquemas. Como un IDE de bases de datos, se conecta a
gateways, una o varias, cada una con su credencial; sus esquemas, workspaces y proyectos quedan en ellas.

Viene de dos formas, la misma app y la misma versión:

- **La aplicación de escritorio**, para Linux, Windows y macOS, que se descarga aquí: corre en tu máquina y se conecta
  desde ella.
- **El IDE web**, la imagen [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  que se despliega junto a las gateways y se usa desde el navegador ([En un contenedor](#in-a-container)).

Cómo usarlo está en la [guía](Guide.md).

![El IDE](../data-gateway/images/ui-query.png)

## Descargar {#download}

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
