# MCHOSE Voice Lab

[Русский](README.ru.md) · [English](README.md) · 简体中文

在浏览器本地运行的 MCHOSE 提示音编辑器，以及 ACT/AAC 固件资源格式研究。

**[打开编辑器](https://zaqvierm.github.io/mchose-voice-lab/)** · [官方 PC 升级工具](https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select)

## 功能

- 从目录加载已校验的原始固件，或选择本地镜像。
- 读取实际声音资源，试听所选原音。
- 裁剪音频、编码 AAC-LC、封装 ACT 并生成固件。
- 保留程序、引导程序、分区表和其他资源。

所有处理均在浏览器中完成，不上传用户文件，也不直接给设备刷机。首次使用会加载约 31 MB 的音频引擎。

## 验证范围

目录包含 5 个型号、8 个官方镜像，每个均通过逐字节一致的无修改重建。全部 144 个 ACT 均通过 AAC 结构与精确封装往返检查。**硬件验证仅覆盖 X9 英文 1003 的开机提示音。** 其他配置仅经过软件验证。

未知镜像仅支持查看。源文件限制为 25 MB / 10 分钟，编码后的声音必须放得进原有分区。

[操作说明](docs/rebuild.zh.md) · [研究记录](docs/research.zh.md) · [固件目录](docs/firmware-catalog.md) · [验证记录](docs/validation.md) · [风险声明](DISCLAIMER.md)

## 开发

Node.js 22+：`npm ci`、`npm test`、`npm run dev`。正式构建：`npm run build`；预览：`npm run preview`。通过 GitHub Actions / Pages 发布。CLI 命令见 [English README](README.md)。

## 许可证与参与者

原创代码采用 [MIT](LICENSE)。厂商固件权利与 FFmpeg 许可证单独保留，见 [THIRD_PARTY.md](THIRD_PARTY.md)。原厂二进制文件和用户音频不存入源代码 Git。网站发布的原厂镜像保持不变并校验哈希。

维护者为 Zaqvierm，开发由 OpenAI Codex 辅助完成。[参与者](CONTRIBUTORS.md)。
