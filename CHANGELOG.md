# Changelog

All notable changes to Free Vision Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
