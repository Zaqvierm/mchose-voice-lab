# Official firmware catalog

Snapshot: 2026-11-13. [Official production manifest](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfig_prod.json).

The manifest lists 8 headset images for 5 models. Receiver/base images and historical versions are excluded. Exact URLs, SHA256 values and language evidence are recorded in [catalog.json](../public/catalog.json).

| Model | Language | Version | Size | Validation |
|---|---|---|---:|---|
| MCHOSE G9 Pro | zh | [0026](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/G9Pro/headset/0026.bin) | 755200 | Software only |
| MCHOSE V9 Pro | zh | [0036](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Pro/headset/0036.bin) | 755712 | Software only |
| MCHOSE V9 Pro | en | [1015](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Pro/headset/1015.bin) | 747008 | Software only |
| MCHOSE X9 | zh | [0038](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/X9/headset/0038.bin) | 729088 | Software only |
| MCHOSE X9 | en | [1003](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/X9/headset/1003.bin) | 743936 | Hardware: Power On |
| MCHOSE V9 Turbo+ | zh | [0033](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Turbo/headset/0033.bin) | 736768 | Software only |
| MCHOSE V9 Turbo+ | en | [1002](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Turbo/headset/1002.bin) | 751616 | Software only |
| MCHOSE V9 Turbo | zh | [0005](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9TurboBase/headset/0005.bin) | 736768 | Software only |

## Validation

Each image passes AOTA header/body/file CRC32, XML metadata, SDFS additive checksums and a byte-identical no-op rebuild. All 144 ACT resources contain AAC-LC ADTS, 16 kHz, mono, and roundtrip exactly. The sound partition capacity is 122880 bytes in every listed profile.

Resource names are enumerated per image. G9 Pro and V9 Pro include `V_BATTLO.act` and omit `V_MAXVOL.act`; the other listed models use `V_MAXVOL.act` instead. Hardware playback evidence covers X9 English 1003 Power On only.

## Language evidence

The official V9 Pro/X9 English-upgrade guide confirms English for V9 Pro 1015 and X9 1003. Other language labels were inferred from three decoded factory voice prompts using multilingual speech recognition; this provenance is retained per entry.

## Distribution and transport

Factory images are excluded from source Git. Website builds retrieve unchanged originals and verify their pinned sizes and SHA256. A validated cache or previously published original is used if the vendor CDN is unavailable. Published same-origin assets allow catalog loading despite the vendor binaries lacking CORS headers. Vendor rights remain unchanged; see [THIRD_PARTY.md](../THIRD_PARTY.md).

The official updater uses WebHID. This project generates images but does not implement device flashing.

## Models outside the current firmware catalog

The [official manuals](https://www.mchose.store/pages/user-manual) list S9 and S9 Pro separately, as well as R9, V9 and G9 / G9 Pro. R9, ordinary V9, S9, S9 Pro and wired G9 do not have separate headset images in the production PC OTA manifest checked on 2026-11-13. This does not establish that no firmware exists elsewhere. They are not supported rebuild profiles; a similar model is not a substitute.

For any of the 8 catalog entries, select the model and language and use **Download original**. The editor retrieves the unchanged published base, checks its byte count, parses its firmware structure and checks SHA256 before passing it to the browser. The filename contains the model, language and version. This action does not replace the image or audio currently being edited. The original is a saved factory image, not a guarantee of recovery after a failed flash.
