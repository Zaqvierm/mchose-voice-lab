# MCHOSE V9 Pro Russian prompts: experiment

This recipe builds Russian voice prompts for **MCHOSE V9 Pro headset firmware 1015**. It is an experimental community build, not an official MCHOSE language pack. It does not modify the receiver.

## What is confirmed

- The base is the official headset image 1015 with SHA-256 `4893aba8c1b8b6007c7bc4a6a7d5b4c449787773a4b720313e23e87eb4dc290b`.
- For the custom image containing eighteen replacement prompts, container and partition checksums were verified; the application, bootloader, and parameter partitions remained unchanged.
- The project owner reported that the official updater successfully installed the corrected build containing “Устройство подключено” (“Device connected”).
- Updater success confirms that it accepted and installed the image; it does not establish that every prompt has been acoustically verified. Evidence applies only to V9 Pro 1015 headset firmware, not its receiver, Turbo, X9, or other models.

## Build with your own audio

1. Obtain the official **V9 Pro headset 1015** image from MCHOSE and verify its SHA-256. The script rejects a different image or revision.
2. Prepare eighteen MP3 files, one for each resource ID in the Russian table. Use audio you have rights to use, such as your own recordings or generated speech. The private reference recording is not included; the generated community MP3 pack is linked below.
3. Install Node.js 22+, clone this project, run `npm ci`, then:

   ```sh
   node scripts/build-v9pro-ru-pack.mjs stock-V9Pro-1015.bin ./prompts ./V9Pro-1015-custom.bin
   ```

   `./prompts` must contain `V_BATLOW.mp3`, `V_BATTLO.mp3`, …, `V_USBDIS.mp3`. The script writes an image and adjacent JSON report. It does not upload files or flash a device.
4. Listen to every source prompt and review the integrity report. Keep the original image for your exact model and version before flashing.
5. Install separately with the official MCHOSE updater. Select the **headset**, not the receiver. Do not disconnect USB or power during writing; stop if the updater rejects the image.

Firmware modification can damage the device. Keeping a stock image does not guarantee recovery after a failed update. This is not official MCHOSE support.

See the [Russian phrase table and direct MP3 links](v9pro-russian-prompts.ru.md), [audio notes](../assets/v9pro-ru/README.md), and [validation record](validation.md).

