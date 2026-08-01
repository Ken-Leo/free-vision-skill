# 小红书图文发布顺序

## P1 封面

Free Vision Skill  
给没有视觉能力的模型装上眼睛

## P2 痛点

为什么需要 Free Vision Skill？

文案：

很多文本模型代码能力很强，却看不到报错截图、UI、表格和图表。
直接换视觉大模型，不仅贵，还会输出大量无关描述。

## P3 原理

视觉模型只负责看见，DeepSeek 继续思考。

## P4 低 Token

传统：图片 → 长描述 → 主模型  
我们：图片 → 极简 VEP → 主模型

## P5 安全配置

MVP：`.env`  
正式版：OS Keychain / Secret Broker

## P6 使用场景与 CTA

报错截图 / UI / OCR / 图表  
适合 Skill、实用小产品和 Agent 工具。

## 小红书正文

我最近一直在用 DeepSeek-V4-Flash 做开发，但它有一个很现实的问题：不能直接看截图。

于是我没有换掉主模型，而是做了一个 Free Vision Skill。

它会在真正需要看图时，调用免费或免费层视觉 API；视觉模型只负责提取看得见的事实，然后把结果压缩成一行 VEP，再交给 DeepSeek 继续思考、读仓库、修代码和跑测试。

重点不是“接一个视觉模型”，而是把视觉能力做成一个低 Token 的传感器。

例如一张报错截图，最终可能只返回：

```text
VEP/1|a="Cannot find module ethers"|t="src/app.ts:42"|c=0.97
```

这样不会把一大段视觉描述塞进上下文。

项目支持多 Provider、本地缓存、自动降级，还设计了 OS Keychain 方案，避免 Agent 直接接触 API Key。

#VibeCoding大赏 #ai新星计划 #DeepSeek #CodingAgent #开源项目 #AI编程 #独立开发
