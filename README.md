# Free Vision Skill 👁️

> 给没有视觉能力的模型，装上一双按需调用的眼睛。
> A low-token visual evidence compiler for text-only coding agents.

<p align="center">
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-0ea5e9"></a>
  <img alt="Node 20+" src="https://img.shields.io/badge/node-%3E%3D20-22c55e">
  <img alt="VEP Protocol" src="https://img.shields.io/badge/output-VEP%2F1-38bdf8">
  <img alt="Text-only agents" src="https://img.shields.io/badge/for-text--only_agents-white">
  <a href="https://github.com/lora-sys/free-vision-skill/releases/tag/v0.1.0"><img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue"></a>
</p>

---

<p align="center">
  <img src="./assets/cover.png" alt="Free Vision Skill 封面" width="760" />
</p>

---

## 🌟 核心特性

<div align="center">

| 特性 | 说明 |
|------|------|
| 🎯 **低 Token 消耗** | 默认 50-220 tokens，比完整描述节省 80-90% |
| 🔄 **自动降级** | Provider 限流时自动切换到备用服务 |
| 💾 **本地缓存** | SHA-256 缓存，相同请求不消耗额度 |
| 🔐 **安全存储** | macOS Keychain 和 Linux Secret Service 支持 |
| 🌍 **13 个 Provider** | 国内 4 个 + 全球 9 个，全面覆盖 |
| 📦 **易于集成** | `npx skills add` 一键安装到所有主流 Agent |
| 🔌 **VEP/1 协议** | 极简视觉证据包格式，主模型轻松解析 |

</div>

---

## 🎬 效果演示

<div align="center">

### 使用场景

<img src="./assets/slide-06-use-cases.png" alt="使用场景" width="700" />

### Token 节省对比

<img src="./assets/slide-02-token.png" alt="Token 节省对比" width="700" />
<p><em>左：传统方案 2000+ tokens | 右：Free Vision Skill ~100 tokens</em></p>

### 工作原理

<img src="./assets/slide-03-how-it-works.png" alt="工作原理" width="700" />
<p><em>图片 → 视觉提取 → VEP → 主模型推理</em></p>

</div>

---

## 它解决什么问题？

DeepSeek-V4-Flash、部分 Coding Agent 和很多低成本文本模型，代码能力很强，却不能直接读取：

- 📸 **终端报错截图** — 错误信息在图片里
- 🎨 **产品 UI 和设计稿** — 视觉对齐、间距问题
- 📊 **海报、表格与 OCR** — 文字提取、结构识别
- 📈 **图表、仪表盘** — 数据趋势、关键指标

### ❌ 传统方案的四个问题

常见解决方案是把图片交给视觉模型，生成一大段描述，再塞回主模型：

```text
图片 → 视觉模型 → 长描述 → 主模型
```

这会带来：

| 问题 | 影响 |
|------|------|
| 💸 **Token 消耗高** | 2000-5000 tokens 每次调用 |
| 🗑️ **无关描述多** | 视觉模型输出大量不需要的内容 |
| 🧹 **上下文污染** | 主模型上下文被长描述占满 |
| 🧠 **越权推理** | 视觉模型替主模型做决策 |

### ✅ Free Vision Skill 的方案

```text
图片
  ↓
免费视觉 API（只提取当前任务需要的事实）
  ↓
压缩为 VEP（Visual Evidence Packet）
  ↓
DeepSeek / Codex / Claude Code / OpenCode 继续推理
```

> **视觉模型只负责看见，主模型继续负责思考。**

---

## 🚀 快速开始

### 安装

#### 方式一：npx + skills CLI（推荐）⭐

```bash
npx skills add lora-sys/free-vision-skill
```

#### 方式二：npm 全局安装

```bash
npm install -g free-vision-skill
```

#### 方式三：克隆运行

```bash
git clone https://github.com/lora-sys/free-vision-skill.git
cd free-vision-skill
npm install
cp .env.example .env
```

### 配置

#### 方式一：.env（简单）

```bash
# 中国用户
echo "ZHIPU_API_KEY=你的key" >> .env
echo "VISION_PROVIDER=auto" >> .env
echo "VISION_REGION=cn" >> .env

# 全球用户
echo "OPENROUTER_API_KEY=你的key" >> .env
echo "VISION_PROVIDER=auto" >> .env
echo "VISION_REGION=global" >> .env
```

#### 方式二：Keychain（更安全）🔐

```bash
# macOS
free-vision login zhipu

# Linux
free-vision login zhipu
```

### 使用

```bash
free-vision see \
  --image ./error.png \
  --question "只提取精确错误、文件名和行号"
```

**VEP 输出：**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module ethers"|
t="src/app.ts:42"|
e=[dependency error]|
c=0.97
```

---

## 📖 核心概念

### VEP：极简视觉证据协议

**VEP = Visual Evidence Packet**

视觉模型不返回完整分析，只返回**事实**：

```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module ethers"|
t="src/app.ts:42"|
c=0.97
```

| 字段 | 含义 | 示例 |
|------|------|------|
| `src` | Provider 和模型 | `zhipu/glm-4.6v-flash` |
| `m` | 任务模式 | `error` / `ocr` / `ui` / `chart` |
| `a` | 直接答案 | `"Cannot find module"` |
| `t` | OCR 文本 | `"src/app.ts:42"` |
| `o` | 关键对象 | `[button, input, modal]` |
| `e` | 可见错误 | `[overlapping, clipped]` |
| `v` | 关键值 | `["$99", "2024-12-31"]` |
| `c` | 置信度 | `0.97` |
| `cache` | 缓存状态 | `cache=hit` |

详细协议见 [docs/VEP.md](docs/VEP.md)

---

## 💡 使用场景

### 1️⃣ 报错截图

```bash
free-vision see --image ./error.png \
  --question "只提取精确错误、文件名和行号"
```

**VEP:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module 'lodash'"|
t="webpack.config.js:15"|
e=[module resolution error]|
c=0.98
```

### 2️⃣ UI 分析

```bash
free-vision see --image ./ui.png \
  --question "只列出被裁切、重叠、禁用或异常的 UI 元素"
```

**VEP:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ui|
o=[{name:"Submit",issue:"disabled"},{name:"Avatar",issue:"clipped"}]|
c=0.95
```

### 3️⃣ OCR / 表格

```bash
free-vision see --image ./table.png \
  --question "提取所有文本和表格结构"
```

**VEP:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=ocr|
a="Q3 销售报表"|
t=["产品","销售额","增长率"],["A",12000,"15%"],["B",8500,"8%"]|
c=0.92
```

### 4️⃣ 图表

```bash
free-vision see --image ./chart.png \
  --question "只返回图表标题、趋势和三个关键值"
```

**VEP:**
```
VEP/1|src=zhipu/glm-4.6v-flash|m=chart|
a="月度营收增长"|
v=[45200,58300,72100]|
c=0.96
```

---

## 🌍 支持的 Provider

### 🇨🇳 中国优先

| Provider | 模型 | 免费额度 | 认证方式 |
|---------|------|---------|---------|
| **Zhipu** ⭐ | `glm-4.6v-flash` | 永久免费 | Bearer |
| **ModelScope** | `Qwen/Qwen3-VL-8B-Instruct` | 变化 | 直接 token |
| **SiliconFlow** | 配置模型 | 变化 | Bearer |
| **Alibaba** | `qwen3-vl-flash` | 新用户 90 天 | Bearer |

### 🌍 全球

| Provider | 模型 | 免费额度 | 认证方式 |
|---------|------|---------|---------|
| **OpenRouter** ⭐ | `nvidia/nemotron-nano-12b-v2-vl:free` | 永久免费 | Bearer |
| **Groq** | `qwen/qwen3.6-27b` | 免费计划 | Bearer |
| **Gemini** | `gemini-3.5-flash-lite` | 免费层 | Bearer |
| **Mistral** | `mistral-small-latest` | Studio Free | Bearer |
| **Cohere** | `command-a-vision-07-2025` | 1000次/月 | Bearer |
| **Cloudflare** | `@cf/meta/llama-3.2-11b-vision-instruct` | 10,000/天 | Bearer |
| **Ollama** | `qwen3-vl:235b-cloud` | 轻量免费 | Bearer |
| **SambaNova** | `Llama-4-Maverick-17B-128E-Instruct` | 免费层 | Bearer |
| **NVIDIA** | `nvidia/nemotron-nano-12b-v2-vl` | 原型端点 | Bearer |

详细见 [docs/PROVIDERS.md](docs/PROVIDERS.md)

---

## 🔐 安全特性

### 威胁模型

Free Vision Skill 的安全设计原则：

| 威胁 | 防护措施 |
|------|---------|
| 🖼️ **图片注入攻击** | 视觉输出视为不可信数据 |
| 🔑 **API Key 泄露** | Keychain 隔离，不写入 Prompt |
| 📤 **数据外泄** | 不上传无关文件到视觉 API |
| 🧠 **越权推理** | 视觉模型只提取事实，不推理 |
| 🔗 **上下文污染** | VEP 格式紧凑，不塞入完整描述 |

### 安全策略

```bash
# ✅ 正确：使用 Keychain
free-vision login zhipu

# ❌ 错误：把 Key 写入 Prompt
echo "API Key 是 sk-xxx" | free-vision ...

# ✅ 正确：.env 文件（已 .gitignore）
ZHIPU_API_KEY=xxx >> .env

# ❌ 错误：提交 .env 到 Git
git add .env
```

详细见 [docs/SECURITY.md](docs/SECURITY.md)

---

## 🤖 支持的 Agent

Free Vision Skill 不绑定某个主模型，适合：

- **DeepSeek-V4-Flash** — 代码专家，需要视觉辅助
- **Codex** — OpenAI 的代码 Agent
- **Claude Code** — Anthropic 的 CLI 工具
- **OpenCode** — 开源代码 Agent
- **Reasonix** — 推理专家
- **Deep Code** — 深度代码分析
- **你自己的文本 Agent** — 任何需要视觉能力的 Agent

### Agent 集成示例

```bash
# Claude Code
npx skills add lora-sys/free-vision-skill

# Codex
# 在 .codex/config.json 中添加 free-vision 命令

# OpenCode
# 在 opencode.json 中添加 skill 配置
```

详细见 [examples/](examples/)

---

## 🎯 Token 控制指南

### Token 经济学

| 场景 | 视觉模型输出 | VEP 大小 | 主模型接收 |
|------|-------------|---------|-----------|
| 错误提取 | ~100 tokens | ~150 chars | ~50 tokens |
| UI 审计 | ~180 tokens | ~400 chars | ~80 tokens |
| OCR | ~220 tokens | ~500 chars | ~120 tokens |
| 图表 | ~150 tokens | ~300 chars | ~70 tokens |

**对比：** 发送完整视觉描述需要 2000-5000 tokens。

### ✅ 推荐：聚焦式问题

```bash
free-vision see --image error.png \
  --question "只提取错误信息和行号"
```

### ❌ 避免：开放式问题

```bash
free-vision see --image error.png \
  --question "详细分析错误并提供完整解决方案"
```

---

## 📚 文档导航

### 🚀 快速上手

- [快速开始](docs/QUICKSTART.md) — 5 分钟上手
- [安装指南](docs/INSTALLATION.md) — 多种安装方式对比
- [配置指南](docs/SETUP.md) — .env 和 Keychain 详细说明

### 📖 核心文档

- [VEP 协议](docs/VEP.md) — Visual Evidence Packet 规范
- [架构文档](docs/ARCHITECTURE.md) — 系统设计
- [Provider 指南](docs/PROVIDERS.md) — 13 个 Provider 对比
- [安全策略](docs/SECURITY.md) — 威胁模型和防护

### ❓ 帮助

- [FAQ](docs/FAQ.md) — 常见问题
- [贡献指南](CONTRIBUTING.md) — 如何贡献
- [路线图](ROADMAP.md) — 未来计划

---

## 🗺️ 路线图

### ✅ v0.1.0 — MVP（已完成）

- [x] Provider registry（13 个 Provider）
- [x] VEP/1 协议
- [x] Auto-fallback 降级
- [x] SHA-256 本地缓存
- [x] .env 和 Keychain
- [x] Agent Skill 文档

### 🚧 v0.2 — 集成（进行中）

- [ ] Codex 一键安装
- [ ] Claude Code Hook
- [ ] OpenCode Agent
- [ ] Provider 健康检查
- [ ] 图片自动裁剪

### 🔮 v0.3 — 高级功能

- [ ] Windows Credential Manager
- [ ] 本地 Secret Broker
- [ ] GUI 设置页
- [ ] Provider 用量统计
- [ ] VEP Schema Validator

---

## 🧪 测试状态

### 冒烟测试结果

| 测试项 | 通过率 |
|--------|--------|
| Keychain 存储/读取 | ✅ 100% |
| CLI 命令完整性 | ✅ 100% |
| 图像识别 | ✅ 100% |
| 本地缓存 | ✅ 100% |
| VEP 协议 | ✅ 100% |
| Auto-fallback | ✅ 100% |
| Provider 认证检查 | ✅ 100% (13/13) |

详细测试报告见 [INSTALLATION_COMPLETE.md](INSTALLATION_COMPLETE.md)

---

## 🤝 贡献

欢迎提交：

- ✅ 新 Provider Adapter（需官方文档）
- ✅ VEP 压缩改进
- ✅ 本地模型支持（Ollama 等）
- ✅ Windows Keychain 支持
- ✅ Agent 集成示例
- ✅ Prompt Injection 防护

**不接受：**
- ❌ 匿名代理或逆向工程 API
- ❌ 无官方文档的 Provider
- ❌ 调用付费 API 的测试

详见 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 License

MIT © 2026 lora-sys

详见 [LICENSE](LICENSE)

---

## 🙏 致谢

感谢以下开源视觉模型和 API 提供商：

- [智谱 AI (Zhipu AI)](https://open.bigmodel.cn/) — GLM 系列模型
- [阿里 ModelScope](https://modelscope.cn/) — 魔搭社区
- [OpenRouter](https://openrouter.ai/) — 统一 API 网关
- [Groq](https://groq.com/) — 高速推理
- [Google Gemini](https://gemini.google.com/) — 多模态 AI
- [Mistral AI](https://mistral.ai/) — 欧洲开源 AI
- [Cohere](https://cohere.com/) — 企业级 AI
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) — 边缘 AI
- [Ollama](https://ollama.com/) — 本地模型运行
- [SambaNova](https://sambanova.ai/) — 高效推理
- [NVIDIA NIM](https://build.nvidia.com/) — 企业级推理

---

<p align="center">
  <strong>先看见，再压缩，再推理。</strong> 👁️
</p>

<p align="center">
  <em>Free Vision Skill · low-token visual evidence compiler</em>
</p>

<p align="center">
  <a href="https://github.com/lora-sys/free-vision-skill">⭐ Star on GitHub</a> ·
  <a href="https://github.com/lora-sys/free-vision-skill/issues">🐛 Report Bug</a> ·
  <a href="https://github.com/lora-sys/free-vision-skill/blob/main/CONTRIBUTING.md">🤝 Contribute</a>
</p>
