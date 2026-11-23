# IDE

The IDE of the Data Gateway: connect to your gateways, browse their schemas, read each entity as a form, write queries
with autocompletion, draw diagrams and administer the schemas. Like a database IDE, it connects to gateways, one or
several, each with its credential; their schemas, workspaces and projects stay in them.

It comes in two ways, the same app and the same version:

- **The desktop app**, for Linux, Windows and macOS, downloaded here: it runs on your machine and connects from it.
- **The web IDE**, the image [`flaviorita/data-gateway-ide`](https://hub.docker.com/r/flaviorita/data-gateway-ide),
  deployed next to the gateways and used from the browser ([In a container](#in-a-container)).

How to use it is in the [guide](Guide.md).

![The IDE](../data-gateway/images/ui-query.png)

## Download {#download}

<div id="ide-downloads" class="ide-downloads" aria-live="polite" data-repo="lambda-orm/data-gateway" data-tag-prefix="ide-v"
  data-labels='{"loading":"Reading the versions…","latest":"Latest version: {version} · {date}","downloadFor":"Download for {os}","linux":"Linux","windows":"Windows","macos":"macOS","appleSilicon":"Apple Silicon","intel":"Intel","bothArchs":"x64 and arm64","allVersions":"All the versions","testVersions":"Test versions","version":"Version","date":"Date","notes":"What is new","noReleases":"No version is published yet.","openReleases":"The versions on GitHub","error":"The versions could not be read from GitHub.","rateLimit":"GitHub limits the requests without an account: try again after {time}, or open the versions on GitHub."}'>
<noscript><p><a href="https://github.com/lambda-orm/data-gateway/releases?q=ide-v&amp;expanded=true">The versions on GitHub</a></p></noscript>
</div>

## Installing it {#installing-it}

| OS | File | How |
| --- | --- | --- |
| Linux | `.AppImage` | `chmod +x data-gateway-ide-*.AppImage` and run it: nothing to install, and it updates itself |
| Linux | `.deb` | `sudo apt install ./data-gateway-ide-*.deb` (Debian, Ubuntu); it tells when a new version is out |
| Windows | `.exe` | the installer, for your user (no administrator); it updates itself. `-win.exe` has both architectures |
| macOS | `.dmg` | open it and drag the app to Applications; it tells when a new version is out |

The executables are **not signed yet**:

- **macOS** says it can't verify the developer (on Apple Silicon, that the app is damaged): right click on the app →
  **Open**, or `xattr -dr com.apple.quarantine "/Applications/Data Gateway IDE.app"`.
- **Windows** (SmartScreen) says it protected your PC: **More info** → **Run anyway**.

Updates are checked when it starts and every 6 hours; **Help → Check automatically** turns it off.

## Where it connects {#where-it-connects}

The IDE connects to the `management` port of each gateway ([Transports](../data-gateway/Transports.md#management)),
with a [session](../data-gateway/Transports.md#sessions) opened with your credential. The desktop app connects from
your machine: for a gateway that is not on it, a VPN, an SSH tunnel or a `kubectl port-forward` reaches its
`management` without publishing it ([Where the IDE runs](Guide.md#where-the-ide-runs)).

## In a container {#in-a-container}

For a web IDE shared by a team, next to the gateways, with `management` only on their internal network:

```sh
docker run -p 127.0.0.1:8090:8080 -e DATA_GATEWAY_IDE_TARGETS='http://data-gateway:9090' flaviorita/data-gateway-ide
```

See [Deploying it](Guide.md#deploying-it) in the guide.
