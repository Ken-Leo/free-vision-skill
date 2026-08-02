# Free Vision Skill 👁️

> 给没有视觉能力的模型，装上一双按需调用的眼睛。
> A low-token visual evidence compiler for text-only coding agents.

<div align="center">

[![MIT License](https://img.shields.io/badge/license-MIT-0ea5e9?style=flat-square)](./LICENSE)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-22c55e?style=flat-square)](https://nodejs.org/)
[![VEP/1 Protocol](https://img.shields.io/badge/output-VEP%2F1-38bdf8?style=flat-square)](./docs/VEP.md)
[![Text-Only Agents](https://img.shields.io/badge/for-text--only_agents-white?style=flat-square)](./docs/AGENT_INTEGRATION.md)
[![v0.4.0](https://img.shields.io/badge/version-0.4.0-blue?style=flat-square)](./CHANGELOG.md)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-passing-brightgreen?style=flat-square)](https://github.com/lora-sys/free-vision-skill/actions/workflows/ci.yml)
[![30/30 Tests](https://img.shields.io/badge/tests-30%2F30%20passing-success?style=flat-square)](./tests)

</div>

---

## 🎯 为什么需要它？

**问题：** DeepSeek-V4-Flash、Claude Code CLI 等文本模型**无法直接读取图片**，但经常需要分析截图、UI、图表等视觉内容。

**传统方案：** 把图片交给视觉模型，生成 2000-5000 tokens 的长描述 → 主模型处理
- ❌ Token 消耗高
- ❌ 无关描述多
- ❌ 上下文污染
- ❌ 视觉模型越权推理

**Free Vision Skill 的方案：**
```
图片 → 视觉提取（只提取事实）→ VEP 证据包（50-150 tokens）→ 主模型推理
```

**核心价值：**
- ✅ **90-95% Token 节省**（50-150 tokens vs 2000-5000）
- ✅ **视觉模型只负责看见**，主模型继续负责思考
- ✅ **强制触发检测** — 模型无法读图时自动触发，不再误诊为"图片损坏"

---

## ⚡ 快速开始

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

### VEP 输出示例

```text
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module 'lodash'"|
t="webpack.config.js:15"|
e=[module resolution error]|
c=0.98
```

**字段说明：**
- `src` — Provider 和模型
- `m` — 任务模式（error / ocr / ui / chart）
- `a` — 直接答案
- `t` — OCR 文本
- `e` — 可见错误
- `c` — 置信度（0-1）

**详细协议：** [VEP 规范](./docs/VEP.md)

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
- **[快速开始](./docs/QUICKSTART.md)** — 5 分钟上手
- **[安装指南](./docs/INSTALLATION.md)** — 多种安装方式对比
- **[配置指南](./docs/SETUP.md)** — API Key 配置

### 💡 核心文档
- **[VEP 协议](./docs/VEP.md)** — Visual Evidence Packet 规范
- **[架构设计](./docs/ARCHITECTURE.md)** — 系统设计
- **[使用场景](./docs/USE_CASES.md)** — 常见场景示例
- **[Token 经济学](./docs/TOKEN_ECONOMICS.md)** — Token 对比分析
- **[为什么需要它](./docs/WHY_VISION.md)** — 解决的问题

### 🛠️ 集成
- **[Agent 集成](./docs/AGENT_INTEGRATION.md)** — Claude Code / Codex / OpenCode
- **[Provider 配置](./docs/PROVIDERS.md)** — 13 个 Provider 对比
- **[Claude Code Hook](./docs/INTEGRATION_CLAUDE_CODE.md)** — Hook 配置

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

<div align="center">

### 先看见，再压缩，再推理。 👁️

**Free Vision Skill** · low-token visual evidence compiler

[⭐ Star](https://github.com/lora-sys/free-vision-skill) · [🐛 Issues](https://github.com/lora-sys/free-vision-skill/issues) · [🤝 Contribute](./CONTRIBUTING.md)

</div>
