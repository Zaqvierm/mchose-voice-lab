# 实验性离线构建

[Русский](offline.ru.md) · [English](offline.en.md) · 简体中文

Python CLI 仅接受准确匹配的官方原始镜像：V9 Pro 2 0032/1002、R9 0018、G9 V2 0031。已完成文件结构与修改范围验证，**本项目尚未在这些耳机上验证修改后的固件**。工具不会搜索设备或刷机。浏览器编辑器仍用于九个 AAC/ACT 镜像；这四个镜像采用独立的离线流程。

下载或克隆仓库，并完整保留 `tools` 目录。需要 Python 3.10+（含 LZMA）以及 PATH 中的本机 FFmpeg。G9 的 WTS 转换另外需要 Windows 和经过哈希校验的官方音频工具。用户音频和固件均在本地处理。

1. 从[网站](https://zaqvierm.github.io/mchose-voice-lab/)下载准确型号和版本的原始固件。
2. 查看并提取实际声音资源：

```sh
python tools/voice_lab.py inspect original.bin
python tools/discover.py original.bin > discovery.json
python tools/voice_lab.py extract original.bin --directory extracted-sounds
```

3. 仅 G9 需要下载官方文件转换器。此命令验证 SHA256，不运行转换器：

```sh
python tools/voice_lab.py prepare-tools --tools-dir tools/vendor-tools
```

4. 选择短音频片段，使用 `inspect` 列出的资源名称生成实验镜像：

```sh
# V9 Pro 2 / R9：编号资源，尚未独立确认对应的事件
python tools/voice_lab.py replace original.bin --resource prompt-00 --audio voice.wav --start 0 --duration 0.4 --output custom.bin --experimental

# G9 V2：实际原厂文件名
python tools/voice_lab.py replace original.bin --resource tone_zh/power_on.wts --audio voice.wav --duration 0.4 --output custom.bin --experimental
```

同时生成 `custom.preview.wav` 和 `custom.report.json`。考虑安装前应先试听。生成成功不代表设备一定接受文件。工具拒绝覆盖原始文件或已有输出，不修改版本号，不绕过升级工具检查。请按厂商针对准确型号的说明单独安装；不能假定网站所链接的官方网页升级工具支持全部型号。

SBC 保留原始字节数、帧数及 bitpool（53 或 60）。短音频补静音，过长片段直接拒绝，不会自动截断。WTS 必须放入原有槽位；地址和镜像总大小保持不变。源音频最大 25 MB；WTS 片段最大 30 秒，但实际槽位通常只容纳更短的声音。可用 `--ffmpeg` 指定 FFmpeg 路径。G9 转换器仅在哈希匹配后运行。

X9、G9 Pro、V9 Pro 和 Turbo 的 AAC/ACT 镜像继续使用浏览器或[原有 CLI](rebuild.zh.md)。原厂固件及提示音不包含在源码归档中。
