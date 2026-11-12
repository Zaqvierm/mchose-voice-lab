# Official headset firmware catalog

Checked: 2026-11-12T19:06:14.505106+00:00

Source: https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfig_prod.json

## Scope and language evidence

All 8 headset images in the official production PC OTA manifest: 5 models. Dongles and bases excluded. This is not a claim to cover every MCHOSE headset ever sold. The manifest encodes type 0/1/null, not language names. English for V9 Pro 1015 and X9 1003 is supported by the official guide; remaining language labels are inferred from three decoded voice clips with multilingual Whisper tiny and are explicitly marked. Only pinned X9 1003 has the original verified-x9 customization profile.

Official client builds URLs as `./otaFile/${config.dir}/${kind}/${entry.fileName}`. Only `headset` entries were included. It maps `foreign=1` to `versionType=1`, then selects `headset.type=1`; otherwise it selects the default/first branch. The official guide is titled V9 Pro/X9 Headset English And Battery Data Firmware Prompt Upgrade Tutorial, links the foreign=1 route, instructs selecting V9 Pro or X9, and states the headset voice prompts will be switched to English. This confirms English for V9 Pro 1015 and X9 1003. For other models the client confirms the foreign branch, not its spoken language. The `zh_CN` / `en_US` strings in the client are UI localization and do not independently prove audio language. No guessed firmware paths, historical versions, or unrelated device files were added.

## Verified downloads

| Model | Type | Version | Bytes | tone.bin | tone capacity | Customization |
|---|---|---|---:|---:|---:|---|
| MCHOSE G9 Pro | None | [0026](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/G9Pro/headset/0026.bin) | 755200 | 88416 | 122880 | unverified |
| MCHOSE V9 Pro | 0 | [0036](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Pro/headset/0036.bin) | 755712 | 88416 | 122880 | unverified |
| MCHOSE V9 Pro | 1 | [1015](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Pro/headset/1015.bin) | 747008 | 79904 | 122880 | unverified |
| MCHOSE X9 | 0 | [0038](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/X9/headset/0038.bin) | 729088 | 61760 | 122880 | unverified |
| MCHOSE X9 | 1 | [1003](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/X9/headset/1003.bin) | 743936 | 76736 | 122880 | verified-x9 |
| MCHOSE V9 Turbo+ | 0 | [0033](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Turbo/headset/0033.bin) | 736768 | 61824 | 122880 | unverified |
| MCHOSE V9 Turbo+ | 1 | [1002](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9Turbo/headset/1002.bin) | 751616 | 76736 | 122880 | unverified |
| MCHOSE V9 Turbo | None | [0005](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/V9TurboBase/headset/0005.bin) | 736768 | 61824 | 122880 | unverified |

All eight URLs returned HTTP 200. Exact SHA256 hashes and byte counts are in `public/catalog.json`. No firmware, OEM audio, SDK code, or executable utility is redistributed in the project.

## Browser CORS

GET requests used `Origin: https://zaqvierm.github.io`. The manifest returned `Access-Control-Allow-Origin: *`. All eight firmware downloads returned no `Access-Control-Allow-Origin` header. X9 1003 was rechecked with two query-string variants; both still returned HTTP 200 without that header. `Timing-Allow-Origin: *` is present but does not grant fetch access. These checks inspect actual server response headers; they are not a browser playback or flashing test.

A cross-origin browser fetch of the firmware is therefore expected to fail CORS. A direct navigation/download link and local factory-file selection remain usable. Do not silently substitute an unverified proxy, guess alternate CDN paths, or bundle OEM binaries to work around this.

## Static resource compatibility

All eight pass the existing offline AOTA parser: 1024-byte header, header/data CRC32, per-file CRC32 and XML partition sizes/checksums. All contain `ota.xml`, `app.bin`, `tone.bin`, `mbrec.bin`, `param.bin`. Sizes differ per image.

The existing X9 32-byte-unit resource transform with the same initial seed decodes every tone.bin to SDFS. All SDFS directory, body and individual file additive checksums pass; decoded tone re-encodes byte-identically. Every image has 20 tone entries: 18 ACT voice files, readme and T_RING.pcm. All 144 ACTs pass the existing AAC wrapper and complete ADTS parser and wrap back byte-identically; every frame is AAC-LC, 16000 Hz, mono. All eight transformed parameter tables contain one aligned fw0_sdfs record with capacity 122880 bytes. This validates static parsing and existing audio wrappers, not modified-image acceptance or hardware playback.

G9 Pro and both V9 Pro images contain V_BATTLO.act and omit V_MAXVOL.act. X9, V9 Turbo+ and V9 Turbo images contain V_MAXVOL.act and omit V_BATTLO.act. Actual complete names are per-entry toneResourceNames in the catalog; consumers must enumerate the selected image rather than assume an X9 list.

The exact original X9 1003 hash is the only verified-x9 customization entry. Other entries remain unverified even though staticValidated is true. Enabling other hashes requires explicit per-image profiles and full no-op container rebuild verification. No-op tone transform and ACT wrapper roundtrips alone do not prove the whole repacker or a modified image.

## Official web transport

The downloaded official production JS uses WebHID: navigator.hid.requestDevice, HIDDevice.open, sendReport and inputreport events. No navigator.usb / WebUSB transport was found. Its updater requests the selected model VID/PID, checks the product name, initializes the selected headset/dongle target, streams firmware in HID reports, reacts to pause/resume and completion/error notifications, and waits for reboot. Local-file selection exists as a separate route. The protocol is accessible in the client source, but has not been ported, executed, or tested against hardware here.

## Local audit evidence

Downloaded OEM inputs and detailed static reports are kept outside this repository under `../../work/mchose-catalog-20261113/` (relative to the project directory). Files: `verified-downloads.json`, `structure-report.json`, each original .bin, and per-image parts/tone directories. Local parsers used: `work/mchose-x9/aota_inspect.py`, `x9_decode.py`, `act_aac_codec.py`. No SDK binaries were run.

## Bounded audio language inference

Each original V_POWON.act, V_POWOFF.act and V_BATLOW.act was decoded using the statically verified ACT wrapper and FFmpeg 8.1.2 to 16 kHz mono PCM, concatenated with 250 ms gaps, and checked once with OpenAI Whisper tiny (multilingual, CUDA). No language was forced. These are model language scores on short samples, not calibrated certainty and not OEM declarations. Only these three clips were transcribed per image.

| Image | Inferred language | Model score | Transcript |
|---|---|---:|---|
| G9Pro-0026 | zh | 0.996748 | 開機關機電量不足請及時充電 |
| V9Pro-0036 | zh | 0.996748 | 開機關機電量不足請及時充電 |
| V9Pro-1015 | en | 0.987048 | Power on. Power off. Low battery. |
| V9Turbo-0033 | zh | 0.997408 | 開機 關機 電量不足請及時充電 |
| V9Turbo-1002 | en | 0.987048 | Power on. Power off. Low battery. |
| V9TurboBase-0005 | zh | 0.997408 | 開機 關機 電量不足請及時充電 |
| X9-0038 | zh | 0.997408 | 開機 關機 電量不足請及時充電 |
| X9-1003 | en | 0.987048 | Power on. Power off. Low battery. |

Raw top-five probabilities and transcripts: local work/mchose-catalog-20261113/language-inference.json. Sample WAVs and official tiny checkpoint remain outside the repository. Catalog uses languageEvidence to distinguish official-guide confirmation from inferred-from-audio labels.

## Website packaging and repacker update

The parent implementation added explicit profiles for all eight SHA256 values and verified complete no-op AOTA rebuilds byte-identically. X9 1003 remains the only hardware-tested PowerOn scenario; other images are static-only profiles.

Source Git excludes OEM binaries. The website build retrieves each pinned original into ignored public/firmware and publishes those unchanged vendor assets for one-click catalog loading. Runtime uses same-origin assets and retains official source links. Vendor rights are not covered by the project MIT license.
