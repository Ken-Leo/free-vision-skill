# v0.2 详细规划 — 集成增强版

## 🎯 核心目标

让 Free Vision Skill 更容易集成到主流 Agent 工作流中，提升用户体验和可见度。

---

## 📋 功能清单

### 🔴 P0-1: Claude Code Hook

**优先级：** 🔴 最高  
**预计时间：** 3-4 小时  
**用户价值：** ⭐⭐⭐⭐⭐

#### 目标
让 Claude Code 自动检测用户上传的图片，并智能调用 free-vision 进行视觉分析。

#### 实施步骤

##### 1.1 创建 Hook 脚本

**文件：** `hooks/claude-code/detect-image.sh`

```bash
#!/bin/bash
# Claude Code Hook: 检测用户上传的图片

# 从 Claude Code 的会话中检测图片
# Claude Code 会在特定环境变量或临时文件中存储图片路径

IMAGE_PATH="${CLAUDE_IMAGE_PATH:-$1}"
QUESTION="${CLAUDE_QUESTION:-"Analyze this image"}"

if [ -z "$IMAGE_PATH" ]; then
  echo "No image detected"
  exit 0
fi

# 调用 free-vision
free-vision see \
  --image "$IMAGE_PATH" \
  --question "$QUESTION" \
  --json

# 输出 VEP 给 Claude Code
```

##### 1.2 Claude Code 配置

**文件：** `~/.claude/settings.json`

```json
{
  "hooks": {
    "on-image-upload": {
      "command": "free-vision hooks/claude-code/detect-image.sh",
      "description": "Auto-analyze uploaded images with free-vision"
    }
  }
}
```

##### 1.3 智能问题生成

根据图片类型自动生成问题：

```typescript
// 检测错误截图
if (isErrorScreenshot(image)) {
  question = "Extract only exact error, filename and line number"
}
// 检测 UI 截图
else if (isUIScreenshot(image)) {
  question = "Only disabled, clipped, overlapping or broken elements"
}
// 默认
else {
  question = "Describe what you see in one sentence"
}
```

#### 完成标准
- [ ] Hook 脚本可检测 Claude Code 上传的图片
- [ ] 自动调用 free-vision see
- [ ] 返回 VEP 给 Claude Code
- [ ] 文档完整（docs/INTEGRATION_CLAUDE_CODE.md）

---

### 🔴 P0-2: Provider 健康检查

**优先级：** 🔴 高  
**预计时间：** 2-3 小时  
**用户价值：** ⭐⭐⭐⭐

#### 目标
增强 `free-vision doctor` 命令，自动验证每个 Provider 的可用性和配额状态。

#### 实施步骤

##### 2.1 创建健康检查函数

**文件：** `src/health.ts`

```typescript
interface HealthStatus {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'no-key';
  latencyMs?: number;
  error?: string;
  quotaRemaining?: number;
}

async function checkProviderHealth(
  provider: ProviderConfig,
  apiKey: string
): Promise<HealthStatus>
```

##### 2.2 检查项

1. **API Key 配置** — 是否已配置
2. **连接测试** — 发送测试请求
3. **延迟测量** — 响应时间
4. **配额状态** — 剩余额度（如果 API 提供）
5. **模型可用性** — 模型是否可访问

##### 2.3 更新 doctor 命令

**改进的输出：**

```
Free Vision Skill doctor

Provider Health Check:
  ✅ zhipu        cn     glm-4.6v-flash     12ms  [quota: unlimited]
  ✅ modelscope   cn     Qwen3-VL-8B        45ms  [quota: varies]
  ⚠️  openrouter  global nvidia/nemotron    89ms  [quota: ~100/day]
  ❌ groq         global qwen/qwen3.6-27b  [no API key]

System Checks:
  ✅ Provider registry loaded
  ✅ Local VEP compression available
  ✅ SHA-256 result cache available
  ✅ Keychain: macOS Keychain

Summary: 2/4 providers healthy
```

#### 完成标准
- [ ] 健康检查函数实现
- [ ] doctor 命令增强
- [ ] 彩色输出（✅⚠️❌）
- [ ] 文档更新

---

### 🟡 P1-1: Codex 一键安装

**优先级：** 🟡 中  
**预计时间：** 2-3 小时  
**用户价值：** ⭐⭐⭐⭐

#### 目标
让 Codex 用户能一键安装和配置 Free Vision Skill。

#### 实施步骤

##### 3.1 创建安装脚本

**文件：** `installers/codex-install.sh`

```bash
#!/bin/bash
# Codex 一键安装脚本

echo "🚀 Installing Free Vision Skill for Codex..."

# 1. 检查依赖
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found. Please install Node.js first."
  exit 1
fi

# 2. 安装 free-vision CLI
npm install -g free-vision-skill

# 3. 配置 Codex
CODEX_CONFIG_DIR="$HOME/.codex"
mkdir -p "$CODEX_CONFIG_DIR"

cat > "$CODEX_CONFIG_DIR/config.json" << 'EOF'
{
  "skills": {
    "free-vision": {
      "enabled": true,
      "auto-detect-images": true,
      "default-provider": "auto",
      "default-question": "Describe what you see briefly"
    }
  }
}
EOF

# 4. 创建快捷命令
echo 'alias free-vision="free-vision"' >> "$HOME/.bashrc"
echo 'alias fv="free-vision"' >> "$HOME/.bashrc"

echo "✅ Free Vision Skill installed for Codex!"
echo ""
echo "Next steps:"
echo "  1. Configure API key: echo 'ZHIPU_API_KEY=your_key' >> ~/.env"
echo "  2. Test: free-vision --help"
```

##### 3.2 Codex 配置文件示例

**文件：** `examples/CODEX_INTEGRATION.md`

```markdown
# Codex 集成指南

## 安装

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/lora-sys/free-vision-skill/main/installers/codex-install.sh | bash
\`\`\`

## 配置

编辑 \`~/.codex/config.json\`:

\`\`\`json
{
  "skills": {
    "free-vision": {
      "enabled": true,
      "auto-detect-images": true,
      "default-provider": "auto",
      "default-region": "cn"
    }
  }
}
\`\`\`

## 使用

在 Codex 中上传图片后，Codex 会自动调用 free-vision。
```

#### 完成标准
- [ ] 安装脚本可用
- [ ] Codex 配置示例完整
- [ ] 文档清晰

---

### 🟡 P1-2: OpenCode Agent 支持

**优先级：** 🟡 中  
**预计时间：** 1-2 小时  
**用户价值：** ⭐⭐⭐

#### 目标
为 OpenCode 提供集成文档和配置示例。

#### 实施步骤

##### 4.1 OpenCode 配置示例

**文件：** `examples/OPENCODE.md`

```markdown
# OpenCode 集成

## 配置

编辑 \`opencode.json\`:

\`\`\`json
{
  "agents": {
    "coder": {
      "skills": ["free-vision"],
      "vision": {
        "provider": "auto",
        "region": "cn"
      }
    }
  }
}
\`\`\`

## 使用

在 OpenCode 中，当用户上传图片时，OpenCode 会：
1. 调用 free-vision see
2. 解析 VEP
3. 基于视觉证据继续推理
```

#### 完成标准
- [ ] OpenCode 配置示例
- [ ] 使用文档

---

### 🟡 P1-3: 图片自动裁剪（可选）

**优先级：** 🟡 中  
**预计时间：** 3-4 小时  
**用户价值：** ⭐⭐⭐

#### 目标
自动裁剪图片中的相关区域，减少视觉模型处理的数据量。

#### 实施步骤

##### 5.1 裁剪策略

**基于问题类型的裁剪：**

```typescript
interface CropStrategy {
  mode: 'error' | 'ui' | 'ocr' | 'chart' | 'general';
  strategy: 'full' | 'center' | 'detect' | 'grid';
}

// 错误截图 → 裁剪到错误区域
if (mode === 'error') {
  // 检测红色边框/背景的区域
  // 裁剪到该区域
}

// UI 截图 → 裁剪到 UI 元素
if (mode === 'ui') {
  // 使用简单的网格裁剪
  // 返回多个区域的 VEP
}
```

##### 5.2 实现

**文件：** `src/crop.ts`

```typescript
export async function autoCrop(
  imageBuffer: Buffer,
  mode: VisionMode
): Promise<Buffer[]> {
  // 实现裁剪逻辑
  // 返回多个裁剪后的图片
}
```

##### 5.3 CLI 标志

```bash
free-vision see \
  --image ./screenshot.png \
  --question "..." \
  --auto-crop
```

#### 完成标准
- [ ] 基础裁剪功能
- [ ] 至少支持 2 种模式
- [ ] CLI 标志可用

---

### 🟢 P2-1: 新 Provider（可选）

**优先级：** 🟢 低  
**预计时间：** 2-3 小时/个  
**用户价值：** ⭐⭐

#### 候选 Provider

1. **SiliconFlow** — 国内，SiliconFlow  SiliconFlow 免费模型
2. **阿里百炼** — 国内，新用户额度
3. **其他** — 根据用户反馈添加

#### 实施步骤

1. 注册并获取 API Key
2. 测试认证方式
3. 添加到 `registry/providers.json`
4. 测试并验证
5. 更新文档

#### 完成标准
- [ ] Provider 认证测试通过
- [ ] 添加到注册表
- [ ] 文档更新

---

## 📊 工作量汇总

| 功能 | 优先级 | 预计时间 | 完成标准 |
|------|--------|---------|---------|
| Claude Code Hook | 🔴 P0 | 3-4 小时 | 自动检测+调用 |
| Provider 健康检查 | 🔴 P0 | 2-3 小时 | doctor 增强 |
| Codex 一键安装 | 🟡 P1 | 2-3 小时 | 安装脚本 |
| OpenCode Agent | 🟡 P1 | 1-2 小时 | 文档+配置 |
| 图片自动裁剪 | 🟡 P1 | 3-4 小时 | --auto-crop 标志 |
| 新 Provider | 🟢 P2 | 2-3 小时/个 | 认证测试+文档 |

**总计：**
- **最小版本**（P0 部分 P1）：8-11 小时
- **推荐版本**（P0 + P1）：11-16 小时
- **完整版本**（P0 + P1 + P2）：13-25 小时

---

## 🎯 建议的 v0.2 范围

### 方案 A：最小可行版本（推荐）⭐

**时间：** 2-3 天  
**包含：**
1. ✅ Claude Code Hook
2. ✅ Provider 健康检查
3. ✅ Codex 一键安装（基础）
4. ✅ OpenCode Agent（文档）

**跳过：**
- 图片自动裁剪（v0.3）
- 新 Provider（可选）

**理由：** 快速发布，收集反馈

---

### 方案 B：完整版本

**时间：** 1-2 周  
**包含：**
1. ✅ 方案 A 所有功能
2. ✅ 图片自动裁剪（基础版）
3. ✅ 1-2 个新 Provider

**理由：** 功能完整，体验最佳

---

## 🗓️ 推荐实施计划

### 第 1 天（4-5 小时）

**上午（2-3 小时）：** Claude Code Hook
- [ ] 创建 Hook 脚本
- [ ] 实现图片检测
- [ ] 测试基本功能

**下午（2-3 小时）：** Claude Code Hook 完成
- [ ] 智能问题生成
- [ ] Claude Code 配置
- [ ] 完整测试
- [ ] 文档编写

**交付物：**
- `hooks/claude-code/detect-image.sh`
- `docs/INTEGRATION_CLAUDE_CODE.md`

---

### 第 2 天（3-4 小时）

**上午（2-3 小时）：** Provider 健康检查
- [ ] 创建 `src/health.ts`
- [ ] 实现健康检查逻辑
- [ ] 彩色输出

**下午（1-2 小时）：** Provider 健康检查完成
- [ ] 集成到 doctor 命令
- [ ] 测试所有 Provider
- [ ] 文档更新

**交付物：**
- `src/health.ts`
- 增强的 `free-vision doctor`

---

### 第 3 天（3-4 小时）

**上午（2-3 小时）：** Codex 一键安装
- [ ] 创建安装脚本
- [ ] Codex 配置示例

**下午（1-2 小时）：** OpenCode Agent
- [ ] OpenCode 配置示例
- [ ] 文档编写

**交付物：**
- `installers/codex-install.sh`
- `examples/CODEX_INTEGRATION.md`
- `examples/OPENCODE.md`

---

### 第 4 天（可选，3-4 小时）

**图片自动裁剪**
- [ ] 实现基础裁剪
- [ ] 测试和优化

---

### 第 5 天（可选，2-3 小时）

**新 Provider**
- [ ] 添加 1-2 个 Provider
- [ ] 测试和文档

---

## ✅ v0.2 发布检查清单

### 代码
- [ ] Claude Code Hook 实现
- [ ] Provider 健康检查实现
- [ ] Codex 安装脚本
- [ ] OpenCode 配置示例
- [ ] 所有测试通过
- [ ] TypeScript 编译无错误

### 文档
- [ ] CHANGELOG.md 更新
- [ ] ROADMAP.md 更新
- [ ] docs/INTEGRATION_CLAUDE_CODE.md
- [ ] examples/CODEX_INTEGRATION.md
- [ ] examples/OPENCODE.md
- [ ] README.md 更新（新增功能说明）

### 发布
- [ ] Git Tag v0.2.0
- [ ] GitHub Release 创建
- [ ] npm 包发布（可选）
- [ ] 社区通知

---

## 🎯 立即开始

**推荐从 Claude Code Hook 开始！**

**理由：**
1. 你正在使用 Claude Code，可以立即测试
2. 最大的用户体验提升
3. 相对简单，快速见效

**准备好开始了吗？** 🚀
