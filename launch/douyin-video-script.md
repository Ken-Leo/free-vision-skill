# 抖音视频脚本：我给 DeepSeek 做了一双免费的眼睛

建议时长：55～75 秒  
形式：真人口播 + 终端录屏 + 6 张图文轮播

## 0–5 秒：Hook

画面：封面海报 + DeepSeek 输入图片后无法识别的对比。

口播：

> DeepSeek V4 Flash 很强，但它看不到截图。  
> 所以我没有换模型，我直接给它做了一双免费的眼睛。

屏幕大字：

```text
我给 DeepSeek 做了一个免费识图 Skill
```

## 5–15 秒：痛点

画面：Slide 2。

口播：

> 终端报错、产品 UI、海报表格、图表，这些信息一旦在图片里，文本模型就卡住了。  
> 直接换视觉大模型又贵，而且经常输出一大段无关描述。

## 15–30 秒：解决方案

画面：Slide 3，逐步点亮流程。

口播：

> Free Vision Skill 会在模型真的需要看图时，调用一个免费的视觉 API。  
> 但视觉模型不负责解决问题，它只负责把看到的事实提取出来。

## 30–42 秒：低 Token

画面：Slide 4 + 终端显示 VEP。

口播：

> 图片不会整段塞给 DeepSeek。  
> 它会被压缩成一行 VEP：错误、文件、行号、置信度。  
> 主模型只拿几十到几百个 Token，然后继续读仓库、修代码、跑测试。

## 42–55 秒：Demo

录屏命令：

```bash
free-vision see \
  --image ./error.png \
  --question "只提取错误、文件和行号"
```

出现：

```text
VEP/1|a="Cannot find module ethers"|t="src/app.ts:42"|c=0.97
```

接着展示 DeepSeek 修复代码。

## 55–65 秒：安全

画面：Slide 5。

口播：

> API Key 可以先用 `.env`，正式版支持存在系统 Keychain，Agent 不需要直接看到 Key。

## 65–75 秒：CTA

画面：Slide 6。

口播：

> 它不只服务 DeepSeek，而是给所有没有视觉能力的模型外挂一个低 Token 的视觉工具。  
> 项目会开源，想试的可以去 GitHub 搜 Free Vision Skill。

屏幕：

```text
#VibeCoding大赏 #ai新星计划
```
