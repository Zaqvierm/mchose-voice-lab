# 型号与功能

[Русский](compatibility.ru.md) · [English](compatibility.en.md) · [简体中文](compatibility.zh.md)

目录包含8个无线型号的13个原始镜像。浏览器可编辑5个型号的9个AAC/ACT镜像，独立实验性CLI可重建3个型号的4个镜像。

九个浏览器配置均支持按键编辑和兼容自定义镜像的再次编辑。电源键点击可修改，开关机长按受保护。[版本、实际按键及平台限制](binding-compatibility.md)。下方实验性离线配置支持提示音，暂不支持按键重写。

| 耳机 | 原始版本 | 浏览器重建 | 离线工具 |
|---|---|---|---|
| MCHOSE G9 Pro | 0026 | 支持 | Node CLI |
| MCHOSE V9 Pro | 0036 · 1015 | 支持 | Node CLI |
| MCHOSE X9 | 0038 · 1003 | 支持 | Node CLI |
| MCHOSE V9 Turbo+ | 0033 · 1002 · 0035 | 支持 | Node CLI |
| MCHOSE V9 Turbo | 0005 | 支持 | Node CLI |
| MCHOSE G9 V2 | 0031 | 不支持 | 实验性 Python CLI |
| MCHOSE V9 Pro 2 | 0032 · 1002 | 不支持 | 实验性 Python CLI |
| MCHOSE R9 | 0018 | 不支持 | 实验性 Python CLI |

普通V9、S9和S9 Pro确实存在，但两个官方目录中尚未找到可验证的独立镜像。不使用相似型号代替。排除有线耳机和条形音箱。

本项目硬件播放验证仅覆盖X9 EN1003的开机音替换。解码并试听G9原音不代表修改后镜像已通过启动验证。

[CLI](offline.zh.md) · [研究](wireless.zh.md) · [Official web manifest](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfig_prod.json) · [Official desktop manifest](https://cdn.mchose.com.cn/OTA/PC/prod/otaFile/otaConfigApp_prod.json)
