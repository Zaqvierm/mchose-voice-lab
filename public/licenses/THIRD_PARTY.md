# Third-party components and vendor assets

The project author's MIT license covers this repository's original source and documentation. It does not relicense dependencies, manufacturer firmware, trademarks or user audio.

| Component | Version | Declared license | Source |
|---|---|---|---|
| @ffmpeg/ffmpeg browser wrapper | 0.12.15 | MIT | https://github.com/ffmpegwasm/ffmpeg.wasm |
| @ffmpeg/core single-thread WebAssembly build | 0.12.10 | GPL-2.0-or-later | https://github.com/ffmpegwasm/ffmpeg.wasm |
| Vite (build tool) | 6.4.6 | MIT | https://github.com/vitejs/vite |
| LZMA-JS (browser worker and test codec) | 2.3.2 | MIT | https://github.com/LZMA-JS/LZMA-JS |

The unminified upstream LZMA worker is used because the npm package's minified worker changes its public message-property names. Its license is included in [licenses/lzma-MIT.txt](licenses/lzma-MIT.txt), also copied to the website license directory. It is used only on the exact SHA256-pinned X9 application. No modified executable instructions or vendor SDK tools are distributed with the editor.

The FFmpeg core is retrieved from the pinned npm package. Its upstream source, component versions and build scripts are available in the [ffmpeg.wasm project](https://github.com/ffmpegwasm/ffmpeg.wasm); the underlying multimedia project is [FFmpeg](https://ffmpeg.org/). The published core has a different license from the MIT wrapper. A copy of GPLv2 is provided in [licenses/FFmpeg-GPLv2.txt](licenses/FFmpeg-GPLv2.txt). Package provenance is recorded in `package-lock.json`.

The website build retrieves unchanged official MCHOSE headset images from the URLs in `public/catalog.json`. Each is checked against an explicitly recorded SHA256 and size before publication. They are vendor assets, not open-source contributions of this project. Rights remain with their respective owners. Official source links remain available alongside the catalog. No manufacturer SDK executables or source modules are bundled.

Owner audio (including the test sound used during research), original voice recordings and private fixture images are not committed to Git. Visitors are responsible for the audio they provide.

When the manufacturer's CDN is unavailable, the build may reuse a cached or previously published original from this project's website. The exact same SHA256 and size are required; no alternative version is silently substituted. An initial publication still requires at least one valid original source. Cache/mirror transport does not change vendor ownership.

MCHOSE, Actions Technology, OpenAI Codex and other names identify relevant products or assistance, not endorsement. See [CONTRIBUTORS.md](CONTRIBUTORS.md).


## Offline research and codec references

- i3sey's [V9 Pro 2 research](https://gitlab.com/i3sey/mchose-v9pro2-english) supplied an external LZMA/SBC lead. Source container layouts and resource maps were independently checked; its hardware result is not project evidence. It is a reference, not a project author credit.
- [kagaimiq/jl-misctools](https://github.com/kagaimiq/jl-misctools) describes the JLFS/ENC/SFC family. This repository contains its own constrained G9 parser and source-specific validation. No upstream tool code is vendored.
- [Jieli-Tech/fw-AC63_BT_SDK](https://github.com/Jieli-Tech/fw-AC63_BT_SDK) provides the official WTGv2 audio converters and conversion sequence. `prepare-tools` retrieves three exact SHA256-pinned Windows executables directly from that repository. Their manufacturer rights and applicable upstream terms remain unchanged. They are not included in Git, source archives or the website, and are not relicensed under this project's MIT license.
- [xqy2006/jsc2js](https://github.com/xqy2006/jsc2js) was a static research tool. It is not bundled or needed at runtime.

The offline CLI requires a user-provided native FFmpeg installation; its license and build configuration remain the user's installed distribution's responsibility. No vendor firmware, factory voice audio, downloaded codec executables or app disassembly is committed.
