# Free Vision Skill 👁️

> 给没有视觉能力的模型，装上一双按需调发的眼睛。
> A low-token visual evidence compiler for text-only coding agents.

<p align="center">

[![MIT License](https://img.shields.io/badge/license-MIT-0ea5e9)](./LICENSE)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-22c55e)](https://nodejs.org/)
[![VEP Protocol](https://img.shields.io/badge/output-VEP%2F1-38bdf8)](./docs/VEP.md)
[![For Text-Only Agents](https://img.shields.io/badge/for-text--only_agents-white)](./docs/AGENT_INTEGRATION.md)
[![Version](https://img.shields.io/badge/version-0.4.0-blue)](./CHANGELOG.md)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-passing-brightgreen)](https://github.com/lora-sys/free-vision-skill/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-30%2F30%20passing-success)](./tests)

</p>

---

## 🎯 一句话说明

把图片压缩成 **50-150 tokens 的极简 VEP 证据包**，让文本模型也能低成本"看见"。

---

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 🎯 **极低 Token** | 50-150 tokens，比完整描述节省 **90-95%** |
| ⚡ **性能优化** | 智能缓存 + 并发控制，健康检查 **32.5x 更快** |
| 🔐 **安全存储** | macOS Keychain + Linux Secret Service + Windows Credential Manager |
| 🌍 **13 个 Provider** | 国内 4 + 全球 9，自动降级 |
| 🚨 **强制触发检测** | 模型无法读图时自动触发，不再误诊为"图片损坏" |
| ✂️ **智能裁剪** | 自动检测边距，减少 50-90% 图片大小 |

**详细文档：** [核心特性详解](./docs/FEATURES.md)

---

## 🚀 快速开始

### 安装

```bash
# 方式 1：推荐（npx + skills CLI）
npx skills add lora-sys/free-vision-skill

# 方式 2：npm 全局安装
npm install -g free-vision-skill

# 方式 3：克隆运行
git clone https://github.com/lora-sys/free-vision-skill.git
cd free-vision-skill && npm install
```

### 配置

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

**详细配置：** [配置指南](./docs/SETUP.md)

### 使用

```bash
# 基础用法
free-vision see --image ./error.png --question "只提取错误信息和行号"

# 指定 Provider
free-vision see --image ./chart.png --provider openrouter --question "返回图表标题和三个关键值"

# 自动裁剪（减少图片大小 50-90%）
free-vision see --image ./screenshot.png --auto-crop --question "提取 UI 问题"

# JSON 输出（用于解析）
free-vision see --image ./invoice.png --json --question "提取发票金额和日期"
```

**更多用例：** [使用场景指南](./docs/USE_CASES.md)

---

## 🎬 效果演示

### Token 对比

| 方案 | Token 消耗 | 节省 |
|------|-----------|------|
| **传统方案**（完整视觉描述） | 2000-5000 | - |
| **Free Vision Skill**（VEP 协议） | **50-150** | **90-95%** ✨ |

**详细对比：** [Token 经济学](./docs/TOKEN_ECONOMICS.md)

### 工作原理

```mermaid
graph LR
    A[图片] --> B[视觉提取]
    B --> C[VEP/1 证据包]
    C --> D[主模型推理]
    style C fill:#7ee787,color:#07090c
    style D fill:#0d1116,color:#e6edf3
```

---

## 📚 核心概念

### VEP: Visual Evidence Packet

**VEP = 视觉证据包**，格式：

```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module 'lodash'"|
t="webpack.config.js:15"|
e=[module resolution error]|
c=0.98
```

**VEP 协议规范：** [VEP.md](./docs/VEP.md)

---

## 🤔 为什么需要它？

### ❌ 传统方案的问题

| 问题 | 影响 |
|------|------|
| 💸 Token 消耗高 | 2000-5000 tokens/次 |
| 🗑️ 无关描述多 | 视觉模型输出大量不需要的内容 |
| 🧹 上下文污染 | 主模型上下文被长描述占满 |
| 🧠 越权推理 | 视觉模型替主模型做决策 |

### ✅ Free Vision Skill 的方案

```
图片
  ↓
视觉 API（只提取任务需要的事实）
  ↓
VEP 证据包（50-150 tokens）
  ↓
主模型继续推理
```

**视觉模型只负责看见，主模型继续负责思考。**

**完整对比：** [为什么需要 Free Vision Skill](./docs/WHY_VISION.md)

---

## 🌍 支持的 Provider

### 🇨🇳 中国优先

| Provider | 模型 | 免费额度 |
|---------|------|---------|
| **Zhipu** ⭐ | `glm-4.6v-flash` | 永久免费 |
| **ModelScope** | `Qwen/Qwen3-VL-8B-Instruct` | 变化 |
| **SiliconFlow** | 配置模型 | 变化 |
| **Alibaba** | `qwen3-vl-flash` | 新用户 90 天 |

### 🌍 全球

| Provider | 模型 | 免费额度 |
|---------|------|---------|
| **OpenRouter** ⭐ | `nvidia/nemotron-nano-12b-v2-vl:free` | 永久免费 |
| **Groq** | `qwen/qwen3.6-27b` | 免费计划 |
| **Gemini** | `gemini-3.5-flash-lite` | 免费层 |
| **Mistral** | `mistral-small-latest` | Studio Free |
| **Ollama** | `qwen3-vl:235b-cloud` | 轻量免费 |

**完整列表：** [Provider 指南](./docs/PROVIDERS.md)

---

## 🧪 测试状态

| 测试项 | 结果 |
|--------|------|
| **总体** | ✅ **30/30 测试通过** |
| TypeScript 类型检查 | ✅ 通过 |
| 单元测试 | ✅ 5 个文件，30 个测试 |
| 构建 | ✅ 成功 |
| CI/CD | ✅ [GitHub Actions](https://github.com/lora-sys/free-vision-skill/actions) 绿色通过 |

**详细测试报告：** [测试状态](./docs/TEST_STATUS.md)

---

## 📖 文档导航

### 🚀 快速上手
- **[安装指南](./docs/INSTALLATION.md)** — 详细安装步骤
- **[配置指南](./docs/SETUP.md)** — API Key 配置
- **[快速开始](./docs/QUICKSTART.md)** — 5 分钟上手

### 💡 核心文档
- **[VEP 协议](./docs/VEP.md)** — Visual Evidence Packet 规范
- **[架构设计](./docs/ARCHITECTURE.md)** — 系统设计
- **[使用场景](./docs/USE_CASES.md)** — 常见场景示例
- **[Token 经济学](./docs/TOKEN_ECONOMICS.md)** — Token 对比分析
- **[核心特性](./docs/FEATURES.md)** — 特性详解

### 🛠️ 集成
- **[Agent 集成](./docs/AGENT_INTEGRATION.md)** — Claude Code / Codex / OpenCode
- **[Provider 配置](./docs/PROVIDERS.md)** — 13 个 Provider 对比
- **[钩子指南](./docs/HOOKS.md)** — Claude Code Hook

### 🔒 安全与性能
- **[安全策略](./docs/SECURITY.md)** — 威胁模型和防护
- **[性能优化](./docs/PERFORMANCE.md)** — 缓存 + 并发 + 降级
- **[FAQ](./docs/FAQ.md)** — 常见问题

### 📋 开发
- **[贡献指南](./CONTRIBUTING.md)** — 如何贡献
- **[路线图](./ROADMAP.md)** — 未来计划
- **[Changelog](./CHANGELOG.md)** — 版本历史

---

## 🤝 贡献

欢迎提交：
- ✅ 新 Provider（需官方文档）
- ✅ VEP 压缩改进
- ✅ 本地模型支持（Ollama 等）
- ✅ Windows Keychain 支持

**不接受：**
- ❌ 匿名代理或逆向工程 API
- ❌ 无官方文档的 Provider

详见 [贡献指南](./CONTRIBUTING.md)

---

## 📄 License

MIT © 2026 [lora-sys](https://github.com/lora-sys)

详见 [LICENSE](./LICENSE)

---

## 🙏 致谢

感谢以下开源视觉模型和 API 提供商：
[智谱 AI](https://open.bigmodel.cn/) · [阿里 ModelScope](https://modelscope.cn/) · [OpenRouter](https://openrouter.ai/) · [Groq](https://groq.com/) · [Google Gemini](https://gemini.google.com/) · [Mistral AI](https://mistral.ai/) · [Cohere](https://cohere.com/) · [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) · [Ollama](https://ollama.com/) · [SambaNova](https://sambanova.ai/) · [NVIDIA NIM](https://build.nvidia.com/)

---

<p align="center">
  <strong>先看见，再压缩，再推理。</strong> 👁️<br>
  <em>Free Vision Skill · low-token visual evidence compiler</em>
</p>

<p align="center">
  <a href="https://github.com/lora-sys/free-vision-skill">⭐ Star on GitHub</a> ·
  <a href="https://github.com/lora-sys/free-vision-skill/issues">🐛 Report Bug</a> ·
  <a href="https://github.com/lora-sys/free-vision-skill/blob/main/CONTRIBUTING.md">🤝 Contribute</a>
</p>
