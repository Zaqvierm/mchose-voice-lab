# MCHOSE X9 ACT resource format

Follow-up: [X9 key-table research and experimental custom bindings](bindings.en.md). Button builds modify application configuration; audio-only builds retain the complete application payload.

[Русский](research.ru.md) · English · [简体中文](research.zh.md)

## Result and scope

The examined MCHOSE X9 factory ACT resources contain **standard AAC-LC ADTS, 16 kHz, mono**, behind a fixed prefix and a reversible byte-pair transform. Custom Power On playback was verified on physical X9 headphones using an image whose program, DSP, bootloader and parameters remained factory-original.

This is a resource-format result, not a complete reverse engineering of the DSP. The exact headset SoC model was not established. `ACTIONS_CUCKOO` is a platform string, not a chip part number.

## Starting from the firmware

The analysis covered official Chinese/default 0038 and English 1003 headset images and receiver 0019. The outer AOTA container exposed `ota.xml`, `app.bin`, `tone.bin`, `mbrec.bin` and `param.bin`. Checksums, bounds and transport offsets were established first.

The inner partitions used a reversible plaintext-feedback transform. Static inspection of a public Actions SDK reference and a known `ACTHHTCA` header gave the feedback equations and the 32-bit initial state `0x01373373`. Tone/application/parameter data reset this state every 32 bytes; the bootloader used a different reset unit. LZMA application unpacking and SDFS resource extraction followed. SDFS uses additive little-endian 32-bit word sums, ignoring an incomplete final word, rather than CRC32 for every resource.

Replacing Power On with an unmodified factory Power Off worked on the device. This separated container rebuilding from audio-encoding correctness.

## Identification method

A legacy CELP-based ACT interpretation was rejected because it did not reconstruct valid factory audio. The observed frame-length fields instead suggested ADTS with swapped byte order. Candidate transforms were evaluated against complete streams, not only their initial signature.

## Recognizing ADTS, then proving it

The first encoded frame starts:

```text
E5 F7 54 68 16 10 15 48
```

Swap adjacent bytes and XOR the result with repeating `08 14`:

```text
FF F1 60 40 18 02 40 01
```

That is a valid ADTS header, not merely an AAC guess from the filename. Its fields give:

```text
audio object type = (header[2] >> 6) + 1 = 2  (AAC-LC)
sampling frequency index = (header[2] >> 2) & 15 = 8  (16000 Hz)
channel configuration = ((header[2] & 1) << 2) | (header[3] >> 6) = 1
frame length = ((header[3] & 3) << 11) | (header[4] << 3) | (header[5] >> 5) = 192
```

The actual wrapper transformation is:

```text
P[2*i]   = C[2*i+1] XOR 0x08
P[2*i+1] = C[2*i]   XOR 0x14
```

`P` begins with `F1 A2`, followed by ADTS AAC. An optional zero byte aligns X9 files to an even size. The semantic meaning of the prefix is unknown; we preserve it rather than invent a version definition. Inverse packing swaps the formula: `C[2*i]=P[2*i+1] XOR 0x14`, `C[2*i+1]=P[2*i] XOR 0x08`.

All 36 X9 files parse completely into 648 AAC frames, decode with FFmpeg without errors, and rewrap byte-identically. Speech recognition yielded “Power on”, “Power off” and “Low battery”; the factory recording was confirmed by listening. Previously named A/B blocks were explained by odd/even logical ADTS positions relative to swapped pairs, verified for all 648 old boundaries.

An independently retrieved factory CMF Watch Pro 2 sound partition supplied 11 more files / 432 AAC frames with the same transform. Some CMF alignment bytes are nonzero; the X9 writer does not generalize that detail without evidence.

## Custom sound and final proof

The test clip was encoded using ordinary FFmpeg AAC-LC, 16 kHz, mono, 24 kbit/s, with PNS/TNS disabled for the first test. After adding the prefix, padding and inverse transform, the resulting ACT was inserted into `V_POWON.act`. Other resources and executable payloads were checked byte-for-byte. The final image was extracted again and its audio compared with the preview. Playback was verified on physical headphones.

The hardware-tested image SHA256 is `e92501a68b7c7ca8b3d3434c454b7f8615068ee33d3b15017c41d4b7221478fb` (746496 bytes). That verifies one custom Power On scenario, not every generated image, all notification slots or other devices.

## Further catalog work

All eight current official headset images across five models use the inspected SDFS transform and AAC wrapper: 144 ACT resources. Each exact image has a full byte-identical no-op rebuild test. Resource lists differ by model, so the UI enumerates actual files instead of assigning an X9 path to another device. Only X9 English 1003 has the hardware evidence above.

See [catalog provenance](firmware-catalog.md), [validation](validation.md), [contributors](../CONTRIBUTORS.md) and the implementation in `src/firmware.mjs`.


## Additional wireless formats

[SBC/LZMA: V9 Pro 2, R9 · WTS/JLFS: G9 V2](wireless.en.md) · [CLI](offline.en.md) · [Models](compatibility.en.md)
