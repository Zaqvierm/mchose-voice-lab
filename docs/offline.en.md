# Experimental offline rebuilding

[Русский](offline.ru.md) · English · [简体中文](offline.zh.md)

The Python CLI supports the exact official V9 Pro 2 0032/1002, R9 0018 and G9 V2 0031 images. These profiles have file-level validation, **not project hardware-flash validation**. The tool never discovers or flashes devices. The browser editor remains available for the nine AAC/ACT bases; these four profiles use the separate workflow below.

Download the repository source archive or clone it. Keep the `tools` directory together. Requirements: Python 3.10+ with LZMA support and a native FFmpeg executable on PATH. G9 WTS conversion additionally requires Windows and the hash-pinned official audio tools. User audio and firmware stay local.

1. Download your exact original from the [site](https://zaqvierm.github.io/mchose-voice-lab/).
2. Inspect and list actual resources:

```sh
python tools/voice_lab.py inspect original.bin
python tools/discover.py original.bin > discovery.json
python tools/voice_lab.py extract original.bin --directory extracted-sounds
```

3. For G9 only, download the official file-conversion tools. This command checks SHA256 and does not execute them:

```sh
python tools/voice_lab.py prepare-tools --tools-dir tools/vendor-tools
```

4. Build an experimental image with a short audio selection. Use a resource name printed by `inspect`:

```sh
# V9 Pro 2 / R9: numbered resources, events not independently mapped
python tools/voice_lab.py replace original.bin --resource prompt-00 --audio voice.wav --start 0 --duration 0.4 --output custom.bin --experimental

# G9 V2: actual factory filenames
python tools/voice_lab.py replace original.bin --resource tone_zh/power_on.wts --audio voice.wav --duration 0.4 --output custom.bin --experimental
```

The output includes `custom.preview.wav` and `custom.report.json`. Listen to the preview before considering any installation. A successful build is not proof of device acceptance. Existing originals and outputs are never overwritten. The tool does not change version numbers or bypass updater checks. Follow model-specific vendor installation instructions; the site linked updater is not assumed to support every model.

SBC replacements preserve the original byte length, frame count and bitpool (53 or 60). Short selections are padded; oversized selections are rejected instead of silently shortened. WTS replacements must fit the original slot; offsets and total image size remain unchanged. Source audio is limited to 25 MB; WTS selections are limited to 30 seconds and usually need to be much shorter to fit. Pass `--ffmpeg /path/to/ffmpeg` if necessary. G9 vendor tools are used only after their hashes match the manifest.

For X9, G9 Pro, V9 Pro and Turbo AAC/ACT profiles use the browser or the [existing CLI](rebuild.en.md). No firmware or factory voice samples are included in the source archive.
