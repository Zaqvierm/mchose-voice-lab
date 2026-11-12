# Third-party components and vendor assets

The project author's MIT license covers this repository's original source and documentation. It does not relicense dependencies, manufacturer firmware, trademarks or user audio.

| Component | Version | Declared license | Source |
|---|---|---|---|
| @ffmpeg/ffmpeg browser wrapper | 0.12.15 | MIT | https://github.com/ffmpegwasm/ffmpeg.wasm |
| @ffmpeg/core single-thread WebAssembly build | 0.12.10 | GPL-2.0-or-later | https://github.com/ffmpegwasm/ffmpeg.wasm |
| Vite (build tool) | 6.4.1 | MIT | https://github.com/vitejs/vite |

The FFmpeg core is retrieved from the pinned npm package. Its upstream source, component versions and build scripts are available in the [ffmpeg.wasm project](https://github.com/ffmpegwasm/ffmpeg.wasm); the underlying multimedia project is [FFmpeg](https://ffmpeg.org/). The published core has a different license from the MIT wrapper. A copy of GPLv2 is provided in [licenses/FFmpeg-GPLv2.txt](licenses/FFmpeg-GPLv2.txt). Package provenance is recorded in `package-lock.json`.

The website build retrieves unchanged official MCHOSE headset images from the URLs in `public/catalog.json`. Each is checked against an explicitly recorded SHA256 and size before publication. They are vendor assets, not open-source contributions of this project. Rights remain with their respective owners. Official source links remain available alongside the catalog. No manufacturer SDK executables or source modules are bundled.

Owner audio (including the test sound used during research), original voice recordings and private fixture images are not committed to Git. Visitors are responsible for the audio they provide.

When the manufacturer's CDN is unavailable, the build may reuse a cached or previously published original from this project's website. The exact same SHA256 and size are required; no alternative version is silently substituted. An initial publication still requires at least one valid original source. Cache/mirror transport does not change vendor ownership.

MCHOSE, Actions Technology, OpenAI Codex and other names identify relevant products or assistance, not endorsement. See [CONTRIBUTORS.md](CONTRIBUTORS.md).
