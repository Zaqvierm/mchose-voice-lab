# MCHOSE Voice Lab

[Русский](README.ru.md) · [English](README.md) · 简体中文

这是一个独立的 MCHOSE 固件研究项目，以及在浏览器本地运行的提示音编辑器。

**网站：** https://zaqvierm.github.io/mchose-voice-lab/

选择目录中的耳机型号和固件语言，或提供本地固件。网站会读取该固件中实际存在的声音文件，支持试听原音、裁剪自己的音频、试听编码结果，并下载重建后的固件。

## 已验证的范围

- X9 的 ACT 实际包含经过简单封装的标准 AAC-LC ADTS。36 个中英文原厂文件、648 个音频帧均可正确解码，并逐字节还原。
- 当前官方 PC 升级目录列出 5 个型号、8 个耳机固件。这不等于所有历史 MCHOSE 产品。
- 这些镜像内共 144 个 ACT 均通过 AAC 结构检查与精确封装往返检查。8 个原始镜像均能进行不修改内容的重建，结果逐字节一致。
- 用户已在真实 X9、英文 1003 固件上确认自定义开机提示音可以播放。其他型号和各个提示音尚未逐一进行硬件测试。

构建仅允许明确列出的原始 SHA256。对未知镜像，只在能识别资源系统时提供查看功能，不会假定其他型号使用相同路径并直接修改。提示音列表来自实际镜像，友好名称仅供参考。

## 使用

[操作说明](docs/rebuild.zh.md) · [研究记录](docs/research.zh.md) · [目录来源](docs/firmware-catalog.md) · [验证范围](docs/validation.md)

音频和固件都在浏览器中处理，不会上传你的文件。网站不会连接 USB，也不会直接给耳机刷机。首次使用会下载约 31 MB 的音频引擎。

没有按字数或词数限制提示音。真正的约束是编码后资源的大小，以及原有声音分区的容量。源文件的 25 MB / 10 分钟限制用于控制浏览器资源占用。

原厂固件不存入源代码 Git。网站构建时会从厂商服务器获取并校验未修改的原厂镜像，以便在目录中直接选择，避免原服务器缺少 CORS 的问题。URL 与 SHA256 记录在 `public/catalog.json`。厂商固件的权利仍归相应权利人所有，本项目 MIT 许可证不适用于这些镜像或 FFmpeg 核心。

## 开发与贡献

Node.js 22+：`npm ci`、`npm test`、`npm run dev`。正式构建：`npm run build`。预览：`npm run preview`。通过 GitHub Actions / Pages 发布。

[参与者](CONTRIBUTORS.md)：Zaqvierm；OpenAI Codex 辅助研究、实现和文档；Qwen 提供独立讨论。本项目与 MCHOSE、Actions Technology 或 OpenAI 无隶属关系。

[原创代码 MIT 许可证](LICENSE) · [第三方声明](THIRD_PARTY.md)
