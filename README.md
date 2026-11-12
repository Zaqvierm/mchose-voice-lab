# MCHOSE Voice Lab

[Русский](README.ru.md) · English · [简体中文](README.zh.md)

A browser-local editor for MCHOSE voice prompts and a documented ACT/AAC firmware resource format.

**[Open the editor](https://zaqvierm.github.io/mchose-voice-lab/)** · [Official PC updater](https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select)

## Features

- Load a pinned original from the catalog or select a local image.
- Inspect actual sound resources and preview the selected factory recording.
- Trim audio, encode AAC-LC, package ACT and download a rebuilt image.
- Preserve executable payloads, the flash map and all non-target resources.

Processing stays in the browser. The editor does not upload user files or flash devices. The audio engine loads on first use (~31 MB).

## Validation scope

The catalog contains 8 official images for 5 models. Each passes a byte-identical no-op rebuild. All 144 ACT resources pass AAC structural and exact wrapper-roundtrip checks. **Hardware validation covers X9 English 1003 Power On only.** Other profiles are software-validated.

Unknown images are inspection-only. Source files are limited to 25 MB / 10 minutes; encoded output must fit the original sound partition.

[Instructions](docs/rebuild.en.md) · [Research](docs/research.en.md) · [Catalog](docs/firmware-catalog.md) · [Validation](docs/validation.md) · [Risk notice](DISCLAIMER.md)

## Development

Node.js 22+:

```sh
npm ci
npm test
npm run dev
```

`npm run build` prepares the audio engine and checksum-verified factory assets, then builds the static site. `npm run preview` serves the build. GitHub Actions deploys to GitHub Pages.

## Command line

```sh
ffmpeg -i sound.wav -ar 16000 -ac 1 -c:a aac -profile:a aac_low -b:a 24k -aac_pns 0 -aac_tns 0 -f adts sound.aac
node scripts/voice.mjs wrap sound.aac sound.act
node scripts/build-firmware.mjs factory.bin sound.act custom-headset.bin V_POWON.act
```

Extract AAC with `node scripts/voice.mjs unwrap sound.act sound.aac`.

## License and credits

Original code: [MIT](LICENSE). Vendor firmware and the FFmpeg core retain their respective licenses and rights; see [THIRD_PARTY.md](THIRD_PARTY.md). Factory binaries and user audio are not committed to source Git. Published factory assets remain unchanged and are checksum-pinned.

Maintained by Zaqvierm, with AI-assisted development using OpenAI Codex. [Contributors](CONTRIBUTORS.md).
