# 无线耳机固件格式

[Русский](wireless.ru.md) · [English](wireless.en.md) · 简体中文

## V9 Pro 2 和 R9

官方 V9 Pro 2 0032/1002 各包含17个带 big-endian 长度字段的 LZMA-alone 块；R9 0018 包含18个。限制解压内存和块大小，保留原有参数，无修改重建与原始文件逐字节一致。

固件字符串包含 BEST1306P / RTX5、闪存基址 `0x2C000000` 及代码偏移 `0x20000`。资源指针减去 `0x2C020000` 得到文件偏移。独立 SBC 扫描器找到帧流后，通过地址/长度表分别提取两版 Pro 2 的15个资源和 R9 的25个资源。每帧头 CRC、完整资源边界以及 FFmpeg 解码均已验证。Pro 2 0032 的15种声音也逐字节存在于 R9 中。

格式为16kHz单声道 SBC、16个块、8个子带。多数资源采用 bitpool53、114字节帧；中文版 Pro 2 和 R9 的三个资源采用 bitpool60、128字节帧。替换保留该资源的参数、帧数、字节数及资源表，其他解压后的字节必须完全一致。固定尾部 `1d 34 57 be 00 00 02 2c` 不是前述镜像的普通 CRC32，因此保持不变。

编号资源的事件名称尚未独立确认。听出某句话并不等于证明固件事件调用关系，CLI 使用 `prompt-00` 等中性编号。

## G9 V2

对官方 HUB 的 V8 字节码进行静态分析，确认 G9 V2 选择 G9OTA.dll。所分析的传输分支将原始文件片段复制到 RCSP 数据包中。协议与 JieLi 的对应关系提供了格式线索。

实际镜像是使用地址相关 ENC/SFC、32字节块扰码的 JLFS。通过有限的16位密钥搜索找到 `0xB1C7`，要求多个 CRC、有效边界和合理名称同时成立。另一个仅偶然通过单次 CRC 的候选被拒绝。同一密钥在官方接收器镜像中独立确认。这是可逆扰码，不是 AES。代码字符串出现 AC701N / AC7012F，但没有检查实物芯片丝印。

已验证七个根分区。`tone_zh` 内包含一个索引及17个具有明确名称的 WTS 文件，包括 `power_on.wts`、`power_off.wts`、`mic_on.wts`、`mic_off.wts`。文件头和数据 CRC16 均匹配。项目维护者试听后确认原厂开机音为可辨认的中文语音。

这些文件可由官方 WTGv2 转换器处理。编码器中存在 SKP_Silk 符号，但不能因此将 WTS 当作标准 SILK 容器。官方 `tone.lua` 指定了必要的预处理重采样步骤。660Hz 正向对照在编码/解码后测得660.46Hz；跳过预处理而得到近乎静音的错误流程已弃用。

替换保留资源偏移和全部分区大小，新声音必须放入原有槽位；更新资源长度、数据 CRC、头 CRC，以及父 tone_zh 的数据/头 CRC。其他声音、索引及 tone_zh 之外的分区逐字节保持不变。四种故意损坏均被拒绝；原始外层扰码往返完全一致。

## 验证范围和参考

以上是软件和离线验证。本项目尚未在 Pro 2、R9 或 G9 V2 实物上验证修改后的镜像。唯一经过本项目硬件播放验证的修改仍为 X9 EN1003。试听 G9 原音不代表修改后固件已经启动。

- [i3sey 的 Pro 2 研究](https://gitlab.com/i3sey/mchose-v9pro2-english)：LZMA/SBC 和第三方硬件结果的线索。我们的扫描器、资源表发现及 R9 比较独立完成，不将他人的硬件测试算作自己的。
- [kagaimiq/jl-misctools](https://github.com/kagaimiq/jl-misctools)：JLFS 与扰码算法族参考。具体 G9 密钥、资源映射及校验由我们独立验证。
- [JieLi RCSP 文档](https://doc.zh-jieli.com/SDKWiki/master/Jieli-Tech/WeChat-Mini-Program-OTA/3-bluetooth/2-ble-data-handler.html)。
- [官方音频转换流程](https://github.com/Jieli-Tech/fw-AC63_BT_SDK/blob/master/cpu/bd19/tools/AC632N_config_tool/conf/source/tone/tone.lua)：厂商可执行工具不随本项目源码再分发。
- [xqy2006/jsc2js](https://github.com/xqy2006/jsc2js)：研究使用的静态 V8 反汇编工具，不是编辑器的运行时依赖。

[CLI 操作说明](offline.zh.md) · [精确配置及资源映射](../tools/offline-profiles.json)
