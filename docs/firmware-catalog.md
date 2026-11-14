# Official firmware catalog

Snapshot: 2026-11-14. Sources: [web updater](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfig_prod.json) and [desktop M HUB](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfigApp_prod.json). These are different catalogs.

13 original headset images across 8 wireless models. Receiver images, wired headsets, soundbars and unverified substitute-model images are excluded. Exact SHA256 and size values are recorded in [catalog.json](../public/catalog.json).

| Model | Branch / language | Version | Bytes | Workflow |
|---|---|---|---:|---|
| MCHOSE G9 Pro | Chinese | [0026](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/G9Pro/headset/0026.bin) | 755200 | Browser AAC/ACT |
| MCHOSE V9 Pro | Chinese | [0036](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Pro/headset/0036.bin) | 755712 | Browser AAC/ACT |
| MCHOSE V9 Pro | English | [1015](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Pro/headset/1015.bin) | 747008 | Browser AAC/ACT |
| MCHOSE X9 | Chinese | [0038](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/X9/headset/0038.bin) | 729088 | Browser AAC/ACT |
| MCHOSE X9 | English | [1003](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/X9/headset/1003.bin) | 743936 | Browser AAC/ACT |
| MCHOSE V9 Turbo+ | Chinese | [0033](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Turbo/headset/0033.bin) | 736768 | Browser AAC/ACT |
| MCHOSE V9 Turbo+ | English | [1002](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Turbo/headset/1002.bin) | 751616 | Browser AAC/ACT |
| MCHOSE V9 Turbo | Chinese | [0005](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9TurboBase/headset/0005.bin) | 736768 | Browser AAC/ACT |
| MCHOSE G9 V2 | Chinese | [0031](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/G9V2/headset/MCHOSEG9V2EARPHONEOTAV0031_afc773.bin) | 1009135 | Experimental offline CLI |
| MCHOSE V9 Turbo+ | Chinese | [0035](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Turbo/headset/0035.bin) | 736768 | Browser AAC/ACT |
| MCHOSE V9 Pro 2 | Language unverified | [0032](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9PRO2/headset/V9Pro20032headsetota_a874e5.bin) | 1217230 | Experimental offline CLI |
| MCHOSE V9 Pro 2 | Overseas (language unverified) | [1002](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9PRO2/headset/V9Pro2OVERSEAV1002headsetota_df41b5.bin) | 1229420 | Experimental offline CLI |
| MCHOSE R9 | Language unverified | [0018](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/R9/headset/R9V0018headsetota_1605a3.bin) | 1401976 | Experimental offline CLI |

## Validation

- Nine AOTA/AAC images: AOTA/XML CRCs, SDFS sums, 162 ACT resources, exact wrapper roundtrips and byte-identical no-change firmware rebuilds.
- V9 Pro 2 0032/1002 and R9 0018: bounded LZMA parsing, exact original repacks, 55 SBC resource tables/frame CRCs, factory byte lengths and bitpools.
- G9 V2 0031: verified JLFS key and bounds, seven root sections and 17 WTS sounds plus index, all extracted-file CRCs and exact outer roundtrip. Factory Power On listening was confirmed; modified-image boot was not.
- Offline source profiles are SHA256-pinned; all 72 SBC/WTS resources were tested with unchanged replacement reproducing each original. End-to-end custom audio builds cover both SBC bitpools and G9 WTS, with preview/report outputs.
- The only project custom-image hardware playback evidence remains X9 English 1003 Power On. Software checks do not establish device acceptance.

## Missing wireless originals

Ordinary V9, S9 and S9 Pro are documented manufacturer models, but separate verified headset images were not found in either checked production catalog. This does not prove that originals do not exist elsewhere. Driver packages and similar-model firmware are not treated as substitutes.

## Distribution

Factory firmware and audio are not committed to source Git. Website builds fetch unchanged manufacturer originals and verify exact hashes and sizes, using a validated cache or previous published original if necessary. Vendor rights remain unchanged. Offline codec executables are also excluded; users can retrieve exact pinned official tools with the CLI.

[Models and capabilities](compatibility.en.md) · [Offline instructions](offline.en.md) · [Additional format research](wireless.en.md) · [Third-party provenance](../THIRD_PARTY.md)
