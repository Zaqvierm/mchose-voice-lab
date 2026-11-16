# X9 EN 1003: key-command registration inventory

[Русский: исследование](bindings.ru.md) · [English](bindings.en.md) · [简体中文](bindings.zh.md)

2026-11-16. Read-only static audit of the exact original X9 EN 1003 image. Six direct registrations contain 56 unique IDs; 40 have no factory assignment in ordinary CFG12 or combination CFG13. A registered ID is not proof of a useful implementation in every state. The editor exposes 16 constrained actions; all hardware results remain unverified.

[Machine-readable inventory](../public/key-commands.json). `factory` below means an assignment in these two factory configuration tables, not proof the relevant feature is active. Firmware/NVRAM runtime overrides are outside this snapshot.

| ID | Registered contexts | Factory gesture | Editor status / action |
|---|---|---|---|
| 0x01 | main | yes | Protected service / power / pairing; not editable |
| 0x02 | main | no | Protected service / power / pairing; not editable |
| 0x03 | main | yes | Protected service / power / pairing; not editable |
| 0x04 | main | no | Protected service / power / pairing; not editable |
| 0x05 | main | no | Registered; full semantics or implementation unresolved |
| 0x06 | main | no | Registered; full semantics or implementation unresolved |
| 0x07 | main | no | Protected service / power / pairing; not editable |
| 0x08 | main | no | Protected service / power / pairing; not editable |
| 0x09 | btmusic, le_media, usound | yes | Play / pause |
| 0x0A | btmusic, le_call, le_media, usound | no | Previous track |
| 0x0B | btmusic, le_media, usound | no | Next track |
| 0x0C | btmusic | no | Registered; full semantics or implementation unresolved |
| 0x0D | btmusic | no | Registered; full semantics or implementation unresolved |
| 0x0E | btmusic | no | Registered; full semantics or implementation unresolved |
| 0x0F | btmusic | no | Registered; full semantics or implementation unresolved |
| 0x10 | btmusic, le_media, usound | yes | Media volume up |
| 0x11 | btmusic, le_media, usound | yes | Media volume down |
| 0x12 | btmusic | no | Registered; full semantics or implementation unresolved |
| 0x13 | btmusic | no | Registered; full semantics or implementation unresolved |
| 0x14 | btcall, le_call | yes | Call volume up |
| 0x15 | btcall, le_call | yes | Call volume down |
| 0x16 | btcall, le_call | yes | Answer call |
| 0x17 | btcall, le_call | yes | Reject call |
| 0x18 | btcall, le_call | yes | End call |
| 0x19 | btcall, le_call | no | Registered; full semantics or implementation unresolved |
| 0x1A | btcall, le_call | no | Registered; full semantics or implementation unresolved |
| 0x1B | btcall, le_call | no | Registered; full semantics or implementation unresolved |
| 0x1C | btcall, le_call | no | Registered; full semantics or implementation unresolved |
| 0x1D | btcall, btmusic, le_call, le_media, usound | yes | Microphone toggle |
| 0x1E | main | no | Registered; full semantics or implementation unresolved |
| 0x1F | main | no | HFP voice-assistant request |
| 0x20 | btcall, le_call, main | no | Stop HFP voice assistant |
| 0x21 | main | no | Registered; full semantics or implementation unresolved |
| 0x22 | main | no | Registered; full semantics or implementation unresolved |
| 0x23 | main | yes | Protected service / power / pairing; not editable |
| 0x24 | main | no | Protected service / power / pairing; not editable |
| 0x25 | main | no | Voice-language selection; second resource set unverified |
| 0x26 | main | no | Voice-language selection; second resource set unverified |
| 0x27 | main | no | Voice-language selection; second resource set unverified |
| 0x2C | btcall, btmusic, le_media, usound | yes | Lighting toggle |
| 0x31 | main | no | Registered; full semantics or implementation unresolved |
| 0x32 | main | no | Registered; full semantics or implementation unresolved |
| 0x33 | main | no | Registered; full semantics or implementation unresolved |
| 0x34 | main | no | Registered; full semantics or implementation unresolved |
| 0x35 | main | no | Registered; full semantics or implementation unresolved |
| 0x36 | btmusic, le_media, usound | yes | Switch sound mode |
| 0x37 | main | no | Registered; full semantics or implementation unresolved |
| 0x38 | main | yes | Switch connection |
| 0x39 | main | no | Registered; full semantics or implementation unresolved |
| 0x3A | main | yes | Registered; full semantics or implementation unresolved |
| 0x3B | btcall, le_call, le_media, usound | no | Registered; full semantics or implementation unresolved |
| 0x3D | le_media, usound | no | Registered; full semantics or implementation unresolved |
| 0x3E | le_media, usound | no | Registered; full semantics or implementation unresolved |
| 0x3F | le_media, usound | no | Registered; full semantics or implementation unresolved |
| 0x40 | le_media, usound | no | Registered; full semantics or implementation unresolved |
| 0x43 | btmusic | no | Registered; full semantics or implementation unresolved |

## Concrete dispatch evidence

Reproduce the table counts from a checksum-pinned original without accessing headphones:

```sh
npm ci
node scripts/audit-keys.mjs ORIGINAL-X9-1003.bin
```

The audit decrypts/decompresses the selected exact original, reads all six registered lengths and overlays ordinary/combination configuration records. It emits JSON to stdout and does not modify the image or any device.

- Registration arrays: main `0x1009C450` / 27 entries; btmusic `0x1009C5D0` / 15; btcall `0x1009C648` / 13; LE call `0x1009C754` / 13; LE media `0x1009C7B4` / 13; usound `0x1009C87C` / 13. Their callsites to the key-map builder are recorded in the research notes. Shared/adjacent data is not deduplicated by guessing; unique action IDs are counted after reading each registered length.

- Track direction is verified by code, not voice filenames: action `0x0A` -> `0x100077EC` -> `0x1008DCF0` -> LE wrapper `0x1008E3F8` -> command `0x5F`, named `MEDIA_PLAY_PREV`. Action `0x0B` -> `0x10007802` -> `0x1008DCC6` -> `0x1008E3FC` -> command `0x60`, named `MEDIA_PLAY_NEXT`. The alternative transport paths are also present. USB-side branches send separate media-control masks.

- Assistant request `0x1F` -> main case `0x10003A62` -> `0x1008DFE6` -> `0x1003F3C0`; stop `0x20` -> `0x10003A68` -> `0x1008E002` -> `0x1003F40C`. The functions check capabilities, use an `unsupport siri` log and send native voice-recognition messages. They do not encode an arbitrary app name.

- Notification-language IDs `0x25`–`0x27` reach `0x10004368`, persist `VOICE_LANG` and choose a language notification. A second prompt set is not established for this image, so they are not exposed.

- Media volume `0x10`/`0x11` uses signed +1/-1 calls in the music dispatcher. Call volume `0x14`/`0x15`, answer `0x16`, reject `0x17`, terminate `0x18` and microphone `0x1D` have distinct call-dispatch branches; call state gates remain in the factory code. RGB `0x2C` reaches the `RGB_ON` toggle/persistence branch.

This is a complete inventory of the six located direct registration tables, not a claim that every firmware control path, Bluetooth service, native SDK command or indirect table has been recovered. Unknown IDs remain non-selectable; no service/test/reset or arbitrary numeric-action interface is added.
