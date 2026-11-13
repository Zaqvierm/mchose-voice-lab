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

The [official manuals](https://www.mchose.store/pages/user-manual) list S9 and S9 Pro separately, as well as R9, V9 and G9 / G9 Pro. Ordinary V9, S9 and S9 Pro do not have separate headset images in either production PC manifest checked on 2026-11-13. R9 was subsequently found in the desktop manifest, as recorded below; wired G9 is excluded. This does not establish that no firmware exists elsewhere. They are not supported rebuild profiles; a similar model is not a substitute.

For any of the 13 catalog entries, select the model and language and use **Download original**. The editor retrieves the unchanged published base, checks its byte count and SHA256 (and parses AOTA structure for editable images) before passing it to the browser. The filename contains the model, language and version. This action does not replace the image or audio currently being edited. The original is a saved factory image, not a guarantee of recovery after a failed flash.

## Extended wireless audit: desktop M HUB catalog

The installed official M HUB uses a separate manifest: [otaConfigApp_prod.json](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfigApp_prod.json). Checking only the web updater misses current wireless models.

| Model / image | Result in Voice Lab |
|---|---|
| V9 Turbo+ 0035 | AOTA / 18 AAC-LC ACT voices; editable after exact no-op validation |
| G9 V2 0031 | Different container, not accepted by the AOTA parser; original download only |
| V9 Pro 2 0032 and overseas 1002 | 17 LZMA blocks; different firmware architecture; original download only |
| R9 0018 | 18 LZMA blocks; not AOTA/ACT; original download only |
| V9, S9, S9 Pro | Wireless models confirmed by official manuals; no separate headset payload in either checked manifest. No substitute image or rebuild support added. |

G9 wired and soundbars K20/K20 Pro/K20 GT are excluded. Driver modules (including K9 and hardware revisions) alone do not establish an available flashable headset image. Product names in regulatory filings alone are not treated as released compatible models.

The Pro 2 [independent reverse-engineering project](https://gitlab.com/i3sey/mchose-v9pro2-english) documents SBC prompts and a different container. Its hardware evidence belongs to that project, not this site's parser. LZMA unpacking of both Pro 2 originals and R9 was verified offline with bounded block decompression; no headset was flashed. G9 V2's encoding and R9 audio codec are not established here. Language of the new non-AOTA images has not been independently listened to; overseas is shown as a branch label.

Current totals: 13 original images / 8 wireless models; editing enabled for 9 exact AAC/ACT images / 5 models, with 162 validated ACT resources. Original download is SHA256/size checked for all formats. Only X9 EN 1003 Power On has our hardware playback evidence.
