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

## Frequently asked questions

### How do I change voice prompts on MCHOSE headphones?

Open the [editor](https://zaqvierm.github.io/mchose-voice-lab/), select the exact model and factory firmware language, load the base and choose a notification. Add your audio, trim the clip, preview the result and download the rebuilt `.bin`. Follow the [installation guide](docs/rebuild.en.md).

### How do I make a custom MCHOSE Power On sound?

Select `V_POWON.act` (Power on) from the image's actual resource list. Use a voice recording, music or a short tone. The list comes from the loaded firmware; event labels are hints. Power On replacement has hardware validation on X9 English firmware 1003.

### Are MCHOSE V9 Pro, V9 Turbo and G9 Pro supported?

The catalog includes X9, V9 Pro, V9 Turbo+, V9 Turbo and G9 Pro: 8 original images in total. Available languages depend on the model. Structure and rebuilding are checked for every image, but hardware validation covers only X9 EN 1003. Unknown images can be inspected, but cannot be used to build modified firmware.

### Does this website flash the headphones?

No. It builds a firmware file. Install it separately using the [official MCHOSE PC updater](https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select). Select the headset, not the receiver. Do not bypass an updater rejection by changing the version number.

### Do I need a separate ACT encoder? Where is my audio uploaded?

No separate tool is needed: the editor encodes AAC-LC and packages it in the compatible ACT wrapper in your browser. User audio and firmware are not uploaded to a server. The first audio operation downloads an engine of approximately 31 MB.

### How long can a custom sound be?

There is no word-count limit. Source files must be at most 25 MB and 10 minutes long; the encoded sound must fit the original partition alongside the other resources. Shorten the clip if it does not fit.

### Can I restore the factory sounds?

Save the original image for your exact model and language before editing. Restore through the official updater if it accepts that image. Having the original does not guarantee recovery from an interrupted or failed flash; see the [guide](docs/rebuild.en.md) and [risk notice](DISCLAIMER.md).

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
