# OpenCode Agent 集成

Free Vision Skill 支持 OpenCode 开源代码 Agent，提供智能视觉分析能力。

---

## 📋 目录

- [安装要求](#安装要求)
- [快速配置](#快速配置)
- [高级配置](#高级配置)
- [使用方式](#使用方式)
- [配置文件示例](#配置文件示例)
- [故障排除](#故障排除)

---

## 安装要求

- OpenCode >= 0.2.0
- Node.js >= 20
- free-vision CLI 已安装

---

## 快速配置

### 1. 安装 Free Vision Skill

```bash
# 方式一：npm 全局安装
npm install -g free-vision-skill

# 方式二：npx 直接使用
npx free-vision-skill see --image ./example.png --question "描述这张图片"
```

### 2. 配置 OpenCode

编辑 OpenCode 配置文件（通常位于 `~/.config/opencode/config.json`）：

```bash
mkdir -p ~/.config/opencode
code ~/.config/opencode/config.json
```

### 3. 启用 Free Vision Skill

```json
{
  "agents": {
    "coder": {
      "skills": ["free-vision"],
      "vision": {
        "provider": "auto",
        "region": "cn",
        "auto-detect-images": true,
        "default-question": "Describe what you see briefly"
      }
    }
  }
}
```

### 4. 配置 API Key

```bash
# 使用 free-vision 命令配置
free-vision login zhipu

# 或直接设置环境变量
echo "export ZHIPU_API_KEY=your-key-here" >> ~/.bashrc
source ~/.bashrc
```

---

## 高级配置

### 多 Provider 配置

```json
{
  "agents": {
    "coder": {
      "skills": ["free-vision"],
      "vision": {
        "default-provider": "zhipu",
        "fallback-providers": ["openrouter", "groq"],
        "region": "cn",
        "auto-detect-images": true,
        "auto-crop": false,
        "cache": {
          "enabled": true,
          "ttl": 3600
        }
      }
    }
  }
}
```

### 图片自动裁剪

```json
{
  "agents": {
    "coder": {
      "skills": ["free-vision"],
      "vision": {
        "auto-crop": true,
        "crop-strategy": "smart",
        "crop-modes": ["error", "ui"]
      }
    }
  }
}
```

### 自定义问题模板

```json
{
  "agents": {
    "coder": {
      "skills": ["free-vision"],
      "vision": {
        "question-templates": {
          "error": "提取错误信息、文件名和行号",
          "ui": "列出所有被裁切、重叠或禁用的元素",
          "chart": "返回图表标题、趋势和三个关键值",
          "ocr": "提取所有文本内容"
        }
      }
    }
  }
}
```

---

## 使用方式

### 方式一：自动检测（推荐）

在 OpenCode 中上传图片时，Free Vision Skill 会自动分析并返回 VEP：

```
你: [上传截图 error.png]
OpenCode: [自动调用 free-vision]
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module ethers"|
t="src/app.ts:42"|
e=[dependency error]|
c=0.97
```

### 方式二：手动调用

在 OpenCode 会话中手动触发：

```
/free-vision see --image ./screenshot.png
```

### 方式三：命令行独立使用

```bash
# 分析错误截图
free-vision see --image ./error.png --question "提取错误信息"

# 分析 UI
free-vision see --image ./ui.png --question "列出所有 UI 问题"

# JSON 输出（用于集成）
free-vision see --image ./chart.png --json
```

---

## 配置文件示例

### 完整配置示例

`~/.config/opencode/config.json`：

```json
{
  "version": "0.2.0",
  "agents": {
    "coder": {
      "name": "Free Vision Coder",
      "model": "gpt-4",
      "skills": [
        "free-vision",
        "typescript",
        "react",
        "tailwind"
      ],
      "vision": {
        "enabled": true,
        "provider": "auto",
        "region": "cn",
        "auto-detect-images": true,
        "default-question": "描述这张图片的关键信息",
        "question-templates": {
          "error": "只提取错误信息和行号",
          "ui": "列出 UI 问题",
          "chart": "提取图表数据"
        },
        "auto-crop": false,
        "cache": {
          "enabled": true,
          "ttl": 3600,
          "path": "~/.opencode/cache/vision"
        },
        "fallback": {
          "max-retries": 3,
          "retry-delay": 1000
        }
      }
    },
    "reviewer": {
      "name": "Free Vision Reviewer",
      "model": "gpt-4",
      "skills": ["free-vision", "review"],
      "vision": {
        "enabled": true,
        "provider": "openrouter",
        "region": "global",
        "default-question": "审查这个 UI 截图的问题"
      }
    }
  },
  "hooks": {
    "on-image-upload": {
      "enabled": true,
      "command": "free-vision",
      "auto-analyze": true,
      "inject-vep": true
    }
  }
}
```

### 最小配置示例

```json
{
  "agents": {
    "coder": {
      "skills": ["free-vision"]
    }
  }
}
```

---

## VEP 输出解析

OpenCode 会自动解析 VEP 格式：

```
VEP/1|src=zhipu/glm-4.6v-flash|m=error|
a="Cannot find module ethers"|
t="src/app.ts:42"|
e=[dependency error]|
c=0.97
```

| 字段 | OpenCode 用途 |
|------|--------------|
| `src` | Provider 信息 |
| `m` | 任务模式 |
| `a` | 直接答案 |
| `t` | OCR 文本 |
| `e` | 错误列表 |
| `c` | 置信度 |

OpenCode 会根据 VEP 自动生成响应建议。

---

## 故障排除

### 问题 1: 图片未自动检测

**症状:** 上传图片后没有自动分析

**解决:**
```bash
# 检查配置
cat ~/.config/opencode/config.json | jq '.agents.coder.vision'

# 检查 free-vision
free-vision doctor

# 检查 OpenCode 日志
opencode logs | grep free-vision
```

### 问题 2: API Key 未配置

**症状:** `No credential for zhipu`

**解决:**
```bash
# 配置 API Key
free-vision login zhipu

# 或设置环境变量
export ZHIPU_API_KEY=your-key
```

### 问题 3: Provider 连接超时

**症状:** `Connection timeout` 或 `Network error`

**解决:**
```bash
# 检查网络
ping open.bigmodel.cn

# 测试 API 直接调用
free-vision see --image test.png --provider zhipu --no-cache

# 更换 Provider
export VISION_PROVIDER=openrouter
```

### 问题 4: VEP 格式错误

**症状:** `Failed to parse VEP`

**解决:**
```bash
# 检查原始输出
free-vision see --image test.png --json

# 检查 free-vision 版本
free-vision --version

# 更新到最新版
npm update -g free-vision-skill
```

---

## 性能优化

### 启用缓存

```json
{
  "vision": {
    "cache": {
      "enabled": true,
      "ttl": 3600
    }
  }
}
```

### 并发控制

```json
{
  "vision": {
    "concurrency": {
      "max-parallel": 2,
      "queue-size": 10
    }
  }
}
```

### 图片预处理

```json
{
  "vision": {
    "image": {
      "max-width": 1920,
      "max-height": 1080,
      "format": "png",
      "quality": 85
    }
  }
}
```

---

## 安全建议

1. **API Key 管理**: 使用 `free-vision login` 而不是环境变量
2. **敏感图片**: 避免分析包含敏感信息的截图
3. **网络隔离**: 确保 API 调用走安全网络
4. **日志检查**: 定期检查 OpenCode 日志

---

## 更新日志

### 2026-08-01
- 初始文档
- 支持 OpenCode >= 0.2.0
- 支持 13 个 Provider
- 完整的 VEP/1 协议支持

---

## 相关资源

- [OpenCode 官方文档](https://opencode.ai/docs)
- [Free Vision Skill GitHub](https://github.com/lora-sys/free-vision-skill)
- [Provider 列表](https://github.com/lora-sys/free-vision-skill/blob/main/docs/PROVIDERS.md)
- [VEP 协议文档](https://github.com/lora-sys/free-vision-skill/blob/main/docs/VEP.md)

---

如有问题，请提交 [GitHub Issue](https://github.com/lora-sys/free-vision-skill/issues)。
