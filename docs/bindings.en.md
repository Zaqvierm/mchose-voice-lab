# MCHOSE button profiles and compatible custom images

[Русский](bindings.ru.md) · [简体中文](bindings.zh.md)

Button editing supports nine known AAC/ACT images across X9, G9 Pro, V9 Pro, V9 Turbo and V9 Turbo+, including compatible custom variants. [Versions, buttons and limits](binding-compatibility.md). Each has a separate layout/key policy. New bindings remain software-validated, not hardware-tested. The X9 investigation below is a case study; its offsets must not be reused for other models.

## Evidence

The [official X9 manual](https://support.mchose.store/hc/en-us/articles/52491725066772-X9-Setup-Guide-Getting-Started-with-Your-Headsets) associates G with playback/connection modes, Mic with microphone/call control, and Power with power/lighting. Matching factory action patterns suggests `KEY_PLAY=Power`, `KEY_MENU=G`, `KEY_MODE=Mic`. These are manual/configuration correlations, not complete handler reverse engineering. The action labels remain experimental.

After the reversible partition transform and 15 LZMA chunks, `app.bin` expands to 1,095,413 bytes. Its SDFS at `0xBB774` contains `defcfg.bin` and `usrcfg.bin`. ARM function `0x1000131C` reads configuration ID 12 into a 240-byte buffer with six-byte entries. Function `0x100015A0` walks 40 ordinary entries and eight combination entries from ID 13. String tables identify single through five-click events and several hold events.

Each six-byte entry contains an action ID, internal key code, two additional bytes of incompletely established meaning, and a little-endian 16-bit gesture mask. The defaults contain 39 nonzero actions in 40 slots. The user configuration overlays ID 12 starting at offset 2 for 231 bytes, leaving 17 nonzero actions. This is factory configuration layering, not a count of physical buttons. Partial records must be applied at their declared offsets.

## Editor and protection

Choose a button, gesture and action on the right. Both the factory and loaded assignments are shown. The physical button set is model-specific. Power clicks can be reassigned; the factory power-on/off hold remains protected. New edits are listed separately.

Profiles offer 15–16 choices: play/pause, tracks, media/call volume, call control, assistant requests and headset functions. Only intact factory templates available for that model are used; V9 Pro does not get an invented RGB template. Common `0x3A` hooks and factory timing settings remain unchanged.

Load a supported original or compatible custom image and build. Existing custom sounds are preserved byte-for-byte; audio input is optional. Keep loaded retains a current binding; Factory restores only that gesture, including context-specific factory actions; Discard edit removes only the pending change. A newly prepared sound can be included. The JSON report records the factory and actual input hashes. Install separately using the official updater.

Power clicks are editable. The exact factory power-on/off record and hold are protected, and a missing or altered power function is rejected in both input and output. Only complete six-byte entries within the existing user ID 12 patch can change. Pairing combinations in ID 13, timing settings, executable instructions, bootloader, partition map and other resources remain unchanged. The model's smaller original system-slot capacity is enforced.

The builder repairs SDFS sums, the compressed application header, XML and AOTA CRCs, then decompresses the final application and verifies the intended table and unchanged instructions/resources. Checks run in the builder, not just the UI. They prevent removing power through this editor; they do not guarantee recovery from hardware failure, interrupted flashing or an as-yet untested compressed-stream variant. The website never flashes a device.

## Validation limits

No-op output is byte-identical to the factory image. Custom bindings are extracted again after rebuilding; negative tests reject unknown keys/actions, duplicate gestures and missing power. Private original-image tests are explicitly skipped when fixtures are unavailable. Newly compressed chunks and custom assignments still require hardware validation. Multi-click latency, all action contexts and complete action-ID dispatch remain unresolved. Arbitrary numeric IDs, GPIO changes, timing edits, power changes and pairing edits are not exposed. Hardware-tested X9 custom audio does not establish custom-binding compatibility.

## Registration audit and native Bluetooth limits

All six located direct key-table registrations were inspected: main, btmusic, btcall, two LE Audio contexts and usound. They contain 56 unique IDs; 40 lack an assignment in factory X9 CFG 12/13. Registered does not mean implemented, useful or safe in every mode. [Full inventory](key-command-inventory.md) · [JSON](../public/key-commands.json). Language actions `0x25`–`0x27` reach `VOICE_LANG` persistence, but are restricted because a second voice set is not established. Unknown and service actions are not given invented labels or exposed as selectable commands.

Previous/next dispatch reaches internally named media commands. Assistant start/stop reaches HFP voice-recognition paths with a support check and a Siri-named log. This requests the phone's supported assistant; it cannot choose an arbitrary application. [AVRCP](https://files.bluetooth.com/wp-content/uploads/dlm_uploads/2024/10/AVRCP_v1.6.3.pdf) provides native media control and [HFP](https://www.bluetooth.com/specifications/specs/hands-free-profile-1-7-2/) call/voice functions. Android routes media buttons to a system-selected [MediaSession](https://developer.android.com/media/legacy/media-buttons). Phone/player compatibility remains a separate requirement.

The ID 13 combination table stores two key codes, a gesture mask and an action ID. A stock two-button hold exists for pairing; this does not establish arbitrary fast sequences or configurable timing. A combination selects an existing action, not an app-launch instruction or macro script. RGB, sound mode and microphone controls may remain local to the headset. USB HID code does not establish a Bluetooth HID keyboard. Arbitrary shortcuts, app launches and multi-command macros are not implemented; they require matching phone-side support or additional firmware/profile work.
