# Download

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
