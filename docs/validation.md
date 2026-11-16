# Validation record

## Profile-aware custom-image editing 1.4.0

All nine browser AAC/ACT originals have individual fingerprints and key policies. The music-registration sequence and normalized media-dispatch grouping were compared; key roles and user-patch lengths are extracted per image. G9 Pro uses different G/Mic codes; V9 Pro shares playback/Mode with Power and does not get a nonexistent separate G or RGB template.

Private integration tests exercised each profile through custom audio, Power-click/track binding edits, custom-image reopening, byte-identical empty key edits, further audio edits retaining bindings, and restoring only Power's click while retaining the other edits and sounds. Independent integrity-valid negative fixtures changed program code, parameters and the critical Power-hold record while repairing all outer checksums; compatible-image validation rejected each one.

The local browser loaded the existing hardware-tested Miku X9 image (source SHA256 `e92501a68b7c7ca8b3d3434c454b7f8615068ee33d3b15017c41d4b7221478fb`), changed Power single-click from RGB to connection switching and downloaded a 746,496-byte image, SHA256 `5f916a090f53ef162acc76fd0cc7e04a96dfd16bfd6217a5b512e3c48e8b90b2`. Independent Python verification found only app/XML changes relative to that custom input, with the sound partition byte-identical and Power control/pairing/instructions intact. The resulting custom application reopened successfully in the browser. V9 Pro's UI showed Power/Mic only. These new binding images were not flashed. Historical 1.2/1.3 records below describe the older all-Power-click lock; 1.4 protects the critical power hold while allowing click edits.

## Native-command editor 1.3.0 — 2026-11-16

The three-step editor exposes 16 whitelisted actions, with factory-template fallback for disabled X9 commands. The static audit records 56 unique IDs across six direct registrations; 40 lack factory CFG12/13 assignments. Registration is not hardware support or proof of a meaningful handler in every state.

All 16 actions were planned against the exact private original while retaining Power records. The test suite covers disabled-action templates without restoring old gestures, duplicate/unsupported/prototype-property inputs, the 56-ID catalog and three locale dictionaries. Existing audio-profile/no-op tests remain in place. Custom keys, combined audio/key builds and final decompression are checked in software.

The local browser selected G triple-click / Next track with no audio upload. Power's action control was disabled, the 17-option list included Factory + 16 actions, locale changes retained the selection, and per-gesture factory restore worked. The downloaded 743,936-byte image, SHA256 `5b5cab038a5175d9fb75c0e809305b1ece9e1050e4e9dc580c10730b6d31656e`, passed independent Python AOTA/application/SDFS checks and contained the intended `0B 07 03 00 10 00` entry. Instructions, Power and pairing configuration and other resources were unchanged. These remain software/UI-state checks; the file was not flashed and visual screenshot capture was unavailable.

## Experimental X9 button bindings — 2026-11-16

Exact X9 EN 1003 only. The builder reopens the SHA256-pinned original, overlays CFG records at their declared offsets, retains Power records and verifies the final decompressed application against the intended configuration. No-op output is byte-identical. Test builds preserve executable instructions, bootloader, parameter map, pairing configuration and other application resources. Custom bindings have no hardware proof; action labels are correlated with the official manual. See [button research](bindings.en.md).

The local browser built and downloaded an image assigning G triple-click to connection switching, without an audio upload. An independent Python decoder verified AOTA CRCs, application LZMA/header sums, application SDFS checksums, the intended key record, unchanged executable instructions and all other application resources, and preserved Power/pairing settings. The output was 743,936 bytes, SHA256 `872947cdcc0ccd3a7d52ac8acf4905a280eef71fef16249a24bdc7b19a840d8c`. This file was not flashed. Russian/English/Chinese UI switching retained the selected assignment. Browser screenshot capture was unavailable; these are UI-state and downloaded-artifact checks, not visual-layout proof.

2026-11-13. Evidence is separated by scope.

## Hardware

The project owner recognized the decoded factory X9 Power On voice and confirmed a custom Power On sound after installing image SHA256 `e92501a68b7c7ca8b3d3434c454b7f8615068ee33d3b15017c41d4b7221478fb`. The assistant did not perform flashing. Full regression of every notification, microphone, device mode or other headset model was not reported.

## Local private fixtures

- 36 X9 ACTs / 648 frames: complete ADTS parsing, FFmpeg decode without errors and byte-identical wrapper roundtrip.
- Independent CMF factory partition: 11 ACTs / 432 AAC frames; original container/partition checksums verified.
- 8 current MCHOSE factory headset images: download SHA256/size, AOTA/XML/CRC, SDFS sums, 144 ACT wrappers and fixed partition capacity checked.
- JavaScript no-op firmware rebuilds are byte-identical for all 8 profiles.
- JavaScript rebuilt the hardware-tested X9 custom image byte-identically to the independent Python builder.
- Browser end-to-end: select factory, load a synthetic WAV, trim 0.5–2.5 s, encode with the single-thread FFmpeg.wasm core, wrap ACT, build/download `.bin`. Independent Python AOTA/SDFS checks passed; executable payloads and the other 19 resources were unchanged; extracted audio was AAC-LC/16k/mono and decoded with no FFmpeg errors. This generated browser fixture was not flashed.

The manufacturer images, source audio and downloaded test image are not committed. Public CI runs synthetic structural/integrity tests. Tests requiring private originals are explicitly skipped unless `X9_LAB_ROOT` and/or `X9_CATALOG_ROOT` is set; a green public CI is not hardware evidence.

## Integrity checks

Pinned base SHA256, container/header/partition CRC32, XML metadata, SDFS directory/body/resource additive sums, unchanged executable payloads, unchanged non-target resources and final ACT extraction are checked. Negative controls cover bad magic, truncated byte pairs, malformed ADTS sync, wrong channels and corrupted factory images. An independent Python-generated feedback vector tests the port beyond self-inverse agreement.

No browser WebHID flasher is implemented or tested by this project.

## Multilingual editor and actual resource discovery

The revised interface was exercised in Russian, English and Simplified Chinese without losing the loaded audio, selection or prepared result. Catalog selection loaded a pinned factory image directly from same-origin published assets. G9 Pro exposed its actual `V_BATTLO.act` and did not inherit the X9 `V_MAXVOL.act` entry. Its factory sound could be decoded for audition.

A second browser-generated fixture replaced G9 Pro 0026 `V_BATTLO.act`, not Power On. The downloaded image passed independent Python AOTA/SDFS validation: protected payloads and the other 19 resources matched the original; extracted AAC decoded without errors. No G9 Pro was flashed. Narrow/mobile and desktop breakpoints were checked for horizontal overflow; temporary viewport overrides were cleared.
