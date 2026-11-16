# MCHOSE Voice Lab

[Русский](README.ru.md) · [English](README.md) · 简体中文

MCHOSE 提示音编辑与固件音频研究：浏览器支持 AAC/ACT，实验性本地工具支持 SBC/LZMA 和 WTS/JLFS。

**[打开编辑器](https://zaqvierm.github.io/mchose-voice-lab/)** · [官方 PC 升级工具](https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select)

## 功能

- 从目录加载已校验的原始固件，或选择本地镜像。
- 读取实际声音资源，试听所选原音。
- 裁剪音频、编码 AAC-LC、封装 ACT 并生成固件。
- X9 英文 1003 实验性自定义按键：G / Mic、单击至五击及原有长按。构建器禁止修改电源键。
- 仅编辑提示音时保留整个应用；编辑按键时仅修改应用内的按键配置，保留可执行指令、引导程序、分区参数及其他资源。

参见[按键表研究与使用说明](docs/bindings.zh.md)。自定义按键尚无实机验证，功能名称根据官方说明书对应。长按时长及配对组合不可编辑。

所有处理均在浏览器中完成，不上传用户文件，也不直接给设备刷机。首次使用会加载约 31 MB 的音频引擎。

## 验证范围

目录包含 8 个无线型号的 13 个原始镜像。其中 5 个型号的 9 个 AAC/ACT 镜像支持编辑并通过逐字节一致的无修改重建，其余 4 个仅提供原始文件下载。全部 162 个 ACT 均通过 AAC 结构与精确封装往返检查。**硬件验证仅覆盖 X9 英文 1003 的开机提示音。** 其他配置仅经过软件验证。

未知镜像仅支持查看。源文件限制为 25 MB / 10 分钟，编码后的声音必须放得进原有分区。

[操作说明](docs/rebuild.zh.md) · [研究记录](docs/research.zh.md) · [固件目录](docs/firmware-catalog.md) · [验证记录](docs/validation.md) · [风险声明](DISCLAIMER.md)

## 常见问题

### 如何更换 MCHOSE 耳机的提示音？

打开[编辑器](https://zaqvierm.github.io/mchose-voice-lab/)，选择准确的型号和原厂固件语言，加载原始镜像并选择提示音。添加自己的音频、裁剪片段、试听结果，然后下载生成的 `.bin`。安装步骤见[操作说明](docs/rebuild.zh.md)。

### 如何自定义 MCHOSE 开机提示音（Power On）？

从镜像的实际资源列表中选择 `V_POWON.act`（开机）。可以使用录音、音乐或短提示音。列表来自已加载的固件，事件名称仅供参考。开机提示音替换已在 X9 英文固件 1003 上通过硬件验证。

### 支持 MCHOSE V9 Pro、V9 Turbo 和 G9 Pro 吗？

目录包含 X9、V9 Pro、V9 Turbo+、V9 Turbo 和 G9 Pro，共 13 个原始镜像（包含仅可下载的型号）。可选语言因型号而异。9 个 AAC/ACT 镜像经过结构和重建验证，但硬件验证仅覆盖 X9 EN 1003。未知镜像可以查看，不能用于生成修改后的固件。

### 网站能直接给耳机刷机吗？

不能。网站生成固件文件，安装需单独使用[官方 MCHOSE PC 升级工具](https://cdn.mchose.com.cn/OTA/PC/prod/index.html#/select)。请选择耳机，而非接收器。若升级工具拒绝文件，不要通过修改版本号绕过检查。

### 需要单独的 ACT 编码器吗？音频会上传到哪里？

不需要其他工具。编辑器在浏览器中编码 AAC-LC，并封装为兼容的 ACT 文件。用户音频和固件不会上传到服务器。首次处理音频时会下载约 31 MB 的音频引擎。

### 自定义提示音有长度限制吗？

没有字数限制。源文件不得超过 25 MB 或 10 分钟；编码后的声音必须与其他资源一起放入原有分区。空间不足时，请缩短片段。

### 可以恢复原厂提示音吗？

修改前，请保存与型号和语言完全匹配的原始镜像。如果官方升级工具接受该镜像，可用它恢复。保留原始文件不代表一定能从刷写中断或失败中恢复，详情见[操作说明](docs/rebuild.zh.md)和[风险声明](DISCLAIMER.md)。

## 开发

Node.js 22+：`npm ci`、`npm test`、`npm run dev`。正式构建：`npm run build`；预览：`npm run preview`。通过 GitHub Actions / Pages 发布。CLI 命令见 [English README](README.md)。

## 许可证与参与者

原创代码采用 [MIT](LICENSE)。厂商固件权利与 FFmpeg 许可证单独保留，见 [THIRD_PARTY.md](THIRD_PARTY.md)。原厂二进制文件和用户音频不存入源代码 Git。网站发布的原厂镜像保持不变并校验哈希。

维护者为 Zaqvierm，开发由 OpenAI Codex 辅助完成。[参与者](CONTRIBUTORS.md)。


## 实验性离线配置

[V9 Pro 2 / R9 / G9 V2: CLI](docs/offline.zh.md) · [型号](docs/compatibility.zh.md) · [研究](docs/wireless.zh.md)

这些型号在浏览器中提供原始文件及独立离线流程链接。Python CLI验证准确原始镜像、编码用户音频并生成实验镜像、试听文件及报告。本项目尚未对这些修改后配置进行硬件验证。
