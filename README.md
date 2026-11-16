# MCHOSE Voice Lab

[Русский](README.ru.md) · English · [简体中文](README.zh.md)

MCHOSE voice prompt editing and firmware audio research: AAC/ACT in the browser, plus experimental SBC/LZMA and WTS/JLFS tools for local use.

**[Open the editor](https://zaqvierm.github.io/mchose-voice-lab/)** · [Official PC updater](https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select)

## Features

- Load a pinned original from the catalog or select a local image.
- Inspect actual sound resources and preview the selected factory recording.
- Trim audio, encode AAC-LC, package ACT and download a rebuilt image.
- Edit button bindings on all nine browser-editable profiles: X9, G9 Pro, V9 Pro, V9 Turbo and V9 Turbo+. Buttons and 15–16 action templates are model-specific. Power clicks are editable; power-on/off and its hold remain protected.
- Load compatible custom firmware and retain its existing sounds/bindings. `Keep loaded` and `Factory` are separate choices. [Compatibility and verification](docs/binding-compatibility.md).
- Three-step button editor with track skipping, call controls and voice-assistant requests. [X9 56-ID registration audit](docs/key-command-inventory.md); unverified/service IDs remain restricted.
- Audio-only builds preserve the application payload; binding builds change only its key configuration, preserving executable instructions, bootloader, partition parameters and other resources.

See [button-table research and instructions](docs/bindings.en.md). Custom bindings have software validation only; function labels are correlated with the official manual. Hold timing and pairing combinations are not editable.

Processing stays in the browser. The editor does not upload user files or flash devices. The audio engine loads on first use (~31 MB).

## Validation scope

The catalog contains 13 official images for 8 wireless models. Nine AAC/ACT images across five models support editing; four other images are original-download-only. Each editable image passes a byte-identical no-op rebuild. All 162 ACT resources pass AAC structural and exact wrapper-roundtrip checks. **Hardware validation covers X9 English 1003 Power On only.** Other profiles are software-validated.

Unknown images are inspection-only. Source files are limited to 25 MB / 10 minutes; encoded output must fit the original sound partition.

[Instructions](docs/rebuild.en.md) · [Research](docs/research.en.md) · [Catalog](docs/firmware-catalog.md) · [Validation](docs/validation.md) · [Risk notice](DISCLAIMER.md)

## Frequently asked questions

### How do I change voice prompts on MCHOSE headphones?

Open the [editor](https://zaqvierm.github.io/mchose-voice-lab/), select the exact model and factory firmware language, load the base and choose a notification. Add your audio, trim the clip, preview the result and download the rebuilt `.bin`. Follow the [installation guide](docs/rebuild.en.md).

### How do I make a custom MCHOSE Power On sound?

Select `V_POWON.act` (Power on) from the image's actual resource list. Use a voice recording, music or a short tone. The list comes from the loaded firmware; event labels are hints. Power On replacement has hardware validation on X9 English firmware 1003.

### Are MCHOSE V9 Pro, V9 Turbo and G9 Pro supported?

The catalog includes X9, V9 Pro, V9 Turbo+, V9 Turbo and G9 Pro: 13 original images in total, including download-only models. Available languages depend on the model. Structure and rebuilding are checked for the nine AAC/ACT images, but hardware validation covers only X9 EN 1003. Unknown images can be inspected, but cannot be used to build modified firmware.

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


## Offline experimental models

[V9 Pro 2 / R9 / G9 V2: CLI](docs/offline.en.md) · [Models](docs/compatibility.en.md) · [Research](docs/wireless.en.md)

The browser offers originals and links to the separate offline workflow. The Python CLI validates the exact original, encodes user audio and rebuilds an experimental image with a preview and report. These modified-image profiles have no project hardware validation.
