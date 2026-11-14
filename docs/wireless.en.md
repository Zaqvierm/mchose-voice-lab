# Wireless firmware formats

[Русский](wireless.ru.md) · English · [简体中文](wireless.zh.md)

## V9 Pro 2 and R9

Official V9 Pro 2 0032/1002 containers have 17 length-prefixed LZMA-alone blocks; R9 0018 has 18. Block lengths are big-endian. Decompression is bounded, block parameters are retained, and unchanged repacking matches every original byte.

Firmware strings identify BEST1306P / RTX5 and a flash mapping at `0x2C000000` with code offset `0x20000`. A pointer maps to a file offset by subtracting `0x2C020000`. An independent SBC scanner located frame runs; pointer/length records then separated 15 resources per Pro 2 image and 25 for R9. Every frame header CRC and every complete resource boundary was checked, followed by FFmpeg decoding. Fifteen distinct Pro 2 0032 sounds also occur byte-identically in R9.

These resources use 16 kHz mono SBC, 16 blocks, 8 subbands. Most have bitpool53 / 114-byte frames; three resources in Chinese Pro 2 and R9 use bitpool60 / 128-byte frames. Replacements preserve the selected resource's parameters, frame count, byte length and table. Other decoded image bytes must remain identical. The fixed footer `1d 34 57 be 00 00 02 2c` is not an ordinary CRC32 of the preceding image and is preserved.

Resource indices do not yet have independently verified event names. Hearing a phrase resembling “power on” is useful evidence but does not establish a firmware call-chain mapping. The CLI therefore exposes `prompt-00`, etc., rather than guessed event labels.

## G9 V2

Static inspection of the official HUB's compiled V8 dispatch confirmed that G9 V2 selects G9OTA.dll. The relevant native transfer path copies input file ranges into RCSP packets; it does not reveal the audio format. Matching the protocol to JieLi provided a format-family lead.

The actual image is JLFS with address-dependent, 32-byte ENC/SFC scrambling. A bounded 16-bit key search found `0xB1C7`; acceptance required meaningful headers, valid bounds and multiple CRCs, not a single accidental checksum match. The same key was independently confirmed on the official receiver image. The scrambler is reversible; this is not AES. Firmware strings include AC701N / AC7012F; no physical chip marking was inspected.

Seven root sections were validated. `tone_zh` contains an index and 17 named WTS files, including `power_on.wts`, `power_off.wts`, `mic_on.wts` and `mic_off.wts`. Header and payload CRC16 values match for all extracted files. The original Power On was decoded and its intelligible Chinese speech was confirmed by the project owner.

Official WTGv2 file converters decode these WTS files. Their encoder contains SKP_Silk symbols; that does not make WTS a standard SILK container. The official `tone.lua` conversion sequence includes a mandatory resampler. A 660 Hz positive control survived encode/decode with a measured peak of 660.46 Hz. A raw-PCM shortcut produced near-silence and was rejected.

The replacement keeps the file offset and all section sizes, fits within the original resource slot, updates file size/CRC/header CRC and the parent tone section CRC/header CRC. Other files, the index and all non-tone sections remain byte-identical. Four deliberate corruptions were rejected. A no-change outer roundtrip matches the original exactly.

## Evidence boundary and references

These are software/offline checks. No project hardware flash validation exists for Pro 2, R9 or G9 V2. The only project custom-image playback evidence remains X9 EN1003. G9 factory-audio listening is not evidence of a modified firmware boot.

- [i3sey's Pro 2 research](https://gitlab.com/i3sey/mchose-v9pro2-english): external LZMA/SBC and hardware-result lead. Our scanner, resource-table discovery and R9 comparisons were performed independently. Their hardware report is not ours.
- [kagaimiq/jl-misctools](https://github.com/kagaimiq/jl-misctools): JLFS and cipher-family reference. The particular G9 key, map and checks were independently verified.
- [JieLi RCSP documentation](https://doc.zh-jieli.com/SDKWiki/master/Jieli-Tech/WeChat-Mini-Program-OTA/3-bluetooth/2-ble-data-handler.html).
- [Official audio conversion sequence](https://github.com/Jieli-Tech/fw-AC63_BT_SDK/blob/master/cpu/bd19/tools/AC632N_config_tool/conf/source/tone/tone.lua). Vendor executables are not redistributed.
- [xqy2006/jsc2js](https://github.com/xqy2006/jsc2js): static V8 disassembler used during research, not a runtime dependency.

[Experimental CLI instructions](offline.en.md) · [Exact profiles and resource maps](../tools/offline-profiles.json)
