# Build a custom notification sound

[Русский](rebuild.ru.md) · English · [简体中文](rebuild.zh.md)

1. Choose the exact headset model and language in the catalog, then load the base. Alternatively, select an original local `.bin`. The SHA256 must match an explicitly supported image. Do not select a receiver image or a previously modified build.
2. Inspect the actual resource list and preview an original. Friendly event labels are hints, not authoritative paths. Unknown audio formats remain visible but cannot be replaced by the AAC writer.
3. Choose your audio, set its start and end, then prepare it. The site creates mono 16 kHz PCM with short fades and a peak cap, encodes AAC-LC at 24 kbit/s, wraps it as ACT, unwraps and decodes it for the preview.
4. Listen to that final preview. Build and download the image and validation report. Program, DSP, bootloader, parameters and other sounds are preserved. The flash partition map and firmware version are not changed.
5. Install separately using the [official MCHOSE updater](https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select). Choose the **headset**, not its dongle. Charge the headset, use a stable connection, and do not interrupt writing. If the updater rejects the file/version, stop and record the error rather than guessing a higher version.
6. Power the headset fully off and on. Initially keep it off your ears until volume and sound are confirmed. Check the custom sound, other notifications, microphone and normal PC audio.

The only hardware-confirmed custom scenario is X9 English 1003 Power On. Other pinned profiles have static parsing and byte-identical no-op rebuild evidence, not physical playback evidence. Firmware modification can fail; a factory file is not a guaranteed recovery mechanism.

If you previously installed the experimental PCM application patch, first establish how the stock application will be restored. A same-version update may skip executable writing. This project never silently bumps versions or bypasses the updater.

There is no word-count restriction. The final encoded resource must fit its existing sound partition. Names and locations are preserved, and only the selected record is replaced. All current profiles have a 122880-byte sound partition, with different free space.

## Flash directly from this website?

The official updater uses **WebHID**. A compatible implementation is technically possible in supported Chromium browsers over HTTPS, with a user-triggered device chooser. This project currently **does not implement device flashing**: report framing, target identity, timeouts, interruption handling and actual hardware tests must be established separately. Downloading a valid image is not a test of an updater.
