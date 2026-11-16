# Button profiles and compatible custom images

[Русский](bindings.ru.md) · [English](bindings.en.md) · [简体中文](bindings.zh.md)

All nine images already editable in the browser have individual button profiles. Physical roles are inferred from each model's factory configuration; identical numeric button names are not assumed across models. All custom-binding results remain software-validated, without a hardware flashing test.

| Model | Versions | Buttons presented | Action choices |
|---|---|---|---:|
| X9 | 0038 / 1003 | Power, G/Mode, Mic | 16 |
| G9 Pro | 0026 | Power, G/Mode, Mic | 16 |
| V9 Pro | 0036 / 1015 | Power, Mic; Mode actions share Power | 15 |
| V9 Turbo+ | 0033 / 0035 / 1002 | Power, G/Mode, Mic | 16 |
| V9 Turbo | 0005 | Power, G/Mode, Mic | 16 |

For example, X9 maps G/Mic to internal codes 7/9; G9 Pro uses 3/2; V9 Pro uses Power for playback and connection modes, with Mic on code 2. V9 Pro lacks an intact RGB template in these configurations, so the editor does not invent one. The compared media registration sequence and dispatch grouping match across these profiles; final runtime behavior still needs device testing.

## Existing custom firmware

The website accepts compatible images with custom AAC/ACT sounds and supported key assignments. No factory audio is substituted. It identifies the base through immutable boot/parameter fingerprints, a canonical AOTA header/XML fingerprint, and either the exact application hash or a normalized application fingerprint. Only the existing user key-table patch and its necessary SDFS sums are excluded from the normalized application hash. The actual table is then checked against its model policy.

Executable instructions, DSP and other application resources, GPIO/timing configuration, pairing records, bootloader and parameter map must match the known profile. Broken CRCs, an unknown code patch, altered device parameters or a damaged power binding are rejected. This is compatible custom-image support, not permission to rebuild arbitrary firmware dumps or unknown versions. Original files remain pinned by SHA256.

Editing keys copies the entire loaded sound partition byte-for-byte. Editing one sound retains all other loaded sounds and the loaded application, including custom bindings. Empty key edits produce a byte-identical result. The JSON report records both the known factory SHA256 and the actual input SHA256.

## Power behavior

Power clicks are editable: RGB on single-click can become connection switching, for example. The stock power-on/off record and its hold remain protected. The protection exists in the parser and builder, not just the selector. Other hold thresholds, pairing combinations and common event hooks are unchanged.

`Keep loaded` retains the current assignment. `Factory` restores only the selected gesture from that profile, including multiple context-specific factory actions. `Discard edit` removes a pending change and keeps the loaded image's assignment. None of these replace custom sounds.

## Other catalog models

| Model | Audio tooling | Button editing |
|---|---|---|
| V9 Pro 2, R9 | Experimental SBC/LZMA offline tools, best1306p / RTX5 family | Not supported: different executable/configuration layout; no verified key-table writer |
| G9 V2 | Experimental WTS/JLFS offline tools, Jieli family | Not supported: different firmware architecture and key configuration |

These four images remain original-download / experimental-audio profiles. They are not silently passed through the Actions/AAC key-table editor. Ordinary V9/S9/S9 Pro still have no verified separate original in the checked catalogs.
