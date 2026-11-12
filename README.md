# MCHOSE Voice Lab

[Русский](README.ru.md) · English · [简体中文](README.zh.md)

An independent firmware research project and a browser-local voice-prompt editor for MCHOSE headphones.

**Website:** https://zaqvierm.github.io/mchose-voice-lab/

Select a model and firmware language from the official-image catalog, or provide your own file. Inspect the sounds actually present in that image, audition an original, import audio, trim it, preview the encoded result, and download a rebuilt firmware image.

## What is validated

- Factory X9 ACT files contain **AAC-LC in ADTS**, wrapped by a two-byte prefix, byte-pair permutation and fixed XOR. All 36 EN/CN samples (648 frames) decode and roundtrip exactly.
- The production updater currently lists **8 headset images for 5 models**. All 144 ACT resources across these images pass wrapper roundtrip and ADTS structural checks.
- All 8 checksum-pinned images pass a full no-op rebuild with **byte-identical output**.
- A custom Power On sound in X9 English 1003 was confirmed on physical headphones by the owner. **Other models and notification slots have not been individually hardware-tested.**

Model support is an explicit SHA256 allowlist, not a claim that any MCHOSE firmware is safe to modify. Unknown AOTA images can be inspected where their resource filesystem is recognized; building unknown images is disabled. File names are enumerated from the image. Friendly labels do not select replacement paths.

## Use

See [instructions](docs/rebuild.en.md), [research](docs/research.en.md), [catalog provenance](docs/firmware-catalog.md), and [validation scope](docs/validation.md).

The site processes your audio and image locally. It does not upload them and does not access USB or flash hardware. The audio engine is downloaded on first use (~31 MB).

There is no word-count limit. Encoded resource size must fit the existing sound partition; the app never expands the flash map. The source-audio limit (25 MB / 10 minutes) is a browser resource limit, not a manufacturer audio-format limit.

## Development

Node.js 22+:

```sh
npm ci
npm test
npm run dev
```

For a production build use `npm run build`: it prepares the pinned FFmpeg.wasm core and retrieves checksum-verified official base images, then builds a static Vite site. Preview with `npm run preview`. GitHub Actions deploys `dist/` to GitHub Pages.

Source Git does not contain OEM firmware, OEM audio, the owner's sample audio, SDK binaries or local memory. Published website assets include the unchanged official bases so catalog selection works without the manufacturer's missing CORS headers. Their source URLs and SHA256 values are recorded in `public/catalog.json`; all rights to vendor firmware remain with its respective owners. The MIT license applies to this project's original code, **not** those firmware images or the FFmpeg core.

## Command-line tools

With a locally installed FFmpeg:

```sh
ffmpeg -i sound.wav -ar 16000 -ac 1 -c:a aac -profile:a aac_low -b:a 24k -aac_pns 0 -aac_tns 0 -f adts sound.aac
node scripts/voice.mjs wrap sound.aac sound.act
node scripts/build-firmware.mjs factory.bin sound.act custom-headset.bin V_POWON.act
```

To extract AAC: `node scripts/voice.mjs unwrap sound.act sound.aac`.

## Credits and license

[Contributors](CONTRIBUTORS.md): Zaqvierm and AI-assisted research/development with **OpenAI Codex**, with independent Qwen discussion. This is not an official MCHOSE, Actions Technology or OpenAI project.

Original project code: [MIT](LICENSE). Dependencies and vendor assets: [THIRD_PARTY.md](THIRD_PARTY.md).
