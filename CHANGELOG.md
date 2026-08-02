# Changelog

All notable changes to Free Vision Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/2.0.0.html).

## [0.4.1] - 2026-08-02

### Added

- **Claude Code PostToolUse Hook** — automatic VEP injection on image Read
  - `hooks/claude-code/post-read-image.sh` — fires after any `Read` of a `.png/.jpg/.webp/.gif/.bmp/.avif` file
  - Runs `free-vision see` silently, injects VEP into `hookSpecificOutput.additionalContext`
  - Smart question selection from filename keywords (error, screenshot, chart, table, code, …)
  - `CACHE_HIT_SKIP` env var controls whether cached VEPs are still injected (default: skip)
  - Configurable via `HOOK_TIMEOUT_MS` (35 s) and `MAX_VEP_CHARS` (500)
  - Registered in `~/.claude/settings.json` → `"PostToolUse"` → matcher `"Read"`
- **E2E Test Suite** (`tests/e2e-vep.test.js`)
  - 20 assertions covering VEP format, cold/warm/no-cache/different-question paths
  - `npm run test:e2e` — self-clearing cache for reproducible runs
  - `npm run check` still covers unit tests (30/30 passing)

### Changed

- **Cache directory is now cwd-independent** — defaults to `~/.cache/free-vision/`
  - Priority: `$FREE_VISION_CACHE_DIR` → `$XDG_CACHE_HOME/free-vision` → `~/.cache/free-vision`
  - Old `.vision-cache/` in CWD is no longer created
  - `free-vision cache stats` now prints the active cache directory
- **`~/.free-vision/.env` global credential loading** (`src/cli.ts`)
  - `~/.free-vision/.env` takes priority over CWD `.env` (backward-compatible order)
  - CLI works from any directory without copying `.env`
  - `.env.example` updated to reflect `FREE_VISION_CACHE_DIR`
- **SKILL.md trigger covers tool-produced screenshots**
  - Added "Tool-Produced Screenshots Count" table (Playwright MCP, agent-browser, chrome-devtools, CLI)
  - Added reverse guardrail: prefer `browser_snapshot` for text/DOM questions, reserve free-vision for genuinely visual ones
- **`src/util.ts` — removed dead code cacheGet/cacheSet** (unused; real impl lives in `src/cache.ts`)

### Fixed

- SKILL.md dual-copy drift — `~/.claude/skills/free-vision/SKILL.md` is now a symlink to the repo file
- `.gitignore` — removed `.vision-cache/` entry (no longer needed; global cache is outside the repo)

## [0.4.0] - 2026-08-01

### Added

- **Performance Optimization** - Complete system rewrite for speed and efficiency
  - **Smart Cache System** (`src/cache.ts`)
    - TTL expiration (default: 24 hours)
    - LRU eviction strategy (max 1000 entries)
    - Access count tracking for priority calculation
    - Batch expiration cleanup
    - Cache statistics (hit rate, evictions, size)
    - Backward-compatible API (cacheGet, cacheSet)
  - **Concurrency Control** (`src/pool.ts`)
    - RequestPool: concurrent request pool with configurable limits
    - RateLimiter: token bucket rate limiter
    - Exponential backoff retry strategy
    - parallelFallback: automatic provider failover
    - Configurable timeout and retry limits
  - **CLI Commands**
    - `free-vision cache stats` - view cache statistics
    - `free-vision cache clear` - clear all cache
    - `--no-cache` now deletes old cache before request

### Features

- **32.5x faster** health checks (13 providers in ~2s vs ~65s)
- **Smart cache management** with LRU eviction and TTL
- **Automatic rate limiting** to prevent API throttling
- **Parallel failover** for provider fallback
- **Performance monitoring** with cache hit rate tracking
- **Exponential backoff** with configurable delays

### Performance Improvements

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| **Cache** | Simple file cache | TTL + LRU + access tracking | 90%+ hit rate achievable |
| **Concurrency** | Hard-coded batch=3 | Configurable RequestPool | Flexible & efficient |
| **Retry** | None | Exponential backoff | Automatic recovery |
| **Rate limiting** | None | Token bucket RateLimiter | Prevents throttling |
| **Health checks** | ~65s | ~2s | **32.5x faster** |

### Testing

- Add `tests/performance.test.ts` (8 new tests)
- Total: 30/30 tests passing ✅
- Coverage: cache, pool, rate limiting, fallback

### Documentation

- Add "Performance Optimization Guide" section in README
- Cache strategy explanation (TTL, LRU, access tracking)
- Concurrency control details (request pool, rate limiter, parallel fallback)
- Performance comparison tables
- Best practices and CLI examples

### Breaking Changes

- Cache location remains `.vision-cache/` (backward compatible)
- All existing CLI commands unchanged
- No breaking changes to API or config format

## [0.3.0] - 2026-08-01

### Added

- **Auto-Crop Feature** - `--auto-crop` flag for intelligent image cropping
  - Smart white/transparent margin detection
  - Reduces image size by 50-90% in tests
  - Saves cropped image as `.cropped.png`
  - Configurable margin, threshold, and minimum size
  - Comprehensive test coverage

- **VEP Schema Validator** - `src/vep-validator.ts`
  - `validateVep()`: VEP format and schema validation
  - `parseVep()`: Parse VEP string to structured data
  - `validateVisionResult()`: Validate VisionResult objects
  - `formatValidationResult()`: Human-readable output
  - Quote stripping from parsed values
  - Array field parsing (objects, errors, values)
  - Confidence validation (0-1 range)
  - Mode validation (error/ocr/ui/chart/general)
  - 14 comprehensive tests, all passing ✅

- **Windows Credential Manager Support**
  - Full Windows platform support via `cmdkey`
  - `storeProviderKey()`: Store credentials in Windows Credential Manager
  - `loadProviderKey()`: Retrieve credentials with `/list` parsing
  - `deleteProviderKey()`: Delete credentials with `/delete`
  - Cross-platform: macOS + Linux + Windows ✅

### Features

- Image auto-crop reduces 400x300 → 369x58 (82% reduction in tests)
- VEP Validator provides comprehensive format checking
- Windows users can now use `free-vision login` natively
- All three major platforms supported: macOS, Linux, Windows

### Security

- Windows Credential Manager integration
- No breaking changes to existing security model
- Maintains credential isolation across all platforms

### Testing

- Auto-crop: 3 test cases (with margins, tiny image, CLI integration)
- VEP Validator: 14 test cases covering all validation paths
- All tests passing ✅
- TypeScript compilation clean ✅

### Documentation

- README.md updated with auto-crop examples
- Platform support updated (Windows added)
- Version bumped to 0.3.0

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
