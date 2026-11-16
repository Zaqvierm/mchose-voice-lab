# Models and capabilities

[Русский](compatibility.ru.md) · [English](compatibility.en.md) · [简体中文](compatibility.zh.md)

The catalog contains 13 original images across 8 wireless models. The browser edits 9 AAC/ACT images across five models. A separate experimental CLI rebuilds 4 images across three models.

All nine browser profiles now support button editing and compatible custom-image re-editing. Power clicks are editable; its power-on/off hold is protected. [Versions, physical buttons and platform limits](binding-compatibility.md). The experimental offline profiles below support audio, not button rewriting.

| Headset | Original versions | Browser rebuilding | Offline tooling |
|---|---|---|---|
| MCHOSE G9 Pro | 0026 | Yes | Node CLI |
| MCHOSE V9 Pro | 0036 · 1015 | Yes | Node CLI |
| MCHOSE X9 | 0038 · 1003 | Yes | Node CLI |
| MCHOSE V9 Turbo+ | 0033 · 1002 · 0035 | Yes | Node CLI |
| MCHOSE V9 Turbo | 0005 | Yes | Node CLI |
| MCHOSE G9 V2 | 0031 | No | Experimental Python CLI |
| MCHOSE V9 Pro 2 | 0032 · 1002 | No | Experimental Python CLI |
| MCHOSE R9 | 0018 | No | Experimental Python CLI |

Ordinary V9, S9 and S9 Pro exist, but verified separate images were not found in the two official catalogs. No similar-model substitute is used. Wired headsets and soundbars are excluded.

Only the project X9 EN1003 Power On replacement has hardware playback evidence. Decoding and listening to the G9 original does not validate a modified-image boot.

[CLI](offline.en.md) · [Research](wireless.en.md) · [Official web manifest](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfig_prod.json) · [Official desktop manifest](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfigApp_prod.json)
