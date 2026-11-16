# X9 key table and experimental rebuilding

[Русский](bindings.ru.md) · [简体中文](bindings.zh.md)

Button editing supports **the exact original X9 EN 1003 image only**, checked by full SHA256. It is software-validated, not hardware-tested. Other models and firmware versions are not assumed compatible.

## Evidence

The [official X9 manual](https://support.mchose.store/hc/en-us/articles/52491725066772-X9-Setup-Guide-Getting-Started-with-Your-Headsets) associates G with playback/connection modes, Mic with microphone/call control, and Power with power/lighting. Matching factory action patterns suggests `KEY_PLAY=Power`, `KEY_MENU=G`, `KEY_MODE=Mic`. These are manual/configuration correlations, not complete handler reverse engineering. The action labels remain experimental.

After the reversible partition transform and 15 LZMA chunks, `app.bin` expands to 1,095,413 bytes. Its SDFS at `0xBB774` contains `defcfg.bin` and `usrcfg.bin`. ARM function `0x1000131C` reads configuration ID 12 into a 240-byte buffer with six-byte entries. Function `0x100015A0` walks 40 ordinary entries and eight combination entries from ID 13. String tables identify single through five-click events and several hold events.

Each six-byte entry contains an action ID, internal key code, two additional bytes of incompletely established meaning, and a little-endian 16-bit gesture mask. The defaults contain 39 nonzero actions in 40 slots. The user configuration overlays ID 12 starting at offset 2 for 231 bytes, leaving 17 nonzero actions. This is factory configuration layering, not a count of physical buttons. Partial records must be applied at their declared offsets.

## Editor and protection

G and Mic support single through five clicks and the existing hold gesture. Choices are play/pause, connection switching, sound mode switching and microphone toggle. The planner copies existing factory action records, including additional fields, retains common `0x3A` hooks and never changes hold durations or multi-click timing windows.

Load X9 EN 1003, choose assignments and build. Audio is optional; a prepared sound can be included in the same image. The factory option leaves a gesture untouched. Download the image and its JSON report; install separately with the official updater.

Power is never editable. Its factory entries must remain byte-identical and a factory power action must exist. Only complete six-byte entries within the existing user ID 12 patch can change. Pairing combinations in ID 13, timing settings, executable instructions, bootloader, partition map and other resources remain unchanged. The smaller original system-slot capacity is enforced.

The builder repairs SDFS sums, the compressed application header, XML and AOTA CRCs, then decompresses the final application and verifies the intended table and unchanged instructions/resources. Checks run in the builder, not just the UI. They prevent removing power through this editor; they do not guarantee recovery from hardware failure, interrupted flashing or an as-yet untested compressed-stream variant. The website never flashes a device.

## Validation limits

No-op output is byte-identical to the factory image. Custom bindings are extracted again after rebuilding; negative tests reject unknown keys/actions, duplicate gestures and missing power. Private original-image tests are explicitly skipped when fixtures are unavailable. Newly compressed chunks and custom assignments still require hardware validation. Multi-click latency, all action contexts and complete action-ID dispatch remain unresolved. Arbitrary numeric IDs, GPIO changes, timing edits, power changes and pairing edits are not exposed. Hardware-tested X9 custom audio does not establish custom-binding compatibility.
