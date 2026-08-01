# Changelog

All notable changes to Free Vision Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/2.0.0.html).

## [0.2.0] - 2026-08-01

### Added
- **Claude Code Hook v2** - 增强的智能图片检测
  - 基于文件名的智能问题生成（error、ui、chart、ocr 等）
  - 自动识别图片类型并生成最优问题
  - 改进的日志输出和错误处理
- **Provider 健康检查** - `free-vision doctor` 命令增强
  - 实时测试每个 Provider 的可用性
  - 延迟测量和状态展示
  - 配额状态检测
  - 彩色输出（✅⚠️❌⚪）
  - 批量并发检查（带限流保护）
- **Codex 一键安装脚本** - `installers/codex-install.sh`
  - 自动检测 Node.js 和 npm
  - 安装 free-vision CLI
  - 配置 Codex 集成
  - 创建 Shell 别名
  - 生成 .env 模板
  - 交互式测试选项
- **OpenCode Agent 集成文档** - `examples/OPENCODE.md`
  - 完整的配置示例
  - 高级功能说明（缓存、自动裁剪等）
  - 故障排除指南
  - 性能优化建议
- **Health Check 模块** - `src/health.ts`
  - 可复用的健康检查函数
  - Provider 状态枚举
  - 延迟格式化工具
  - 批量检查支持

### Features
- 智能问题生成支持 8 种图片类型
  - 错误截图（error）
  - UI 截图（ui/screen）
  - 图表（chart/graph）
  - 表格（table/grid）
  - Logo/图标
  - 代码截图
  - 通用图片
- doctor 命令现在展示实时健康状态而非静态信息
- 安装脚本支持配置合并和备份
- OpenCode 集成包含 VEP 输出解析说明

### Provider Adapters
- 保持 13 个 Provider（zhipu、modelscope、siliconflow、alibaba、openrouter、groq、nvidia、gemini、mistral、cohere、cloudflare、ollama、sambanova）

### Security
- Hook 脚本增强：支持多种图片检测方式
- 安装脚本自动备份现有配置
- 健康检查不暴露 API Key

### Documentation
- Claude Code Hook 文档增强
- OpenCode Agent 完整集成指南
- Codex 安装脚本说明
- Provider 健康检查文档
- CHANGELOG 更新

### Testing
- Health Check 模块 TypeScript 类型检查通过
- Hook 脚本 bash 语法验证通过
- 安装脚本逻辑验证通过

### Changed
- `doctor` 命令从静态信息展示改为实时健康检查
- Claude Code Hook 从通用问题改为智能问题生成

### Planned
- [ ] 图片自动裁剪（--auto-crop）
- [ ] 更多 Provider 支持
- [ ] Windows Credential Manager
- [ ] VEP Schema Validator

---

## [0.1.0] - 2026-08-01

### Added
- Initial MVP release
- Provider registry with auto-fallback support
- VEP/1 (Visual Evidence Packet) protocol
- SHA-256 local cache for image+question pairs
- `.env` configuration and macOS/Linux Keychain support
- Agent Skill documentation for multiple coding agents
- CLI with `see`, `doctor`, `providers`, `login`, `logout` commands

### Provider Adapters
- **Zhipu BigModel**: `glm-4.6v-flash` (China, permanent free tier)
- **ModelScope API-Inference**: `Qwen/Qwen3-VL-8B-Instruct` (China, requires direct token without Bearer prefix)
- **OpenRouter**: `nvidia/nemotron-nano-12b-v2-vl:free` (Global, permanent free variants)
- **OpenAI-compatible endpoints**: Support for custom base URLs and models

### Features
- Low-token visual evidence extraction (50-220 tokens default)
- Task mode routing: error, ocr, ui, chart, general
- Compact one-line VEP output format
- JSON debug mode with `--json` flag
- Image format support: png, jpg, jpeg, gif, webp
- Auto-fallback between providers when rate-limited
- Provider-specific authentication headers (configurable `authPrefix`)

### Security
- Visual output treated as untrusted data
- Credential isolation via OS Keychain
- No API keys in prompts or logs
- Prompt injection defense documentation
- Support for provider-specific auth methods

### Documentation
- Architecture documentation
- Setup guide for `.env` and Keychain
- Provider guide with regional recommendations
- Integration examples for Codex, Claude Code, OpenCode
- Security policy and best practices
- Installation guide with multiple methods
- Quick start guide

### Testing
- Keychain smoke test (100% pass rate)
- Multi-provider authentication tests
- Cache mechanism verification
- VEP protocol validation
- Auto-fallback testing

### Planned
- [ ] Codex one-click installer
- [ ] Claude Code Hook integration
- [ ] OpenCode Agent support
- [ ] Provider health probes
- [ ] Image cropping support
- [ ] Windows Credential Manager
- [ ] Usage dashboard
- [ ] VEP schema validator package
